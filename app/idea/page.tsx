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
 "I'm not sure yet",
];

const needs = [
 "Is this worth pursuing?",
 "What is the strongest version?",
 "What problems could this have?",
 "Who would use it?",
 "Can this make or save money?",
 "Help me explain it clearly",
 "Find weak spots",
];

const verdicts: Verdict[] = [
 "Greenlight",
 "Workbench",
 "Distraction",
 "Beautiful Mess",
 "Dangerously Good",
];

const councilFlow = [
 {
 name: "Step 1",
 title: "Tell us the idea",
 body: "Type it like you would say it out loud. Messy is okay.",
 },
 {
 name: "Step 2",
 title: "We make it clear",
 body: "Brad helps put the idea into plain English.",
 },
 {
 name: "Step 3",
 title: "We check weak spots",
 body: "Greg looks for confusing parts, risks, and holes.",
 },
 {
 name: "Step 4",
 title: "We find who it helps",
 body: "Juniper looks for the people, purpose, and human reason it matters.",
 },
 {
 name: "Step 5",
 title: "We make next steps",
 body: "Von Claussen turns it into a simple practical path.",
 },
 {
 name: "Step 6",
 title: "We help finish it later",
 body: "Hovel Editor can turn the strongest version into a serious document when you are ready.",
 },
];
const IDEANATOR_MAX_CHARS = 60000;

