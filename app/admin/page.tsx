"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type AdminPayload = {
  label: string;
  ok: boolean;
  data: unknown;
  error?: string;
};

type MePayload = {
  user?: {
    id?: string;
    email?: string;
  };
  isAdmin?: boolean;
  error?: string;
};

type AnyRecord = Record<string, unknown>;

function isRecord(value: unknown): value is AnyRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getRecord(value: unknown, key: string): AnyRecord {
  if (!isRecord(value)) return {};
  const child = value[key];
  return isRecord(child) ? child : {};
}

function getArray(value: unknown, key: string): unknown[] {
  if (!isRecord(value)) return [];
  const child = value[key];
  return Array.isArray(child) ? child : [];
}

function getNumber(value: unknown, key: string, fallback = 0): number {
  if (!isRecord(value)) return fallback;
  const raw = value[key];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : fallback;
}

function getString(value: unknown, key: string, fallback = ""): string {
  if (!isRecord(value)) return fallback;
  const raw = value[key];
  return typeof raw === "string" ? raw : fallback;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(value: string) {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function withAdminEmail(url: string, email: string) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}adminEmail=${encodeURIComponent(email.toLowerCase())}`;
}

function StatCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string | number;
  note?: string;
}) {
  return (
    <article className="admin-stat-card">
      <p>{label}</p>
      <strong>{value}</strong>
      {note ? <span>{note}</span> : null}
    </article>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="admin-section-card">
      <h2>{title}</h2>
      {children}
    </article>
  );
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [me, setMe] = useState<MePayload | null>(null);
  const [sections, setSections] = useState<AdminPayload[]>([]);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    async function loadAdmin() {
      setLoading(true);
      setMessage("");

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const token = session?.access_token;

        if (!token) {
          setMessage("You need to sign in before the admin dashboard can load.");
          setLoading(false);
          return;
        }

        const meResponse = await fetch("/api/me", {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });

        const meData = (await meResponse.json().catch(() => null)) as MePayload | null;
        setMe(meData);

        if (!meResponse.ok || !meData) {
          setMessage(meData?.error || "Could not verify your login.");
          setLoading(false);
          return;
        }

        const email = meData.user?.email || session.user.email || "";

        if (!meData.isAdmin || !email) {
          setMessage(
            `Signed in as ${email || "unknown user"}, but this account is not marked as an admin. Check ADMIN_EMAILS in Vercel.`
          );
          setLoading(false);
          return;
        }

        const endpoints: [string, string][] = [
          ["Health", "/api/admin/health"],
          ["Usage", "/api/admin/usage"],
          ["Feedback", "/api/admin/feedback"],
          ["Invites", "/api/admin/invites"],
        ];

        const results = await Promise.all(
          endpoints.map(async ([label, url]) => {
            try {
              const res = await fetch(withAdminEmail(url, email), {
                headers: {
                  authorization: `Bearer ${token}`,
                },
              });

              const data = await res.json().catch(() => null);

              return {
                label,
                ok: res.ok,
                data: data || { status: res.status },
              };
            } catch (error) {
              return {
                label,
                ok: false,
                data: null,
                error: error instanceof Error ? error.message : "Unknown error",
              };
            }
          })
        );

        setSections(results);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : String(error));
      } finally {
        setLoading(false);
      }
    }

    loadAdmin();
  }, []);

  const health = useMemo(
    () => sections.find((section) => section.label === "Health"),
    [sections]
  );

  const usage = useMemo(
    () => sections.find((section) => section.label === "Usage"),
    [sections]
  );

  const feedback = useMemo(
    () => sections.find((section) => section.label === "Feedback"),
    [sections]
  );

  const invites = useMemo(
    () => sections.find((section) => section.label === "Invites"),
    [sections]
  );

  const healthData = isRecord(health?.data) ? health.data : {};
  const usageData = isRecord(usage?.data) ? usage.data : {};
  const feedbackData = isRecord(feedback?.data) ? feedback.data : {};
  const invitesData = isRecord(invites?.data) ? invites.data : {};

  const usageSummary = getRecord(usageData, "summary");
  const feedbackSummary = getRecord(feedbackData, "summary");
  const invitesSummary = getRecord(invitesData, "summary");

  const healthProblemCount = getNumber(healthData, "problemCount");
  const healthCheckedAt = getString(healthData, "checkedAt");
  const healthChecks = getArray(healthData, "checks");

  const feedbackItems = getArray(feedbackData, "items").slice(0, 8);
  const inviteItems = getArray(invitesData, "items").slice(0, 8);

  return (
    <main className="admin-page">
      <style>{`
        .admin-page {
          min-height: 100vh;
          padding: 140px 24px 90px;
          background:
            radial-gradient(circle at 20% 20%, rgba(210, 154, 84, 0.08), transparent 28rem),
            #080705;
          color: #f4efe7;
        }

        .admin-shell {
          max-width: 1180px;
          margin: 0 auto;
        }

        .admin-kicker {
          color: #d29a54;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          font-size: 13px;
          font-weight: 900;
          margin: 0 0 18px;
        }

        .admin-title {
          font-size: clamp(44px, 8vw, 92px);
          line-height: 0.95;
          margin: 0 0 22px;
          letter-spacing: -0.05em;
        }

        .admin-lede {
          max-width: 780px;
          color: #d6cbbd;
          font-size: 18px;
          line-height: 1.7;
          margin: 0;
        }

        .admin-user {
          color: #d29a54;
          margin-top: 18px;
          font-size: 15px;
        }

        .admin-actions {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          margin: 34px 0;
        }

        .admin-button {
          color: #080705;
          background: #d29a54;
          padding: 14px 20px;
          border-radius: 16px;
          font-weight: 900;
          text-decoration: none;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          border: 1px solid #d29a54;
          cursor: pointer;
        }

        .admin-button.secondary {
          color: #f4efe7;
          background: transparent;
          border-color: #3a2a1f;
        }

        .admin-message,
        .admin-section-card,
        .admin-stat-card {
          border: 1px solid #2a211b;
          border-radius: 24px;
          background: rgba(14, 11, 8, 0.92);
          box-shadow: 0 22px 70px rgba(0, 0, 0, 0.22);
        }

        .admin-message {
          max-width: 760px;
          padding: 24px;
          color: #f4efe7;
          line-height: 1.7;
        }

        .admin-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
          margin: 30px 0;
        }

        .admin-stat-card {
          padding: 22px;
          min-height: 142px;
        }

        .admin-stat-card p {
          color: #d29a54;
          text-transform: uppercase;
          letter-spacing: 0.13em;
          font-size: 12px;
          font-weight: 900;
          margin: 0 0 18px;
        }

        .admin-stat-card strong {
          display: block;
          font-size: clamp(30px, 5vw, 52px);
          line-height: 1;
          letter-spacing: -0.04em;
        }

        .admin-stat-card span {
          display: block;
          color: #b8aa9b;
          margin-top: 12px;
          line-height: 1.5;
          font-size: 14px;
        }

        .admin-sections {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          margin-top: 18px;
        }

        .admin-section-card {
          padding: 24px;
          min-height: 260px;
        }

        .admin-section-card h2 {
          margin: 0 0 18px;
          color: #d29a54;
          font-size: 24px;
          letter-spacing: -0.02em;
        }

        .admin-pill-row {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin: 14px 0 18px;
        }

        .admin-pill {
          border: 1px solid #3a2a1f;
          border-radius: 999px;
          padding: 9px 12px;
          color: #efe5d8;
          background: rgba(255, 255, 255, 0.03);
          font-size: 13px;
          font-weight: 800;
        }

        .admin-muted {
          color: #b8aa9b;
          line-height: 1.6;
        }

        .admin-list {
          display: grid;
          gap: 10px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .admin-list-item {
          border-top: 1px solid #2a211b;
          padding-top: 12px;
          color: #efe5d8;
          line-height: 1.55;
          font-size: 14px;
        }

        .admin-list-item:first-child {
          border-top: 0;
          padding-top: 0;
        }

        .admin-list-item strong {
          color: #ffffff;
        }

        .admin-raw {
          margin-top: 22px;
          border: 1px solid #2a211b;
          border-radius: 24px;
          padding: 20px;
          background: #0e0b08;
        }

        .admin-raw pre {
          white-space: pre-wrap;
          overflow-wrap: anywhere;
          color: #ddd2c4;
          font-size: 13px;
          line-height: 1.5;
          margin: 0;
        }

        @media (max-width: 900px) {
          .admin-grid,
          .admin-sections {
            grid-template-columns: 1fr;
          }

          .admin-page {
            padding-top: 120px;
          }
        }
      `}</style>

      <section className="admin-shell">
        <p className="admin-kicker">Owner Control Room</p>

        <h1 className="admin-title">Admin Dashboard</h1>

        <p className="admin-lede">
          A clean view of Hovel Editor health, usage, feedback, and beta invite activity.
        </p>

        {me?.user?.email ? (
          <p className="admin-user">
            Signed in as: <strong>{me.user.email}</strong>
          </p>
        ) : null}

        <div className="admin-actions">
          <a href="/dashboard" className="admin-button">
            Dashboard
          </a>

          <a href="/account" className="admin-button secondary">
            Account
          </a>

          <button
            type="button"
            className="admin-button secondary"
            onClick={() => setShowRaw((value) => !value)}
          >
            {showRaw ? "Hide Raw Data" : "Show Raw Data"}
          </button>
        </div>

        {loading ? (
          <article className="admin-message">Loading admin data...</article>
        ) : message ? (
          <article className="admin-message">
            <h2>Admin check</h2>
            <p>{message}</p>
          </article>
        ) : (
          <>
            <div className="admin-grid">
              <StatCard
                label="System Health"
                value={health?.ok && healthProblemCount === 0 ? "OK" : "Check"}
                note={
                  healthCheckedAt
                    ? `Last checked: ${formatDate(healthCheckedAt)}`
                    : "Health check loaded."
                }
              />

              <StatCard
                label="Users"
                value={formatNumber(getNumber(usageSummary, "totalUsers"))}
                note="Signed-in accounts tracked by usage."
              />

              <StatCard
                label="Reports"
                value={formatNumber(getNumber(usageSummary, "totalReports"))}
                note="Saved reports across Hovel Editor tools."
              />

              <StatCard
                label="Feedback"
                value={formatNumber(getNumber(feedbackSummary, "total"))}
                note={`${formatNumber(getNumber(feedbackSummary, "newCount"))} new, ${formatNumber(
                  getNumber(feedbackSummary, "reviewedCount")
                )} reviewed.`}
              />
            </div>

            <div className="admin-grid">
              <StatCard
                label="Events"
                value={formatNumber(getNumber(usageSummary, "totalEvents"))}
                note={`${formatNumber(getNumber(usageSummary, "aggregateEventCount"))} aggregate events.`}
              />

              <StatCard
                label="Words"
                value={formatNumber(getNumber(usageSummary, "totalInputWords"))}
                note="Total input words processed."
              />

              <StatCard
                label="Characters"
                value={formatNumber(getNumber(usageSummary, "totalInputChars"))}
                note="Total input characters processed."
              />

              <StatCard
                label="Invites"
                value={formatNumber(getNumber(invitesSummary, "total"))}
                note={`${formatNumber(getNumber(invitesSummary, "active"))} active, ${formatNumber(
                  getNumber(invitesSummary, "used")
                )} used.`}
              />
            </div>

            <div className="admin-sections">
              <SectionCard title="System OK">
                {health?.ok && healthProblemCount === 0 ? (
                  <p className="admin-muted">
                    No system problems reported. Supabase and admin services appear configured.
                  </p>
                ) : (
                  <p className="admin-muted">
                    Health check returned {formatNumber(healthProblemCount)} possible issue(s).
                  </p>
                )}

                <div className="admin-pill-row">
                  {healthChecks.length > 0 ? (
                    healthChecks.map((check, index) => {
                      const record = isRecord(check) ? check : {};
                      return (
                        <span className="admin-pill" key={index}>
                          {getString(record, "name", `Check ${index + 1}`)}:{" "}
                          {record.ok === true ? "OK" : "Needs review"}
                        </span>
                      );
                    })
                  ) : (
                    <span className="admin-pill">Health data loaded</span>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="Usage Summary">
                <div className="admin-pill-row">
                  <span className="admin-pill">
                    Users: {formatNumber(getNumber(usageSummary, "totalUsers"))}
                  </span>
                  <span className="admin-pill">
                    Reports: {formatNumber(getNumber(usageSummary, "totalReports"))}
                  </span>
                  <span className="admin-pill">
                    Events: {formatNumber(getNumber(usageSummary, "totalEvents"))}
                  </span>
                  <span className="admin-pill">
                    Words: {formatNumber(getNumber(usageSummary, "totalInputWords"))}
                  </span>
                  <span className="admin-pill">
                    Characters: {formatNumber(getNumber(usageSummary, "totalInputChars"))}
                  </span>
                </div>

                <p className="admin-muted">
                  This gives you the quick pulse: how many users exist, how many reports are saved,
                  and how much manuscript text has moved through the system.
                </p>
              </SectionCard>

              <SectionCard title="Feedback">
                <div className="admin-pill-row">
                  <span className="admin-pill">
                    Total: {formatNumber(getNumber(feedbackSummary, "total"))}
                  </span>
                  <span className="admin-pill">
                    New: {formatNumber(getNumber(feedbackSummary, "newCount"))}
                  </span>
                  <span className="admin-pill">
                    Reviewed: {formatNumber(getNumber(feedbackSummary, "reviewedCount"))}
                  </span>
                  <span className="admin-pill">
                    Fixed: {formatNumber(getNumber(feedbackSummary, "fixedCount"))}
                  </span>
                  <span className="admin-pill">
                    Ignored: {formatNumber(getNumber(feedbackSummary, "ignoredCount"))}
                  </span>
                </div>

                {feedbackItems.length > 0 ? (
                  <ul className="admin-list">
                    {feedbackItems.map((item, index) => {
                      const record = isRecord(item) ? item : {};
                      const title =
                        getString(record, "title") ||
                        getString(record, "subject") ||
                        getString(record, "type") ||
                        `Feedback item ${index + 1}`;

                      const body =
                        getString(record, "message") ||
                        getString(record, "body") ||
                        getString(record, "content") ||
                        getString(record, "feedback") ||
                        "No message preview available.";

                      const status = getString(record, "status", "new");

                      return (
                        <li className="admin-list-item" key={getString(record, "id", String(index))}>
                          <strong>{title}</strong>
                          <br />
                          <span className="admin-muted">Status: {status}</span>
                          <br />
                          {body.length > 180 ? `${body.slice(0, 180)}...` : body}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="admin-muted">No feedback items found.</p>
                )}
              </SectionCard>

              <SectionCard title="Invites">
                <div className="admin-pill-row">
                  <span className="admin-pill">
                    Total: {formatNumber(getNumber(invitesSummary, "total"))}
                  </span>
                  <span className="admin-pill">
                    Active: {formatNumber(getNumber(invitesSummary, "active"))}
                  </span>
                  <span className="admin-pill">
                    Used: {formatNumber(getNumber(invitesSummary, "used"))}
                  </span>
                  <span className="admin-pill">
                    Inactive: {formatNumber(getNumber(invitesSummary, "inactive"))}
                  </span>
                </div>

                {inviteItems.length > 0 ? (
                  <ul className="admin-list">
                    {inviteItems.map((item, index) => {
                      const record = isRecord(item) ? item : {};
                      const code =
                        getString(record, "code") ||
                        getString(record, "inviteCode") ||
                        getString(record, "id", `Invite ${index + 1}`);

                      const status =
                        getString(record, "status") ||
                        (record.used === true ? "used" : record.active === false ? "inactive" : "active");

                      return (
                        <li className="admin-list-item" key={getString(record, "id", String(index))}>
                          <strong>{code}</strong>
                          <br />
                          <span className="admin-muted">Status: {status}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="admin-muted">No invite items found.</p>
                )}
              </SectionCard>
            </div>

            {showRaw ? (
              <section className="admin-raw">
                <pre>{JSON.stringify(sections, null, 2)}</pre>
              </section>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}
