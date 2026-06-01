"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";

const modes = [
  { value: "GENERAL", label: "General Human Cleanup" },
  { value: "APPLICATION", label: "Application / Grant Answer" },
  { value: "AUTHOR", label: "Author Voice" },
  { value: "MARKETING", label: "Marketing Copy" },
  { value: "EMAIL", label: "Email" },
  { value: "SOCIAL", label: "Social Post" },
];

const SPHINX_MAX_CHARS = 10000;
const SPHINX_STATUS_MESSAGES = [
  "Sphinx is sniffing for robot perfume...",
  "Checking for fake polish...",
  "Looking for corporate filler...",
  "Testing whether the voice still has a pulse...",
  "Separating human grit from machine gloss...",
  "Preparing the cleaner version...",
];

const strictnessOptions = [
  { value: "STANDARD", label: "Standard" },
  { value: "BRUTAL", label: "Brutal" },
  { value: "MURDER MODE", label: "Murder Mode" },
];
const SPHINX_SAMPLE_TEXT = `At our organization, we are deeply passionate about leveraging innovative solutions to empower individuals and communities in meaningful and impactful ways. Our mission is rooted in a commitment to excellence, authenticity, and transformative engagement, ensuring that every stakeholder feels seen, heard, and valued throughout the process.

By embracing a forward-thinking approach, we seek to create dynamic opportunities that foster growth, collaboration, and long-term success. We believe that through intentional action, strategic alignment, and a culture of continuous improvement, we can unlock potential, inspire change, and build a brighter future for everyone involved.

This initiative is more than a project. It is a journey toward possibility, purpose, and progress. Together, we can move beyond challenges, celebrate shared values, and create outcomes that resonate with meaning, compassion, and sustainable impact.`;

function extractDocxParagraphText(paragraph: Element) {
  const pieces: string[] = [];

  function walk(node: Node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node as Element;
    const name = element.nodeName;

    if (name === "w:t") {
      pieces.push(element.textContent || "");
      return;
    }

    if (name === "w:tab") {
      pieces.push("\t");
      return;
    }

    if (name === "w:br" || name === "w:cr") {
      pieces.push("\n");
      return;
    }

    Array.from(element.childNodes).forEach(walk);
  }

  Array.from(paragraph.childNodes).forEach(walk);

  return pieces.join("").replace(/\u00a0/g, " ").trimEnd();
}

async function readDocxFile(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  const documentFile = zip.file("word/document.xml");

  if (!documentFile) {
    throw new Error("Could not find readable document text inside the Word file.");
  }

  const xmlText = await documentFile.async("string");
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "application/xml");

  if (xml.getElementsByTagName("parsererror").length > 0) {
    throw new Error("Could not parse the Word document.");
  }

  const paragraphs = Array.from(xml.getElementsByTagName("w:p"));

  const extractedText = paragraphs
    .map(extractDocxParagraphText)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n\n");

  if (!extractedText.trim()) {
    throw new Error("The Word document did not contain readable text.");
  }

  return extractedText;
}

async function readUploadedFile(file: File) {
  const lowerName = file.name.toLowerCase();

  if (lowerName.endsWith(".docx")) {
    return readDocxFile(file);
  }

  return file.text();
}

function titleFromFileName(fileName: string) {
  return fileName.replace(/\.(txt|md|docx)$/i, "");
}
function extractSection(
  fullText: string,
  startHeading: string,
  followingHeadings: string[]
) {
  if (!fullText) return "";

  const startIndex = fullText.indexOf(startHeading);

  if (startIndex === -1) return "";

  const contentStart = startIndex + startHeading.length;
  const remaining = fullText.slice(contentStart);

  let endIndex = remaining.length;

  for (const heading of followingHeadings) {
    const foundIndex = remaining.indexOf(heading);

    if (foundIndex !== -1 && foundIndex < endIndex) {
      endIndex = foundIndex;
    }
  }

  return remaining.slice(0, endIndex).trim();
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderSphinxInline(value: string) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong class=\"font-bold text-white\">$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em class=\"italic text-zinc-200\">$1</em>");
}

