"use client";

import { useState, useRef } from "react";

const PERSONAS = [
  { key: "brad", name: "Brad", role: "Voice Guardian", color: "#c8935a", tagline: "Protects what is alive in the manuscript." },
  { key: "greg", name: "Greg", role: "Brutal Editor", color: "#b84040", tagline: "Finds what is costing the manuscript power." },
  { key: "vonClaude", name: "Von Claude", role: "Architect", color: "#5a7cc8", tagline: "Structure, consistency, blueprint discipline." },
  { key: "juniper", name: "Juniper", role: "Reader Lens", color: "#4a9c6a", tagline: "Represents the intelligent outside reader." },
  { key: "finalEditor", name: "Final Editor", role: "Synthesis", color: "#9c7ac8", tagline: "Resolves the council. Writes the official report." },
];

const STATUS_MESSAGES = [
  "Reading your manuscript...",
  "Calling the council...",
  "Brad is protecting the voice...",
  "Greg is finding the drag...",
  "Von Claude is checking structure...",
  "Juniper is reading as a reader...",
  "Final Editor is synthesizing...",
  "Saving your reports...",
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

export default function Home() {
  const [manuscript, setManuscript] = useState("");
  const [reports, setReports] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("brad");
  const [statusMsg, setStatusMsg] = useState("");
  const [hasRun, setHasRun] = useState(false);
  const [error, setError] = useState("");
  const [savedId, setSavedId] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function runCouncil() {
    if (!manuscript.trim()) return;
    setLoading(true);
    setReports({});
    setHasRun(false);
    setActiveTab("brad");
    setError("");
    setSavedId("");

    let idx = 0;
    setStatusMsg(STATUS_MESSAGES[0]);
    intervalRef.current = setInterval(() => {
      idx = Math.min(idx + 1, STATUS_MESSAGES.length - 1);
      setStatusMsg(STATUS_MESSAGES[idx]);
    }, 3500);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manuscriptText: manuscript }),
      });

      const data = await response.json();

      if (data.reports) {
        setReports(data.reports);
        setHasRun(true);
        setActiveTab("brad");
        if (data.submissionId) {
          setSavedId(data.submissionId);
        }
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Connection failed. Please try again.");
    } finally {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setLoading(false);
      setStatusMsg("");
    }
  }

  function reset() {
    setManuscript("");
    setReports({});
    setHasRun(false);
    setActiveTab("brad");
    setError("");
    setSavedId("");
  }

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
        .subtitle { font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 300; color: #9a9186; margin-top: 12px; }
        .textarea { width: 100%; background: #161410; border: 1px solid #2a2520; color: #f0ece4; font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 300; padding: 20px; resize: vertical; outline: none; min-height: 220px; line-height: 1.7; transition: border-color 0.2s; }
        .textarea:focus { border-color: #c8935a; }
        .textarea::placeholder { color: #5a5448; }
        .run-btn { margin-top: 16px; padding: 14px 36px; background: #c8935a; color: #0e0d0b; font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; border: none; cursor: pointer; transition: background 0.2s; }
        .run-btn:hover:not(:disabled) { background: #e0aa70; }
        .run-btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .reset-btn { margin-left: 12px; padding: 14px 24px; background: transparent; color: #5a5448; font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; border: 1px solid #2a2520; cursor: pointer; }
        .reset-btn:hover { border-color: #5a5448; color: #9a9186; }
        .status-bar { margin-top: 32px; padding: 16px 20px; background: #161410; border-left: 2px solid #c8935a; }
        .status-text { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #c8935a; letter-spacing: 0.1em; }
        .council-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 0; margin-top: 16px; border: 1px solid #2a2520; }
        .persona-progress { padding: 12px 8px; text-align: center; border-right: 1px solid #2a2520; }
        .persona-progress:last-child { border-right: none; }
        .persona-progress.done { background: #161410; }
        .persona-progress.pending { opacity: 0.35; }
        .persona-dot { width: 6px; height: 6px; border-radius: 50%; margin: 0 auto 6px; }
        .persona-name-sm { font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: 0.1em; color: #9a9186; text-transform: uppercase; }
        .tabs-wrap { display: flex; border-bottom: 1px solid #2a2520; margin-top: 48px; overflow-x: auto; }
        .tab-btn { padding: 14px 20px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer; white-space: nowrap; transition: all 0.2s; color: #5a5448; }
        .tab-btn.active { border-bottom-color: var(--tab-color); color: var(--tab-color); }
        .tab-btn:hover:not(.active):not(.locked) { color: #9a9186; }
        .tab-btn.locked { opacity: 0.3; cursor: default; }
        .persona-header { padding: 28px 0 20px; border-bottom: 1px solid #2a2520; margin-bottom: 28px; display: flex; align-items: flex-start; gap: 20px; }
        .persona-badge { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 700; flex-shrink: 0; }
        .persona-name { font-family: 'Cormorant Garamond', serif; font-size: 26px; font-weight: 700; line-height: 1; }
        .persona-role { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; margin-top: 4px; }
        .persona-tagline { font-family: 'DM Sans', sans-serif; font-size: 13px; font-weight: 300; color: #9a9186; margin-top: 8px; }
        .report-content { font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 300; line-height: 1.8; color: #d4cfc7; }
        .section-head { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 600; color: #f0ece4; margin: 28px 0 10px; }
        .para { margin-bottom: 12px; }
        .word-count { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #5a5448; margin-top: 8px; }
        .council-label { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.15em; color: #5a5448; text-transform: uppercase; margin-top: 32px; margin-bottom: 8px; }
        .saved-bar { margin-top: 24px; padding: 16px 20px; background: #0e1a10; border-left: 2px solid #4a9c6a; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #4a9c6a; letter-spacing: 0.08em; }
        .saved-link { color: #4a9c6a; text-decoration: underline; word-break: break-all; }
        .error-msg { margin-top: 20px; padding: 16px 20px; background: #2a1010; border-left: 2px solid #b84040; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #b84040; }
        .empty-state { padding: 48px 0; text-align: center; }
        .empty-label { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.15em; color: #5a5448; text-transform: uppercase; margin-top: 12px; }
      `}</style>

      <div className="app-wrap">
        <div className="masthead">
          <div className="eyebrow">Editorial Council — Phase 1 Prototype</div>
          <div className="title">5 CORE</div>
          <div className="subtitle">Five editorial minds. One blunt verdict. No bullshit.</div>
        </div>

        {!hasRun && (
          <div>
            <textarea
              className="textarea"
              placeholder="Paste your manuscript excerpt here. A few paragraphs to a few pages. The council will read it completely before delivering any verdict."
              value={manuscript}
              onChange={(e) => setManuscript(e.target.value)}
              disabled={loading}
            />
            {manuscript.length > 0 && (
              <div className="word-count">
                {manuscript.trim().split(/\s+/).filter(Boolean).length} words
              </div>
            )}
            <div>
              <button
                className="run-btn"
                onClick={runCouncil}
                disabled={loading || manuscript.trim().length < 50}
              >
                {loading ? "Running..." : "Convene the Council"}
              </button>
            </div>
            {error && <div className="error-msg">{error}</div>}
          </div>
        )}

        {loading && (
          <div>
            <div className="status-bar">
              <div className="status-text">{statusMsg}</div>
            </div>
            <div className="council-label">Council Status</div>
            <div className="council-grid">
              {PERSONAS.map((p) => (
                <div key={p.key} className={`persona-progress ${reports[p.key] ? "done" : "pending"}`}>
                  <div className="persona-dot" style={{ background: reports[p.key] ? p.color : "#2a2520" }} />
                  <div className="persona-name-sm">{p.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasRun && !loading && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "12px" }}>
              <div className="eyebrow" style={{ marginBottom: 0 }}>Council Reports</div>
              <button className="reset-btn" onClick={reset}>New Manuscript</button>
            </div>

            {savedId && (
              <div className="saved-bar">
                ✓ Report saved — bookmark this link to return anytime:&nbsp;
                <a className="saved-link" href={`${window.location.origin}/view/${savedId}`}>
                  {window.location.origin}/view/{savedId}
                </a>
              </div>
            )}

            <div className="tabs-wrap">
              {PERSONAS.map((p) => (
                <button
                  key={p.key}
                  className={`tab-btn ${activeTab === p.key ? "active" : ""} ${!reports[p.key] ? "locked" : ""}`}
                  style={{ "--tab-color": p.color } as React.CSSProperties}
                  onClick={() => reports[p.key] && setActiveTab(p.key)}
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
                  <div className="empty-state">
                    <div className="empty-label">Loading...</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}