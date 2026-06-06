"use client";

import { useEffect, useState } from "react";

type AdminPayload = { label: string; data: unknown; error?: string };

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState<AdminPayload[]>([]);

  useEffect(() => {
    async function loadAdmin() {
      const endpoints = [
        ["Health", "/api/admin/health"],
        ["Usage", "/api/admin/usage"],
        ["Feedback", "/api/admin/feedback"],
        ["Invites", "/api/admin/invites"],
      ];

      const results = await Promise.all(
        endpoints.map(async ([label, url]) => {
          try {
            const res = await fetch(url);
            const data = await res.json().catch(() => null);
            return { label, data: res.ok ? data : data || { status: res.status } };
          } catch (error) {
            return { label, data: null, error: error instanceof Error ? error.message : "Unknown error" };
          }
        })
      );

      setSections(results);
      setLoading(false);
    }

    loadAdmin();
  }, []);

  return (
    <main style={{ minHeight: "100vh", padding: "140px 24px 80px", background: "#080705", color: "#f4efe7" }}>
      <section style={{ maxWidth: 1180, margin: "0 auto" }}>
        <p style={{ color: "#d29a54", letterSpacing: "0.18em", textTransform: "uppercase", fontSize: 13, fontWeight: 800 }}>
          Owner Control Room
        </p>
        <h1 style={{ fontSize: "clamp(44px, 8vw, 92px)", lineHeight: 0.95, margin: "18px 0 20px" }}>
          Admin Dashboard
        </h1>
        <p style={{ maxWidth: 760, color: "#cfc5b8", fontSize: 18, lineHeight: 1.7 }}>
          This is the Hovel Editor admin room. If the boxes below show an admin email warning, the next fix is the ADMIN_EMAILS setting in Vercel.
        </p>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: "34px 0" }}>
          <a href="/dashboard" style={{ color: "#080705", background: "#d29a54", padding: "14px 20px", borderRadius: 16, fontWeight: 900, textDecoration: "none", letterSpacing: "0.12em", textTransform: "uppercase" }}>Dashboard</a>
          <a href="/api/admin/health" style={{ color: "#f4efe7", border: "1px solid #3a2a1f", padding: "14px 20px", borderRadius: 16, fontWeight: 900, textDecoration: "none", letterSpacing: "0.12em", textTransform: "uppercase" }}>Health</a>
          <a href="/api/admin/usage" style={{ color: "#f4efe7", border: "1px solid #3a2a1f", padding: "14px 20px", borderRadius: 16, fontWeight: 900, textDecoration: "none", letterSpacing: "0.12em", textTransform: "uppercase" }}>Usage</a>
          <a href="/api/admin/feedback" style={{ color: "#f4efe7", border: "1px solid #3a2a1f", padding: "14px 20px", borderRadius: 16, fontWeight: 900, textDecoration: "none", letterSpacing: "0.12em", textTransform: "uppercase" }}>Feedback</a>
        </div>

        {loading ? (
          <p style={{ color: "#cfc5b8" }}>Loading admin data...</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 18 }}>
            {sections.map((section) => (
              <article key={section.label} style={{ border: "1px solid #2a211b", borderRadius: 24, padding: 22, background: "#0e0b08" }}>
                <h2 style={{ marginTop: 0, color: "#d29a54" }}>{section.label}</h2>
                <pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", color: "#ddd2c4", fontSize: 13, lineHeight: 1.5 }}>
                  {JSON.stringify(section.error ? { error: section.error } : section.data, null, 2)}
                </pre>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
