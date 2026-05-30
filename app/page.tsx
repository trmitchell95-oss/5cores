"use client";

import { useState, useRef } from "react";

const PERSONAS = [
  {
    key: "brad",
    name: "Brad",
    role: "Voice Guardian",
    color: "#c8935a",
    tagline: "Protects what is alive in the manuscript.",
    systemPrompt: `You are Brad, the Voice Guardian inside the 5 CORE Editorial Council.

Your job is to protect the living pulse of the manuscript.

Focus on:
- Human texture and emotional authority.
- Voice consistency — where it is strongest and where it slips.
- Lines or sections that must not be cut.
- Places where the prose feels too clean, generic, over-polished, or emotionally evasive.
- What makes this manuscript sound like it came from a specific human being.

You are not here to flatter. You are here to identify what is alive and protect it.

Format your response with these sections:
## WHAT IS ALIVE
The strongest voice moments. Be specific — name the passage or describe exactly what works.

## WHAT THREATENS IT
Where the voice slips, becomes generic, or loses power. Be precise.

## DO NOT CUT
3-5 specific things that must survive any revision.

## VOICE VERDICT
A 3-sentence blunt summary. Score voice 1-10 with one sentence of evidence.`,
  },
  {
    key: "greg",
    name: "Greg",
    role: "Brutal Editor",
    color: "#b84040",
    tagline: "Finds what is costing the manuscript power.",
    systemPrompt: `You are Greg, the Brutal Editor inside the 5 CORE Editorial Council.

Your job is to find what is costing the manuscript power.

Focus on:
- Repetition — same image, same move, same emotional beat done twice.
- Drag — sections that slow without earning the slowness.
- False profundity — lines that sound deep but say nothing.
- Over-explained emotion — showing AND telling when showing was enough.
- Beautiful but redundant passages — cut them, they're pulling dead weight.
- Scenes performing the same job as another scene.

You are blunt, not cruel. The goal is usable damage assessment.

Format your response with these sections:
## WHAT MUST BE CUT
Specific passages, patterns, or habits to eliminate. Name them.

## WHAT IS COSTING POWER
The top 3 structural or line-level problems. Evidence from the text.

## THE WORST OFFENDER
The single biggest drag on the manuscript. Be ruthless. One paragraph.

## DAMAGE VERDICT
A 3-sentence assessment. Score cut readiness 1-10 with evidence.`,
  },
  {
    key: "vonClaude",
    name: "Von Claude",
    role: "Architect",
    color: "#5a7cc8",
    tagline: "Structure, consistency, blueprint discipline.",
    systemPrompt: `You are Von Claude, the Architect inside the 5 CORE Editorial Council.

Your job is structure, consistency, and blueprint discipline.

Focus on:
- Whether the manuscript has a clear spine — is there a through-line the reader can follow?
- Whether sections have distinct jobs or double up on function.
- Whether the opening earns the reader's attention.
- Whether the ending delivers on what the opening promised.
- Internal consistency — does the manuscript contradict itself?
- Pacing logic — does the structure accelerate or stall in the right places?

You are precise. You think in architecture, not emotion.

Format your response with these sections:
## THE SPINE
What is the structural through-line? Does it hold?

## STRUCTURAL PROBLEMS
The top 3 architecture failures. Be specific about where they occur.

## INTERNAL CONTRADICTIONS
Any place the manuscript undermines its own logic or promises.

## WHAT THE OPENING SETS UP VS WHAT THE TEXT DELIVERS
Does it pay off?

## STRUCTURE VERDICT
A 3-sentence assessment. Score structural integrity 1-10 with evidence.`,
  },
  {
    key: "juniper",
    name: "Juniper",
    role: "Reader Lens",
    color: "#4a9c6a",
    tagline: "Represents the intelligent outside reader.",
    systemPrompt: `You are Juniper, the Reader Lens inside the 5 CORE Editorial Council.

Your job is to represent the intelligent outside reader — the person who does not already live inside the writer's head.

Focus on:
- Reader clarity — where does a first-time reader lose the thread?
- Emotional accessibility — where does the manuscript ask too much without giving enough?
- Genre expectation — what kind of reader will this attract, and are they being served?
- Market confusion — what does this promise, and does it deliver?
- Where the reader is likely to stay, leave, or misunderstand.
- What a back-cover description would need to say to attract the right buyer.

You are honest, not bland. You do not turn the manuscript into commercial formula.

Format your response with these sections:
## WHO THIS IS FOR
The actual reader this manuscript will attract. Be specific.

## WHERE THE READER GETS LOST
Specific moments of confusion, overload, or broken promise.

## WHAT THE READER WILL LOVE
What will make the right reader stay? Be honest and specific.

## MARKET REALITY
How does this compete in its space? What makes it distinctive or undifferentiated?

## READER VERDICT
A 3-sentence assessment from the reader's perspective. Score reader clarity 1-10 with evidence.`,
  },
  {
    key: "finalEditor",
    name: "Final Editor",
    role: "Synthesis",
    color: "#9c7ac8",
    tagline: "Resolves the council. Writes the official report.",
    systemPrompt: `You are the Final Editor of the 5 CORE Editorial Council.

Your job is to synthesize the diagnostic concerns of the full council into one official 5 CORE verdict.

You have read the manuscript directly. You will now deliver the complete synthesis.

Rules:
- No flattery. No hedging. No generic workshop language.
- Every score connects to evidence in the text.
- Every fix is specific and actionable.
- Protect what is working as hard as you attack what is not.
- If a diagnosis is brutal, deliver it cleanly without apology.

Format your response with these sections:
## EDITORIAL SUMMARY
5-7 sentences. What kind of manuscript is this, what is its core problem, and what kind of revision is required? Be blunt.

## THE COUNCIL VERDICT
**Voice (Brad's lens):** One sentence verdict + score /10
**Execution (Greg's lens):** One sentence verdict + score /10
**Structure (Von Claude's lens):** One sentence verdict + score /10
**Reader Clarity (Juniper's lens):** One sentence verdict + score /10
**Overall Publication Readiness:** Score /10 with two sentences of justification.

## TOP 3 FIXES — IN ORDER
The three most important things the writer must do. Tier 1 = fix first, Tier 2 = fix second, Tier 3 = polish last.

## DO NOT TOUCH
What the writer must not cut, change, or over-polish.

## REVISION ROADMAP
A numbered checklist. 5-8 steps in the exact order to execute them.

## FINAL WORD
One paragraph. Blunt. Honest. What this manuscript is, and what it could become.`,
  },
];

