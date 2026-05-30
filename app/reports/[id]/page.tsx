"use client";

import { useEffect, useMemo, useState } from "react";
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

type ReportRecord = {
  id: string;
  created_at?: string;
  title?: string | null;
  content?: string | Record<string, string> | null;
  intake?: string | Record<string, unknown> | null;
};

function formatDate(dateStr?: string) {
  if (!dateStr) return "";

  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseReports(content: ReportRecord["content"]): Record<string, string> {
  if (!content) return {};

  if (typeof content === "object") {
    return content as Record<string, string>;
  }

  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, string>;
    }
  } catch {
    return {};
  }

  return {};
}

function parseIntake(intake: ReportRecord["intake"]): Record<string, unknown> {
  if (!intake) return {};

  if (typeof intake === "object") {
    return intake as Record<string, unknown>;
  }

  try {
    const parsed = JSON.parse(intake);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
  } catch {
    return {};
  }

  return {};
}

function renderMarkdown(text: string): string {
  if (!text) return "";

  const lines = text.split("\n");
  const html: string[] = [];
  let inList = false;

  for (const rawLine of lines) {
    let line = rawLine;

    line = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    line = line.replace(/\*([^*\s][^*]*[^*\s]|[^*\s])\*/g, "<em>$1</em>");

    if (/^# /.test(line)) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h1 class="report-title">${line.replace(/^# /, "")}</h1>`);
      continue;
    }

    if (/^## /.test(line)) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h2 class="section-head">${line.replace(/^## /, "")}</h2>`);
      continue;
    }

    if (/^### /.test(line)) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<h3 class="section-subhead">${line.replace(/^### /, "")}</h3>`);
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      if (inList) {
        html.push("</ul>");
        inList = false;
      }
      html.push(`<hr class="report-divider" />`);
      continue;
    }

    if (/^[-•] /.test(line)) {
      if (!inList) {
        html.push("<ul class='report-list'>");
        inList = true;
      }
      html.push(`<li>${line.replace(/^[-•] /, "")}</li>`);
      continue;
    }

    if (inList) {
      html.push("</ul>");
      inList = false;
    }

    if (line.trim() === "") {
      html.push("<br/>");
      continue;
    }

    html.push(`<p class="para">${line}</p>`);
  }

  if (inList) html.push("</ul>");

  return html.join("\n");
}

