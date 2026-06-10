"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

type HealthCheck = {
  name: string;
  ok: boolean;
  detail: string;
};

type TableHealth = {
  table: string;
  ok: boolean;
  count: number | null;
  latest: Record<string, unknown> | null;
  error: string | null;
};

type HealthResponse = {
  adminEmail: string;
  checkedAt: string;
  problemCount: number;
  checks: HealthCheck[];
  tables: {
    usage: TableHealth;
    feedback: TableHealth;
    invites: TableHealth;
  };
};

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "None";
  return new Date(value).toLocaleString();
}

function prettyValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "None";
  if (typeof value === "object") return JSON.stringify(value, null, 2);
  return String(value);
}

export default function AdminHealthPage() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadHealth(isRefresh = false) {
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

      const response = await fetch("/api/admin/health", {
        headers: {
          authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load health check.");
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadHealth();
  }, []);

  return (
    <main className="health-shell">
      <style>{`
        body {
          margin: 0;
          background: #060b16;
        }

        .health-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(200,147,90,0.13), transparent 34rem),
            radial-gradient(circle at bottom right, rgba(90,124,200,0.1), transparent 32rem),
            #060b16;
          color: #eef4ff;
          padding: 48px 24px 90px;
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

        .top-nav a,
        .text-button {
          color: #93c5fd;
          background: none;
          border: none;
          padding: 0;
          font: inherit;
          cursor: pointer;
          text-decoration: none;
        }

        .hero,
        .panel,
        .check-card,
        .table-card {
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
          color: #93c5fd;
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
          color: #cbd5e1;
          line-height: 1.7;
          max-width: 820px;
        }

        .notice-bad {
          border: 1px solid #5a2020;
          background: #2a1010;
          color: #f0a0a0;
          padding: 14px;
          border-radius: 12px;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .panel {
          border-radius: 24px;
          padding: 22px;
          margin-bottom: 22px;
        }

        .panel-title {
          font-family: Georgia, serif;
          font-size: 34px;
          line-height: 1;
          margin: 0 0 16px;
        }

        .check-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .check-card,
        .table-card {
          border-radius: 18px;
          padding: 18px;
        }

        .check-top {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          align-items: center;
          margin-bottom: 8px;
        }

        .check-name {
          font-family: monospace;
          color: #eef4ff;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          font-size: 12px;
        }

        .badge {
          border: 1px solid #302a24;
          border-radius: 999px;
          padding: 6px 9px;
          font-family: monospace;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .good {
          color: #98d8aa;
          border-color: #214a2d;
          background: #0a1a0e;
        }

        .bad {
          color: #f0a0a0;
          border-color: #5a2020;
          background: #2a1010;
        }

        .detail,
        .meta {
          color: #cbd5e1;
          line-height: 1.6;
          font-size: 14px;
        }

        .table-grid {
          display: grid;
          gap: 14px;
        }

        .table-head {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .table-name {
          font-family: Georgia, serif;
          font-size: 28px;
          line-height: 1;
          margin: 0;
        }

        .latest-box {
          border: 1px solid #302a24;
          background: #060b16;
          border-radius: 14px;
          padding: 14px;
          margin-top: 12px;
          overflow-x: auto;
        }

        .row {
          display: grid;
          grid-template-columns: 180px minmax(0, 1fr);
          gap: 12px;
          padding: 8px 0;
          border-bottom: 1px solid #211d19;
        }

        .row:last-child {
          border-bottom: none;
        }

        .key {
          color: #cbd5e1;
          font-family: monospace;
          font-size: 12px;
        }

        .value {
          color: #eef4ff;
          white-space: pre-wrap;
          word-break: break-word;
          font-size: 13px;
          line-height: 1.5;
        }

        @media (max-width: 820px) {
          .health-shell {
            padding: 28px 14px 90px;
          }

          .hero,
          .panel,
          .check-card,
          .table-card {
            border-radius: 20px;
            padding: 18px;
          }

          .check-grid {
            grid-template-columns: 1fr;
          }

          .row {
            grid-template-columns: 1fr;
            gap: 4px;
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
          <Link href="/admin/exports">Exports</Link>
          <Link href="/dashboard">Dashboard</Link>
          <button className="text-button" onClick={() => loadHealth(true)} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </nav>

        <section className="hero">
          <div className="eyebrow">Admin Health</div>
          <h1 className="title">The engine light.</h1>
          <p className="subtitle">
            A private admin checkup for the beta machine. It checks environment settings,
            database tables, and latest activity so you know whether the truck is running
            or just making confident noises.
          </p>

          {data && (
            <p className="meta">
              Admin: {data.adminEmail} / Checked: {formatDate(data.checkedAt)} / Problems: {data.problemCount}
            </p>
          )}
        </section>

        {error && <div className="notice-bad">{error}</div>}

        {loading ? (
          <section className="panel">
            <p className="detail">Loading health check...</p>
          </section>
        ) : data ? (
          <>
            <section className="panel">
              <h2 className="panel-title">System checks</h2>

              <div className="check-grid">
                {data.checks.map((check) => (
                  <article className="check-card" key={check.name}>
                    <div className="check-top">
                      <div className="check-name">{check.name}</div>
                      <span className={check.ok ? "badge good" : "badge bad"}>
                        {check.ok ? "OK" : "Problem"}
                      </span>
                    </div>

                    <div className="detail">{check.detail}</div>
                  </article>
                ))}
              </div>
            </section>

            <section className="panel">
              <h2 className="panel-title">Table snapshots</h2>

              <div className="table-grid">
                <TableCard table={data.tables.usage} title="Usage Events" />
                <TableCard table={data.tables.feedback} title="Feedback Items" />
                <TableCard table={data.tables.invites} title="Invite Codes" />
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}

function TableCard({ table, title }: { table: TableHealth; title: string }) {
  const latest = table.latest || {};

  return (
    <article className="table-card">
      <div className="table-head">
        <h3 className="table-name">{title}</h3>
        <span className={table.ok ? "badge good" : "badge bad"}>
          {table.ok ? `${table.count ?? 0} rows` : "Problem"}
        </span>
      </div>

      {table.error && <div className="notice-bad">{table.error}</div>}

      <div className="detail">
        Latest record:
      </div>

      <div className="latest-box">
        {Object.keys(latest).length === 0 ? (
          <div className="detail">None yet.</div>
        ) : (
          Object.entries(latest).map(([key, value]) => (
            <div className="row" key={key}>
              <div className="key">{key}</div>
              <div className="value">{prettyValue(value)}</div>
            </div>
          ))
        )}
      </div>
    </article>
  );
}

