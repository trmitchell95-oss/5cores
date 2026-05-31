import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="not-found-shell">
      <style>{`
        body {
          margin: 0;
          background: #0e0d0b;
        }

        .not-found-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(200,147,90,0.15), transparent 34rem),
            radial-gradient(circle at bottom right, rgba(90,124,200,0.1), transparent 34rem),
            #0e0d0b;
          color: #f0ece4;
          padding: 48px 24px;
          font-family: Arial, sans-serif;
          display: grid;
          place-items: center;
        }

        .card {
          width: min(920px, 100%);
          border: 1px solid #26211c;
          background: rgba(18,16,13,0.95);
          border-radius: 30px;
          padding: 36px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.35);
        }

        .eyebrow {
          color: #c8935a;
          font-family: monospace;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          font-size: 12px;
          font-weight: 900;
        }

        h1 {
          font-family: Georgia, serif;
          font-size: clamp(48px, 8vw, 84px);
          line-height: 0.94;
          margin: 14px 0 0;
        }

        p {
          color: #aaa096;
          line-height: 1.7;
          font-size: 17px;
          max-width: 760px;
        }

        .button-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 22px;
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

        @media (max-width: 760px) {
          .not-found-shell {
            padding: 28px 14px;
          }

          .card {
            border-radius: 22px;
            padding: 22px;
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

      <section className="card">
        <div className="eyebrow">404</div>
        <h1>This room does not exist.</h1>
        <p>
          You found a hallway with no door. Either the link is wrong, the page moved,
          or we have not built that particular little bastard yet.
        </p>

        <div className="button-row">
          <Link className="button" href="/start">Go to Start</Link>
          <Link className="button-dark" href="/">Home</Link>
          <Link className="button-dark" href="/dashboard">Dashboard</Link>
          <Link className="button-dark" href="/help">Help</Link>
          <Link className="button-dark" href="/feedback">Feedback</Link>
        </div>
      </section>
    </main>
  );
}
