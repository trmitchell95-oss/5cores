import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="not-found-shell">
      <style>{`
        body {
          margin: 0;
          background: #11100c;
        }

        .not-found-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(200,147,90,0.15), transparent 34rem),
            radial-gradient(circle at bottom right, rgba(90,124,200,0.1), transparent 34rem),
            #11100c;
          color: #eef4ff;
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
          color: #d88a1f;
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
          color: #cbd5e1;
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
          background: #d88a1f;
          color: #11100c;
          border: 1px solid #d88a1f;
        }

        .button-dark {
          background: #332115;
          color: #d88a1f;
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
      
          /* =========================================================
             NOT FOUND RETRO FINAL OVERRIDES
             Directly fixes old blue 404 page classes.
             ========================================================= */

          .not-found-shell {
            background:
              radial-gradient(circle at 14% 0%, rgba(181, 90, 28, 0.25), transparent 32rem),
              radial-gradient(circle at 88% 8%, rgba(91, 117, 55, 0.16), transparent 28rem),
              linear-gradient(135deg, #28180d 0%, #11100c 48%, #2b1a0f 100%) !important;
            color: #f8ecd2 !important;
          }

          .not-found-shell .card {
            background:
              linear-gradient(180deg, rgba(51, 33, 21, 0.97), rgba(24, 19, 14, 0.97)) !important;
            color: #f8ecd2 !important;
            border-color: rgba(222, 176, 96, 0.42) !important;
          }

          .not-found-shell h1 {
            color: #fff1cf !important;
            font-family: Georgia, "Times New Roman", serif !important;
          }

          .not-found-shell .button,
          .not-found-shell .button-dark {
            background:
              linear-gradient(180deg, #d88a1f, #8c4e11) !important;
            color: #fff8e7 !important;
            border-color: rgba(255, 220, 145, 0.68) !important;
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
