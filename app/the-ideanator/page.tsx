import Link from "next/link";

const actions = [
  {
    eyebrow: "Start here",
    title: "Check a raw idea",
    body: "You have a messy idea and need to know if it is anything. Drop it in and get the brutal verdict.",
    href: "/idea?start=intake",
    cta: "Check Idea",
    primary: true,
  },
  {
    eyebrow: "Saved checks",
    title: "View idea reports",
    body: "Read saved Idea Check reports, reopen earlier runs, and put an old idea back on the lift.",
    href: "/idea/saved",
    cta: "Open Reports",
    primary: false,
  },
  {
    eyebrow: "Build system",
    title: "Build a thinking rig",
    body: "Turn raw fog or a saved idea report into a reusable prompt system, pitch helper, grant helper, or working structure.",
    href: "/ideanator",
    cta: "Build Rig",
    primary: false,
  },
  {
    eyebrow: "Reuse system",
    title: "Open saved rigs",
    body: "Find the rigs you already built, copy packets, export them, reuse them, or archive the ones that stopped earning their gas.",
    href: "/saved-ideas",
    cta: "Open Library",
    primary: false,
  },
];

export default function IdeanatorSwitchboardPage() {
  return (
    <main className="ideanator-switchboard">
      <section className="switch-wrap">
        <header className="switch-hero">
          <p className="switch-eyebrow">HOVEL IDEAS PRESENTS</p>
          <h1>The Ideanator</h1>
          <p className="switch-subhead">
            A front desk for the little bastard in your head. Check the idea, save the report,
            build a thinking rig, or reuse one you already made.
          </p>

          <div className="switch-note">
            <strong>Simple version:</strong> Idea Check judges the idea. Thinking Rigs turn that idea into a reusable working system.
          </div>
        </header>

        <section className="switch-grid" aria-label="Ideanator tools">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className={action.primary ? "switch-card switch-card-primary" : "switch-card"}
            >
              <span>{action.eyebrow}</span>
              <h2>{action.title}</h2>
              <p>{action.body}</p>
              <strong>{action.cta}</strong>
            </Link>
          ))}
        </section>

        <section className="switch-helper">
          <div>
            <p className="switch-eyebrow">Not sure?</p>
            <h2>Start with Check Idea.</h2>
            <p>
              If the idea is still foggy, do not build a rig yet. Let the Ideanator diagnose it first.
              Once the report exists, the workbench can turn that report into something reusable.
            </p>
          </div>

          <Link href="/idea?start=intake" className="switch-helper-button">
            Start with the messy idea
          </Link>
        </section>
      </section>

      <style>{`
        .ideanator-switchboard {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(245, 158, 11, 0.26), transparent 34rem),
            radial-gradient(circle at bottom right, rgba(255, 202, 118, 0.11), transparent 30rem),
            linear-gradient(135deg, #2f2114 0%, #1a1814 48%, #111413 100%);
          color: #f5f1e8;
          padding: 34px 24px 100px;
          font-family:
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .switch-wrap {
          width: min(1120px, 100%);
          margin: 0 auto;
        }

        .switch-hero,
        .switch-helper,
        .switch-card {
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(32, 28, 22, 0.9);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.42);
        }

        .switch-hero {
          border-radius: 34px;
          padding: clamp(26px, 5vw, 58px);
          margin-bottom: 18px;
          overflow: hidden;
          position: relative;
        }

        .switch-hero:before {
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

        .switch-hero > * {
          position: relative;
          z-index: 1;
        }

        .switch-eyebrow {
          margin: 0 0 12px;
          color: #f0b35f;
          font-size: 0.75rem;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-weight: 900;
        }

        .switch-hero h1 {
          margin: 0;
          font-size: clamp(3.4rem, 10vw, 8rem);
          line-height: 0.82;
          letter-spacing: -0.09em;
        }

        .switch-subhead {
          max-width: 780px;
          margin: 24px 0 0;
          color: #ddd5c7;
          font-size: clamp(1.05rem, 2vw, 1.25rem);
          line-height: 1.65;
        }

        .switch-note {
          width: fit-content;
          max-width: 820px;
          margin-top: 26px;
          border-left: 5px solid #f0b35f;
          background: rgba(255, 255, 255, 0.065);
          color: #ddd5c7;
          border-radius: 18px;
          padding: 16px 18px;
          line-height: 1.55;
        }

        .switch-note strong {
          color: #fff7ea;
        }

        .switch-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .switch-card {
          display: flex;
          flex-direction: column;
          min-height: 270px;
          border-radius: 26px;
          padding: 22px;
          color: inherit;
          text-decoration: none;
          transition:
            transform 160ms ease,
            border-color 160ms ease,
            box-shadow 160ms ease,
            background 160ms ease;
        }

        .switch-card:hover {
          transform: translateY(-2px);
          border-color: rgba(240, 179, 95, 0.72);
          box-shadow: 0 28px 90px rgba(0, 0, 0, 0.5), 0 0 32px rgba(240, 179, 95, 0.16);
        }

        .switch-card-primary {
          background:
            radial-gradient(circle at top left, rgba(255, 210, 122, 0.2), transparent 18rem),
            rgba(47, 35, 20, 0.96);
          border-color: rgba(240, 179, 95, 0.45);
        }

        .switch-card span {
          color: #f0b35f;
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.16em;
          text-transform: uppercase;
        }

        .switch-card h2 {
          margin: 18px 0 12px;
          color: #fff7ea;
          font-size: clamp(1.55rem, 2.6vw, 2.15rem);
          line-height: 0.96;
          letter-spacing: -0.06em;
        }

        .switch-card p {
          margin: 0;
          color: #d8cfc0;
          line-height: 1.6;
          font-size: 0.96rem;
        }

        .switch-card strong {
          display: inline-flex;
          width: fit-content;
          margin-top: auto;
          border-radius: 999px;
          border: 1px solid rgba(255, 221, 159, 0.34);
          background:
            radial-gradient(circle at 18px 50%, rgba(255, 220, 143, 0.8) 0 3px, transparent 4px),
            rgba(255, 255, 255, 0.08);
          color: #fff7ea;
          padding: 12px 17px 12px 34px;
          font-size: 0.78rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .switch-card-primary strong {
          background:
            radial-gradient(circle at 18px 50%, #fff3c4 0 3px, transparent 4px),
            linear-gradient(180deg, #ffd27a 0%, #f0b35f 55%, #c98438 100%);
          color: #18100a;
          border-color: rgba(255, 241, 190, 0.62);
        }

        .switch-helper {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 22px;
          border-radius: 28px;
          padding: 24px;
        }

        .switch-helper h2 {
          margin: 0;
          color: #fff7ea;
          font-size: clamp(1.7rem, 3vw, 2.5rem);
          letter-spacing: -0.05em;
        }

        .switch-helper p {
          max-width: 740px;
          margin: 10px 0 0;
          color: #d8cfc0;
          line-height: 1.65;
        }

        .switch-helper-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 50px;
          white-space: nowrap;
          border-radius: 999px;
          border: 1px solid rgba(255, 241, 190, 0.62);
          background:
            radial-gradient(circle at 18px 50%, #fff3c4 0 3px, transparent 4px),
            linear-gradient(180deg, #ffd27a 0%, #f0b35f 55%, #c98438 100%);
          color: #18100a;
          padding: 13px 20px 13px 34px;
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
        }

        @media (max-width: 980px) {
          .switch-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .switch-helper {
            flex-direction: column;
            align-items: stretch;
          }

          .switch-helper-button {
            width: fit-content;
          }
        }

        @media (max-width: 640px) {
          .ideanator-switchboard {
            padding: 20px 12px 110px;
          }

          .switch-hero,
          .switch-card,
          .switch-helper {
            border-radius: 22px;
          }

          .switch-grid {
            grid-template-columns: 1fr;
          }

          .switch-card {
            min-height: auto;
          }

          .switch-card strong {
            margin-top: 22px;
          }

          .switch-helper-button {
            width: 100%;
            white-space: normal;
            text-align: center;
          }
        }
      `}</style>
    </main>
  );
}
