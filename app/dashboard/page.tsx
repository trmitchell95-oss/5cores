"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Intake = {
  writingType?: string | null;
  audience?: string | null;
  biggestConcern?: string | null;
  preparationGoal?: string | null;
  feedbackTone?: string | null;
};

type Report = {
  id: string;
  created_at: string;
  title: string | null;
  intake?: string | Intake | null;
};

function parseIntake(intake: Report["intake"]): Intake {
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Dashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email?: string } | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
        return;
      }

      setUser(session.user);

      const { data, error } = await supabase
        .from("reports")
        .select("id, created_at, title, intake")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Dashboard load error:", error);
        setReports([]);
      } else if (data) {
        setReports(data as Report[]);
      }

      setLoading(false);
    }

    load();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0e0d0b", color: "#f0ece4", fontFamily: "Georgia, serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
        }

        .page-wrap {
          max-width: 980px;
          margin: 0 auto;
          padding: 48px 32px 96px;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #2a2520;
          padding-bottom: 24px;
          margin-bottom: 48px;
          gap: 24px;
        }

        .brand {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.18em;
          color: #c8a96e;
          text-transform: uppercase;
        }

        .user-row {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .user-email {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #6b6560;
        }

        .signout-btn {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          color: #6b6560;
          background: none;
          border: 1px solid #2a2520;
          padding: 8px 14px;
          cursor: pointer;
          text-transform: uppercase;
        }

        .signout-btn:hover {
          color: #f0ece4;
          border-color: #6b6560;
        }

        .hero {
          margin-bottom: 36px;
        }

        .eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.18em;
          color: #c8a96e;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .heading {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(42px, 7vw, 72px);
          line-height: 1;
          font-weight: 700;
          margin: 0;
          color: #f0ece4;
        }

        .subheading {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 300;
          color: #9a9186;
          margin-top: 14px;
          max-width: 620px;
          line-height: 1.6;
        }

        .submit-btn {
          display: inline-block;
          background: #c8a96e;
          color: #0e0d0b;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          font-weight: 500;
          padding: 14px 28px;
          text-decoration: none;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 36px;
        }

        .submit-btn:hover {
          background: #e0bd7d;
        }

        .loading,
        .empty-state {
          text-align: center;
          padding: 80px 0;
          color: #5a5448;
          font-family: 'DM Sans', sans-serif;
        }

        .empty-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          color: #6b6560;
          margin-bottom: 10px;
        }

        .reports-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .report-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          background: #161412;
          border: 1px solid #1e1c18;
          padding: 22px 24px;
          transition: border-color 0.2s, transform 0.2s;
        }

        .report-card:hover {
          border-color: #3a332b;
          transform: translateY(-1px);
        }

        .report-main {
          min-width: 0;
        }

        .report-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          color: #f0ece4;
          font-weight: 700;
          margin-bottom: 6px;
          overflow-wrap: anywhere;
        }

        .report-date {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #4a4540;
          margin-bottom: 12px;
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .chip {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          color: #9a9186;
          border: 1px solid #2a2520;
          background: #100f0d;
          padding: 6px 8px;
          text-transform: uppercase;
        }

        .chip.gold {
          color: #c8a96e;
          border-color: #3a3020;
        }

        .view-link {
          flex-shrink: 0;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          color: #c8a96e;
          text-decoration: none;
          text-transform: uppercase;
          border: 1px solid #2a2520;
          padding: 10px 14px;
        }

        .view-link:hover {
          border-color: #c8a96e;
          background: #1c1710;
        }

        @media (max-width: 720px) {
          .page-wrap {
            padding: 32px 20px 72px;
          }

          .topbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .user-row {
            justify-content: flex-start;
          }

          .report-card {
            align-items: flex-start;
            flex-direction: column;
          }

          .view-link {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>

      <div className="page-wrap">
        <div className="topbar">
          <div className="brand">5 CORE</div>

          <div className="user-row">
            {user?.email && <span className="user-email">{user.email}</span>}
            <button className="signout-btn" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        </div>

        <div className="hero">
          <div className="eyebrow">Editorial Dashboard</div>
          <h1 className="heading">Your Reports</h1>
          <p className="subheading">
            Every manuscript you have submitted for diagnosis, saved in one place and ready to reopen.
          </p>
        </div>

        <a className="submit-btn" href="/submit">
          Submit New Manuscript
        </a>

        {loading ? (
          <div className="loading">Loading your reports...</div>
        ) : reports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-title">No reports yet.</div>
            <div>Submit your first manuscript to get started.</div>
          </div>
        ) : (
          <div className="reports-list">
            {reports.map((report) => {
              const intake = parseIntake(report.intake);

              return (
                <div key={report.id} className="report-card">
                  <div className="report-main">
                    <div className="report-title">{report.title || "Untitled Manuscript"}</div>
                    <div className="report-date">{formatDate(report.created_at)}</div>

                    <div className="chips">
                      {intake.writingType ? <span className="chip gold">{intake.writingType}</span> : <span className="chip">No Intake</span>}
                      {intake.preparationGoal ? <span className="chip">{intake.preparationGoal}</span> : null}
                      {intake.feedbackTone ? <span className="chip">{intake.feedbackTone} Tone</span> : null}
                    </div>
                  </div>

                  <a className="view-link" href={`/reports/${report.id}`}>
                    View Report
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
