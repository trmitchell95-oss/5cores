"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const PERSONAS = [
  { key: "brad", name: "Brad", role: "Voice Guardian", color: "#c8935a", tagline: "Protects what is alive in the manuscript." },
  { key: "greg", name: "Greg", role: "Brutal Editor", color: "#b84040", tagline: "Finds what is costing the manuscript power." },
  { key: "vonClaude", name: "Von Claude", role: "Architect", color: "#5a7cc8", tagline: "Structure, consistency, blueprint discipline." },
  { key: "juniper", name: "Juniper", role: "Reader Lens", color: "#4a9c6a", tagline: "Represents the intelligent outside reader." },
  { key: "finalEditor", name: "Final Editor", role: "Synthesis", color: "#9c7ac8", tagline: "Resolves the council. Writes the official report." },
];

function renderMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/## (.+)/g, '<h3 class="section-head">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n\n/g, '</p><p class="para">')
    .replace(/\n- (.+)/g, "<li>$1</li>")
    .replace(/\n/g, "<br/>");
}

export default function ViewReport() {
  const params = useParams();
  const id = params.id as string;
  const [reports, setReports] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("brad");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadReport() {
      try {
        const { data, error } = await supabase
          .from("reports")
          .select("content")
          .eq("id", id)
          .single();

        if (error || !data) {
          setError("Report not found.");
          return;
        }

        const parsed = typeof data.content === "string"
          ? JSON.parse(data.content)
          : data.content;

        setReports(parsed);
        setActiveTab("brad");
      } catch {
        setError("Could not load report.");
      } finally {
        setLoading(false);
      }
    }

    if (id) loadReport();
  }, [id]);

  const activePersona = PERSONAS.find((p) => p.key === activeTab);
  const activeReport = reports[activeTab];

  return (
    <div style={{ minHeight: "100vh", background: "#0e0d0b", color: "#f0ece4", fontFamily: "Georgia, serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .app-wrap { max-width: 960px; margin: 0 auto; padding: 48px 32px 100px; }
        .masthead { border-bottom: 1px solid #2a2520; padding-bottom: 32px; margin-bottom: 48px; }
        .eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.2em; color: #c8935a; text-transform: uppercase; margin-bottom: 12px; }
        .title { font-family: 'Cormorant Garamond', serif; font-size: clamp(40px, 7vw, 72px); font-weight: 700; line-height: 1; color: #f0ece4; }
        .back-link { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #5a5448; text-decoration: none; letter-spacing: 0.1em; display: inline-block; margin-bottom: 32px; }
        .back-link:hover { color: #9a9186; }
        .tabs-wrap { display: flex; border-bottom: 1px solid #2a2520; margin-top: 48px; overflow-x: auto; }
        .tab-btn { padding: 14px 20px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; white-space: nowrap; transition: all 0.2s; color: #5a5448; }
        .tab-btn.active { border-bottom-color: var(--tab-color); color: var(--tab-color); }
        .tab-btn:hover:not(.active) { color: #9a9186; }
        .persona-header { padding: 28px 0 20px; border-bottom: 1px solid #2a2520; margin-bottom: 28px; display: flex; align-items: flex-start; gap: 20px; }
        .persona-badge { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 700; flex-shrink: 0; }
        .persona-name { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 700; line-height: 1; }
        .persona-role { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 4px; }
        .persona-tagline { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 300; color: #9a9186; margin-top: 8px; }
        .report-content { font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 300; line-height: 1.8; color: #d4cfc7; }
        .section-head { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 600; color: #f0ece4; margin: 28px 0 10px; }
        .para { margin-bottom: 12px; }
        .loading-msg { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #5a5448; letter-spacing: 0.1em; }
        .error-box { padding: 24px; background: #2a1010; border-left: 2px solid #b84040; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #b84040; }
      `}</style>

      <div className="app-wrap">
        <a className="back-link" href="/">← Back to 5 CORE</a>

        <div className="masthead">
          <div className="eyebrow">Editorial Council — Saved Report</div>
          <div className="title">5 CORE</div>
        </div>

        {loading && <div className="loading-msg">Loading your report...</div>}
        {error && <div className="error-box">{error}</div>}

        {!loading && !error && (
          <div>
            <div className="tabs-wrap">
              {PERSONAS.map((p) => (
                <button
                  key={p.key}
                  className={`tab-btn ${activeTab === p.key ? "active" : ""}`}
                  style={{ "--tab-color": p.color } as React.CSSProperties}
                  onClick={() => setActiveTab(p.key)}
                >
                  {p.name}{p.key === "finalEditor" ? " ★" : ""}
                </button>
              ))}
            </div>

            {activePersona && (
              <div>
                <div className="persona-header">
                  <div
                    className="persona-badge"
                    style={{ background: activePersona.color + "22", color: activePersona.color }}
                  >
                    {activePersona.name[0]}
                  </div>
                  <div>
                    <div className="persona-name" style={{ color: activePersona.color }}>{activePersona.name}</div>
                    <div className="persona-role" style={{ color: activePersona.color + "99" }}>{activePersona.role}</div>
                    <div className="persona-tagline">{activePersona.tagline}</div>
                  </div>
                </div>

                {activeReport ? (
                  <div
                    className="report-content"
                    dangerouslySetInnerHTML={{ __html: "<p class='para'>" + renderMarkdown(activeReport) + "</p>" }}
                  />
                ) : (
                  <div className="loading-msg">No report found for this editor.</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}