"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function isIdeanatorHostName(hostname: string) {
  return hostname === "theideanator.com" || hostname === "www.theideanator.com";
}

export default function HelpPage() {
  const [isIdeanator, setIsIdeanator] = useState(false);

  useEffect(() => {
    setIsIdeanator(isIdeanatorHostName(window.location.hostname.toLowerCase()));
  }, []);

  return (
    <main className={isIdeanator ? "help-shell idea-help" : "help-shell"}>
      <style>{`
        body {
          margin: 0;
          background: #0e0d0b;
        }

        .help-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(200,147,90,0.13), transparent 34rem),
            radial-gradient(circle at bottom right, rgba(90,124,200,0.1), transparent 32rem),
            #0e0d0b;
          color: #f0ece4;
          padding: 48px 24px 90px;
          font-family: Arial, sans-serif;
        }

        .idea-help {
          background:
            radial-gradient(circle at top left, rgba(245, 158, 11, 0.26), transparent 36rem),
            radial-gradient(circle at bottom right, rgba(255, 202, 118, 0.12), transparent 32rem),
            linear-gradient(135deg, #332313 0%, #242018 46%, #1c211e 100%);
        }

        .wrap {
          max-width: 1100px;
          margin: 0 auto;
        }

        .top-nav {
          display: flex;
          gap: 14px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          align-items: center;
        }

        .top-nav a {
          color: ${isIdeanator ? "#f0b35f" : "#c8935a"};
          text-decoration: none;
          font-family: monospace;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .hero,
        .panel,
        .card {
          border: 1px solid ${isIdeanator ? "rgba(255, 221, 159, 0.2)" : "#26211c"};
          background: ${isIdeanator ? "rgba(43, 38, 30, 0.92)" : "rgba(18,16,13,0.95)"};
          box-shadow: 0 24px 80px rgba(0,0,0,0.22);
        }

        .hero {
          border-radius: 28px;
          padding: 32px;
          margin-bottom: 22px;
        }

        .eyebrow {
          color: ${isIdeanator ? "#f0b35f" : "#c8935a"};
          font-family: monospace;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          font-size: 12px;
          font-weight: 900;
        }

        .title {
          font-family: Georgia, serif;
          font-size: clamp(48px, 8vw, 82px);
          line-height: 0.95;
          margin: 12px 0 0;
        }

        .subtitle {
          color: #ddd5c7;
          line-height: 1.7;
          max-width: 850px;
          font-size: 18px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .three-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .card,
        .panel {
          border-radius: 24px;
          padding: 24px;
        }

        .card h2,
        .panel h2 {
          font-family: Georgia, serif;
          font-size: 34px;
          line-height: 1;
          margin: 0 0 14px;
        }

        .card p,
        .panel p,
        li {
          color: #ddd5c7;
          line-height: 1.65;
          font-size: 16px;
        }

        ul {
          margin: 12px 0 0;
          padding-left: 22px;
        }

        li {
          margin-bottom: 10px;
        }

        .callout {
          border: 1px solid #4b3a1f;
          background: rgba(240,179,95,0.1);
          border-radius: 20px;
          padding: 18px;
          color: #f3c27d;
          line-height: 1.65;
          margin-top: 16px;
        }

        .button-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 18px;
        }

        .button,
        .button-dark {
          border-radius: 14px;
          padding: 13px 16px;
          font-family: monospace;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
        }

        .button {
          background: ${isIdeanator ? "#f0b35f" : "#c8935a"};
          color: #0e0d0b;
          border: 1px solid ${isIdeanator ? "#f0b35f" : "#c8935a"};
        }

        .button-dark {
          background: #11100e;
          color: ${isIdeanator ? "#f0b35f" : "#c8935a"};
          border: 1px solid #302a24;
        }

        .mini-label {
          color: ${isIdeanator ? "#f0b35f" : "#c8935a"};
          font-family: monospace;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .steps {
          counter-reset: step;
          display: grid;
          gap: 12px;
        }

        .step {
          border: 1px solid rgba(255, 221, 159, 0.14);
          background: rgba(0, 0, 0, 0.16);
          border-radius: 18px;
          padding: 16px;
        }

        .step strong {
          color: #fff7ea;
        }

        @media (max-width: 920px) {
          .grid,
          .three-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 820px) {
          .help-shell {
            padding: 28px 14px 90px;
          }

          .hero,
          .panel,
          .card {
            border-radius: 20px;
            padding: 18px;
          }

          .title {
            font-size: clamp(42px, 12vw, 60px);
          }

          .button-row {
            display: grid;
          }

          .button,
          .button-dark {
            text-align: center;
          }
        }
      `}</style>

      <div className="wrap">
        <nav className="top-nav">
          <Link href={isIdeanator ? "/ideanator" : "/"}>{isIdeanator ? "Rig Workbench" : "Home"}</Link>
          {isIdeanator ? (
            <>
              <Link href="/idea">Idea Check</Link>
              <Link href="/idea/saved">Idea Reports</Link>
              <Link href="/rigs">Rig Library</Link>
            </>
          ) : (
            <>
              <Link href="/submit">The Council</Link>
              <Link href="/sphinx">Sphinx</Link>
              <Link href="/dashboard">Dashboard</Link>
            </>
          )}
          <Link href="/feedback">Feedback</Link>
          <Link href="/beta-terms">Beta Terms</Link>
        </nav>

        {isIdeanator ? (
          <>
            <section className="hero">
              <div className="eyebrow">Ideanator Help</div>
              <h1 className="title">Fog in. Thinking Rig out.</h1>
              <p className="subtitle">
                The Ideanator has two connected sides now. Idea Check diagnoses the messy idea.
                Rig Workbench turns that diagnosis, document, or rough material into a reusable working structure.
                This is not just a prompt builder. It is a place to pressure-test, organize, reuse, export, and keep working.
              </p>

              <div className="button-row">
                <Link className="button" href="/idea">Run Idea Check</Link>
                <Link className="button-dark" href="/ideanator">Open Rig Workbench</Link>
                <Link className="button-dark" href="/idea/saved">Open Idea Reports</Link>
                <Link className="button-dark" href="/rigs">Open Rig Library</Link>
              </div>
            </section>

            <section className="grid">
              <article className="card">
                <div className="mini-label">Lane One</div>
                <h2>Idea Check diagnoses the idea.</h2>
                <p>
                  Use Idea Check when you have a raw idea, invention note, product concept, story seed,
                  business thought, grant angle, or strategy dump and need to know what the hell it actually is.
                </p>
                <ul>
                  <li>Gives a verdict, spark, weak spots, audience, value path, and next moves.</li>
                  <li>Best for early ideas that are still foggy.</li>
                  <li>Saves as an Idea Report when you choose to save it.</li>
                </ul>
              </article>

              <article className="card">
                <div className="mini-label">Lane Two</div>
                <h2>Rig Workbench builds the reusable pattern.</h2>
                <p>
                  Use Rig Workbench when you want to turn fog into a reusable structure. The left side is the Fog.
                  The right side is the Blueprint. The buttons below run, save, copy, or export the rig.
                </p>
                <ul>
                  <li>Fog is the messy source material.</li>
                  <li>Blueprint is the organized instruction structure.</li>
                  <li>Run Rig creates the finished output.</li>
                </ul>
              </article>
            </section>

            <section className="panel">
              <h2>The basic Ideanator loop.</h2>
              <div className="steps">
                <div className="step"><strong>1. Drop the idea into Idea Check.</strong> Get the diagnosis first.</div>
                <div className="step"><strong>2. Save the Idea Report.</strong> This preserves the verdict and useful notes.</div>
                <div className="step"><strong>3. Click Build Rig.</strong> The report opens in Rig Workbench and fills the Fog and Blueprint.</div>
                <div className="step"><strong>4. Review the Blueprint.</strong> Change the purpose, audience, tone, constraints, or missing pieces.</div>
                <div className="step"><strong>5. Click Run Rig.</strong> This generates the finished working output.</div>
                <div className="step"><strong>6. Save as New Rig.</strong> The reusable pattern goes to Rig Library.</div>
              </div>

              <div className="callout">
                When you arrive from Build Rig and feel lost, scroll up. Fog is on the left. Blueprint is on the right.
                You usually do not need to generate the blueprint again. Review it, then click Run Rig.
              </div>
            </section>

            <section className="three-grid">
              <article className="card">
                <div className="mini-label">Idea Reports</div>
                <h2>Reports are diagnosis.</h2>
                <p>
                  Idea Reports are saved checkups. They tell you what the idea is, what is strong,
                  what leaks oil, and what to try next.
                </p>
                <ul>
                  <li>Use Back on the Lift to revise and rerun.</li>
                  <li>Use Compare when you have multiple versions.</li>
                  <li>Use Build Rig to turn the report into a reusable structure.</li>
                </ul>
              </article>

              <article className="card">
                <div className="mini-label">Rig Library</div>
                <h2>Rigs are reusable tools.</h2>
                <p>
                  A saved rig is not just a report. It is a reusable working pattern. Open it, revise it,
                  run it again, update it, copy it, export it, or archive it.
                </p>
                <ul>
                  <li>Open a saved rig from Rig Library.</li>
                  <li>Update Open Rig saves changes to the current rig.</li>
                  <li>Save as New Rig creates a new version.</li>
                </ul>
              </article>

              <article className="card">
                <div className="mini-label">Portable Prompt</div>
                <h2>Take the rig elsewhere.</h2>
                <p>
                  The Portable Prompt is the copyable structure you can take to another AI room.
                  It is for portability and trust, not because you have to leave the app.
                </p>
                <ul>
                  <li>Copy the Blueprint when you want the structure only.</li>
                  <li>Copy the Portable Prompt when you want to use the rig elsewhere.</li>
                  <li>Copy Full Rig Packet when you want everything together.</li>
                </ul>
              </article>
            </section>

            <section className="panel">
              <h2>Uploads and exports.</h2>
              <p>
                Rig Workbench can accept pasted text or uploaded documents. Current upload support is for TXT,
                Markdown, and modern Word DOCX files. Old DOC files and PDFs are not supported yet.
              </p>
              <ul>
                <li>Use Upload TXT / MD / DOCX in the Fog panel.</li>
                <li>Use exports when you want to keep the prompt, output, or full packet outside the app.</li>
                <li>Do not upload confidential legal, medical, financial, or third-party material unless you are comfortable testing it in beta.</li>
              </ul>
            </section>
          </>
        ) : (
          <>
            <section className="hero">
              <div className="eyebrow">Beta Help</div>
              <h1 className="title">How to use The Council without feeding it a whale.</h1>
              <p className="subtitle">
                The Council is a manuscript diagnosis engine. It tells you what is working,
                what is dragging, what is cracked, and what to fix first. It is not a magic rewrite button,
                a therapist, a lawyer, or a replacement for your own judgment.
              </p>

              <div className="button-row">
                <Link className="button" href="/submit">Start The Council Diagnosis</Link>
                <Link className="button-dark" href="/sphinx">Run Sphinx Cleanup</Link>
                <Link className="button-dark" href="/manifesto">Read The Manifesto</Link>
              </div>
            </section>

            <section className="grid">
              <article className="card">
                <div className="mini-label">The Council</div>
                <h2>Use it for manuscript diagnosis.</h2>
                <p>
                  The Council reads an excerpt through multiple editorial lenses and gives you a saved report.
                  It is best for chapters, scenes, essays, story openings, grant answers, bios, or substantial excerpts.
                </p>
                <ul>
                  <li>Best for deeper editorial feedback.</li>
                  <li>Use when you want structure, voice, pacing, market, or priority notes.</li>
                  <li>Current beta limit: about 25,000 characters.</li>
                </ul>
              </article>

              <article className="card">
                <div className="mini-label">Sphinx</div>
                <h2>Use it for AI stink removal.</h2>
                <p>
                  Sphinx is for shorter writing that feels too polished, too generic, too corporate,
                  or too much like a robot wearing a conference badge.
                </p>
                <ul>
                  <li>Best for blurbs, posts, emails, bios, application answers, and short passages.</li>
                  <li>It diagnoses the stink, then gives cleaner options.</li>
                  <li>Current beta limit: about 10,000 characters.</li>
                </ul>
              </article>
            </section>

            <section className="panel">
              <h2>What should I paste?</h2>
              <ul>
                <li>A chapter, scene, essay, short story, pitch, blurb, grant answer, bio, or application response.</li>
                <li>Text you actually want diagnosed, not just praised.</li>
                <li>Enough context for the tool to understand what it is looking at.</li>
                <li>For Word files, use modern .docx files. Old .doc files and PDFs are not supported yet.</li>
              </ul>

              <div className="callout">
                Do not paste a whole book into the beta. That is how we turn a useful truck into a smoking crater.
                Use a meaningful excerpt instead.
              </div>
            </section>
          </>
        )}

        <section className="grid">
          <article className="card">
            <div className="mini-label">Feedback</div>
            <h2>Tell us what broke.</h2>
            <p>
              Use the Feedback button when something breaks, confuses you, helps you,
              or makes you want a feature. Beta feedback is part of the build.
            </p>
          </article>

          <article className="card">
            <div className="mini-label">Privacy</div>
            <h2>Use beta judgment.</h2>
            <p>
              The app needs your text to generate reports or rigs. Signed-in users can save report history,
              rig history, and related metadata. Do not submit private legal, medical, financial, or confidential
              third-party material unless you are comfortable using it in a beta testing environment.
            </p>
          </article>
        </section>

        <section className="panel">
          <h2>Still confused?</h2>
          <p>
            On The Ideanator side, start with Idea Check when the idea is unclear.
            Start with Rig Workbench when you already have material and want a reusable working structure.
            Open Rig Library when you want to reuse something you already saved.
          </p>

          <div className="button-row">
            <Link className="button" href={isIdeanator ? "/ideanator" : "/submit"}>
              {isIdeanator ? "Open Rig Workbench" : "Run The Council"}
            </Link>
            <Link className="button-dark" href="/feedback">Send Feedback</Link>
            <Link className="button-dark" href="/beta-terms">Read Beta Terms</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

