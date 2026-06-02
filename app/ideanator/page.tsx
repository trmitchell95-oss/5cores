"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Stage = "landing" | "intake" | "loading" | "results";

type Verdict =
  | "Greenlight"
  | "Workbench"
  | "Distraction"
  | "Beautiful Mess"
  | "Dangerously Good";

type IdeanatorReport = {
  ideaName: string;
  ideaKind: string;
  primaryNeed: string;
  verdict: Verdict;
  spark: string;
  plainEnglishVersion: string;
  strongestUseCase: string;
  weakSpots: string;
  audience: string;
  moneyValuePath: string;
  avoidance: string;
  nextThreeMoves: string[];
};

type IdeaRun = {
  submittedText: string;
  report: IdeanatorReport;
};

type IdeanatorApiResponse =
  | {
      ok: true;
      report: IdeanatorReport;
    }
  | {
      ok: false;
      error: string;
    };

const ideaKinds = [
  "Business",
  "App / Software",
  "Invention / Product",
  "Book / Story",
  "Brand / Marketing",
  "Social Impact",
  "I have no damn clue",
];

const needs = [
  "Is this worth pursuing?",
  "What is the strongest version?",
  "What are the holes?",
  "Who would use it?",
  "How could it make money?",
  "How do I explain it clearly?",
  "Tear it apart honestly",
];

const verdicts: Verdict[] = [
  "Greenlight",
  "Workbench",
  "Distraction",
  "Beautiful Mess",
  "Dangerously Good",
];

const IDEANATOR_MAX_CHARS = 60000;

function normalizeIdeaName(value: string) {
  const cleaned = value.trim().replace(/\s+/g, " ");

  if (!cleaned) {
    return "Untitled Little Bastard";
  }

  const hasRealCharacters = /[a-zA-Z0-9]/.test(cleaned);

  if (!hasRealCharacters) {
    return "Untitled Little Bastard";
  }

  return cleaned;
}