export default function ReportPage() {
  const params = useParams();
  const rawId = params?.id;
  const reportId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [report, setReport] = useState<ReportRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState("brad");

  useEffect(() => {
    async function loadReport() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
        return;
      }

      if (!reportId) {
        setErrorMessage("Missing report ID.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", reportId)
        .single();

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      setReport(data as ReportRecord);
      setLoading(false);
    }

    loadReport();
  }, [reportId]);

  const savedReports = useMemo(() => parseReports(report?.content), [report]);
  const intake = useMemo(() => parseIntake(report?.intake), [report]);
  const activePersona = PERSONAS.find((p) => p.key === activeTab);
  const activeReport = savedReports[activeTab];

  return (
    <div style={{ minHeight: "100vh", background: "#0e0d0b", color: "#f0ece4", fontFamily: "Georgia, serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .app-wrap { max-width: 960px; margin: 0 auto; padding: 48px 32px 100px; }
        .back-link { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #5a5448; text-decoration: none; letter-spacing: 0.1em; display: inline-block; margin-bottom: 32px; }
        .back-link:hover { color: #9a9186; }
        .masthead { border-bottom: 1px solid #2a2520; padding-bottom: 32px; margin-bottom: 32px; }
        .eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.2em; color: #c8935a; text-transform: uppercase; margin-bottom: 12px; }
        .title { font-family: 'Cormorant Garamond', serif; font-size: clamp(38px, 6vw, 64px); font-weight: 700; line-height: 1; color: #f0ece4; }
        .date { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #5a5448; margin-top: 14px; }
        .error-box { background: #161410; border: 1px solid #3a2520; padding: 24px; color: #d19a7a; }
        .intake-box { background: #12100d; border: 1px solid #2a2520; padding: 18px 20px; margin-bottom: 32px; }
        .intake-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 20px; }
        .intake-item { font-family: 'DM Sans', sans-serif; font-size: 13px; color: #9a9186; line-height: 1.45; }
        .intake-label { display: block; font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.12em; color: #c8935a; text-transform: uppercase; margin-bottom: 4px; }
        .tabs-wrap { display: flex; border-bottom: 1px solid #2a2520; margin-top: 24px; overflow-x: auto; }
        .tab-btn { padding: 14px 20px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; white-space: nowrap; transition: all 0.2s; color: #5a5448; }
        .tab-btn.active { border-bottom-color: var(--tab-color); color: var(--tab-color); }
        .tab-btn:hover:not(.active):not(.locked) { color: #9a9186; }
        .tab-btn.locked { opacity: 0.3; cursor: default; }
        .persona-header { padding: 28px 0 20px; border-bottom: 1px solid #2a2520; margin-bottom: 28px; display: flex; align-items: flex-start; gap: 20px; }
        .persona-badge { width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 700; flex-shrink: 0; border: 1px solid var(--badge-border); }
        .persona-name { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 700; line-height: 1; }
        .persona-role { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 4px; }
        .persona-tagline { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 300; color: #9a9186; margin-top: 8px; }
        .report-content { font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 300; line-height: 1.8; color: #d4cfc7; }
        .report-title { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 700; color: #f0ece4; margin: 24px 0 8px; line-height: 1.2; }
        .section-head { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 600; color: #f0ece4; margin: 32px 0 10px; letter-spacing: 0.05em; }
        .section-subhead { font-family: 'Cormorant Garamond', serif; font-size: 16px; font-weight: 600; color: #9a9186; margin: 20px 0 8px; }
        .report-divider { border: none; border-top: 1px solid #2a2520; margin: 28px 0; }
        .report-list { padding-left: 20px; margin: 12px 0; }
        .report-list li { margin-bottom: 8px; line-height: 1.7; }
        .para { margin-bottom: 12px; }
        .empty-state { padding: 48px 0; color: #5a5448; font-family: 'DM Sans', sans-serif; }
        @media (max-width: 720px) {
          .intake-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="app-wrap">
        <a className="back-link" href="/dashboard">Back to Dashboard</a>

        {loading ? (
          <div className="empty-state">Loading report...</div>
        ) : errorMessage ? (
          <div className="error-box">
            <h1>Report could not be loaded.</h1>
            <p>{errorMessage}</p>
          </div>
        ) : !report ? (
          <div className="empty-state">Report not found.</div>
        ) : (
          <>
            <div className="masthead">
              <div className="eyebrow">Editorial Council Report</div>
              <div className="title">{report.title || "Untitled Manuscript"}</div>
              {report.created_at && <div className="date">{formatDate(report.created_at)}</div>}
            </div>

            {Object.keys(intake).length > 0 && (
              <div className="intake-box">
                <div className="eyebrow">Intake</div>
                <div className="intake-grid">
                  <div className="intake-item">
                    <span className="intake-label">Writing Type</span>
                    {String(intake.writingType || "Not specified")}
                  </div>
                  <div className="intake-item">
                    <span className="intake-label">Audience</span>
                    {String(intake.audience || "Not specified")}
                  </div>
                  <div className="intake-item">
                    <span className="intake-label">Preparation Goal</span>
                    {String(intake.preparationGoal || "Not specified")}
                  </div>
                  <div className="intake-item">
                    <span className="intake-label">Feedback Tone</span>
                    {String(intake.feedbackTone || "Honest")}
                  </div>
                  <div className="intake-item" style={{ gridColumn: "1 / -1" }}>
                    <span className="intake-label">Biggest Concern</span>
                    {String(intake.biggestConcern || "Not specified")}
                  </div>
                </div>
              </div>
            )}

            {Object.keys(savedReports).length === 0 ? (
              <div className="empty-state">
                This saved report opened, but no council report content was found.
              </div>
            ) : (
              <>
                <div className="tabs-wrap">
                  {PERSONAS.map((p) => (
                    <button
                      key={p.key}
                      className={`tab-btn ${activeTab === p.key ? "active" : ""} ${!savedReports[p.key] ? "locked" : ""}`}
                      style={{ "--tab-color": p.color } as React.CSSProperties}
                      onClick={() => savedReports[p.key] && setActiveTab(p.key)}
                    >
                      {p.name}{p.key === "finalEditor" ? " *" : ""}
                    </button>
                  ))}
                </div>

                {activePersona && (
                  <div>
                    <div className="persona-header">
                      <div
                        className="persona-badge"
                        style={{
                          background: activePersona.color + "22",
                          color: activePersona.color,
                          "--badge-border": activePersona.color + "55",
                        } as React.CSSProperties}
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
                        dangerouslySetInnerHTML={{ __html: renderMarkdown(activeReport) }}
                      />
                    ) : (
                      <div className="empty-state">No report content found for this council member.</div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
