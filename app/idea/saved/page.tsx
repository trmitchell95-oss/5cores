"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type Report = {
  id: string;
  created_at: string;
  title: string | null;
  report_type?: string | null;
  intake?: string | Record<string, unknown> | null;
};

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase browser settings.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

function parseIntake(intake: Report["intake"]): Record<string, unknown> {
  if (!intake) return {};

  if (typeof intake === "object") {
    return intake;
  }

  try {
    const parsed = JSON.parse(intake);

    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {
    return {};
  }

  return {};
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isIdeanatorReport(report: Report) {
  const intake = parseIntake(report.intake);

  return report.report_type === "ideanator" || intake.tool === "ideanator";
}

function normalizeTimestamp(dateStr: string) {
  const hasTimezone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(dateStr);
  return hasTimezone ? dateStr : `${dateStr}Z`;
}

function formatDate(dateStr: string) {
  const date = new Date(normalizeTimestamp(dateStr));

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export default function SavedIdeasPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  async function loadReports() {
    try {
      setError("");

      const supabase = getSupabaseClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/reports", {
        headers: {
          authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load saved ideas.");
      }

      const allReports = (data.reports || []) as Report[];
      setReports(allReports.filter(isIdeanatorReport));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load saved ideas.");
      setReports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  async function refreshReports() {
    setRefreshing(true);
    await loadReports();
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      if (!normalizedSearch) return true;

      const intake = parseIntake(report.intake);

      return [
        report.title || "",
        getString(intake.ideaKind),
        getString(intake.primaryNeed),
        getString(intake.verdict),
        getString(intake.sourceReportTitle),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [reports, normalizedSearch]);

  const latestReport = reports[0];

  return (
    <main className="idea-saved-shell">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #101010;
        }

        .idea-saved-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(245, 158, 11, 0.18), transparent 34rem),
            radial-gradient(circle at bottom right, rgba(125, 211, 252, 0.1), transparent 30rem),
            #101010;
          color: #f5f1e8;
          font-family:
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .wrap {
          width: min(1120px, 100%);
          margin: 0 auto;
          padding: 34px 24px 100px;
        }

        .hero {
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(20, 20, 20, 0.88);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
          border-radius: 32px;
          padding: clamp(24px, 5vw, 52px);
          margin-bottom: 22px;
        }

        .eyebrow {
          margin: 0 0 10px;
          color: #f0b35f;
          font-size: 0.75rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 900;
        }

        h1 {
          margin: 0;
          font-size: clamp(2.6rem, 7vw, 5.8rem);
          line-height: 0.92;
          letter-spacing: -0.08em;
        }

        h2 {
          margin: 0;
          font-size: clamp(1.7rem, 3vw, 2.6rem);
          line-height: 1;
          letter-spacing: -0.04em;
        }

        p {
          color: #ddd5c7;
          line-height: 1.65;
        }

        .subhead {
          max-width: 760px;
          margin: 18px 0 0;
          font-size: 1.05rem;
        }

        .hero-actions,
        .controls {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          margin-top: 26px;
        }

        .primary-link,
        .secondary-link,
        .refresh-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          border-radius: 999px;
          padding: 13px 18px;
          font-size: 0.78rem;
          font-weight: 1000;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          cursor: pointer;
        }

        .primary-link {
          background: #f0b35f;
          color: #18100a;
          border: 1px solid #f0b35f;
        }

        .secondary-link,
        .refresh-button {
          background: rgba(255, 255, 255, 0.06);
          color: #f5f1e8;
          border: 1px solid rgba(255, 255, 255, 0.16);
        }

        .secondary-link:hover,
        .refresh-button:hover {
          border-color: #f0b35f;
          color: #f0b35f;
        }

        .refresh-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(280px, 0.55fr);
          gap: 16px;
          margin-bottom: 22px;
        }

        .summary-card,
        .library-card,
        .empty-box,
        .error-box {
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(20, 20, 20, 0.88);
          border-radius: 26px;
          padding: 22px;
        }

        .big-stat {
          display: block;
          color: #fff7ea;
          font-size: clamp(2rem, 5vw, 4rem);
          line-height: 1;
          font-weight: 1000;
          letter-spacing: -0.06em;
        }

        .latest-title {
          color: #fff7ea;
          font-size: 1.4rem;
          line-height: 1.1;
          font-weight: 1000;
          overflow-wrap: anywhere;
        }

        .muted {
          color: #bdb4a8;
        }

        .library-head {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          align-items: flex-end;
          margin-bottom: 18px;
          padding-bottom: 18px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .search-input {
          width: 100%;
          min-height: 52px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(0, 0, 0, 0.22);
          color: #fff7ea;
          border-radius: 16px;
          padding: 14px 15px;
          font-size: 16px;
          outline: none;
        }

        .search-input:focus {
          border-color: rgba(240, 179, 95, 0.8);
          box-shadow: 0 0 0 4px rgba(240, 179, 95, 0.13);
        }

        .ideas-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 18px;
        }

        .idea-card {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 18px;
          align-items: center;
          border: 1px solid rgba(255, 255, 255, 0.11);
          background: rgba(255, 255, 255, 0.045);
          border-radius: 22px;
          padding: 18px;
        }

        .idea-title {
          color: #fff7ea;
          font-size: 1.45rem;
          line-height: 1.1;
          font-weight: 1000;
          overflow-wrap: anywhere;
          margin-bottom: 8px;
        }

        .idea-date {
          color: #bdb4a8;
          font-size: 0.9rem;
          margin-bottom: 12px;
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .chip {
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(255, 255, 255, 0.055);
          color: #d7cec0;
          border-radius: 999px;
          padding: 7px 10px;
          font-size: 0.72rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .chip.gold {
          border-color: rgba(240, 179, 95, 0.52);
          background: rgba(240, 179, 95, 0.1);
          color: #f0b35f;
        }

        .idea-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .small-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.06);
          color: #f5f1e8;
          border-radius: 999px;
          padding: 10px 13px;
          font-size: 0.72rem;
          font-weight: 1000;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          text-decoration: none;
          white-space: nowrap;
        }

        .small-link:hover {
          border-color: #f0b35f;
          color: #f0b35f;
        }

        .error-box {
          border-color: rgba(248, 113, 113, 0.45);
          background: rgba(248, 113, 113, 0.1);
          color: #fecaca;
          margin-bottom: 18px;
        }

        @media (max-width: 820px) {
          .wrap {
            padding: 22px 14px 110px;
          }

          .summary-grid,
          .idea-card {
            grid-template-columns: 1fr;
          }

          .library-head,
          .hero-actions,
          .controls,
          .idea-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .primary-link,
          .secondary-link,
          .refresh-button,
          .small-link {
            width: 100%;
          }

          .hero,
          .summary-card,
          .library-card,
          .empty-box,
          .error-box {
            border-radius: 22px;
          }
        }
      `}</style>

      <div className="wrap">
        <section className="hero">
          <p className="eyebrow">THE IDEANATOR</p>
          <h1>Saved Ideas</h1>
          <p className="subhead">
            This is the Ideanator side of the garage. Saved ideas, reruns, verdicts, and version trails live here, not buried in the manuscript dashboard.
          </p>

          <div className="hero-actions">
            <a className="primary-link" href="/idea">
              Drop in a new idea
            </a>

            <a className="secondary-link" href="/dashboard">
              Open HOVEL Editor
            </a>
          </div>
        </section>

        <section className="summary-grid">
          <div className="summary-card">
            <p className="eyebrow">Idea Garage Status</p>
            <span className="big-stat">
              {loading ? "Loading" : `${reports.length}`}
            </span>
            <p className="muted">
              {reports.length === 1
                ? "saved idea in the shop."
                : "saved ideas in the shop."}
            </p>
          </div>

          <div className="summary-card">
            <p className="eyebrow">Most Recent</p>
            {latestReport ? (
              <>
                <div className="latest-title">
                  {latestReport.title || "Untitled Little Bastard"}
                </div>
                <p className="muted">{formatDate(latestReport.created_at)}</p>
                <a className="secondary-link" href={`/reports/${latestReport.id}`}>
                  Open latest idea
                </a>
              </>
            ) : (
              <p className="muted">
                No saved ideas yet. Drop one in and let the little bastard make noise.
              </p>
            )}
          </div>
        </section>

        <section className="library-card">
          <div className="library-head">
            <div>
              <p className="eyebrow">Idea Library</p>
              <h2>Only Ideanator reports.</h2>
            </div>

            <button
              className="refresh-button"
              type="button"
              onClick={refreshReports}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing" : "Refresh"}
            </button>
          </div>

          {error && <div className="error-box">{error}</div>}

          <input
            className="search-input"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search saved ideas by title, verdict, type, need, or source..."
          />

          {loading ? (
            <div className="empty-box">Loading saved ideas...</div>
          ) : filteredReports.length === 0 ? (
            <div className="empty-box">
              {reports.length === 0
                ? "No saved Ideanator reports yet."
                : "No matching saved ideas. They may be hiding under the workbench."}
            </div>
          ) : (
            <div className="ideas-list">
              {filteredReports.map((report) => {
                const intake = parseIntake(report.intake);
                const verdict = getString(intake.verdict) || "No verdict";
                const ideaKind = getString(intake.ideaKind);
                const primaryNeed = getString(intake.primaryNeed);
                const parentReportId = getString(intake.parentReportId);
                const iterationType = getString(intake.iterationType);

                return (
                  <article className="idea-card" key={report.id}>
                    <div>
                      <div className="idea-title">
                        {report.title || "Untitled Little Bastard"}
                      </div>

                      <div className="idea-date">
                        {formatDate(report.created_at)}
                      </div>

                      <div className="chips">
                        <span className="chip gold">{verdict}</span>

                        {ideaKind && <span className="chip">{ideaKind}</span>}

                        {primaryNeed && <span className="chip">{primaryNeed}</span>}

                        {iterationType === "rerun" && (
                          <span className="chip gold">Back on the Lift</span>
                        )}
                      </div>
                    </div>

                    <div className="idea-actions">
                      <a className="small-link" href={`/reports/${report.id}`}>
                        View
                      </a>

                      <a className="small-link" href={`/ideanator?rerun=${report.id}`}>
                        Back on Lift
                      </a>

                      {parentReportId && (
                        <a className="small-link" href={`/reports/${report.id}/compare`}>
                          Compare
                        </a>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