function renderSphinxMarkdown(text: string): string {
  if (!text) return "";

  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const html: string[] = [];
  let inList = false;

  function closeList() {
    if (inList) {
      html.push("</ul>");
      inList = false;
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      closeList();
      html.push("<div class=\"h-3\"></div>");
      continue;
    }

    if (line.startsWith("# ")) {
      closeList();
      html.push(`<h1 class="mb-6 text-3xl font-black tracking-tight text-white">${renderSphinxInline(line.replace(/^#\s+/, ""))}</h1>`);
      continue;
    }

    if (line.startsWith("## ")) {
      closeList();
      html.push(`<h2 class="mb-4 mt-8 border-b border-zinc-800 pb-3 text-xl font-black tracking-tight text-amber-300">${renderSphinxInline(line.replace(/^##\s+/, ""))}</h2>`);
      continue;
    }

    if (line.startsWith("### ")) {
      closeList();
      html.push(`<h3 class="mb-3 mt-6 text-sm font-bold uppercase tracking-[0.18em] text-zinc-300">${renderSphinxInline(line.replace(/^###\s+/, ""))}</h3>`);
      continue;
    }

    if (/^---+$/.test(line)) {
      closeList();
      html.push("<hr class=\"my-6 border-zinc-800\" />");
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("• ")) {
      if (!inList) {
        html.push("<ul class=\"mb-5 space-y-3\">");
        inList = true;
      }

      html.push(`<li class="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 text-sm leading-7 text-zinc-100">${renderSphinxInline(line.replace(/^[-•]\s+/, ""))}</li>`);
      continue;
    }

    closeList();
    html.push(`<p class="mb-4 text-sm leading-7 text-zinc-100">${renderSphinxInline(line)}</p>`);
  }

  closeList();

  return html.join("\n");
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase browser settings. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export default function SphinxPage() {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [mode, setMode] = useState("GENERAL");
  const [strictness, setStrictness] = useState("BRUTAL");
  const [report, setReport] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState("");
  const [strongerVersion, setStrongerVersion] = useState("");
  const [savedId, setSavedId] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingLogin, setCheckingLogin] = useState(true);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [loadingMessage, setLoadingMessage] = useState("");
  const [loadingSeconds, setLoadingSeconds] = useState(0);

  const tooLong = text.trim().length > SPHINX_MAX_CHARS;
  const canRunSphinx = text.trim().length >= 20 && !tooLong && !loading;

  useEffect(() => {
    async function checkLogin() {
      try {
        const supabase = getSupabaseClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        setIsLoggedIn(Boolean(session?.access_token));
      } catch {
        setIsLoggedIn(false);
      } finally {
        setCheckingLogin(false);
      }
    }

    checkLogin();
  }, []);

  useEffect(() => {
    if (!loading) {
      setLoadingMessage("");
      setLoadingSeconds(0);
      return;
    }

    let index = 0;
    setLoadingMessage(SPHINX_STATUS_MESSAGES[0]);

    const timer = setInterval(() => {
      index = (index + 1) % SPHINX_STATUS_MESSAGES.length;
      setLoadingMessage(SPHINX_STATUS_MESSAGES[index]);
      setLoadingSeconds((seconds) => seconds + 1);
    }, 2500);

    return () => clearInterval(timer);
  }, [loading]);
  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setReport("");
    setCopied("");
    setStrongerVersion("");
    setSavedId("");
    setSaveMessage("");

    const lowerName = file.name.toLowerCase();

    const allowed =
      file.type === "text/plain" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      lowerName.endsWith(".txt") ||
      lowerName.endsWith(".md") ||
      lowerName.endsWith(".docx");

    if (!allowed) {
      setError("For now, upload a .txt, .md, or .docx file, or paste directly into the box. Old .doc files and PDFs are not supported yet.");
      event.target.value = "";
      return;
    }

    try {
      const nextText = await readUploadedFile(file);
      setText(nextText);
      setUploadedFileName(file.name);

      if (!title.trim()) {
        setTitle(titleFromFileName(file.name));
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not read that file. Paste the text into the box instead."
      );
    } finally {
      event.target.value = "";
    }
  }
  async function saveSphinxReportWithValues(
    reportToSave: string,
    strongerVersionToSave: string,
    options: { automatic?: boolean } = {}
  ) {
    if (!reportToSave) return false;

    setSaving(true);

    if (options.automatic) {
      setSaveMessage("Sphinx finished. Auto-saving to your dashboard...");
    } else {
      setError("");
      setSaveMessage("");
    }

    try {
      const supabase = getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setIsLoggedIn(false);

        if (options.automatic) {
          setSaveMessage("");
          setError(
            "Report generated, but it was not saved because you are not logged in. Copy the report or log in before leaving this page."
          );
          return false;
        }

        window.location.href = "/login";
        return false;
      }

      setIsLoggedIn(true);

      const response = await fetch("/api/sphinx/save", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title,
          text,
          report: reportToSave,
          strongerVersion: strongerVersionToSave,
          mode,
          strictness,
        }),
      });

      let data: { id?: string; error?: string; details?: string } = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        const saveErrorMessage = data.details
          ? `${data.error || "Could not save Sphinx report."} Details: ${data.details}`
          : data.error || "Could not save Sphinx report.";

        throw new Error(saveErrorMessage);
      }

      setSavedId(data.id || "");
      setSaveMessage(
        options.automatic
          ? "Report auto-saved to your dashboard."
          : "Saved to your reports."
      );

      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong while saving.";

      setSaveMessage("");

      if (options.automatic) {
        setError(
          `Report generated, but auto-save failed. Copy the report before leaving this page. Details: ${message}`
        );
      } else {
        setError(message);
      }

      return false;
    } finally {
      setSaving(false);
    }
  }

  async function runSphinx() {
    setLoading(true);
    setError("");
    setReport("");
    setCopied("");
    setStrongerVersion("");
    setSavedId("");
    setSaveMessage("");

    try {
      const response = await fetch("/api/sphinx", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ text, mode, strictness }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Sphinx failed.");
      }

      const nextReport = data.report || "";
      const nextStrongerVersion = extractSection(
        nextReport,
        "## 6. Stronger Version",
        ["## 7. What Changed", "## 8. Final Sphinx Verdict"]
      );

      setReport(nextReport);
      setStrongerVersion(nextStrongerVersion);

      if (nextReport) {
        await saveSphinxReportWithValues(nextReport, nextStrongerVersion, {
          automatic: true,
        });
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function saveSphinxReport() {
    if (!report) return;

    await saveSphinxReportWithValues(report, strongerVersion, {
      automatic: false,
    });
  }
  async function copyReport() {
    if (!report) return;

    await navigator.clipboard.writeText(report);
    setCopied("report");

    setTimeout(() => {
      setCopied("");
    }, 2000);
  }

  async function copyStrongerVersion() {
    if (!strongerVersion) return;

    await navigator.clipboard.writeText(strongerVersion);
    setCopied("stronger");

    setTimeout(() => {
      setCopied("");
    }, 2000);
  }

  function clearAll() {
    setTitle("");
    setText("");
    setReport("");
    setError("");
    setCopied("");
    setStrongerVersion("");
    setSavedId("");
    setSaveMessage("");
    setUploadedFileName("");
  }

  function loadSampleText() {
    setTitle("SPHINX Sample Text");
    setText(SPHINX_SAMPLE_TEXT);
    setMode("GENERAL");
    setStrictness("BRUTAL");
    setReport("");
    setError("");
    setCopied("");
    setStrongerVersion("");
    setSavedId("");
    setSaveMessage("");
    setUploadedFileName("");
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <nav className="mb-6 flex flex-col gap-3 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-xl md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400">
              SPHINX Navigation
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              Run Sphinx. If you are logged in, completed reports auto-save to your dashboard.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/submit"
              className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-200 hover:border-amber-400 hover:text-amber-300"
            >
              Main 5 CORE
            </Link>

            <Link
              href="/dashboard"
              className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-200 hover:border-amber-400 hover:text-amber-300"
            >
              Dashboard
            </Link>

            {!checkingLogin && !isLoggedIn && (
              <Link
                href="/login"
                className="rounded-xl bg-amber-400 px-4 py-3 text-sm font-black text-zinc-950 hover:bg-amber-300"
              >
                Log In to Save
              </Link>
            )}

            {!checkingLogin && isLoggedIn && (
              <span className="rounded-xl border border-green-800 bg-green-950/40 px-4 py-3 text-sm font-bold text-green-200">
                Logged In
              </span>
            )}
          </div>
        </nav>

        <section className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-2xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">
            5 CORE Add-On
          </p>

          <h1 className="mb-3 text-4xl font-black tracking-tight text-white md:text-5xl">
            SPHINX
          </h1>

          <p className="max-w-3xl text-lg leading-8 text-zinc-300">
            The AI Stink Preventer. Paste writing that sounds too polished,
            too generic, too corporate, or too much like a robot wearing a
            conference badge. Sphinx will diagnose it and rewrite it like a
            human being.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white">
                Paste Your Text
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Best for blurbs, grant answers, emails, posts, bios, and
                application responses. Beta limit: 10,000 characters.
              </p>
            </div>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Optional title for saved report"
              className="mb-4 w-full rounded-2xl border border-zinc-700 bg-zinc-950 p-4 text-base text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-amber-400"
            />

            <div className="mb-4 rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/70 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-zinc-200">
                    Upload a document
                  </p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Supports .txt, .md, and modern Word .docx files. Old .doc files and PDFs are not supported yet.
                  </p>
                </div>

                <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-200 hover:border-amber-400 hover:text-amber-300">
                  Choose File
                  <input
                    type="file"
                    accept=".txt,.md,.docx,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileUpload}
                    disabled={loading}
                    className="hidden"
                  />
                </label>
              </div>

              <p className="mt-3 text-xs text-zinc-500">
                {uploadedFileName ? `Loaded: ${uploadedFileName}` : "Optional. Pasting directly still works."}
              </p>
            </div>
            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Mode
                </span>
                <select
                  value={mode}
                  onChange={(event) => setMode(event.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-amber-400"
                >
                  {modes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Strictness
                </span>
                <select
                  value={strictness}
                  onChange={(event) => setStrictness(event.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-amber-400"
                >
                  {strictnessOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Paste something that smells a little too AI in here..."
              className="min-h-[430px] w-full resize-y rounded-2xl border border-zinc-700 bg-zinc-950 p-5 text-base leading-7 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-amber-400"
            />

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-zinc-500">
                {text.length.toLocaleString()} / 10,000 characters
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={loadSampleText}
                  disabled={loading}
                  type="button"
                  className="rounded-xl border border-amber-800 bg-amber-950/30 px-5 py-3 text-sm font-bold text-amber-200 hover:border-amber-400 hover:text-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Try Sample Text
                </button>

                <button
                  onClick={clearAll}
                  type="button"
                  className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-300 hover:border-zinc-500 hover:text-white"
                >
                  Clear
                </button>

                <button
                  onClick={runSphinx}
                  disabled={!canRunSphinx}
                  type="button"
                  className="rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-zinc-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Running Sphinx..." : "Run Sphinx"}
                </button>
              </div>
            </div>

            {tooLong && (
              <div className="mt-4 rounded-2xl border border-red-900 bg-red-950/50 p-4 text-sm text-red-200">
                Sphinx beta limit is 10,000 characters. Use it for blurbs, posts, emails, application answers, and short passages, not whole manuscripts. Don&apos;t feed the little bastard a whale.
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-2xl border border-red-900 bg-red-950/50 p-4 text-sm text-red-200">
                {error}
              </div>
            )}

            {saveMessage && (
              <div className="mt-4 rounded-2xl border border-green-900 bg-green-950/40 p-4 text-sm text-green-200">
                {saveMessage}
                {savedId && (
                  <>
                    {" "}
                    <a
                      href={`/reports/${savedId}`}
                      className="font-bold text-amber-300 underline"
                    >
                      Open saved report
                    </a>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Sphinx Report
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Diagnosis, rewrite, shorter version, and stronger version.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={saveSphinxReport}
                  disabled={!report || saving}
                  type="button"
                  className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-300 hover:border-green-400 hover:text-green-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {!isLoggedIn
                    ? "Log in to Save"
                    : saving
                      ? "Saving..."
                      : savedId
                        ? "Saved"
                        : "Save Report"}
                </button>

                <button
                  onClick={copyStrongerVersion}
                  disabled={!strongerVersion}
                  type="button"
                  className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-300 hover:border-amber-400 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {copied === "stronger" ? "Copied Stronger" : "Copy Stronger"}
                </button>

                <button
                  onClick={copyReport}
                  disabled={!report}
                  type="button"
                  className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-300 hover:border-amber-400 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {copied === "report" ? "Copied Report" : "Copy Report"}
                </button>
              </div>
            </div>

            <div className="min-h-[540px] rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              {!report && !loading && (
                <div className="flex h-full min-h-[500px] items-center justify-center text-center text-zinc-500">
                  <div>
                    <p className="text-lg font-semibold text-zinc-400">
                      No report yet.
                    </p>
                    <p className="mt-2 max-w-md text-sm leading-6">
                      Paste something on the left and let Sphinx sniff out the
                      robot perfume.
                    </p>
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex h-full min-h-[500px] items-center justify-center text-center text-zinc-400">
                  <div>
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-amber-400" />
                    <p className="text-lg font-semibold">Sphinx is reading.</p>
                    <p className="mt-2 text-sm text-zinc-500">
                      It is judging the stink.
                    </p>
                  </div>
                </div>
              )}

              {report && (
                <div
                  className="sphinx-rendered-report"
                  dangerouslySetInnerHTML={{ __html: renderSphinxMarkdown(report) }}
                />
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}













