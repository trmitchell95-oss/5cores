"use client";

import Link from "next/link";

const cards = [
  {
    eyebrow: "01",
    title: "Run 5 CORE",
    copy:
      "Use this for chapters, scenes, essays, story openings, serious excerpts, and work that needs real editorial diagnosis.",
    href: "/submit",
    cta: "Start Diagnosis",
    primary: true,
  },
  {
    eyebrow: "02",
    title: "Run Sphinx",
    copy:
      "Use this for blurbs, bios, posts, emails, application answers, and anything that smells too polished or too AI.",
    href: "/sphinx",
    cta: "Clean Up Text",
    primary: false,
  },
  {
    eyebrow: "03",
    title: "Open Report Library",
    copy:
      "Reopen saved reports, rename them, delete them, or download them as text or markdown.",
    href: "/dashboard",
    cta: "View Reports",
    primary: false,
  },
  {
    eyebrow: "04",
    title: "Read Help",
    copy:
      "Not sure what to paste, which tool to use, or where your reports go? Start here before feeding the machine.",
    href: "/help",
    cta: "Open Help",
    primary: false,
  },
];

export default function StartPage() {
  return (
    <main className="start-shell">
      <style>{`
        body {
          margin: 0;
          background: #0e0d0b;
        }

        .start-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(200,147,90,0.15), transparent 34rem),
            radial-gradient(circle at bottom right, rgba(90,124,200,0.1), transparent 34rem),
            #0e0d0b;
          color: #f0ece4;
          padding: 48px 24px 100px;
          font-family: Arial, sans-serif;
        }

        .wrap {
          max-width: 1180px;
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
        .card,
        .notice {
          border: 1px solid #26211c;
          background: rgba(18,16,13,0.95);
          box-shadow: 0 24px 80px rgba(0,0,0,0.22);
        }

        .hero {
          border-radius: 30px;
          padding: 36px;
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
          max-width: 900px;
          position: relative;
          z-index: 1;
        }

        .subtitle {
          color: #aaa096;
          line-height: 1.7;
          max-width: 840px;
          font-size: 18px;
          position: relative;
          z-index: 1;
        }

        .button-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 22px;
          position: relative;
          z-index: 1;
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

        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .card {
          border-radius: 24px;
          padding: 24px;
          display: grid;
          align-content: space-between;
          gap: 18px;
          min-height: 240px;
        }

        .card-top {
          display: grid;
          gap: 12px;
        }

        .card-number {
          width: fit-content;
          border: 1px solid #4b3a1f;
          background: rgba(200,147,90,0.08);
          color: #c8935a;
          border-radius: 12px;
          padding: 8px 10px;
          font-family: monospace;
          font-size: 11px;
          font-weight: 900;
        }

        .card h2 {
          font-family: Georgia, serif;
          font-size: 38px;
          line-height: 1;
          margin: 0;
        }

        .card p,
        .notice p,
        li {
          color: #aaa096;
          line-height: 1.65;
          font-size: 16px;
        }

        .notice {
          border-radius: 24px;
          padding: 24px;
        }

        .notice h2 {
          font-family: Georgia, serif;
          font-size: 34px;
          line-height: 1;
          margin: 0 0 14px;
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
          border-radius: 18px;
          padding: 16px;
          color: #d8b072;
          line-height: 1.6;
          margin-top: 16px;
        }

        @media (max-width: 820px) {
          .start-shell {
            padding: 28px 14px 100px;
          }

          .hero,
          .card,
          .notice {
            border-radius: 20px;
            padding: 18px;
          }

          .grid {
            grid-template-columns: 1fr;
          }

          .title {
            font-size: clamp(44px, 12vw, 64px);
          }

          .button-row {
            display: grid;
          }

          .button,
          .button-dark {
            text-align: center;
          }

          .card {
            min-height: auto;
          }
        }
      `}</style>

      <div className="wrap">
        <nav className="top-nav">
          <Link href="/">Home</Link>
          <Link href="/submit">5 CORE</Link>
          <Link href="/sphinx">Sphinx</Link>
          <Link href="/dashboard">Reports</Link>
          <Link href="/help">Help</Link>
          <Link href="/manifesto">Manifesto</Link>
          <Link href="/feedback">Feedback</Link>
        </nav>

        <section className="hero">
          <div className="eyebrow">Beta Launchpad</div>
          <h1 className="title">Start here, then feed the machine.</h1>
          <p className="subtitle">
            This is the simple beta control room. Pick the right tool, run the text,
            save what matters, and tell us what breaks. No mystery hallway. No digital
            raccoon hunt.
          </p>

          <div className="button-row">
            <Link className="button" href="/submit">Start 5 CORE</Link>
            <Link className="button-dark" href="/sphinx">Run Sphinx</Link>
            <Link className="button-dark" href="/dashboard">Open Reports</Link>
          </div>
        </section>

        <section className="grid">
          {cards.map((card) => (
            <article className="card" key={card.title}>
              <div className="card-top">
                <div className="card-number">{card.eyebrow}</div>
                <h2>{card.title}</h2>
                <p>{card.copy}</p>
              </div>

              <Link className={card.primary ? "button" : "button-dark"} href={card.href}>
                {card.cta}
              </Link>
            </article>
          ))}
        </section>

        <section className="notice">
          <h2>Beta rules of the road.</h2>
          <ul>
            <li>Use excerpts, chapters, scenes, essays, bios, grant answers, and application responses.</li>
            <li>Do not paste a whole book unless you enjoy watching money catch fire.</li>
            <li>Use 5 CORE for deeper manuscript diagnosis.</li>
            <li>Use Sphinx for shorter cleanup when something sounds stiff, generic, or too AI.</li>
            <li>Use Feedback when something breaks, confuses you, or gives you a useful idea.</li>
          </ul>

          <div className="callout">
            Current beta limits: 5 CORE is best under about 25,000 characters.
            Sphinx is best under about 10,000 characters.
          </div>

          <div className="button-row">
            <Link className="button" href="/help">Read Full Help</Link>
            <Link className="button-dark" href="/beta-terms">Read Beta Terms</Link>
            <Link className="button-dark" href="/feedback">Send Feedback</Link>
          </div>
        </section>
      </div>
    </main>
  );
}




