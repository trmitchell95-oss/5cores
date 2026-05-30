"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Report = {
  id: string;
  created_at: string;
  report_type: string;
};

export default function Dashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email?: string } | null>(null);

  useEffect(() => {
    async function load() {
      // Handle implicit flow - session comes from URL hash
      const { data: { session: hashSession } } = await supabase.auth.getSession();
      
      if (!hashSession) {
        // Try to get session from URL hash
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) {
          window.location.href = "/login";
          return;
        }
        setUser(data.user);
      } else {
        setUser(hashSession.user);
      }

      const { data: reportsData } = await supabase
        .from("reports")
        .select("id, created_at, report_type")
        .order("created_at", { ascending: false })
        .limit(20);

      if (reportsData) setReports(reportsData);
      setLoading(false);
    }

    load();
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
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

  return (
    <div style={{ minHeight: "100vh", background: "#0e0d0b", color: "#f0ece4", fontFamily: "Georgia, serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .wrap { max-width: 960px; margin: 0 auto; padding: 48px 32px 100px; }
        .topbar { display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #2a2520; padding-bottom: 24px; margin-bottom: 48px; }
        .eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.2em; color: #c8935a; text-transform: uppercase; margin-bottom: 8px; }
        .title { font-family: 'Cormorant Garamond', serif; font-size: 48px; font-weight: 700; line-height: 1; color: #f0ece4; }
        .user-email { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #5a5448; }
        .signout-btn { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #5a5448; background: none; border: 1px solid #2a2520; padding: 8px 16px; cursor: pointer; letter-spacing: 0.1em; text-transform: uppercase; }
        .signout-btn:hover { color: #9a9186; border-color: #5a5448; }
        .new-btn { display: inline-block; margin-bottom: 40px; padding: 14px 32px; background: #c8935a; color: #0e0d0b; font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; border: none; cursor: pointer; text-decoration: none; transition: background 0.2s; }
        .new-btn:hover { background: #e0aa70; }
        .section-label { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.15em; color: #5a5448; text-transform: uppercase; margin-bottom: 16px; }
        .report-row { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid #1a1815; }
        .report-row:first-child { border-top: 1px solid #1a1815; }
        .report-date { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #5a5448; }
        .report-type { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.1em; color: #9a9186; text-transform: uppercase; margin-top: 4px; }
        .view-btn { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #c8935a; text-decoration: none; letter-spacing: 0.1em; }
        .view-btn:hover { color: #e0aa70; }
        .empty { font-family: 'DM Sans', sans-serif; font-size: 15px; color: #5a5448; padding: 48px 0; }
        .loading-msg { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #5a5448; letter-spacing: 0.1em; }
      `}</style>

      <div className="wrap">
        <div className="topbar">
          <div>
            <div className="eyebrow">Editorial Council</div>
            <div className="title">5 CORE</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="user-email">{user?.email}</div>
            <button className="signout-btn" style={{ marginTop: "8px" }} onClick={handleSignOut}>Sign Out</button>
          </div>
        </div>

        <a className="new-btn" href="/submit">Run New Manuscript</a>

        <div className="section-label">Your Reports</div>

        {loading && <div className="loading-msg">Loading your reports...</div>}

        {!loading && reports.length === 0 && (
          <div className="empty">No reports yet. Run your first manuscript above.</div>
        )}

        {!loading && reports.map((report) => (
          <div className="report-row" key={report.id}>
            <div>
              <div className="report-date">{formatDate(report.created_at)}</div>
              <div className="report-type">{report.report_type}</div>
            </div>
            <a className="view-btn" href={`/view/${report.id}`}>View Report →</a>
          </div>
        ))}
      </div>
    </div>
  );
}