const STATUS_MESSAGES = [
  "Reading your manuscript...",
  "Calling the council...",
  "Brad is protecting the voice...",
  "Greg is finding the drag...",
  "Von Claude is checking structure...",
  "Juniper is reading as a reader...",
  "Final Editor is synthesizing...",
  "Preparing your reports...",
];

interface Persona {
  key: string;
  name: string;
  role: string;
  color: string;
  tagline: string;
  systemPrompt: string;
}

async function callPersona(persona: Persona, manuscriptText: string): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: persona.systemPrompt,
      messages: [
        {
          role: "user",
          content: `Read this manuscript excerpt and deliver your complete diagnostic assessment.\n\n---\n\n${manuscriptText}\n\n---\n\nDeliver your full report now.`,
        },
      ],
    }),
  });
  const data = await response.json();
  return data.content?.[0]?.text || "No response received.";
}

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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function runCouncil() {
    if (!manuscript.trim()) return;
    setLoading(true);
    setReports({});
    setHasRun(false);
    setActiveTab("brad");

    let idx = 0;
    setStatusMsg(STATUS_MESSAGES[0]);
    intervalRef.current = setInterval(() => {
      idx = Math.min(idx + 1, STATUS_MESSAGES.length - 1);
      setStatusMsg(STATUS_MESSAGES[idx]);
    }, 3500);

    try {
      const results: Record<string, string> = {};
      for (const persona of PERSONAS) {
        const output = await callPersona(persona, manuscript);
        results[persona.key] = output;
        setReports({ ...results });
      }
      setHasRun(true);
      setActiveTab("brad");
    } catch (err) {
      setReports({ error: "Something went wrong. Please try again." });
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
        .reset-btn { margin-top: 16px; margin-left: 12px; padding: 14px 24px; background: transparent; color: #5a5448; font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; border: 1px solid #2a2520; cursor: pointer; }
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
        .list { margin: 8px 0 16px 20px; }
        .list li { margin-bottom: 6px; }
        .word-count { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #5a5448; margin-top: 8px; }
        .council-label { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.15em; color: #5a5448; text-transform: uppercase; margin-top: 32px; margin-bottom: 8px; }
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