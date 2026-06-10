export default function LoadingPage() {
  return (
    <main className="loading-shell">
      <style>{`
        body {
          margin: 0;
          background: #0e0d0b;
        }

        .loading-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(200,147,90,0.13), transparent 34rem),
            radial-gradient(circle at bottom right, rgba(90,124,200,0.1), transparent 34rem),
            #0e0d0b;
          color: #f0ece4;
          display: grid;
          place-items: center;
          padding: 48px 24px;
          font-family: Arial, sans-serif;
        }

        .card {
          border: 1px solid #26211c;
          background: rgba(18,16,13,0.95);
          border-radius: 28px;
          padding: 32px;
          width: min(620px, 100%);
          box-shadow: 0 24px 80px rgba(0,0,0,0.35);
          text-align: center;
        }

        .spinner {
          width: 54px;
          height: 54px;
          border-radius: 999px;
          border: 4px solid #302a24;
          border-top-color: #c8935a;
          margin: 0 auto 20px;
          animation: spin 0.9s linear infinite;
        }

        .eyebrow {
          color: #c8935a;
          font-family: monospace;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          font-size: 12px;
          font-weight: 900;
          margin-bottom: 12px;
        }

        h1 {
          font-family: Georgia, serif;
          font-size: clamp(38px, 6vw, 62px);
          line-height: 0.95;
          margin: 0;
        }

        p {
          color: #aaa096;
          line-height: 1.7;
          margin-top: 16px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

      <section className="card">
        <div className="spinner" />
        <div className="eyebrow">Loading</div>
        <h1>Loading The Ideanatorâ€¦</h1>
        <p>This should only take a moment.</p>
      </section>
    </main>
  );
}
