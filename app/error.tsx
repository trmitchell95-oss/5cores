"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("The Council app error:", error);
  }, [error]);

  return (
    <main className="error-shell">
      <style>{`
        body {
          margin: 0;
          background: #060b16;
        }

        .error-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(200,147,90,0.15), transparent 34rem),
            radial-gradient(circle at bottom right, rgba(140,40,40,0.13), transparent 34rem),
            #060b16;
          color: #eef4ff;
          padding: 48px 24px;
          font-family: Arial, sans-serif;
          display: grid;
          place-items: center;
        }

        .card {
          width: min(920px, 100%);
          border: 1px solid #352720;
          background: rgba(18,16,13,0.95);
          border-radius: 30px;
          padding: 36px;
          box-shadow: 0 24px 80px rgba(0,0,0,0.35);
        }

        .eyebrow {
          color: #93c5fd;
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

        .error-box {
          border: 1px solid #5a2020;
          background: #2a1010;
          color: #f0a0a0;
          border-radius: 18px;
          padding: 16px;
          margin: 22px 0;
          line-height: 1.55;
          font-family: monospace;
          font-size: 13px;
          white-space: pre-wrap;
          overflow-wrap: anywhere;
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
          cursor: pointer;
        }

        .button {
          background: #93c5fd;
          color: #060b16;
          border: 1px solid #93c5fd;
        }

        .button-dark {
          background: #0f172a;
          color: #93c5fd;
          border: 1px solid #302a24;
        }

        @media (max-width: 760px) {
          .error-shell {
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
        <div className="eyebrow">Something broke</div>
        <h1>The machine coughed.</h1>
        <p>
          Something went wrong inside the app. Your browser did not explode.
          The raccoon is probably still in one piece. Try again, or head back to a safe page.
        </p>

        <div className="error-box">
          {error?.message || "Unknown app error."}
          {error?.digest ? `\nDigest: ${error.digest}` : ""}
        </div>

        <div className="button-row">
          <button className="button" type="button" onClick={() => reset()}>
            Try Again
          </button>
          <Link className="button-dark" href="/start">Start</Link>
          <Link className="button-dark" href="/dashboard">Dashboard</Link>
          <Link className="button-dark" href="/help">Help</Link>
          <Link className="button-dark" href="/feedback">Feedback</Link>
        </div>
      </section>
    </main>
  );
}


