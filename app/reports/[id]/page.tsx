"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type SavedReport = {
  id: string;
  title?: string | null;
  created_at?: string | null;
  report_type?: string | null;
  content?: unknown;
  voice?: unknown;
  structure?: unknown;
  repetition?: unknown;
  market?: unknown;
  line?: unknown;
  voice_report?: unknown;
  structure_report?: unknown;
  repetition_report?: unknown;
  market_report?: unknown;
  line_report?: unknown;
  [key: string]: unknown;
};

type ReportSection = {
  key: string;
  name: string;
  role: string;
  color: string;
  tagline: string;
  text: string;
};

type RenderBlock =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "bullet"; text: string }
  | { type: "divider"; text: string };

const PERSONAS = [
  {
    key: "brad",
    name: "Brad",
    role: "Voice Guardian",
    color: "#c8935a",
    tagline: "Protects what is alive in the manuscript.",
  },
  {
    key: "greg",
    name: "Greg",
    role: "Brutal Editor",
    color: "#b84040",
    tagline: "Finds what is costing the manuscript power.",
  },
  {
    key: "vonClaude",
    name: "Von Clausen",
    role: "Architect",
    color: "#5a7cc8",
    tagline: "Structure, consistency, blueprint discipline.",
  },
  {
    key: "juniper",
    name: "Juniper",
    role: "Reader Lens",
    color: "#4a9c6a",
    tagline: "Represents the intelligent outside reader.",
  },
  {
    key: "finalEditor",
    name: "Final Editor",
    role: "Synthesis",
    color: "#9c7ac8",
    tagline: "Resolves the council and writes the official report.",
  },
];

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase settings. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodeMaybeJson(value: unknown): unknown {
  let current = value;

  for (let i = 0; i < 3; i++) {
    if (typeof current !== "string") return current;

    const trimmed = current.trim();

    if (!trimmed) return "";

    const looksJson =
      (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith('"') && trimmed.endsWith('"'));

    if (!looksJson) return current;

    try {
      current = JSON.parse(trimmed);
    } catch {
      return current;
    }
  }

  return current;
}

function findCouncilObject(value: unknown): Record<string, unknown> | null {
  const decoded = decodeMaybeJson(value);

  if (!isPlainObject(decoded)) return null;

  const candidates = [
    decoded,
    decoded.reports,
    decoded.content,
    decoded.report,
    decoded.data,
  ];

  for (const candidate of candidates) {
    const parsed = decodeMaybeJson(candidate);

    if (!isPlainObject(parsed)) continue;

    const hasCouncilKeys = PERSONAS.some((person) => asText(parsed[person.key]));

    if (hasCouncilKeys) {
      return parsed;
    }
  }

  return null;
}

function getSingleTextFromObject(value: unknown): string {
  const decoded = decodeMaybeJson(value);

  if (typeof decoded === "string") {
    return decoded.trim();
  }

  if (!isPlainObject(decoded)) return "";

  const possibleFields = [
    decoded.content,
    decoded.fullReport,
    decoded.report,
    decoded.sphinx,
    decoded.text,
    decoded.strongerVersion,
    decoded.final,
    decoded.finalEditor,
  ];

  for (const field of possibleFields) {
    const text = getSingleTextFromObject(field);
    if (text) return text;
  }

  return "";
}

function buildCouncilSections(report: SavedReport): ReportSection[] {
  const contentCouncil = findCouncilObject(report.content);

  if (contentCouncil) {
    return PERSONAS.map((person) => ({
      ...person,
      text: asText(contentCouncil[person.key]),
    })).filter((section) => section.text);
  }

  const legacySections = [
    {
      key: "voice",
      name: "Voice Report",
      role: "Voice",
      color: "#c8935a",
      tagline: "Voice, authority, and human texture.",
      text: asText(report.voice || report.voice_report),
    },
    {
      key: "structure",
      name: "Structure Report",
      role: "Architecture",
      color: "#5a7cc8",
      tagline: "Shape, pacing, and structural strength.",
      text: asText(report.structure || report.structure_report),
    },
    {
      key: "repetition",
      name: "Repetition Report",
      role: "Pattern Check",
      color: "#b84040",
      tagline: "Drag, repeated moves, and overused beats.",
      text: asText(report.repetition || report.repetition_report),
    },
    {
      key: "market",
      name: "Market Report",
      role: "Reader Fit",
      color: "#4a9c6a",
      tagline: "Audience, promise, and positioning.",
      text: asText(report.market || report.market_report),
    },
    {
      key: "line",
      name: "Line Report",
      role: "Line Level",
      color: "#9c7ac8",
      tagline: "Sentence-level pressure and polish.",
      text: asText(report.line || report.line_report),
    },
  ];

  return legacySections.filter((section) => section.text);
}