function normalizeIdeaName(value: string) {
 const cleaned = value.trim().replace(/\s+/g, " ");

 if (!cleaned) {
 return "Untitled Idea";
 }

 const hasRealCharacters = /[a-zA-Z0-9]/.test(cleaned);

 if (!hasRealCharacters) {
 return "Untitled Idea";
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

THE GUT READ
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

function redirectToLogin() {
 const nextPath = `${window.location.pathname}${window.location.search}`;
 window.location.assign(`/login?next=${encodeURIComponent(nextPath)}`);
}

export default function IdeanatorPage() {
 const [stage, setStage] = useState<Stage>("intake");
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
 redirectToLogin();
 return;
 }

 const response = await fetch(`/api/reports/${rerunId}`, {
 headers: {
 authorization: `Bearer ${session.access_token}`,
 },
 });

 const data = await response.json();

 if (!response.ok) {
 throw new Error(data.error || "Could not load saved idea report.");
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
 setRerunSourceTitle(savedReport.title || savedIdeaName || "Earlier saved idea report");
 setPreviousVerdict(savedVerdict);
 setRerunNotice(
 "Loaded your saved idea report. Change whatever needs changing, then put it back on the lift."
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
 : "Could not load saved idea report."
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

 const supabase = getSupabaseClient();

 const {
 data: { session },
 } = await supabase.auth.getSession();

 if (!session?.access_token) {
 setErrorMessage("Sign in to run the analysis. Sign in first, then we will put it on the lift.");
 redirectToLogin();
 return;
 }

 setStage("loading");

 try {
 const response = await fetch("/api/ideanator", {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 authorization: `Bearer ${session.access_token}`,
 },
 body: JSON.stringify({
 ideaName,
 ideaText,
 ideaKind,
 primaryNeed,
 }),
 });

 const data = (await response.json()) as IdeanatorApiResponse;

 if (response.status === 401) {
 redirectToLogin();
 return;
 }

 if (!response.ok || !data.ok) {
 const message =
 "error" in data
 ? data.error
 : "The Ideanator could not start the idea check. Please try again.";

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
 : "The Ideanator could not start the idea check. Please try again.";

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
 setStage("intake");
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
 setStage("intake");
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
 redirectToLogin();
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
 <p className="eyebrow">START HERE</p>
 <h1>Tell us your idea.</h1>
 </div>

 <button className="ghost-button" type="button" onClick={returnToLanding}>
 Reset
 </button>
 </header>

 {stage === "landing" && (
 <section className="hero-card">
 <p className="kicker">Got an idea stuck between genius and confusion?</p>

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

 <p>Drop the Idea.</p>
 </div>

 <div className="refusal-box">
 <p>
 The Ideanator does not hype you. It does not clap because you
 had a thought. It does not turn your napkin sketch into a fake
 empire with a forty-slide deck, a pretend roadmap, and some
 made-up language market-size number nobody believes.
 </p>

 <p>
 <strong>It tells you what you actually have.</strong>
 </p>
 </div>

 <div className="promise-grid">
 <article>
 <span>What Has Heat</span>
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
 <span>The The Gut Read</span>
 <p>
 Greenlight, Workbench, Distraction, Beautiful Mess, or
 Dangerously Good.
 </p>
 </article>
 </div>

 <div className="hero-actions">
 <button className="primary-button" type="button" onClick={returnToIntake}>
 Drop the Idea
 </button>

 <p>We will put it on the lift.</p>
 </div>
 </section>
 )}

 {stage === "intake" && (
 <section className="intake-card">
 <div className="section-heading">
 <p className="eyebrow">STEP 1</p>
 <h2>Tell us your idea.</h2>
 <p>
 Type it like you would explain it to a friend. A few sentences are enough.
 You can add rough notes, examples, or questions if you have them.
 You do not need a business plan, a perfect name, or fancy words.
 </p>
 </div>

 {errorMessage && (
 <div className="error-box">
 <span>The spark jammed.</span>
 <p>{errorMessage}</p>
 </div>
 )}

 <form onSubmit={handleSubmit} className="idea-form">
 <label className="full-width">
 <span>Type your idea here.</span>
 <textarea
 value={ideaText}
 onChange={(event) => setIdeaText(event.target.value)}
 placeholder="Example: I have an idea for a retirement savings adjuster that helps people know how much they can safely spend each month. It is still messy, but here is what I mean..."
 />

 <div className={`idea-limit-note ${ideaTooLong ? "over-limit" : ""}`}>
 <strong>
 {ideaCharCount.toLocaleString()} / {IDEANATOR_MAX_CHARS.toLocaleString()} characters
 </strong>
 <p>
 Short ideas work. Messy documents work. Notes, examples, questions, and half-finished thoughts are welcome. Do not paste anything private you would not want submitted for analysis.
 </p>
 </div>
 </label>

 <details className="optional-details full-width">
 <summary>Optional details</summary>

 <div className="optional-grid">
 <label>
 <span>Name this idea</span>
 <input
 value={ideaName}
 onChange={(event) => setIdeaName(event.target.value)}
 placeholder="Optional nickname"
 />
 <p className="field-help">
 Leave this blank if the idea does not have a name yet.
 </p>
 </label>

 <label>
 <span>What kind of thing is this?</span>
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
 <span>What kind of help do you want?</span>
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
 </div>
 </details>

 <div className="form-actions full-width">
 <button className="secondary-button" type="button" onClick={returnToLanding}>
 Clear
 </button>

 <button
 className="primary-button"
 type="submit"
 disabled={!ideaText.trim() || ideaTooLong}
 >
 Check My Idea
 </button>
 </div>
 </form>
 </section>
 )}

 {stage === "loading" && (
 <section className="loading-card">
 <div className="spinner" />

 <h2>We are checking your idea.</h2>

 <p>
 First we make it clearer. Then we look for weak spots and who it could help.
 Then we turn it into simple next steps and bring back
 the clearest usable path.
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
 <span>The Gut Read</span>
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
 <span>The spark jammed.</span>
 <p>{errorMessage}</p>
 </div>
 )}

 <div className="report-actions">
 <div>
 <span>Your next move</span>
 <p>
 Save this if it is worth keeping. Change it if the report gave you a better version. When you are ready, you can turn it into a plan or send it to Hovel Editor for the serious final pass.
 </p>
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
 <ResultCard title="What Has Heat" body={currentRun.report.spark} />

 <ResultCard
 title="The Simple Version"
 body={currentRun.report.plainEnglishVersion}
 />

 <ResultCard
 title="What’s Strong"
 body={currentRun.report.strongestUseCase}
 />

 <ResultCard title="What Needs Work" body={currentRun.report.weakSpots} />

 <ResultCard title="Who It’s For" body={currentRun.report.audience} />

 <ResultCard
 title="The Value Path"
 body={currentRun.report.moneyValuePath}
 />

 <ResultCard
 title="What You Might Be Avoiding"
 body={currentRun.report.avoidance}
 />

 <ResultCard
 title="Your Next Three Moves"
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
 Revise This Idea
 </button>

 <button className="primary-button" type="button" onClick={resetRun}>
 Test Another Idea
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
 linear-gradient(135deg, #0b1020 0%, #0f172a 46%, #111827 100%);
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
 color: #93c5fd;
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
 color: #ffffff;
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
 background: #93c5fd;
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
 border-left: 5px solid #93c5fd;
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
 color: #ffffff;
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
 radial-gradient(circle at 18px 50%, #dbeafe 0 4px, transparent 5px),
 linear-gradient(180deg, #dbeafe 0%, #93c5fd 52%, #60a5fa 100%);
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
 color: #ffffff;
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
 color: #ffffff;
 font-weight: 900;
 }

 .field-help {
 margin: 0;
 color: #bdb4a8;
 font-size: 0.88rem;
 line-height: 1.45;
 }

 input,
 select,
 textarea {
 width: 100%;
 border: 1px solid rgba(255, 255, 255, 0.15);
 background: rgba(0, 0, 0, 0.22);
 color: #ffffff;
 border-radius: 16px;
 padding: 14px 15px;
 outline: none;
 }

 .ideanator-page select {
 color-scheme: dark;
 }

 .ideanator-page select option {
 background: #14120f;
 color: #ffffff;
 }

 .ideanator-page select option:checked {
 background: #93c5fd;
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
 color: #93c5fd;
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

 .first-idea-card,
 .long-doc-note,
 .beta-run-note,
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

 .council-flow {
 border: 1px solid rgba(147, 197, 253, 0.24);
 border-radius: 28px;
 padding: 20px;
 margin: 20px 0;
 background:
 linear-gradient(180deg, rgba(248, 237, 210, 0.08), rgba(15, 23, 42, 0.88)),
 repeating-linear-gradient(
 0deg,
 transparent,
 transparent 32px,
 rgba(248, 237, 210, 0.04) 33px
 );
 box-shadow: 0 22px 70px rgba(0, 0, 0, 0.26);
 }

 .council-flow-header {
 display: flex;
 align-items: baseline;
 justify-content: space-between;
 gap: 12px;
 flex-wrap: wrap;
 margin-bottom: 14px;
 }

 .council-flow-header span {
 color: #93c5fd;
 font-family: monospace;
 font-size: 0.78rem;
 font-weight: 900;
 letter-spacing: 0.16em;
 text-transform: uppercase;
 }

 .council-flow-header strong {
 color: #f5f1e8;
 font-size: 1.05rem;
 }

 .council-flow-grid {
 display: grid;
 grid-template-columns: repeat(3, minmax(0, 1fr));
 gap: 10px;
 }

 .council-flow-card {
 border: 1px solid rgba(147, 197, 253, 0.18);
 border-radius: 20px;
 padding: 14px;
 background: rgba(2, 6, 23, 0.34);
 }

 .council-flow-card span {
 width: 34px;
 height: 34px;
 border-radius: 999px;
 display: grid;
 place-items: center;
 background: #dbeafe;
 color: #07111f;
 font-family: monospace;
 font-weight: 900;
 margin-bottom: 10px;
 }

 .council-flow-card strong {
 display: block;
 color: #93c5fd;
 font-family: monospace;
 font-size: 0.74rem;
 letter-spacing: 0.12em;
 text-transform: uppercase;
 margin-bottom: 6px;
 }

 .council-flow-card h3 {
 margin: 0;
 color: #ffffff;
 font-size: 1.08rem;
 line-height: 1.1;
 }

 .council-flow-card p {
 margin: 8px 0 0;
 color: #d8c7ad;
 font-size: 0.94rem;
 line-height: 1.45;
 }



 .first-idea-card {
 margin-bottom: 24px;
 border-color: rgba(240, 179, 95, 0.34);
 background:
 linear-gradient(135deg, rgba(240, 179, 95, 0.14), rgba(0, 0, 0, 0.12));
 }

 .first-idea-card span {
 display: block;
 color: #ffffff;
 font-size: 1rem;
 font-weight: 900;
 margin-bottom: 8px;
 }

 .first-idea-card p {
 margin-bottom: 10px;
 color: #d8cfc0;
 }

 .first-idea-card ol {
 margin: 12px 0 0;
 padding-left: 22px;
 color: #ddd5c7;
 line-height: 1.65;
 }

 .first-idea-card li {
 margin-bottom: 6px;
 }

 .long-doc-note {
 margin-bottom: 24px;
 border-color: rgba(255, 221, 159, 0.22);
 background: rgba(255, 221, 159, 0.075);
 }

 .long-doc-note span {
 display: block;
 color: #ffffff;
 font-size: 1rem;
 font-weight: 900;
 margin-bottom: 8px;
 }

 .long-doc-note p {
 margin-bottom: 0;
 color: #d8cfc0;
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
 color: #93c5fd;
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
 color: #ffffff;
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
 border-top-color: #93c5fd;
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
 background: #93c5fd;
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
 
 /* =========================================================
    PAPER WORKBENCH INTAKE OVERRIDES
    Visual layer only. No form logic changed.
    ========================================================= */

 .intake-card {
 background:
 linear-gradient(90deg, rgba(120, 53, 15, 0.16) 0 2px, transparent 2px 100%),
 repeating-linear-gradient(
 180deg,
 #fff8e7 0,
 #fff8e7 34px,
 #eadfc7 35px
 );
 color: #24180d;
 border: 1px solid rgba(120, 53, 15, 0.28);
 box-shadow:
 0 28px 90px rgba(0, 0, 0, 0.34),
 inset 54px 0 0 rgba(180, 83, 9, 0.08);
 padding: clamp(22px, 4vw, 42px);
 }

 .intake-card .section-heading {
 max-width: 760px;
 margin-bottom: 22px;
 padding-left: clamp(0px, 3vw, 34px);
 }

 .intake-card .eyebrow {
 color: #92400e;
 }

 .intake-card h2 {
 color: #1f1309;
 font-size: clamp(2.35rem, 6vw, 4.7rem);
 letter-spacing: -0.06em;
 margin-bottom: 10px;
 }

 .intake-card p {
 color: #4b3420;
 }

 .intake-card .idea-form {
 grid-template-columns: 1fr;
 gap: 16px;
 padding-left: clamp(0px, 3vw, 34px);
 }

 .intake-card label span {
 color: #1f1309;
 }

 .intake-card textarea {
 min-height: 280px;
 resize: vertical;
 background: rgba(255, 253, 244, 0.9);
 color: #1f1309;
 border: 2px solid rgba(120, 53, 15, 0.24);
 border-radius: 18px;
 font-size: clamp(1.08rem, 1.8vw, 1.3rem);
 line-height: 1.55;
 box-shadow: inset 0 2px 16px rgba(120, 53, 15, 0.08);
 }

 .intake-card textarea::placeholder,
 .intake-card input::placeholder {
 color: rgba(75, 52, 32, 0.56);
 }

 .intake-card input,
 .intake-card select {
 background: rgba(255, 253, 244, 0.92);
 color: #1f1309;
 border: 1px solid rgba(120, 53, 15, 0.24);
 }

 .intake-card .idea-limit-note {
 background: rgba(255, 251, 235, 0.72);
 border: 1px solid rgba(120, 53, 15, 0.18);
 }

 .intake-card .idea-limit-note strong,
 .intake-card .idea-limit-note p {
 color: #3a2818;
 }

 .intake-card .optional-details {
 border: 1px dashed rgba(120, 53, 15, 0.36);
 border-radius: 18px;
 background: rgba(255, 251, 235, 0.68);
 overflow: hidden;
 }

 .intake-card .optional-details summary {
 color: #1f1309;
 padding: 18px 20px;
 }

 .intake-card .optional-grid {
 grid-template-columns: repeat(3, minmax(0, 1fr));
 gap: 14px;
 padding: 0 20px 20px;
 }

 .intake-card .field-help {
 color: #5f4630;
 }

 .intake-card .form-actions {
 justify-content: flex-end;
 }

 .intake-card .secondary-button {
 color: #1f1309;
 border-color: rgba(120, 53, 15, 0.32);
 background: rgba(255, 251, 235, 0.72);
 }

 .intake-card .primary-button {
 min-width: min(100%, 260px);
 font-size: 1.05rem;
 }

 @media (max-width: 820px) {
 .intake-card .optional-grid {
 grid-template-columns: 1fr;
 }

 .intake-card .form-actions {
 flex-direction: column-reverse;
 align-items: stretch;
 }

 .intake-card .primary-button,
 .intake-card .secondary-button {
 width: 100%;
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
