"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

type ExportType = "usage" | "feedback" | "invites";

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function labelFor(type: ExportType) {
  if (type === "usage") return "Usage Events";
  if (type === "feedback") return "Feedback";
  return "Invite Codes";
}

function filenameFor(type: ExportType) {
  const stamp = new Date().toISOString().slice(0, 10);

  if (type === "usage") return `hovel-editor-usage-events-${stamp}.csv`;
  if (type === "feedback") return `hovel-editor-feedback-${stamp}.csv`;
  return `hovel-editor-invite-codes-${stamp}.csv`;
}

export default function AdminExportsPage() {
  const [loadingType, setLoadingType] = useState<ExportType | "">("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function downloadExport(type: ExportType) {
    setLoadingType(type);
    setError("");
    setMessage("");

    try {
      const supabase = getSupabaseClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(`/api/admin/exports?type=${type}`, {
        headers: {
          authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || "Could not download export.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = filenameFor(type);
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.URL.revokeObjectURL(url);

      setMessage(`${labelFor(type)} export downloaded.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoadingType("");
    }
  }

  return (
    <main className="export-shell">
      <style>{`
        body {
          margin: 0;
          background: #0e0d0b;
        }

        .export-shell {
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
        .panel,
        .export-card {
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
          max-width: 780px;
        }

        .notice-good,
        .notice-bad {
          padding: 14px;
          border-radius: 12px;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .notice-good {
          border: 1px solid #214a2d;
          background: #0a1a0e;
          color: #98d8aa;
        }

        .notice-bad {
          border: 1px solid #5a2020;
          background: #2a1010;
          color: #f0a0a0;
        }

        .panel {
          border-radius: 24px;
          padding: 22px;
        }

        .export-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .export-card {
          border-radius: 20px;
          padding: 20px;
          display: grid;
          gap: 14px;
          align-content: start;
        }

        .card-title {
          font-family: Georgia, serif;
          font-size: 30px;
          line-height: 1;
          margin: 0;
        }

        .card-copy {
          color: #aaa096;
          line-height: 1.55;
          font-size: 14px;
          margin: 0;
        }

        .export-button {
          min-height: 48px;
          border-radius: 12px;
          border: none;
          background: #c8935a;
          color: #0e0d0b;
          font-family: monospace;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .export-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        @media (max-width: 820px) {
          .export-shell {
            padding: 28px 14px 90px;
          }

          .hero,
          .panel,
          .export-card {
            border-radius: 20px;
            padding: 18px;
          }

          .export-grid {
            grid-template-columns: 1fr;
          }

          .title {
            font-size: clamp(42px, 12vw, 60px);
          }
        }
      `}</style>

      <div className="wrap">
        <nav className="top-nav">
          <Link href="/admin/usage">Speedometer</Link>
          <Link href="/admin/feedback">Feedback</Link>
          <Link href="/admin/invites">Invites</Link>
          <Link href="/dashboard">Dashboard</Link>
        </nav>

        <section className="hero">
          <div className="eyebrow">Admin Exports</div>
          <h1 className="title">The paper trail.</h1>
          <p className="subtitle">
            Download clean CSV files for beta usage, feedback, and invite codes.
            This keeps you from digging through Supabase like a raccoon with a flashlight.
          </p>
        </section>

        {error && <div className="notice-bad">{error}</div>}
        {message && <div className="notice-good">{message}</div>}

        <section className="panel">
          <div className="export-grid">
            <article className="export-card">
              <h2 className="card-title">Usage</h2>
              <p className="card-copy">
                Exports recent The Council, Sphinx, save, failure, and rejection events.
              </p>
              <button
                className="export-button"
                type="button"
                disabled={loadingType !== ""}
                onClick={() => downloadExport("usage")}
              >
                {loadingType === "usage" ? "Downloading..." : "Download CSV"}
              </button>
            </article>

            <article className="export-card">
              <h2 className="card-title">Feedback</h2>
              <p className="card-copy">
                Exports beta tester comments, bug reports, feature requests, and review status.
              </p>
              <button
                className="export-button"
                type="button"
                disabled={loadingType !== ""}
                onClick={() => downloadExport("feedback")}
              >
                {loadingType === "feedback" ? "Downloading..." : "Download CSV"}
              </button>
            </article>

            <article className="export-card">
              <h2 className="card-title">Invites</h2>
              <p className="card-copy">
                Exports invite codes, labels, active status, use limits, and use counts.
              </p>
              <button
                className="export-button"
                type="button"
                disabled={loadingType !== ""}
                onClick={() => downloadExport("invites")}
              >
                {loadingType === "invites" ? "Downloading..." : "Download CSV"}
              </button>
            </article>
          </div>
        </section>
      </div>
    </main>
  );
}


