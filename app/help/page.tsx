"use client";

import Link from "next/link";

export default function HelpPage() {
  return (
    <main className="help-shell">
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

        .wrap {
          max-width: 1060px;
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
          color: #c8935a;
          text-decoration: none;
        }

        .hero,
        .panel,
        .card {
          border: 1px solid #26211c;
          background: rgba(18,16,13,0.95);
          box-shadow: 0 24px 80px rgba(0,0,0,0.22);
        }

        .hero {
          border-radius: 28px;
          padding: 32px;
          margin-bottom: 22px;
        }

        .eyebrow {
          color: #c8935a;
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
          color: #aaa096;
          line-height: 1.7;
          max-width: 820px;
          font-size: 18px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
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
          color: #aaa096;
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
          background: rgba(200,147,90,0.08);
          border-radius: 20px;
          padding: 18px;
          color: #d8b072;
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
          background: #c8935a;
          color: #0e0d0b;
          border: 1px solid #c8935a;
        }

        .button-dark {
          background: #11100e;
          color: #c8935a;
          border: 1px solid #302a24;
        }

        .mini-label {
          color: #c8935a;
          font-family: monospace;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 10px;
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

          .grid {
            grid-template-columns: 1fr;
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
          <Link href="/">Home</Link>
          <Link href="/submit">The Council</Link>
          <Link href="/sphinx">Sphinx</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/feedback">Feedback</Link>
          <Link href="/beta-terms">Beta Terms</Link>
          <Link href="/manifesto">Manifesto</Link>
        </nav>

        <section className="hero">
          <div className="eyebrow">Beta Help</div>
          <h1 className="title">How to use The Council without feeding it a whale.</h1>
          <p className="subtitle">
            The Council is a manuscript diagnosis engine. It is built to tell you what is working,
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

        <section className="grid">
          <article className="card">
            <div className="mini-label">Saved Reports</div>
            <h2>Your dashboard keeps your work.</h2>
            <p>
              When you are signed in, saved reports stay connected to your account.
              You can reopen reports, rename them, delete them, or download them as text or markdown.
            </p>
          </article>

          <article className="card">
            <div className="mini-label">Feedback</div>
            <h2>Tell us what broke.</h2>
            <p>
              Use the Feedback button when something breaks, confuses you, helps you,
              or makes you want a feature. Beta feedback is part of the build.
            </p>
          </article>
        </section>

        <section className="panel">
          <h2>Privacy, plain and simple.</h2>
          <p>
            This is a beta tool. Use common sense with sensitive material. The app needs your text
            to generate reports, and signed-in users can save report history. Admin tools track usage,
            feedback, invite codes, and report metadata so the system can be tested and improved.
          </p>
          <p>
            Do not submit private legal, medical, financial, or confidential third-party material unless
            you are comfortable using it in a beta testing environment.
          </p>

          <div className="button-row">
            <Link className="button" href="/beta-terms">Read Beta Terms</Link>
            <Link className="button-dark" href="/feedback">Send Feedback</Link>
          </div>
        </section>
      </div>
    </main>
  );
}