function buildSingleReportText(report: SavedReport) {
  const textFromContent = getSingleTextFromObject(report.content);

  if (textFromContent) {
    return textFromContent;
  }

  const fields = [
    report.voice,
    report.voice_report,
    report.structure,
    report.structure_report,
    report.repetition,
    report.repetition_report,
    report.market,
    report.market_report,
    report.line,
    report.line_report,
  ];

  return fields.map(asText).filter(Boolean).join("\n\n---\n\n");
}

function formatDate(value?: string | null) {
  if (!value) return "";

  try {
    return new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function cleanInline(text: string) {
  return text
    .replace(/\\"/g, '"')
    .replace(/\\n/g, "\n")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .trim();
}

function parseReportText(text: string): RenderBlock[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: RenderBlock[] = [];
  let paragraph: string[] = [];

  function flushParagraph() {
    const joined = paragraph.join(" ").trim();

    if (joined) {
      blocks.push({ type: "paragraph", text: cleanInline(joined) });
    }

    paragraph = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      continue;
    }

    if (/^-{3,}$/.test(line)) {
      flushParagraph();
      blocks.push({ type: "divider", text: "" });
      continue;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      blocks.push({ type: "h3", text: cleanInline(line.replace(/^###\s+/, "")) });
      continue;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      blocks.push({ type: "h2", text: cleanInline(line.replace(/^##\s+/, "")) });
      continue;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      blocks.push({ type: "h1", text: cleanInline(line.replace(/^#\s+/, "")) });
      continue;
    }

    if (line.startsWith(">")) {
      flushParagraph();
      blocks.push({
        type: "quote",
        text: cleanInline(line.replace(/^>\s?/, "")),
      });
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("• ")) {
      flushParagraph();
      blocks.push({
        type: "bullet",
        text: cleanInline(line.replace(/^[-•]\s+/, "")),
      });
      continue;
    }

    paragraph.push(line);
  }

  flushParagraph();

  return blocks;
}

function ReportBlock({ block }: { block: RenderBlock }) {
  if (block.type === "h1") {
    return (
      <div className="report-h1">
        <h2>{block.text}</h2>
      </div>
    );
  }

  if (block.type === "h2") {
    return <h3 className="report-h2">{block.text}</h3>;
  }

  if (block.type === "h3") {
    return <h4 className="report-h3">{block.text}</h4>;
  }

  if (block.type === "quote") {
    return <blockquote className="report-quote">{block.text}</blockquote>;
  }

  if (block.type === "bullet") {
    return (
      <div className="report-bullet">
        <span />
        <p>{block.text}</p>
      </div>
    );
  }

  if (block.type === "divider") {
    return <hr className="report-divider" />;
  }

  return <p className="report-para">{block.text}</p>;
}

export default function SavedReportPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";

  const [report, setReport] = useState<SavedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("brad");

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        setError("");

        if (!id) {
          throw new Error("Missing report ID.");
        }

        const supabase = getSupabaseClient();

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          window.location.href = "/login";
          return;
        }

        const { data, error: reportError } = await supabase
          .from("reports")
          .select("*")
          .eq("id", id)
          .eq("user_id", session.user.id)
          .single();

        if (reportError) {
          throw new Error(reportError.message);
        }

        setReport(data as SavedReport);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Could not load report.";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    loadReport();
  }, [id]);

  const councilSections = useMemo(() => {
    if (!report) return [];
    return buildCouncilSections(report);
  }, [report]);

  const singleReportText = useMemo(() => {
    if (!report || councilSections.length > 0) return "";
    return buildSingleReportText(report);
  }, [report, councilSections.length]);

  useEffect(() => {
    if (councilSections.length > 0 && !councilSections.some((section) => section.key === activeTab)) {
      setActiveTab(councilSections[0].key);
    }
  }, [activeTab, councilSections]);

  const activeSection =
    councilSections.find((section) => section.key === activeTab) ||
    councilSections[0];

  const activeText = activeSection?.text || singleReportText;
  const blocks = useMemo(() => parseReportText(activeText), [activeText]);

  const label =
    report?.report_type === "sphinx"
      ? "SPHINX SAVED REPORT"
      : "EDITORIAL COUNCIL REPORT";

  const copyText = councilSections.length
    ? councilSections
        .map((section) => `# ${section.name}\n\n${section.text}`)
        .join("\n\n---\n\n")
    : singleReportText;

  async function copyFullReport() {
    if (!copyText) return;

    await navigator.clipboard.writeText(copyText);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <main className="report-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;700&family=IBM+Plex+Mono:wght@400;500;700&display=swap');

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #0e0d0b;
        }

        .report-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(200, 147, 90, 0.12), transparent 35rem),
            radial-gradient(circle at bottom right, rgba(90, 124, 200, 0.1), transparent 32rem),
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
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
        }

        .nav-link,
        .action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          border: 1px solid #302a24;
          background: rgba(18, 16, 13, 0.84);
          color: #9a9186;
          text-decoration: none;
          border-radius: 14px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 12px 14px;
          cursor: pointer;
        }

        .nav-link:hover,
        .action-btn:hover {
          color: #c8935a;
          border-color: #c8935a;
        }

        .top-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .hero-card,
        .report-card {
          border: 1px solid #26211c;
          background: rgba(18, 16, 13, 0.9);
          border-radius: 30px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.2);
        }

        .hero-card {
          padding: 34px;
          margin-bottom: 22px;
        }

        .eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.28em;
          color: #c8935a;
          text-transform: uppercase;
          margin-bottom: 14px;
        }

        .title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(44px, 8vw, 78px);
          font-weight: 700;
          line-height: 0.96;
          color: #f0ece4;
          margin: 0;
          overflow-wrap: anywhere;
        }

        .date {
          margin-top: 18px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          color: #7b7168;
        }

        .meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 20px;
        }

        .meta-chip {
          border: 1px solid #302a24;
          background: #11100e;
          color: #9a9186;
          border-radius: 999px;
          padding: 8px 10px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .report-card {
          padding: 24px;
        }

        .tabs-wrap {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid #2a2520;
          padding-bottom: 14px;
          margin-bottom: 24px;
          overflow-x: auto;
        }

        .tab-btn {
          padding: 12px 14px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          background: #11100e;
          border: 1px solid #302a24;
          border-radius: 13px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
          color: #6f665f;
        }

        .tab-btn.active {
          border-color: var(--tab-color);
          color: var(--tab-color);
          background: #16120e;
        }

        .persona-header {
          padding-bottom: 22px;
          border-bottom: 1px solid #2a2520;
          margin-bottom: 24px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .persona-badge {
          width: 50px;
          height: 50px;
          border-radius: 17px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-weight: 700;
          flex-shrink: 0;
          border: 1px solid var(--badge-border);
        }

        .persona-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px;
          font-weight: 700;
          line-height: 1;
        }

        .persona-role {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-top: 5px;
        }

        .persona-tagline {
          font-size: 13px;
          font-weight: 300;
          color: #9a9186;
          margin-top: 8px;
        }

        .report-body {
          max-width: 880px;
          margin: 0 auto;
        }

        .report-h1 {
          margin: 8px 0 24px;
          border: 1px solid rgba(200, 147, 90, 0.24);
          background: rgba(200, 147, 90, 0.08);
          border-radius: 20px;
          padding: 18px;
        }

        .report-h1 h2 {
          margin: 0;
          font-family: 'Cormorant Garamond', serif;
          font-size: 30px;
          line-height: 1.1;
          color: #f0d5a3;
        }

        .report-h2 {
          margin: 34px 0 14px;
          border-bottom: 1px solid #2a2520;
          padding-bottom: 10px;
          font-family: 'Cormorant Garamond', serif;
          font-size: 26px;
          line-height: 1.1;
          color: #f0ece4;
        }

        .report-h3 {
          margin: 26px 0 10px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #c8935a;
        }

        .report-para {
          margin: 0 0 18px;
          color: #d7d0c8;
          font-size: 16px;
          font-weight: 300;
          line-height: 1.85;
        }

        .report-quote {
          margin: 24px 0;
          border-left: 3px solid #c8935a;
          background: #11100e;
          border-radius: 0 18px 18px 0;
          padding: 16px 18px;
          color: #f0ece4;
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-style: italic;
          line-height: 1.55;
        }

        .report-bullet {
          display: flex;
          gap: 12px;
          margin-bottom: 10px;
          border: 1px solid #26211c;
          background: #11100e;
          border-radius: 16px;
          padding: 13px 15px;
        }

        .report-bullet span {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #c8935a;
          flex-shrink: 0;
          margin-top: 9px;
        }

        .report-bullet p {
          margin: 0;
          color: #d7d0c8;
          font-size: 15px;
          line-height: 1.7;
        }

        .report-divider {
          border: none;
          border-top: 1px solid #2a2520;
          margin: 32px 0;
        }

        .loading-box,
        .error-box,
        .empty-box {
          border: 1px solid #26211c;
          background: rgba(18, 16, 13, 0.9);
          border-radius: 24px;
          padding: 24px;
          color: #9a9186;
        }

        .error-box {
          border-color: #5a2020;
          background: #2a1010;
          color: #f0a0a0;
        }

        @media (max-width: 700px) {
          .page-wrap {
            padding: 22px 14px 70px;
          }

          .topbar {
            align-items: flex-start;
            flex-direction: column;
          }

          .hero-card,
          .report-card {
            border-radius: 22px;
            padding: 22px;
          }

          .top-actions {
            width: 100%;
            flex-direction: column;
          }

          .nav-link,
          .action-btn {
            width: 100%;
            text-align: center;
          }

          .persona-header {
            flex-direction: column;
          }
        }
      `}</style>

      <div className="page-wrap">
        <div className="topbar">
          <Link href="/dashboard" className="nav-link">
            Back to Dashboard
          </Link>

          <div className="top-actions">
            <Link href="/sphinx" className="nav-link">
              Open Sphinx
            </Link>

            <button
              onClick={copyFullReport}
              disabled={!copyText}
              className="action-btn"
              type="button"
            >
              {copied ? "Copied" : "Copy Report"}
            </button>
          </div>
        </div>

        <section className="hero-card">
          <div className="eyebrow">{label}</div>

          <h1 className="title">{report?.title || "Saved Report"}</h1>

          {report?.created_at && (
            <div className="date">{formatDate(report.created_at)}</div>
          )}

          <div className="meta-row">
            <span className="meta-chip">
              {councilSections.length ? "Council Format" : "Single Report"}
            </span>

            {report?.report_type && (
              <span className="meta-chip">{report.report_type}</span>
            )}

            {councilSections.length > 0 && (
              <span className="meta-chip">{councilSections.length} sections</span>
            )}
          </div>
        </section>

        {loading && <div className="loading-box">Loading saved report...</div>}

        {error && <div className="error-box">{error}</div>}

        {!loading && !error && activeText && (
          <article className="report-card">
            {councilSections.length > 0 && (
              <>
                <div className="tabs-wrap">
                  {councilSections.map((section) => (
                    <button
                      key={section.key}
                      className={`tab-btn ${activeSection?.key === section.key ? "active" : ""}`}
                      style={{ "--tab-color": section.color } as CSSProperties}
                      onClick={() => setActiveTab(section.key)}
                      type="button"
                    >
                      {section.name}
                      {section.key === "finalEditor" ? " *" : ""}
                    </button>
                  ))}
                </div>

                {activeSection && (
                  <div className="persona-header">
                    <div
                      className="persona-badge"
                      style={{
                        background: activeSection.color + "22",
                        color: activeSection.color,
                        "--badge-border": activeSection.color + "55",
                      } as CSSProperties}
                    >
                      {activeSection.name[0]}
                    </div>

                    <div>
                      <div
                        className="persona-name"
                        style={{ color: activeSection.color }}
                      >
                        {activeSection.name}
                      </div>

                      <div
                        className="persona-role"
                        style={{ color: activeSection.color + "99" }}
                      >
                        {activeSection.role}
                      </div>

                      <div className="persona-tagline">
                        {activeSection.tagline}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="report-body">
              {blocks.map((block, index) => (
                <ReportBlock key={`${block.type}-${index}`} block={block} />
              ))}
            </div>
          </article>
        )}

        {!loading && !error && !activeText && (
          <div className="empty-box">
            This saved report opened, but no readable report content was found.
          </div>
        )}
      </div>
    </main>
  );
}

