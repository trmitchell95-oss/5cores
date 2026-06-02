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
  report_type?: string | null;
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

function getReportLabel(count: number) {
  if (count === 1) return "1 saved report";
  return `${count} saved reports`;
}


function getReportTypeValue(report: Report) {
  const intake = parseIntake(report.intake) as Intake & { tool?: string | null };

  if (report.report_type === "ideanator" || intake.tool === "ideanator") return "ideanator";
  if (report.report_type === "sphinx") return "sphinx";
  if (report.report_type === "council-reread") return "council-reread";
  return "council";
}

function getReportTypeLabel(report: Report) {
  const intake = parseIntake(report.intake) as Intake & { tool?: string | null };

  if (report.report_type === "ideanator" || intake.tool === "ideanator") return "Ideanator";
  if (report.report_type === "sphinx") return "Sphinx";
  if (report.report_type === "council-reread") return "Council Re-Read";
  return "The Council";
}

function getSearchText(report: Report) {
  const intake = parseIntake(report.intake);

  return [
    report.title || "",
    report.report_type || "",
    getReportTypeLabel(report),
    intake.writingType || "",
    intake.audience || "",
    intake.preparationGoal || "",
    intake.feedbackTone || "",
    intake.biggestConcern || "",
  ]
    .join(" ")
    .toLowerCase();
}
export default function Dashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<{ email?: string | null } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [reportFilter, setReportFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(20);
  const [dashboardError, setDashboardError] = useState("");

  useEffect(() => {
    async function load() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
        return;
      }

      try {
        const meResponse = await fetch("/api/me", {
          headers: {
            authorization: `Bearer ${session.access_token}`,
          },
        });

        const meData = await meResponse.json();

        if (meResponse.ok) {
          setUser(meData.user || session.user);
          setIsAdmin(Boolean(meData.isAdmin));
        } else {
          setUser(session.user);
          setIsAdmin(false);
        }
      } catch {
        setUser(session.user);
        setIsAdmin(false);
      }

      const reportsResponse = await fetch("/api/reports", {
        headers: {
          authorization: `Bearer ${session.access_token}`,
        },
      });

      const reportsData = await reportsResponse.json();

      if (!reportsResponse.ok) {
        console.error("Dashboard load error:", reportsData.error || reportsData.details);
        setReports([]);
      } else {
        const allReports = (reportsData.reports || []) as Report[];
        setReports(allReports.filter((report) => getReportTypeValue(report) !== "ideanator"));
      }

      setLoading(false);
    }

    load();
  }, []);


  useEffect(() => {
    setVisibleCount(20);
  }, [searchTerm, reportFilter]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }


  async function refreshReports() {
    setRefreshing(true);
    setDashboardError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
        return;
      }

      const reportsResponse = await fetch("/api/reports", {
        headers: {
          authorization: `Bearer ${session.access_token}`,
        },
      });

      const reportsData = await reportsResponse.json();

      if (!reportsResponse.ok) {
        throw new Error(reportsData.error || "Could not refresh reports.");
      }

      const allReports = (reportsData.reports || []) as Report[];
      setReports(allReports.filter((report) => getReportTypeValue(report) !== "ideanator"));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not refresh reports.";
      setDashboardError(message);
    } finally {
      setRefreshing(false);
    }
  }

  const latestReport = reports[0];
  const latestIntake = latestReport ? parseIntake(latestReport.intake) : {};
  const reportLabel = getReportLabel(reports.length);
  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      !normalizedSearch || getSearchText(report).includes(normalizedSearch);

    const matchesType =
      reportFilter === "all" || getReportTypeValue(report) === reportFilter;

    return matchesSearch && matchesType;
  });

  const visibleReports = filteredReports.slice(0, visibleCount);
  const hasMoreReports = visibleReports.length < filteredReports.length;
  const filteredReportLabel = getReportLabel(filteredReports.length);

  return (
    <main className="dashboard-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;700&family=IBM+Plex+Mono:wght@400;500;700&display=swap');

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #0e0d0b;
        }

        .dashboard-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(200, 169, 110, 0.16), transparent 34rem),
            radial-gradient(circle at bottom right, rgba(90, 124, 200, 0.1), transparent 30rem),
            #0e0d0b;
          color: #f0ece4;
          font-family: 'DM Sans', sans-serif;
        }

        .page-wrap {
          max-width: 1180px;
          margin: 0 auto;
          padding: 34px 24px 90px;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          border: 1px solid #26211c;
          background: rgba(18, 16, 13, 0.82);
          padding: 16px 18px;
          margin-bottom: 34px;
          border-radius: 22px;
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
        }

        .brand-lockup {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .brand-mark {
          width: 42px;
          height: 42px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #c8a96e;
          color: #0e0d0b;
          font-family: 'IBM Plex Mono', monospace;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: -0.08em;
          flex-shrink: 0;
        }

        .brand-main {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: #f0ece4;
          text-transform: uppercase;
        }

        .brand-sub {
          margin-top: 3px;
          font-size: 12px;
          color: #7b7168;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-row {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .user-email {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          color: #8a8177;
          max-width: 240px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .admin-btn,
        .signout-btn {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          color: #8a8177;
          background: #11100e;
          border: 1px solid #302a24;
          border-radius: 12px;
          padding: 10px 13px;
          cursor: pointer;
          text-transform: uppercase;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .admin-btn:hover,
        .signout-btn:hover {
          color: #f0ece4;
          border-color: #6b6560;
        }

        .admin-btn {
          color: #c8a96e;
          border-color: #3a3020;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) minmax(300px, 0.6fr);
          gap: 22px;
          align-items: stretch;
          margin-bottom: 22px;
        }

        .hero-card,
        .status-card,
        .tool-card,
        .reports-panel,
        .how-card {
          border: 1px solid #26211c;
          background: rgba(18, 16, 13, 0.86);
          border-radius: 28px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.22);
        }

        .hero-card {
          padding: 34px;
          overflow: hidden;
          position: relative;
        }

        .hero-card::after {
          content: "";
          position: absolute;
          right: -90px;
          top: -90px;
          width: 260px;
          height: 260px;
          border-radius: 999px;
          background: rgba(200, 169, 110, 0.08);
          pointer-events: none;
        }

        .eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.2em;
          color: #c8a96e;
          text-transform: uppercase;
          margin-bottom: 14px;
        }

        .heading {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(44px, 8vw, 82px);
          line-height: 0.94;
          font-weight: 700;
          margin: 0;
          color: #f0ece4;
          max-width: 760px;
        }

        .subheading {
          font-size: 16px;
          font-weight: 300;
          color: #aaa096;
          margin-top: 18px;
          max-width: 680px;
          line-height: 1.65;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
        }

        .primary-btn,
        .secondary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 48px;
          border-radius: 15px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          padding: 14px 18px;
        }

        .primary-btn {
          background: #c8a96e;
          color: #0e0d0b;
          border: 1px solid #c8a96e;
        }

        .primary-btn:hover {
          background: #e2bf7e;
          border-color: #e2bf7e;
        }

        .secondary-btn {
          background: #11100e;
          color: #d8d0c5;
          border: 1px solid #302a24;
        }

        .secondary-btn:hover {
          border-color: #c8a96e;
          color: #c8a96e;
        }

        .status-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 100%;
        }

        .status-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.18em;
          color: #6f665f;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .status-big {
          font-family: 'Cormorant Garamond', serif;
          font-size: 38px;
          font-weight: 700;
          color: #f0ece4;
          line-height: 1;
        }

        .status-muted {
          color: #8f867b;
          font-size: 13px;
          line-height: 1.55;
          margin-top: 10px;
        }

        .latest-box {
          margin-top: 22px;
          border-top: 1px solid #26211c;
          padding-top: 18px;
        }

        .latest-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-weight: 700;
          color: #f0ece4;
          line-height: 1.15;
          overflow-wrap: anywhere;
        }

        .latest-link {
          display: inline-block;
          margin-top: 12px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          color: #c8a96e;
          text-decoration: none;
          text-transform: uppercase;
        }

        .latest-link:hover {
          text-decoration: underline;
        }

        .tool-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .tool-card {
          padding: 22px;
          min-height: 230px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .tool-number {
          width: 34px;
          height: 34px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #18140f;
          border: 1px solid #332a1c;
          color: #c8a96e;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 16px;
        }

        .tool-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 28px;
          color: #f0ece4;
          line-height: 1;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .tool-text {
          color: #9c9288;
          font-size: 14px;
          font-weight: 300;
          line-height: 1.6;
        }

        .tool-link {
          margin-top: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #302a24;
          background: #11100e;
          color: #d8d0c5;
          border-radius: 13px;
          padding: 12px 14px;
          text-decoration: none;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .tool-link:hover {
          border-color: #c8a96e;
          color: #c8a96e;
        }

        .how-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .how-card {
          padding: 20px;
        }

        .how-title {
          font-family: 'IBM Plex Mono', monospace;
          color: #c8a96e;
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .how-text {
          color: #8f867b;
          font-size: 13px;
          line-height: 1.55;
          font-weight: 300;
        }

        .reports-panel {
          padding: 24px;
        }

        .reports-head {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 18px;
          border-bottom: 1px solid #26211c;
          padding-bottom: 18px;
          margin-bottom: 18px;
        }

        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 34px;
          line-height: 1;
          font-weight: 700;
          margin: 0;
          color: #f0ece4;
        }

        .section-note {
          margin-top: 8px;
          color: #8f867b;
          font-size: 14px;
          line-height: 1.5;
        }

        .mini-stat {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          color: #6f665f;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .library-controls {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 220px auto;
          gap: 12px;
          align-items: center;
          margin-bottom: 18px;
          padding-bottom: 18px;
          border-bottom: 1px solid #26211c;
        }

        .library-input,
        .library-select {
          width: 100%;
          min-height: 46px;
          border: 1px solid #302a24;
          background: #11100e;
          color: #f0ece4;
          border-radius: 14px;
          padding: 12px 14px;
          outline: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
        }

        .library-input::placeholder {
          color: #5f574f;
        }

        .library-input:focus,
        .library-select:focus {
          border-color: #c8a96e;
        }

        .library-btn,
        .show-more-btn {
          min-height: 46px;
          border-radius: 14px;
          border: 1px solid #302a24;
          background: #11100e;
          color: #9a9186;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 12px 14px;
          cursor: pointer;
        }

        .library-btn:hover,
        .show-more-btn:hover {
          color: #c8a96e;
          border-color: #c8a96e;
        }

        .library-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .library-error {
          margin-bottom: 18px;
          padding: 14px 16px;
          border: 1px solid #5a2020;
          border-left: 3px solid #b84040;
          background: #2a1010;
          color: #f0a0a0;
          border-radius: 14px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          line-height: 1.5;
        }

        .show-more-wrap {
          display: flex;
          justify-content: center;
          margin-top: 16px;
        }
        .loading,
        .empty-state {
          text-align: center;
          padding: 70px 0;
          color: #7a7168;
        }

        .empty-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 30px;
          color: #f0ece4;
          margin-bottom: 10px;
        }

        .empty-action {
          margin-top: 20px;
        }

        .reports-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .report-card {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 20px;
          background: #14120f;
          border: 1px solid #24201b;
          padding: 18px;
          border-radius: 18px;
          transition: border-color 0.2s, transform 0.2s, background 0.2s;
        }

        .report-card:hover {
          border-color: #3f3529;
          background: #181511;
          transform: translateY(-1px);
        }

        .report-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 25px;
          color: #f0ece4;
          font-weight: 700;
          margin-bottom: 5px;
          overflow-wrap: anywhere;
          line-height: 1.1;
        }

        .report-date {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          color: #5f574f;
          margin-bottom: 11px;
        }

        .chips {
          display: flex;
          flex-wrap: wrap;
          gap: 7px;
        }

        .chip {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.08em;
          color: #9a9186;
          border: 1px solid #2a2520;
          background: #100f0d;
          padding: 6px 8px;
          border-radius: 999px;
          text-transform: uppercase;
        }

        .chip.gold {
          color: #c8a96e;
          border-color: #3a3020;
          background: #17130d;
        }

        .view-link {
          flex-shrink: 0;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          color: #c8a96e;
          text-decoration: none;
          text-transform: uppercase;
          border: 1px solid #302a24;
          background: #11100e;
          border-radius: 13px;
          padding: 12px 14px;
        }

        .view-link:hover {
          border-color: #c8a96e;
          background: #1c1710;
        }

        /* Dashboard beta readability pass */
        .dashboard-shell {
          font-size: 17px;
        }

        .brand-sub,
        .subheading,
        .status-muted,
        .tool-text,
        .how-text,
        .section-note {
          font-size: 15px !important;
          line-height: 1.65 !important;
          color: #bdb4aa !important;
        }

        .eyebrow,
        .status-label,
        .mini-stat,
        .report-date,
        .chip,
        .latest-link,
        .tool-link,
        .admin-btn,
        .signout-btn,
        .primary-btn,
        .secondary-btn,
        .library-btn,
        .show-more-btn,
        .user-email {
          font-size: 12px !important;
          letter-spacing: 0.11em !important;
        }

        .primary-btn,
        .secondary-btn,
        .tool-link,
        .view-link,
        .admin-btn,
        .signout-btn,
        .library-btn,
        .show-more-btn {
          min-height: 52px !important;
          padding: 15px 18px !important;
        }

        .library-input,
        .library-select {
          font-size: 16px !important;
          min-height: 54px !important;
        }

        .status-big {
          font-size: 42px !important;
        }

        .latest-title {
          font-size: 29px !important;
          line-height: 1.18 !important;
        }

        .tool-title {
          font-size: 32px !important;
        }

        .section-title {
          font-size: 38px !important;
        }

        .report-title {
          font-size: 29px !important;
          line-height: 1.18 !important;
        }

        .view-link {
          font-size: 12px !important;
        }

        .report-card {
          padding: 22px !important;
        }

        @media (max-width: 900px) {
          .hero-grid,
          .tool-grid,
          .how-grid {
            grid-template-columns: 1fr;
          }

          .tool-card {
            min-height: auto;
          }

          .library-controls {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .page-wrap {
            padding: 18px 14px 70px;
          }

          .topbar {
            align-items: flex-start;
            flex-direction: column;
            border-radius: 18px;
          }

          .user-row {
            justify-content: flex-start;
            width: 100%;
          }

          .hero-card,
          .status-card,
          .tool-card,
          .reports-panel,
          .how-card {
            border-radius: 20px;
          }

          .hero-card {
            padding: 24px;
          }

          .hero-actions {
            flex-direction: column;
          }

          .primary-btn,
          .secondary-btn {
            width: 100%;
          }

          .reports-head {
            align-items: flex-start;
            flex-direction: column;
          }

          .report-card {
            grid-template-columns: 1fr;
            align-items: flex-start;
          }

          .view-link {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>

      <div className="page-wrap">
        <header className="topbar">
          <div className="brand-lockup">
            <div className="brand-mark">HE</div>
            <div>
              <div className="brand-main">HOVEL EDITOR</div>
              <div className="brand-sub">Manuscript memory dashboard</div>
            </div>
          </div>

          <div className="user-row">
            {user?.email && <span className="user-email">{user.email}</span>}
            {isAdmin && (
              <a className="admin-btn" href="/admin/usage">
                Admin Usage
              </a>
            )}
            <a className="signout-btn" href="/beta-terms">
              Beta Terms
            </a>
            <button className="signout-btn" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        </header>

        <section className="hero-grid">
          <div className="hero-card">
            <div className="eyebrow">Start Here</div>
            <h1 className="heading">Diagnose the manuscript before you rewrite the damn thing.</h1>
            <p className="subheading">
              Run a diagnosis, organize drafts into projects, compare revisions, reopen saved reports, and use SPHINX when the prose smells too polished, too stiff, or too AI.
            </p>

            <div className="hero-actions">
              <a className="primary-btn" href="/submit">
                Run The Council
              </a>
              <a className="secondary-btn" href="/projects">
                Open Projects
              </a>
              <a className="secondary-btn" href="/reread">
                Council Re-Read
              </a>
              <a className="secondary-btn" href="/sphinx">
                Run SPHINX
              </a>
              <a className="secondary-btn" href="#saved-reports">
                Saved Reports
              </a>
            </div>
          </div>

          <aside className="status-card">
            <div>
              <div className="status-label">Garage Status</div>
              <div className="status-big">{loading ? "Loading" : reportLabel}</div>
              <p className="status-muted">
                This dashboard only shows reports connected to the signed-in user. If someone else logs in, they should see their own work, not yours.
              </p>
            </div>

            <div className="latest-box">
              <div className="status-label">Most Recent</div>

              {latestReport ? (
                <>
                  <div className="latest-title">{latestReport.title || "Untitled Manuscript"}</div>
                  <p className="status-muted">
                    {formatDate(latestReport.created_at)}
                    {latestIntake.writingType ? ` â€¢ ${latestIntake.writingType}` : ""}
                  </p>
                  <a className="latest-link" href={`/reports/${latestReport.id}`}>
                    Open Latest Report
                  </a>
                </>
              ) : (
                <p className="status-muted">
                  No saved reports yet. Start with one test manuscript and make sure the cab feels right.
                </p>
              )}
            </div>
          </aside>
        </section>

        <section className="tool-grid">
          <article className="tool-card">
            <div>
              <div className="tool-number">01</div>
              <div className="tool-title">Full Diagnosis</div>
              <p className="tool-text">
                Best for manuscripts, chapters, scenes, essays, and serious excerpts. This sends the work through the full editorial council.
              </p>
            </div>
            <a className="tool-link" href="/submit">
              Run The Council
            </a>
          </article>

          <article className="tool-card">
            <div>
              <div className="tool-number">02</div>
              <div className="tool-title">Sphinx</div>
              <p className="tool-text">
                Best for blurbs, bios, grant answers, posts, emails, and anything that smells too polished, too stiff, or too AI.
              </p>
            </div>
            <a className="tool-link" href="/sphinx">
              Run Sphinx
            </a>
          </article>

          <article className="tool-card">
            <div>
              <div className="tool-number">03</div>
              <div className="tool-title">Projects</div>
              <p className="tool-text">
                Organize manuscripts into project folders, preserve draft history, and keep revision memory from turning into a folder full of chaos goblins.
              </p>
            </div>
            <a className="tool-link" href="/projects">
              Open Projects
            </a>
          </article>

          <article className="tool-card">
            <div>
              <div className="tool-number">04</div>
              <div className="tool-title">Re-Read</div>
              <p className="tool-text">
                Compare a revised draft against an earlier saved version and see what actually improved, worsened, or still needs work.
              </p>
            </div>
            <a className="tool-link" href="/reread">
              Run Re-Read
            </a>
          </article>


        </section>

        <section className="how-grid">
          <div className="how-card">
            <div className="how-title">Step 1</div>
            <div className="how-text">Choose what kind of writing this is and what kind of feedback you can handle today.</div>
          </div>

          <div className="how-card">
            <div className="how-title">Step 2</div>
            <div className="how-text">Paste the manuscript and run the council. The app reads first, then judges.</div>
          </div>

          <div className="how-card">
            <div className="how-title">Step 3</div>
            <div className="how-text">Open the saved report and revise from a diagnosis instead of vibes, panic, and caffeine.</div>
          </div>
        </section>

        <section className="reports-panel" id="saved-reports">
          <div className="reports-head">
            <div>
              <h2 className="section-title">Saved Reports</h2>
              <p className="section-note">
                Search, filter, and open your saved reports. Newest reports appear first.
              </p>
            </div>

            <div className="mini-stat">
              {loading ? "Loading" : `Showing ${visibleReports.length} of ${filteredReports.length} / ${reports.length}`}
            </div>
          </div>
          {dashboardError && (
            <div className="library-error">{dashboardError}</div>
          )}

          <div className="library-controls">
            <input
              className="library-input"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search reports by title, type, audience, goal, or concern..."
            />

            <select
              className="library-select"
              value={reportFilter}
              onChange={(event) => setReportFilter(event.target.value)}
            >
              <option value="all">All Reports</option>
              <option value="council">The Council Only</option>
              <option value="council-reread">Council Re-Read Only</option>
              <option value="sphinx">Sphinx Only</option>
            </select>

            <button
              className="library-btn"
              type="button"
              onClick={refreshReports}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing" : "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="loading">Loading your reports...</div>
          ) : reports.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">No reports yet.</div>
              <div>Start your first diagnosis and it will show up here.</div>
              <div className="empty-action">
                <a className="primary-btn" href="/submit">
                  Start New Diagnosis
                </a>
              </div>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="empty-state">
              <div className="empty-title">No matching reports.</div>
              <div>Change the search or filter. The reports are probably there. They are just hiding like little digital possums.</div>
            </div>
          ) : (
            <>
              <div className="reports-list">
                {visibleReports.map((report) => {
                const intake = parseIntake(report.intake);

                return (
                  <article key={report.id} className="report-card">
                    <div>
                      <div className="report-title">{report.title || "Untitled Manuscript"}</div>
                      <div className="report-date">{formatDate(report.created_at)}</div>

                      <div className="chips">
                        <span className="chip gold">{getReportTypeLabel(report)}</span>

                        {intake.writingType ? (
                          <span className="chip gold">{intake.writingType}</span>
                        ) : (
                          <span className="chip">No Intake</span>
                        )}

                        {intake.preparationGoal ? (
                          <span className="chip">{intake.preparationGoal}</span>
                        ) : null}

                        {intake.feedbackTone ? (
                          <span className="chip">{intake.feedbackTone} Tone</span>
                        ) : null}

                        {intake.audience ? (
                          <span className="chip">{intake.audience}</span>
                        ) : null}
                      </div>
                    </div>

                    <a className="view-link" href={`/reports/${report.id}`}>
                      View Report
                    </a>
                  </article>
                );
              })}
              </div>

              {hasMoreReports && (
                <div className="show-more-wrap">
                  <button
                    className="show-more-btn"
                    type="button"
                    onClick={() => setVisibleCount((count) => count + 20)}
                  >
                    Show More Reports
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}














