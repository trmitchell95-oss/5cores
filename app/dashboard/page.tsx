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
  title: string;
};

export default function Dashboard() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email?: string } | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/login";
        return;
      }
      setUser(session.user);
      const { data } = await supabase
        .from("reports")
        .select("id, created_at, title")
        .order("created_at", { ascending: false })
        .limit(20);
      if (data) setReports(data);
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
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "48px 32px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #2a2520", paddingBottom: "24px", marginBottom: "48px" }}>
          <div style={{ fontFamily: "Georgia, serif", fontSize: "22px", fontWeight: "700", letterSpacing: "0.12em", color: "#c8a96e", textTransform: "uppercase" }}>5 Core</div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {user?.email && <span style={{ fontSize: "13px", color: "#6b6560" }}>{user.email}</span>}
            <button onClick={handleSignOut} style={{ fontSize: "13px", color: "#6b6560", background: "none", border: "1px solid #2a2520", padding: "6px 14px", cursor: "pointer" }}>Sign out</button>
          </div>
        </div>

        <h1 style={{ fontSize: "36px", fontWeight: "600", marginBottom: "8px" }}>Your Reports</h1>
        <p style={{ fontSize: "15px", color: "#6b6560", marginBottom: "40px" }}>Every manuscript you have submitted for diagnosis.</p>

        <a href="/submit" style={{ display: "inline-block", background: "#c8a96e", color: "#0e0d0b", fontSize: "14px", fontWeight: "500", padding: "12px 28px", textDecoration: "none", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "48px" }}>+ Submit New Manuscript</a>

        {loading ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: "#4a4540" }}>Loading your reports...</div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: "24px", color: "#4a4540", marginBottom: "12px" }}>No reports yet.</div>
            <div style={{ fontSize: "15px", color: "#3a3530" }}>Submit your first manuscript to get started.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {reports.map((report) => (
              <div key={report.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#161412", border: "1px solid #1e1c18", padding: "20px 24px" }}>
                <div>
                  <div style={{ fontSize: "20px", color: "#f0ece4", fontWeight: "600", marginBottom: "4px" }}>{report.title || "Untitled Manuscript"}</div>
                  <div style={{ fontSize: "12px", color: "#4a4540", fontFamily: "monospace" }}>{formatDate(report.created_at)}</div>
                </div>
                <a href={`/reports/${report.id}`} style={{ fontSize: "13px", color: "#c8a96e", textDecoration: "none" }}>View Report →</a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}