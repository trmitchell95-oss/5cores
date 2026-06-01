"use client";

import Link from "next/link";

export default function ManifestoPage() {
  return (
    <main className="manifesto-shell">
      <style>{`
        body {
          margin: 0;
          background: #0e0d0b;
        }

        .manifesto-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(200,147,90,0.16), transparent 34rem),
            radial-gradient(circle at bottom right, rgba(90,124,200,0.1), transparent 34rem),
            #0e0d0b;
          color: #f0ece4;
          padding: 48px 24px 110px;
          font-family: Arial, sans-serif;
        }

        .wrap {
          max-width: 980px;
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
        .panel {
          border: 1px solid #26211c;
          background: rgba(18,16,13,0.95);
          box-shadow: 0 24px 80px rgba(0,0,0,0.22);
        }

        .hero {
          border-radius: 30px;
          padding: 38px;
          margin-bottom: 22px;
          position: relative;
          overflow: hidden;
        }

        .hero::after {
          content: "";
          position: absolute;
          right: -7rem;
          top: -7rem;
          width: 20rem;
          height: 20rem;
          border-radius: 999px;
          background: rgba(200,147,90,0.08);
          pointer-events: none;
        }

        .eyebrow {
          color: #c8935a;
          font-family: monospace;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          font-size: 12px;
          font-weight: 900;
          position: relative;
          z-index: 1;
        }

        .title {
          font-family: Georgia, serif;
          font-size: clamp(52px, 8vw, 92px);
          line-height: 0.92;
          margin: 14px 0 0;
          position: relative;
          z-index: 1;
        }

        .subtitle {
          color: #aaa096;
          line-height: 1.7;
          max-width: 820px;
          font-size: 18px;
          position: relative;
          z-index: 1;
        }

        .panel {
          border-radius: 26px;
          padding: 34px;
        }

        .manifesto-copy {
          display: grid;
          gap: 22px;
        }

        .manifesto-copy p {
          color: #d7d0c8;
          font-size: 19px;
          line-height: 1.85;
          margin: 0;
        }

        .manifesto-copy strong {
          color: #ffffff;
        }

        .button-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
        }

        .button,
        .button-dark {
          border-radius: 15px;
          padding: 14px 18px;
          font-family: monospace;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.14em;
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

        @media (max-width: 820px) {
          .manifesto-shell {
            padding: 28px 14px 110px;
          }

          .hero,
          .panel {
            border-radius: 20px;
            padding: 20px;
          }

          .title {
            font-size: clamp(44px, 12vw, 64px);
          }

          .manifesto-copy p {
            font-size: 16px;
            line-height: 1.75;
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
          <Link href="/start">Start</Link>
          <Link href="/submit">The Council</Link>
          <Link href="/sphinx">Sphinx</Link>
          <Link href="/dashboard">Reports</Link>
          <Link href="/help">Help</Link>
        </nav>

        <section className="hero">
          <div className="eyebrow">The Hovel Editor Manifesto</div>
          <h1 className="title">Keep the soul in the sentence.</h1>
          <p className="subtitle">
            The public version of the little garage note behind The Council, SPHINX, and the whole damn machine.
          </p>
        </section>

        <section className="panel">
          <div className="manifesto-copy">
            <p>
              The Hovel Editor is the garage. <strong>The Council</strong> and <strong>SPHINX</strong> are the tools on the bench. None of it was built to replace writers. It was built because the machine is already in the room, and pretending otherwise is useless. Writers are going to use AI. Editors are going to use AI. Publishers, teachers, applicants, marketers, and weird little goblins with laptops at 2:00 in the morning are going to use it. The question is not whether the tool exists. The question is whether we let the tool sand every fingerprint off the work.
            </p>

            <p>
              AI is a tool. So is a chisel. So is a brush. Michelangelo did not use one sacred instrument for every cut, scrape, shadow, and color. He used what the work demanded. That is the point here too. Use the machine when it helps. Distrust it when it flatters. Argue with it. Ignore it when it is wrong. But do not hand it the keys to your voice.
            </p>

            <p>
              The Council checks the manuscript&apos;s bones. SPHINX checks the pulse. One asks whether the structure holds. The other leans close to the sentence and asks whether a human being still lives there. The goal is not cleaner writing, smoother writing, or prettier words wearing a rented tuxedo. The goal is writing that still sounds stubbornly, unmistakably human.
            </p>
          </div>

          <div className="button-row">
            <Link className="button" href="/start">Start Using The Hovel</Link>
            <Link className="button-dark" href="/submit">Run The Council</Link>
            <Link className="button-dark" href="/sphinx">Run SPHINX</Link>
          </div>
        </section>
      </div>
    </main>
  );
}

