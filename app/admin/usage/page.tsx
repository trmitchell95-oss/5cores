"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

type UsageEvent = {
  id: string;
  created_at: string;
  user_id: string | null;
  tool: string;
  status: string;
  input_chars: number;
  input_words: number;
  model: string | null;
  report_id: string | null;
  title: string | null;
  error_message: string | null;
  meta: Record<string, unknown> | null;
};

type AdminUser = {
  id: string;
  email: string;
  created_at: string | null;
  last_sign_in_at: string | null;
  lastActivityAt: string | null;
  reportCount: number;
  councilRuns: number;
  sphinxRuns: number;
  sphinxSaveRuns: number;
  problemCount: number;
};

type UsageSummary = {
  totalEvents: number;
  aggregateEventCount: number;
  totalInputChars: number;
  totalInputWords: number;
  totalUsers: number;
  totalReports: number;
  byTool: Record<string, number>;
  byStatus: Record<string, number>;
  lastEventAt: string | null;
};

type UsageResponse = {
  adminEmail: string;
  summary: UsageSummary;
  users: AdminUser[];
  events: UsageEvent[];
};

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase browser settings.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

function formatDate(value: string | null) {
  if (!value) return "None yet";

  try {
    return new Date(value).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function formatNumber(value: number | null | undefined) {
  return Number(value || 0).toLocaleString();
}

function statusClass(status: string) {
  if (status === "succeeded") return "status status-good";
  if (status === "failed") return "status status-bad";
  if (status === "rejected") return "status status-warn";
  return "status status-neutral";
}

function toolLabel(tool: string) {
  if (tool === "council") return "5 CORE";
  if (tool === "sphinx") return "Sphinx";
  if (tool === "sphinx_save") return "Sphinx Save";
  return tool;
}

export default function AdminUsagePage() {
  const [data, setData] = useState<UsageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadUsage(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const supabase = getSupabaseClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/admin/usage", {
        method: "GET",
        headers: {
          authorization: `Bearer ${session.access_token}`,
        },
      });

      const nextData = await response.json();

      if (!response.ok) {
        throw new Error(nextData.error || "Could not load admin usage.");
      }

      setData(nextData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadUsage();
  }, []);

  const events = data?.events || [];
  const users = data?.users || [];
  const summary = data?.summary;

  const recentFailures = useMemo(() => {
    return events.filter(
      (event) => event.status === "failed" || event.status === "rejected"
    ).length;
  }, [events]);

  const activeUsers = useMemo(() => {
    return users.filter((user) => user.lastActivityAt).length;
  }, [users]);

  return (
    <main className="admin-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;700&family=IBM+Plex+Mono:wght@400;500;700&display=swap');

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #0e0d0b;
        }

        .admin-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(200, 147, 90, 0.13), transparent 34rem),
            radial-gradient(circle at bottom right, rgba(90, 124, 200, 0.1), transparent 32rem),
            #0e0d0b;
          color: #f0ece4;
          font-family: 'DM Sans', sans-serif;
        }

        .wrap {
          max-width: 1240px;
          margin: 0 auto;
          padding: 34px 24px 90px;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          border: 1px solid #26211c;
          background: rgba(18, 16, 13, 0.86);
          border-radius: 24px;
          padding: 16px 18px;
          margin-bottom: 22px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-mark {
          width: 42px;
          height: 42px;
          border-radius: 15px;
          background: #c8935a;
          color: #0e0d0b;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'IBM Plex Mono', monospace;
          font-weight: 800;
          font-size: 12px;
        }

        .brand-main {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .brand-sub {
          color: #7b7168;
          font-size: 12px;
          margin-top: 3px;
        }

        .nav-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .nav-link,
        .refresh-btn {
          min-height: 42px;
          border-radius: 14px;
          border: 1px solid #302a24;
          background: #11100e;
          color: #9a9186;
          text-decoration: none;
          padding: 12px 14px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .nav-link:hover,
        .refresh-btn:hover {
          color: #c8935a;
          border-color: #c8935a;
        }

        .hero {
          border: 1px solid #26211c;
          background: rgba(18, 16, 13, 0.9);
          border-radius: 30px;
          padding: 34px;
          margin-bottom: 22px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.2);
        }

        .eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.24em;
          color: #c8935a;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(48px, 8vw, 84px);
          line-height: 0.94;
          font-weight: 700;
          margin: 0;
        }

        .subtitle {
          color: #aaa096;
          line-height: 1.7;
          max-width: 780px;
          margin-top: 18px;
          font-weight: 300;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 22px;
        }

        .card {
          border: 1px solid #26211c;
          background: rgba(18, 16, 13, 0.9);
          border-radius: 22px;
          padding: 20px;
        }

        .card-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #7b7168;
          margin-bottom: 10px;
        }

        .card-value {
          font-family: 'Cormorant Garamond', serif;
          font-size: 34px;
          line-height: 1;
          font-weight: 700;
        }

        .card-note {
          margin-top: 10px;
          color: #8f867b;
          font-size: 12px;
          line-height: 1.45;
        }

        .panel {
          border: 1px solid #26211c;
          background: rgba(18, 16, 13, 0.92);
          border-radius: 28px;
          padding: 22px;
          margin-bottom: 22px;
        }

        .panel-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          border-bottom: 1px solid #2a2520;
          padding-bottom: 16px;
          margin-bottom: 16px;
        }

        .panel-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px;
          line-height: 1;
          font-weight: 700;
        }

        .panel-note {
          color: #8f867b;
          font-size: 13px;
          margin-top: 6px;
        }

        .table-wrap {
          overflow-x: auto;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1040px;
        }

        th {
          text-align: left;
          padding: 12px 10px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #7b7168;
          border-bottom: 1px solid #2a2520;
        }

        td {
          padding: 14px 10px;
          border-bottom: 1px solid #211d19;
          vertical-align: top;
          color: #d7d0c8;
          font-size: 13px;
          line-height: 1.45;
        }

        .mono {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
        }

        .email-cell {
          color: #f0ece4;
          font-weight: 700;
        }

        .status {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 6px 9px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .status-good {
          border: 1px solid #214a2d;
          background: #0a1a0e;
          color: #98d8aa;
        }

        .status-bad {
          border: 1px solid #5a2020;
          background: #2a1010;
          color: #f0a0a0;
        }

        .status-warn {
          border: 1px solid #5a4a20;
          background: #2a210f;
          color: #f0d080;
        }

        .status-neutral {
          border: 1px solid #302a24;
          background: #11100e;
          color: #9a9186;
        }

        .report-link {
          color: #c8935a;
          font-weight: 800;
          text-decoration: none;
        }

        .report-link:hover {
          text-decoration: underline;
        }

        .error-box {
          border: 1px solid #5a2020;
          background: #2a1010;
          color: #f0a0a0;
          border-radius: 18px;
          padding: 18px;
          margin-bottom: 22px;
        }

        .loading-box {
          border: 1px solid #26211c;
          background: rgba(18, 16, 13, 0.9);
          color: #9a9186;
          border-radius: 18px;
          padding: 18px;
          margin-bottom: 22px;
        }

        @media (max-width: 1100px) {
          .summary-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .summary-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .wrap {
            padding: 22px 14px 70px;
          }

          .topbar,
          .panel-head {
            flex-direction: column;
          }

          .hero,
          .panel {
            border-radius: 22px;
            padding: 22px;
          }

          .nav-actions {
            width: 100%;
            flex-direction: column;
          }

          .nav-link,
          .refresh-btn {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>

      <div className="wrap">
        <nav className="topbar">
          <div className="brand">
            <div className="brand-mark">5C</div>
            <div>
              <div className="brand-main">5 CORE Admin</div>
              <div className="brand-sub">Private usage speedometer</div>
            </div>
          </div>

          <div className="nav-actions">
            <Link href="/dashboard" className="nav-link">
              Dashboard
            </Link>

            <Link href="/sphinx" className="nav-link">
              Sphinx
            </Link>

            <Link href="/admin/feedback" className="nav-link">
              Feedback
            </Link>

            <Link href="/admin/invites" className="nav-link">
              Invites
            </Link>

            <Link href="/admin/exports" className="nav-link">
              Exports
            </Link>

            <button
              className="refresh-btn"
              type="button"
              onClick={() => loadUsage(true)}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </nav>

        <section className="hero">
          <div className="eyebrow">Usage Dashboard</div>
          <h1 className="title">The speedometer.</h1>
          <p className="subtitle">
            Recent usage events, beta users, saved reports, and problem counts.
            This tells you who is driving the truck, how hard they are pushing it,
            and whether anything is coughing smoke.
          </p>
        </section>

        {loading && <div className="loading-box">Loading usage events...</div>}

        {error && <div className="error-box">{error}</div>}

        {summary && (
          <section className="summary-grid">
            <div className="card">
              <div className="card-label">Beta Users</div>
              <div className="card-value">{formatNumber(summary.totalUsers)}</div>
              <div className="card-note">{formatNumber(activeUsers)} active users found.</div>
            </div>

            <div className="card">
              <div className="card-label">Saved Reports</div>
              <div className="card-value">{formatNumber(summary.totalReports)}</div>
              <div className="card-note">Reports currently stored.</div>
            </div>

            <div className="card">
              <div className="card-label">Recent Events</div>
              <div className="card-value">{formatNumber(summary.totalEvents)}</div>
              <div className="card-note">Last 100 usage events shown below.</div>
            </div>

            <div className="card">
              <div className="card-label">Input Chars</div>
              <div className="card-value">{formatNumber(summary.totalInputChars)}</div>
              <div className="card-note">From last {formatNumber(summary.aggregateEventCount)} events.</div>
            </div>

            <div className="card">
              <div className="card-label">Input Words</div>
              <div className="card-value">{formatNumber(summary.totalInputWords)}</div>
              <div className="card-note">Approximate recent word volume.</div>
            </div>

            <div className="card">
              <div className="card-label">Problems</div>
              <div className="card-value">{formatNumber(recentFailures)}</div>
              <div className="card-note">Failed or rejected recent events.</div>
            </div>
          </section>
        )}

        {!loading && data && (
          <>
            <section className="panel">
              <div className="panel-head">
                <div>
                  <div className="panel-title">Beta users</div>
                  <div className="panel-note">
                    Admin: {data.adminEmail} • Users loaded:{" "}
                    {formatNumber(users.length)}
                  </div>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Created</th>
                      <th>Last Sign-In</th>
                      <th>Last Activity</th>
                      <th>Reports</th>
                      <th>5 CORE</th>
                      <th>Sphinx</th>
                      <th>Sphinx Saves</th>
                      <th>Problems</th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="email-cell">
                          <a className="report-link" href={`/admin/users/${user.id}`}>
                            {user.email}
                          </a>
                        </td>
                        <td className="mono">{formatDate(user.created_at)}</td>
                        <td className="mono">{formatDate(user.last_sign_in_at)}</td>
                        <td className="mono">{formatDate(user.lastActivityAt)}</td>
                        <td className="mono">{formatNumber(user.reportCount)}</td>
                        <td className="mono">{formatNumber(user.councilRuns)}</td>
                        <td className="mono">{formatNumber(user.sphinxRuns)}</td>
                        <td className="mono">{formatNumber(user.sphinxSaveRuns)}</td>
                        <td className="mono">{formatNumber(user.problemCount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="panel">
              <div className="panel-head">
                <div>
                  <div className="panel-title">Recent usage events</div>
                  <div className="panel-note">
                    Last event: {formatDate(data.summary.lastEventAt)}
                  </div>
                </div>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Tool</th>
                      <th>Status</th>
                      <th>Size</th>
                      <th>Model</th>
                      <th>Title</th>
                      <th>Report</th>
                      <th>Error</th>
                    </tr>
                  </thead>

                  <tbody>
                    {events.map((event) => (
                      <tr key={event.id}>
                        <td className="mono">{formatDate(event.created_at)}</td>
                        <td>{toolLabel(event.tool)}</td>
                        <td>
                          <span className={statusClass(event.status)}>
                            {event.status}
                          </span>
                        </td>
                        <td className="mono">
                          {formatNumber(event.input_chars)} chars
                          <br />
                          {formatNumber(event.input_words)} words
                        </td>
                        <td className="mono">{event.model || "None"}</td>
                        <td>{event.title || "Untitled"}</td>
                        <td>
                          {event.report_id ? (
                            <a
                              className="report-link"
                              href={`/reports/${event.report_id}`}
                            >
                              Open
                            </a>
                          ) : (
                            <span className="mono">None</span>
                          )}
                        </td>
                        <td>{event.error_message || ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}







