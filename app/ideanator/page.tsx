"use client";

import { FormEvent, useMemo, useState } from "react";

type Stage = "landing" | "intake" | "loading" | "results";

type Verdict =
  | "Greenlight"
  | "Workbench"
  | "Distraction"
  | "Beautiful Mess"
  | "Dangerously Good";

type IdeaRun = {
  name: string;
  text: string;
  kind: string;
  need: string;
  verdict: Verdict;
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

function getFakeVerdict(kind: string, need: string): Verdict {
  if (kind === "Book / Story") return "Beautiful Mess";
  if (kind === "Invention / Product") return "Dangerously Good";
  if (kind === "Social Impact") return "Workbench";
  if (need === "Tear it apart honestly") return "Workbench";
  if (need === "Is this worth pursuing?") return "Workbench";

  return "Workbench";
}

function getIdeaPhrase(kind: string) {
  if (kind === "I have no damn clue") {
    return "early-stage idea";
  }

  return `${kind.toLowerCase()} concept`;
}

function getIdeaPreview(text: string) {
  const cleaned = text.trim().replace(/\s+/g, " ");

  if (!cleaned) {
    return "No idea text was submitted.";
  }

  if (cleaned.length <= 180) {
    return cleaned;
  }

  return `${cleaned.slice(0, 180)}...`;
}

export default function IdeanatorPage() {
  const [stage, setStage] = useState<Stage>("landing");
  const [ideaName, setIdeaName] = useState("");
  const [ideaText, setIdeaText] = useState("");
  const [ideaKind, setIdeaKind] = useState(ideaKinds[0]);
  const [primaryNeed, setPrimaryNeed] = useState(needs[0]);
  const [currentRun, setCurrentRun] = useState<IdeaRun | null>(null);

  const liveDisplayName = useMemo(() => {
    return normalizeIdeaName(ideaName);
  }, [ideaName]);

  const result = currentRun ?? {
    name: liveDisplayName,
    text: ideaText,
    kind: ideaKind,
    need: primaryNeed,
    verdict: getFakeVerdict(ideaKind, primaryNeed),
  };

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!ideaText.trim()) {
      return;
    }

    const submittedRun: IdeaRun = {
      name: normalizeIdeaName(ideaName),
      text: ideaText.trim(),
      kind: ideaKind,
      need: primaryNeed,
      verdict: getFakeVerdict(ideaKind, primaryNeed),
    };

    setCurrentRun(submittedRun);
    setStage("loading");

    window.setTimeout(() => {
      setStage("results");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 1400);
  }

  function resetRun() {
    setIdeaName("");
    setIdeaText("");
    setIdeaKind(ideaKinds[0]);
    setPrimaryNeed(needs[0]);
    setCurrentRun(null);
    setStage("landing");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function returnToLanding() {
    setStage("landing");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function returnToIntake() {
    setStage("intake");
    window.scrollTo({ top: 0, behavior: "smooth" });
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
                  disabled={!ideaText.trim()}
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
              We are checking the frame, the spark, the tires, and whether this
              thing explodes at highway speed.
            </p>
          </section>
        )}

        {stage === "results" && (
          <section className="results-card">
            <div className="result-header">
              <div>
                <p className="eyebrow">IDEA CHECK COMPLETE</p>
                <h2>{result.name}</h2>
                <p>
                  Type: <strong>{result.kind}</strong>
                </p>
                <p>
                  Asked for: <strong>{result.need}</strong>
                </p>
              </div>

              <div className="verdict-badge">
                <span>Brutal Verdict</span>
                <strong>{result.verdict}</strong>
              </div>
            </div>

            <div className="submitted-box">
              <span>What you dropped in</span>
              <p>{getIdeaPreview(result.text)}</p>
            </div>

            <div className="cards-grid">
              <ResultCard
                title="The Spark"
                body="There is something here because the idea has tension. It is not just a feature or a cute thought. It is trying to solve a real confusion point before the user even knows what box to put it in."
              />

              <ResultCard
                title="The Plain-English Version"
                body={`${result.name} is a ${getIdeaPhrase(
                  result.kind,
                )} that needs to be reduced to one clean promise before anyone can judge whether it has legs.`}
              />

              <ResultCard
                title="The Strongest Use Case"
                body="The strongest version helps someone move from vague interest to clear next action. The value is not that it gives them more ideas. The value is that it helps them stop drowning in the ones they already have."
              />

              <ResultCard
                title="The Weak Spots"
                body="Right now, the danger is over-explaining. If this takes five paragraphs to defend, the user will leave. The first version needs one job, one promise, and one satisfying result."
              />

              <ResultCard
                title="The Audience"
                body="This is probably for idea-heavy people: writers, founders, inventors, students, small business owners, creators, and restless porch philosophers with too many napkins and not enough structure."
              />

              <ResultCard
                title="The Money / Value Path"
                body="The path is not selling inspiration. The path is selling clarity. A simple paid idea check, saved reports, deeper diagnostics, and later specialized tracks could all make sense."
              />

              <ResultCard
                title="The Part You Are Probably Avoiding"
                body="You may be attached to the clever version of the idea instead of the useful version. The useful version is usually smaller, uglier, and more likely to survive contact with real people."
              />

              <ResultCard
                title="Next Three Moves"
                body="1. Write the one-sentence version. 2. Show it to five people who might actually use it. 3. Build the smallest ugly version possible before adding any fancy bullshit."
              />
            </div>

            <div className="verdict-row">
              {verdicts.map((verdict) => (
                <span
                  key={verdict}
                  className={verdict === result.verdict ? "active-verdict" : ""}
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
          background:
            radial-gradient(circle at top left, rgba(245, 158, 11, 0.18), transparent 34rem),
            radial-gradient(circle at bottom right, rgba(125, 211, 252, 0.12), transparent 30rem),
            #101010;
          color: #f5f1e8;
          padding: 28px;
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
          background: rgba(20, 20, 20, 0.88);
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
        .intake-preview span {
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
          border-radius: 999px;
          font-weight: 900;
          transition:
            transform 160ms ease,
            opacity 160ms ease,
            border-color 160ms ease,
            background 160ms ease;
        }

        .primary-button:hover,
        .secondary-button:hover,
        .ghost-button:hover {
          transform: translateY(-1px);
        }

        .primary-button {
          background: #f0b35f;
          color: #18100a;
          padding: 14px 22px;
        }

        .secondary-button {
          background: rgba(255, 255, 255, 0.09);
          color: #fff7ea;
          padding: 14px 22px;
          border: 1px solid rgba(255, 255, 255, 0.16);
        }

        .ghost-button {
          background: transparent;
          color: #f5f1e8;
          border: 1px solid rgba(255, 255, 255, 0.18);
          padding: 10px 15px;
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

        input:focus,
        select:focus,
        textarea:focus {
          border-color: rgba(240, 179, 95, 0.8);
          box-shadow: 0 0 0 4px rgba(240, 179, 95, 0.13);
        }

        textarea {
          min-height: 230px;
          resize: vertical;
        }

        .full-width {
          grid-column: 1 / -1;
        }

        .intake-preview,
        .submitted-box {
          border: 1px solid rgba(240, 179, 95, 0.24);
          background: rgba(240, 179, 95, 0.08);
          border-radius: 18px;
          padding: 16px 18px;
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
            padding: 16px;
          }

          .topbar,
          .result-header {
            flex-direction: column;
            align-items: stretch;
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