function getIdeaPreview(text: string) {
  const cleaned = text.trim().replace(/\s+/g, " ");

  if (!cleaned) {
    return "No idea text was submitted.";
  }

  if (cleaned.length <= 220) {
    return cleaned;
  }

  return `${cleaned.slice(0, 220)}...`;
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase browser settings.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

function formatDiagnosisText(run: IdeaRun) {
  const report = run.report;
  const moves = report.nextThreeMoves
    .slice(0, 3)
    .map((move, index) => `${index + 1}. ${move}`)
    .join("\n");

  return `THE IDEANATOR REPORT

IDEA
${report.ideaName}

TYPE
${report.ideaKind}

ASKED FOR
${report.primaryNeed}

BRUTAL VERDICT
${report.verdict}

WHAT YOU DROPPED IN
${run.submittedText}

THE SPARK
${report.spark}

THE PLAIN-ENGLISH VERSION
${report.plainEnglishVersion}

THE STRONGEST USE CASE
${report.strongestUseCase}

THE WEAK SPOTS
${report.weakSpots}

THE AUDIENCE
${report.audience}

THE MONEY / VALUE PATH
${report.moneyValuePath}

THE PART YOU ARE PROBABLY AVOIDING
${report.avoidance}

NEXT THREE MOVES
${moves}`;
}

function safeFileName(value: string) {
  const cleaned = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return cleaned || "ideanator-report";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodeMaybeJson(value: unknown): unknown {
  let current = value;

  for (let index = 0; index < 3; index += 1) {
    if (typeof current !== "string") {
      return current;
    }

    const trimmed = current.trim();

    if (!trimmed) {
      return "";
    }

    const looksJson =
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith("\"") && trimmed.endsWith("\""));

    if (!looksJson) {
      return current;
    }

    try {
      current = JSON.parse(trimmed);
    } catch {
      return current;
    }
  }

  return current;
}

function getStringField(value: Record<string, unknown> | null, key: string) {
  if (!value) return "";

  const field = value[key];

  return typeof field === "string" ? field.trim() : "";
}

function getSelectValue(value: string, options: string[], fallback: string) {
  return options.includes(value) ? value : fallback;
}

export default function IdeanatorPage() {
  const [stage, setStage] = useState<Stage>("landing");
  const [ideaName, setIdeaName] = useState("");
  const [ideaText, setIdeaText] = useState("");
  const [ideaKind, setIdeaKind] = useState(ideaKinds[0]);
  const [primaryNeed, setPrimaryNeed] = useState(needs[0]);
  const [currentRun, setCurrentRun] = useState<IdeaRun | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [savingDiagnosis, setSavingDiagnosis] = useState(false);
  const [savedId, setSavedId] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [rerunNotice, setRerunNotice] = useState("");
  const [rerunSourceId, setRerunSourceId] = useState("");
  const [rerunSourceTitle, setRerunSourceTitle] = useState("");
  const [previousVerdict, setPreviousVerdict] = useState("");

  const liveDisplayName = useMemo(() => {
    return normalizeIdeaName(ideaName);
  }, [ideaName]);

  const ideaCharCount = ideaText.length;
  const ideaTooLong = ideaCharCount > IDEANATOR_MAX_CHARS;

  useEffect(() => {
    let stillMounted = true;

    async function loadSavedIdeaForRerun() {
      const params = new URLSearchParams(window.location.search);
      const rerunId = params.get("rerun");
      const start = params.get("start");

      if (!rerunId) {
        if (start === "intake") {
          setStage("intake");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }

        return;
      }

      try {
        setErrorMessage("");
        setRerunNotice("");

        const supabase = getSupabaseClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          window.location.href = "/login";
          return;
        }

        const response = await fetch(`/api/reports/${rerunId}`, {
          headers: {
            authorization: `Bearer ${session.access_token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not load saved idea.");
        }

        if (!stillMounted) {
          return;
        }

        const savedReport = data.report as {
          title?: string | null;
          content?: unknown;
        };

        const content = decodeMaybeJson(savedReport.content);
        const contentObject = isPlainObject(content) ? content : null;
        const ideanatorRaw = contentObject?.ideanator;
        const ideanatorReport = isPlainObject(ideanatorRaw) ? ideanatorRaw : null;

        const savedIdeaName =
          getStringField(ideanatorReport, "ideaName") ||
          savedReport.title ||
          "";

        const savedIdeaKind = getSelectValue(
          getStringField(ideanatorReport, "ideaKind"),
          ideaKinds,
          ideaKinds[0]
        );

        const savedPrimaryNeed = getSelectValue(
          getStringField(ideanatorReport, "primaryNeed"),
          needs,
          needs[0]
        );

        const submittedText =
          typeof contentObject?.submittedText === "string"
            ? contentObject.submittedText
            : "";

        const savedVerdict = getStringField(ideanatorReport, "verdict");

        setIdeaName(savedIdeaName);
        setIdeaKind(savedIdeaKind);
        setPrimaryNeed(savedPrimaryNeed);
        setIdeaText(submittedText);
        setCurrentRun(null);
        setCopied(false);
        setSavingDiagnosis(false);
        setSavedId("");
        setSaveMessage("");
        setRerunSourceId(rerunId);
        setRerunSourceTitle(savedReport.title || savedIdeaName || "Earlier saved idea");
        setPreviousVerdict(savedVerdict);
        setRerunNotice(
          "Loaded your saved idea. Change whatever needs changing, then put it back on the lift."
        );
        setStage("intake");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } catch (error) {
        if (!stillMounted) {
          return;
        }

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Could not load saved idea."
        );
        setStage("intake");
      }
    }

    loadSavedIdeaForRerun();

    return () => {
      stillMounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!ideaText.trim()) {
      return;
    }

    if (ideaTooLong) {
      setErrorMessage(
        "This idea dump is over 60,000 characters. Trim it down to the useful chaos before we put it on the lift."
      );
      setStage("intake");
      return;
    }

    setErrorMessage("");
    setStage("loading");

    try {
      const response = await fetch("/api/ideanator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ideaName,
          ideaText,
          ideaKind,
          primaryNeed,
        }),
      });

      const data = (await response.json()) as IdeanatorApiResponse;

      if (!response.ok || !data.ok) {
        const message =
          "error" in data
            ? data.error
            : "The Ideanator coughed, smoked, and refused to start.";

        throw new Error(message);
      }

      setCurrentRun({
        submittedText: ideaText,
        report: data.report,
      });

      setStage("results");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "The Ideanator coughed, smoked, and refused to start.";

      setErrorMessage(message);
      setStage("intake");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function resetRun() {
    setIdeaName("");
    setIdeaText("");
    setIdeaKind(ideaKinds[0]);
    setPrimaryNeed(needs[0]);
    setCurrentRun(null);
    setErrorMessage("");
    setCopied(false);
    setSavingDiagnosis(false);
    setSavedId("");
    setSaveMessage("");
    setRerunSourceId("");
    setRerunSourceTitle("");
    setPreviousVerdict("");
    setRerunNotice("");
    setStage("landing");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function returnToLanding() {
    setErrorMessage("");
    setCopied(false);
    setSavingDiagnosis(false);
    setSavedId("");
    setSaveMessage("");
    setRerunSourceId("");
    setRerunSourceTitle("");
    setPreviousVerdict("");
    setRerunNotice("");
    setStage("landing");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function returnToIntake() {
    setErrorMessage("");
    setCopied(false);
    setSaveMessage("");
    setStage("intake");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function copyDiagnosis() {
    if (!currentRun) return;

    await navigator.clipboard.writeText(formatDiagnosisText(currentRun));
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1800);
  }

  function downloadDiagnosis() {
    if (!currentRun) return;

    const text = formatDiagnosisText(currentRun);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${safeFileName(currentRun.report.ideaName)}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  async function saveDiagnosis() {
    if (!currentRun || savingDiagnosis || savedId) return;

    setSavingDiagnosis(true);
    setErrorMessage("");
    setSaveMessage("");

    try {
      const supabase = getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/ideanator/save", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          report: currentRun.report,
          submittedText: currentRun.submittedText,
          parentReportId: rerunSourceId,
          sourceReportTitle: rerunSourceTitle,
          previousVerdict,
        }),
      });

      let data: { id?: string; error?: string; details?: string } = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        const message = data.details
          ? `${data.error || "Could not save Ideanator report."} Details: ${data.details}`
          : data.error || "Could not save Ideanator report.";

        throw new Error(message);
      }

      setSavedId(data.id || "");
      setSaveMessage("Saved to your reports.");
    } catch (error) {
      setSaveMessage("");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving the diagnosis."
      );
    } finally {
      setSavingDiagnosis(false);
    }
  }

  return (
    <main className="ideanator-page">
      <section className="shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">HOVEL IDEAS PRESENTS</p>
            <h1>THE IDEANATOR</h1>
          </div>

          <button className="ghost-button" type="button" onClick={returnToLanding}>
            Reset the lift
          </button>
        </header>

        {stage === "landing" && (
          <section className="hero-card">
            <p className="kicker">Got an idea stuck between genius and bullshit?</p>

            <h2>A reality check for ideas that do not know what they are yet.</h2>

            <div className="hero-copy">
              <p>You have got something stuck in your head.</p>

              <p>
                Maybe it is a business. Maybe it is a book. Maybe it is a
                product you have explained to three different people and gotten
                three different confused faces.
              </p>

              <p>Maybe you do not even know what it is yet.</p>

              <p>Just that it will not leave you alone.</p>

              <p>
                <strong>Good.</strong>
              </p>

              <p>Drop it in.</p>
            </div>

            <div className="refusal-box">
              <p>
                The Ideanator does not hype you. It does not clap because you
                had a thought. It does not turn your napkin sketch into a fake
                empire with a forty-slide deck, a pretend roadmap, and some
                horseshit market-size number nobody believes.
              </p>

              <p>
                <strong>It tells you what you actually have.</strong>
              </p>
            </div>

            <div className="promise-grid">
              <article>
                <span>The Spark</span>
                <p>What is actually alive in the idea.</p>
              </article>

              <article>
                <span>The Holes</span>
                <p>What breaks, confuses, or smells funny.</p>
              </article>

              <article>
                <span>The Strongest Version</span>
                <p>The cleaner, sharper version hiding under the mess.</p>
              </article>

              <article>
                <span>The Brutal Verdict</span>
                <p>
                  Greenlight, Workbench, Distraction, Beautiful Mess, or
                  Dangerously Good.
                </p>
              </article>
            </div>

            <div className="hero-actions">
              <button className="primary-button" type="button" onClick={returnToIntake}>
                Drop it in
              </button>

              <p>We will put it on the lift.</p>
            </div>
          </section>
        )}

        {stage === "intake" && (
          <section className="intake-card">
            <div className="section-heading">
              <p className="eyebrow">IDEA INTAKE</p>
              <h2>Tell us what is rattling around in there.</h2>
              <p>
                No pitch-deck voice. No founder fog. Just explain the thing as
                honestly as you can.
              </p>
            </div>

            {errorMessage && (
              <div className="error-box">
                <span>The lift jammed.</span>
                <p>{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="idea-form">
              <label>
                <span>Idea name</span>
                <input
                  value={ideaName}
                  onChange={(event) => setIdeaName(event.target.value)}
                  placeholder="Optional. Blank becomes Untitled Little Bastard."
                />
              </label>

              <label>
                <span>What kind of idea is it?</span>
                <select
                  value={ideaKind}
                  onChange={(event) => setIdeaKind(event.target.value)}
                >
                  {ideaKinds.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span>What do you need from it?</span>
                <select
                  value={primaryNeed}
                  onChange={(event) => setPrimaryNeed(event.target.value)}
                >
                  {needs.map((need) => (
                    <option key={need} value={need}>
                      {need}
                    </option>
                  ))}
                </select>
              </label>

              <label className="full-width">
                <span>What is the idea?</span>
                <textarea
                  value={ideaText}
                  onChange={(event) => setIdeaText(event.target.value)}
                  placeholder="Dump the chaos here. Half-thoughts are allowed. Weird is allowed. Rambling is allowed. Lying to yourself is discouraged."
                />

                <div className={`idea-limit-note ${ideaTooLong ? "over-limit" : ""}`}>
                  <strong>
                    {ideaCharCount.toLocaleString()} / {IDEANATOR_MAX_CHARS.toLocaleString()} characters
                  </strong>
                  <p>
                    Short ideas work. Messy documents work. Product notes, invention notes, diagrams explained in text, feature maps, and strategy dumps are welcome. Do not paste a full manuscript or anything you are not comfortable submitting for analysis.
                  </p>
                </div>
              </label>

              <div className="intake-preview full-width">
                <span>Current label</span>
                <strong>{liveDisplayName}</strong>
              </div>

              <div className="form-actions full-width">
                <button className="secondary-button" type="button" onClick={returnToLanding}>
                  Back
                </button>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={!ideaText.trim() || ideaTooLong}
                >
                  Put it on the lift
                </button>
              </div>
            </form>
          </section>
        )}

        {stage === "loading" && (
          <section className="loading-card">
            <div className="spinner" />

            <h2>The little bastard is on the lift.</h2>

            <p>
              We are sending it through the shop now. Frame, spark, tires,
              obvious leaks, hidden rot, weird noises, and whether this thing
              explodes at highway speed.
            </p>
          </section>
        )}

        {stage === "results" && currentRun && (
          <section className="results-card">
            <div className="result-header">
              <div>
                <p className="eyebrow">IDEA CHECK COMPLETE</p>
                <h2>{currentRun.report.ideaName}</h2>
                <p>
                  Type: <strong>{currentRun.report.ideaKind}</strong>
                </p>
                <p>
                  Asked for: <strong>{currentRun.report.primaryNeed}</strong>
                </p>
              </div>

              <div className="verdict-badge">
                <span>Brutal Verdict</span>
                <strong>{currentRun.report.verdict}</strong>
              </div>
            </div>

            <div className="submitted-box">
              <span>What you dropped in</span>
              <p>{getIdeaPreview(currentRun.submittedText)}</p>
            </div>

            {saveMessage && (
              <div className="save-box">
                <span>{saveMessage}</span>
                {savedId && (
                  <a href={`/reports/${savedId}?product=idea`}>Open saved report</a>
                )}
              </div>
            )}

            {errorMessage && (
              <div className="error-box results-error">
                <span>The lift jammed.</span>
                <p>{errorMessage}</p>
              </div>
            )}

            <div className="report-actions">
              <div>
                <span>Take this thing with you.</span>
                <p>Copy it, download it, or save it to your Ideanator saved ideas.</p>
              </div>

              <div className="report-action-buttons">
                <button className="secondary-button" type="button" onClick={copyDiagnosis}>
                  {copied ? "Copied" : "Copy Diagnosis"}
                </button>

                <button className="secondary-button" type="button" onClick={downloadDiagnosis}>
                  Download .txt
                </button>

                <button
                  className="primary-button"
                  type="button"
                  onClick={saveDiagnosis}
                  disabled={savingDiagnosis || Boolean(savedId)}
                >
                  {savingDiagnosis
                    ? "Saving..."
                    : savedId
                      ? "Saved"
                      : "Save Diagnosis"}
                </button>
              </div>
            </div>

            <div className="cards-grid">
              <ResultCard title="The Spark" body={currentRun.report.spark} />

              <ResultCard
                title="The Plain-English Version"
                body={currentRun.report.plainEnglishVersion}
              />

              <ResultCard
                title="The Strongest Use Case"
                body={currentRun.report.strongestUseCase}
              />

              <ResultCard title="The Weak Spots" body={currentRun.report.weakSpots} />

              <ResultCard title="The Audience" body={currentRun.report.audience} />

              <ResultCard
                title="The Money / Value Path"
                body={currentRun.report.moneyValuePath}
              />

              <ResultCard
                title="The Part You Are Probably Avoiding"
                body={currentRun.report.avoidance}
              />

              <ResultCard
                title="Next Three Moves"
                body={currentRun.report.nextThreeMoves
                  .map((move, index) => `${index + 1}. ${move}`)
                  .join(" ")}
              />
            </div>

            <div className="verdict-row">
              {verdicts.map((verdict) => (
                <span
                  key={verdict}
                  className={
                    verdict === currentRun.report.verdict ? "active-verdict" : ""
                  }
                >
                  {verdict}
                </span>
              ))}
            </div>

            <div className="form-actions">
              <button className="secondary-button" type="button" onClick={returnToIntake}>
                Edit the idea
              </button>

              <button className="primary-button" type="button" onClick={resetRun}>
                Run another idea
              </button>
            </div>
          </section>
        )}
      </section>

      <style>{`
        .ideanator-page {
          min-height: 100vh;
          margin-top: -92px;
          background:
            radial-gradient(circle at top left, rgba(245, 158, 11, 0.34), transparent 36rem),
            radial-gradient(circle at bottom right, rgba(255, 202, 118, 0.13), transparent 32rem),
            linear-gradient(135deg, #332313 0%, #242018 46%, #1c211e 100%);
          color: #f5f1e8;
          padding: 120px 28px 28px;
          font-family:
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .shell {
          width: min(1120px, 100%);
          margin: 0 auto;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 24px;
        }

        .eyebrow {
          margin: 0 0 8px;
          color: #f0b35f;
          font-size: 0.75rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 800;
        }

        h1,
        h2,
        p {
          margin-top: 0;
        }

        h1 {
          margin-bottom: 0;
          font-size: clamp(2rem, 5vw, 4.2rem);
          line-height: 0.92;
          letter-spacing: -0.08em;
        }

        h2 {
          font-size: clamp(2rem, 4vw, 4.7rem);
          line-height: 0.95;
          letter-spacing: -0.07em;
          margin-bottom: 22px;
        }

        p {
          color: #ddd5c7;
          font-size: 1rem;
          line-height: 1.65;
        }

        strong {
          color: #fff7ea;
        }

        .hero-card,
        .intake-card,
        .loading-card,
        .results-card {
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(43, 38, 30, 0.92);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
          border-radius: 32px;
          padding: clamp(24px, 5vw, 56px);
        }

        .hero-card {
          position: relative;
          overflow: hidden;
        }

        .hero-card:before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            linear-gradient(135deg, rgba(255, 255, 255, 0.08), transparent 42%),
            repeating-linear-gradient(
              90deg,
              transparent,
              transparent 38px,
              rgba(255, 255, 255, 0.018) 40px
            );
          pointer-events: none;
        }

        .hero-card > * {
          position: relative;
          z-index: 1;
        }

        .kicker {
          display: inline-flex;
          width: fit-content;
          background: #f0b35f;
          color: #17120b;
          border-radius: 999px;
          padding: 8px 14px;
          font-weight: 900;
          margin-bottom: 24px;
        }

        .hero-copy {
          max-width: 760px;
          margin-bottom: 26px;
        }

        .hero-copy p {
          font-size: clamp(1.05rem, 2vw, 1.24rem);
        }

        .refusal-box {
          max-width: 840px;
          border-left: 5px solid #f0b35f;
          background: rgba(255, 255, 255, 0.06);
          padding: 22px 24px;
          border-radius: 18px;
          margin: 28px 0;
        }

        .promise-grid,
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin: 30px 0;
        }

        .promise-grid article,
        .result-card {
          border: 1px solid rgba(255, 255, 255, 0.13);
          background: rgba(255, 255, 255, 0.055);
          border-radius: 20px;
          padding: 20px;
        }

        .promise-grid span,
        .result-card h3,
        .submitted-box span,
        .intake-preview span,
        .error-box span {
          display: block;
          color: #fff7ea;
          font-size: 1rem;
          font-weight: 900;
          margin-bottom: 8px;
        }

        .promise-grid p,
        .result-card p {
          margin-bottom: 0;
          font-size: 0.94rem;
        }

        .hero-actions,
        .form-actions {
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          margin-top: 24px;
        }

        .hero-actions p {
          margin: 0;
          color: #bdb4a8;
        }

        button,
        input,
        select,
        textarea {
          font: inherit;
        }

        button {
          border: 0;
          cursor: pointer;
        }

        button:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .primary-button,
        .secondary-button,
        .ghost-button {
          position: relative;
          overflow: hidden;
          border-radius: 999px;
          font-weight: 900;
          transition:
            transform 160ms ease,
            opacity 160ms ease,
            border-color 160ms ease,
            background 160ms ease,
            box-shadow 160ms ease;
        }

        .primary-button:hover,
        .secondary-button:hover,
        .ghost-button:hover {
          transform: translateY(-1px);
        }

        .primary-button {
          background:
            radial-gradient(circle at 18px 50%, #fff3c4 0 4px, transparent 5px),
            linear-gradient(180deg, #ffd27a 0%, #f0b35f 52%, #c98438 100%);
          color: #18100a;
          padding: 14px 22px 14px 34px;
          border: 1px solid rgba(255, 241, 190, 0.7);
          box-shadow:
            0 0 0 1px rgba(255, 208, 122, 0.18),
            0 0 22px rgba(240, 179, 95, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.42),
            inset 0 -10px 18px rgba(120, 71, 20, 0.18);
        }

        .primary-button:hover {
          box-shadow:
            0 0 0 1px rgba(255, 224, 150, 0.24),
            0 0 34px rgba(240, 179, 95, 0.44),
            inset 0 1px 0 rgba(255, 255, 255, 0.5),
            inset 0 -10px 18px rgba(120, 71, 20, 0.16);
        }

        .secondary-button {
          background:
            radial-gradient(circle at 18px 50%, rgba(255, 220, 143, 0.8) 0 3px, transparent 4px),
            rgba(255, 255, 255, 0.09);
          color: #fff7ea;
          padding: 14px 22px 14px 34px;
          border: 1px solid rgba(255, 221, 159, 0.22);
          box-shadow:
            0 0 18px rgba(240, 179, 95, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
        }

        .secondary-button:hover {
          border-color: rgba(240, 179, 95, 0.72);
          box-shadow:
            0 0 24px rgba(240, 179, 95, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.12);
        }

        .ghost-button {
          background:
            radial-gradient(circle at 16px 50%, rgba(255, 220, 143, 0.72) 0 3px, transparent 4px),
            rgba(255, 255, 255, 0.04);
          color: #f5f1e8;
          border: 1px solid rgba(255, 221, 159, 0.2);
          padding: 10px 15px 10px 31px;
          box-shadow: 0 0 16px rgba(240, 179, 95, 0.08);
        }

        .ghost-button:hover {
          border-color: rgba(240, 179, 95, 0.62);
          box-shadow: 0 0 24px rgba(240, 179, 95, 0.18);
        }

        .section-heading {
          max-width: 760px;
          margin-bottom: 28px;
        }

        .idea-form {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
        }

        label {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        label span {
          color: #fff7ea;
          font-weight: 900;
        }

        input,
        select,
        textarea {
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(0, 0, 0, 0.22);
          color: #fff7ea;
          border-radius: 16px;
          padding: 14px 15px;
          outline: none;
        }

        .ideanator-page select {
          color-scheme: dark;
        }

        .ideanator-page select option {
          background: #14120f;
          color: #fff7ea;
        }

        .ideanator-page select option:checked {
          background: #f0b35f;
          color: #18100a;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: rgba(240, 179, 95, 0.8);
          box-shadow: 0 0 0 4px rgba(240, 179, 95, 0.13);
        }

        textarea {
          min-height: 360px;
          resize: vertical;
        }

        .idea-limit-note {
          border: 1px solid rgba(255, 221, 159, 0.16);
          background: rgba(255, 255, 255, 0.045);
          border-radius: 16px;
          padding: 12px 14px;
        }

        .idea-limit-note strong {
          display: block;
          color: #f0b35f;
          font-size: 0.86rem;
          margin-bottom: 6px;
        }

        .idea-limit-note p {
          margin: 0;
          color: #bdb4a8;
          font-size: 0.88rem;
          line-height: 1.5;
        }

        .idea-limit-note.over-limit {
          border-color: rgba(248, 113, 113, 0.55);
          background: rgba(248, 113, 113, 0.1);
        }

        .idea-limit-note.over-limit strong {
          color: #fecaca;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        .intake-preview,
        .submitted-box,
        .error-box,
        .save-box,
        .report-actions {
          border: 1px solid rgba(240, 179, 95, 0.24);
          background: rgba(240, 179, 95, 0.08);
          border-radius: 18px;
          padding: 16px 18px;
        }

        .error-box {
          border-color: rgba(248, 113, 113, 0.45);
          background: rgba(248, 113, 113, 0.1);
          margin-bottom: 24px;
        }

        .results-error {
          margin-bottom: 20px;
        }

        .error-box p {
          margin-bottom: 0;
        }

        .save-box {
          border-color: rgba(34, 197, 94, 0.42);
          background: rgba(34, 197, 94, 0.1);
          margin-bottom: 20px;
        }

        .intake-rerun-box {
          margin-bottom: 24px;
        }

        .intake-rerun-box p {
          margin-bottom: 0;
        }

        .save-box span {
          display: block;
          color: #dcfce7;
          font-weight: 900;
          margin-bottom: 8px;
        }

        .save-box a {
          color: #f0b35f;
          font-weight: 900;
        }

        .report-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 28px;
        }

        .report-actions span {
          display: block;
          color: #fff7ea;
          font-size: 1rem;
          font-weight: 900;
          margin-bottom: 6px;
        }

        .report-actions p {
          margin-bottom: 0;
        }

        .report-action-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .intake-preview strong {
          display: block;
          font-size: 1.1rem;
        }

        .submitted-box {
          margin-bottom: 28px;
        }

        .submitted-box p {
          margin-bottom: 0;
        }

        .loading-card {
          min-height: 460px;
          display: grid;
          place-items: center;
          text-align: center;
        }

        .loading-card h2 {
          margin-bottom: 10px;
        }

        .loading-card p {
          max-width: 620px;
          margin: 0 auto;
        }

        .spinner {
          width: 74px;
          height: 74px;
          border-radius: 999px;
          border: 7px solid rgba(255, 255, 255, 0.12);
          border-top-color: #f0b35f;
          animation: spin 900ms linear infinite;
          margin-bottom: 24px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .result-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 22px;
          margin-bottom: 26px;
        }

        .result-header h2 {
          margin-bottom: 10px;
        }

        .verdict-badge {
          min-width: 220px;
          border-radius: 22px;
          border: 1px solid rgba(240, 179, 95, 0.48);
          background: rgba(240, 179, 95, 0.1);
          padding: 18px;
        }

        .verdict-badge span {
          display: block;
          color: #d8c6a9;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 8px;
        }

        .verdict-badge strong {
          display: block;
          font-size: 1.35rem;
        }

        .cards-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .result-card h3 {
          font-size: 1.1rem;
          margin-top: 0;
        }

        .verdict-row {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          margin-top: 26px;
        }

        .verdict-row span {
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #cfc5b6;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 999px;
          padding: 8px 12px;
          font-size: 0.9rem;
          font-weight: 800;
        }

        .verdict-row .active-verdict {
          border-color: rgba(240, 179, 95, 0.8);
          color: #18100a;
          background: #f0b35f;
        }

        @media (max-width: 860px) {
          .ideanator-page {
            margin-top: -86px;
            padding: 104px 16px 16px;
          }

          .topbar,
          .result-header,
          .report-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .report-action-buttons {
            justify-content: stretch;
          }

          .report-action-buttons button {
            width: 100%;
          }

          .ghost-button {
            width: fit-content;
          }

          .promise-grid,
          .cards-grid,
          .idea-form {
            grid-template-columns: 1fr;
          }

          h1 {
            font-size: 2.5rem;
          }

          h2 {
            font-size: 2.35rem;
          }

          .hero-card,
          .intake-card,
          .loading-card,
          .results-card {
            border-radius: 24px;
          }
        }

        /* IDEANATOR PAGE TOP OFFSET FIX */
        @media (max-width: 520px) {
          .ideanator-page {
            margin-top: -124px;
            padding-top: 146px !important;
          }
        }
      `}</style>
    </main>
  );
}

function ResultCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="result-card">
      <h3>{title}</h3>
      <p>{body}</p>
    </article>
  );
}











