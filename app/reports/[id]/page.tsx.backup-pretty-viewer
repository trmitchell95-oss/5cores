"use client";

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

type RenderBlock =
  | { type: "h1"; text: string }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "bullet"; text: string }
  | { type: "divider"; text: string };

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

function renderSections(report: SavedReport) {
  const contentText = asText(report.content);

  if (contentText) {
    return contentText;
  }

  if (isPlainObject(report.content)) {
    const nestedContent =
      asText(report.content.content) ||
      asText(report.content.fullReport) ||
      asText(report.content.sphinx) ||
      asText(report.content.report) ||
      asText(report.content.voice) ||
      asText(report.content.voice_report);

    if (nestedContent) {
      return nestedContent;
    }
  }

  const sections = [
    ["Voice Report", report.voice || report.voice_report],
    ["Structure Report", report.structure || report.structure_report],
    ["Repetition Report", report.repetition || report.repetition_report],
    ["Market Report", report.market || report.market_report],
    ["Line Report", report.line || report.line_report],
  ];

  const rendered = sections
    .map(([label, value]) => {
      const text = asText(value);
      if (!text) return "";
      return `# ${label}\n\n${text}`;
    })
    .filter(Boolean)
    .join("\n\n---\n\n");

  if (rendered) {
    return rendered;
  }

  return "";
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
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
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
      <div className="mb-8 mt-2 rounded-2xl border border-amber-500/20 bg-amber-400/10 p-5">
        <h2 className="text-2xl font-black tracking-tight text-amber-200">
          {block.text}
        </h2>
      </div>
    );
  }

  if (block.type === "h2") {
    return (
      <h3 className="mb-4 mt-10 border-b border-zinc-800 pb-3 text-xl font-black tracking-tight text-zinc-100">
        {block.text}
      </h3>
    );
  }

  if (block.type === "h3") {
    return (
      <h4 className="mb-3 mt-7 text-base font-bold uppercase tracking-[0.18em] text-amber-300">
        {block.text}
      </h4>
    );
  }

  if (block.type === "quote") {
    return (
      <blockquote className="my-5 border-l-4 border-amber-400 bg-zinc-900/70 px-5 py-4 text-lg italic leading-8 text-zinc-100">
        {block.text}
      </blockquote>
    );
  }

  if (block.type === "bullet") {
    return (
      <div className="mb-3 flex gap-3 rounded-xl bg-zinc-900/50 px-4 py-3 text-zinc-200">
        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
        <p className="leading-7">{block.text}</p>
      </div>
    );
  }

  if (block.type === "divider") {
    return <hr className="my-8 border-zinc-800" />;
  }

  return (
    <p className="mb-5 text-base leading-8 text-zinc-200 md:text-lg md:leading-9">
      {block.text}
    </p>
  );
}

export default function SavedReportPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  const [report, setReport] = useState<SavedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

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
          throw new Error("Log in to view this saved report.");
        }

        const { data, error: reportError } = await supabase
          .from("reports")
          .select("*")
          .eq("id", id)
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

  const reportText = useMemo(() => {
    if (!report) return "";
    return renderSections(report);
  }, [report]);

  const blocks = useMemo(() => parseReportText(reportText), [reportText]);

  const label =
    report?.report_type === "sphinx"
      ? "SPHINX SAVED REPORT"
      : "EDITORIAL COUNCIL REPORT";

  async function copyFullReport() {
    if (!reportText) return;

    await navigator.clipboard.writeText(reportText);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <main className="min-h-screen bg-black px-6 py-12 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Link
            href="/dashboard"
            className="text-xs uppercase tracking-[0.28em] text-zinc-500 hover:text-amber-300"
          >
            Back to Dashboard
          </Link>

          <div className="flex gap-3">
            <Link
              href="/sphinx"
              className="rounded-full border border-amber-400/40 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-amber-300 hover:bg-amber-400 hover:text-black"
            >
              Open Sphinx
            </Link>

            <button
              onClick={copyFullReport}
              disabled={!reportText}
              className="rounded-full border border-zinc-700 px-5 py-3 text-xs font-black uppercase tracking-[0.2em] text-zinc-300 hover:border-zinc-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {copied ? "Copied" : "Copy Report"}
            </button>
          </div>
        </div>

        <section className="mb-10 rounded-3xl border border-zinc-800 bg-zinc-950/70 p-8 shadow-2xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.35em] text-amber-400">
            {label}
          </p>

          <h1 className="max-w-5xl font-serif text-4xl font-black tracking-tight text-zinc-100 md:text-6xl">
            {report?.title || "Saved Report"}
          </h1>

          {report?.created_at && (
            <p className="mt-6 font-mono text-sm text-zinc-500">
              {formatDate(report.created_at)}
            </p>
          )}
        </section>

        {loading && (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8 text-zinc-400">
            Loading saved report...
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-900 bg-red-950/40 p-8 text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && reportText && (
          <article className="rounded-3xl border border-zinc-800 bg-zinc-950 p-7 shadow-2xl md:p-10">
            <div className="mx-auto max-w-4xl">
              {blocks.map((block, index) => (
                <ReportBlock key={`${block.type}-${index}`} block={block} />
              ))}
            </div>
          </article>
        )}

        {!loading && !error && !reportText && (
          <div className="rounded-3xl border border-zinc-800 bg-zinc-950 p-8 text-zinc-400">
            This saved report opened, but no report content was found.
          </div>
        )}
      </div>
    </main>
  );
}
