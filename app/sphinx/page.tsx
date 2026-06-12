"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";

const modes = [
  { value: "GENERAL", label: "Not sure / general cleanup" },
  { value: "APPLICATION", label: "Application or grant answer" },
  { value: "AUTHOR", label: "Book or author voice" },
  { value: "MARKETING", label: "Ad, flyer, or marketing text" },
  { value: "EMAIL", label: "Email" },
  { value: "SOCIAL", label: "Social post" },
];

const SPHINX_MAX_CHARS = 10000;
const SPHINX_STATUS_MESSAGES = [
  "Clean Words is sniffing for robot perfume...",
  "Checking for fake polish...",
  "Looking for corporate filler...",
  "Testing whether the voice still has a pulse...",
  "Separating human grit from machine gloss...",
  "Preparing the cleaner version...",
];

const strictnessOptions = [
  { value: "STANDARD", label: "Gentle cleanup" },
  { value: "BRUTAL", label: "Strong cleanup" },
  { value: "MURDER MODE", label: "Very strong cleanup" },
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
  const canRunSphinx = text.trim().length >= 20 && !tooLong && !loading && !checkingLogin && isLoggedIn;

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
      setSaveMessage("Clean Words finished. Auto-saving to your dashboard...");
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
          ? `${data.error || "Could not save Clean Words report."} Details: ${data.details}`
          : data.error || "Could not save Clean Words report.";

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
      const supabase = getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setIsLoggedIn(false);
        throw new Error("You must be logged in to use Clean Words. Click Log In above, then come back.");
      }

      setIsLoggedIn(true);

      const response = await fetch("/api/sphinx", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ text, mode, strictness }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Clean Words failed.");
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
    if (!report || savedId) return;

    await saveSphinxReportWithValues(report, strongerVersion, {
      automatic: false,
    });
  }

  function safeSphinxDownloadFileName(value: string) {
    const cleaned = (value || "clean-words")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);

    return cleaned || "clean-words";
  }

  function downloadSphinxTextFile(label: string, filename: string, value: string) {
    if (!value) {
      setError(`Nothing to download yet for ${label}.`);
      return;
    }

    const blob = new Blob([value], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  function downloadStrongerText() {
    const baseName = safeSphinxDownloadFileName(title || uploadedFileName || "clean-words-stronger");
    downloadSphinxTextFile("the stronger version", `${baseName}-stronger.txt`, strongerVersion);
  }

  function downloadReportText() {
    const baseName = safeSphinxDownloadFileName(title || uploadedFileName || "clean-words-notes");
    downloadSphinxTextFile("the notes", `${baseName}-notes.txt`, report);
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
    setTitle("Clean Words Sample Text");
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
    <main className="sphinx-shell min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <style>{`
        /* Sphinx beta readability pass */
        .sphinx-shell {
          font-size: 17px;
        }

        .sphinx-shell p,
        .sphinx-shell li,
        .sphinx-shell textarea,
        .sphinx-shell input,
        .sphinx-shell select {
          font-size: 17px !important;
          line-height: 1.7 !important;
        }

        .sphinx-shell textarea {
          min-height: 460px;
        }

        .sphinx-shell button,
        .sphinx-shell a,
        .sphinx-shell span {
          font-size: 15px !important;
        }

        .sphinx-shell button,
        .sphinx-shell a {
          min-height: 52px;
        }

        .sphinx-shell .sphinx-rendered-report p,
        .sphinx-shell .sphinx-rendered-report li {
          font-size: 17px !important;
          line-height: 1.75 !important;
          color: #eef4ff !important;
        }

        .sphinx-shell .sphinx-rendered-report h1 {
          font-size: 34px !important;
          line-height: 1.15 !important;
        }

        .sphinx-shell .sphinx-rendered-report h2 {
          font-size: 25px !important;
          line-height: 1.25 !important;
        }

        .sphinx-shell .sphinx-rendered-report h3 {
          font-size: 17px !important;
          line-height: 1.4 !important;
        }

        .sphinx-shell .text-zinc-400,
        .sphinx-shell .text-zinc-500,
        .sphinx-shell .text-zinc-600 {
          color: #cbd5e1 !important;
        }

        .sphinx-shell .text-xs {
          font-size: 13px !important;
          line-height: 1.45 !important;
        }

        .sphinx-shell .text-sm {
          font-size: 16px !important;
          line-height: 1.6 !important;
        }
      
          /* =========================================================
             CLEAN WORDS 80S / HUMANIZER OVERRIDES
             User-facing Sphinx page becomes Clean Words.
             ========================================================= */

          .sphinx-shell {
            background:
              radial-gradient(circle at 12% 0%, rgba(181, 90, 28, 0.25), transparent 32rem),
              radial-gradient(circle at 88% 8%, rgba(91, 117, 55, 0.16), transparent 28rem),
              linear-gradient(135deg, #28180d 0%, #11100c 48%, #2b1a0f 100%) !important;
            color: #f8ecd2 !important;
          }

          .sphinx-shell::before {
            content: "";
            position: fixed;
            inset: 0;
            pointer-events: none;
            background:
              repeating-linear-gradient(
                90deg,
                rgba(255, 230, 174, 0.025) 0,
                rgba(255, 230, 174, 0.025) 1px,
                transparent 1px,
                transparent 5px
              ),
              radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.34) 76%);
            opacity: 0.88;
          }

          .sphinx-shell > div {
            position: relative;
            z-index: 1;
          }

          .sphinx-shell nav,
          .sphinx-shell section,
          .sphinx-shell [class*="bg-zinc-900"],
          .sphinx-shell [class*="bg-zinc-950"] {
            background:
              linear-gradient(180deg, #332115 0%, #18130e 100%) !important;
            border-color: rgba(222, 176, 96, 0.42) !important;
            box-shadow:
              0 24px 70px rgba(0, 0, 0, 0.42),
              inset 0 1px 0 rgba(255, 238, 190, 0.08) !important;
          }

          .sphinx-shell section.grid > div,
          .sphinx-shell .simple-sphinx-guide {
            background:
              linear-gradient(180deg, #f8e7c1 0%, #d7ad68 100%) !important;
            color: #211408 !important;
            border-color: rgba(83, 52, 26, 0.58) !important;
            border-radius: 10px !important;
            box-shadow:
              0 22px 70px rgba(0, 0, 0, 0.36),
              inset 0 1px 0 rgba(255, 255, 255, 0.45) !important;
          }

          .sphinx-shell h1,
          .sphinx-shell h2,
          .sphinx-shell h3 {
            font-family: Georgia, "Times New Roman", serif !important;
            text-shadow: none !important;
          }

          .sphinx-shell h1 {
            color: #fff1cf !important;
            letter-spacing: -0.055em !important;
          }

          .sphinx-shell section.grid h2,
          .sphinx-shell .simple-sphinx-guide h2 {
            color: #1d1208 !important;
          }

          .sphinx-shell p,
          .sphinx-shell li,
          .sphinx-shell label,
          .sphinx-shell span {
            text-shadow: none !important;
          }

          .sphinx-shell [class*="text-zinc-300"],
          .sphinx-shell [class*="text-zinc-400"],
          .sphinx-shell [class*="text-zinc-500"],
          .sphinx-shell [class*="text-zinc-600"] {
            color: #f5dfb4 !important;
          }

          .sphinx-shell section.grid [class*="text-zinc-"],
          .sphinx-shell .simple-sphinx-guide [class*="text-zinc-"] {
            color: #2b1a0c !important;
          }

          .sphinx-shell [class*="text-amber"] {
            color: #d99a2b !important;
          }

          .sphinx-shell textarea {
            background:
              repeating-linear-gradient(
                180deg,
                #fffaf0 0,
                #fffaf0 30px,
                rgba(74, 111, 128, 0.34) 31px,
                #fffaf0 32px
              ) !important;
            color: #11110d !important;
            border-color: rgba(83, 52, 26, 0.62) !important;
            border-radius: 8px !important;
            font-family: Georgia, "Times New Roman", serif !important;
            box-shadow:
              inset 0 2px 14px rgba(83, 52, 26, 0.14),
              0 10px 26px rgba(83, 52, 26, 0.14) !important;
          }

          .sphinx-shell textarea::placeholder {
            color: rgba(31, 28, 20, 0.42) !important;
          }

          .sphinx-shell input,
          .sphinx-shell select {
            background: #fff8e7 !important;
            color: #11110d !important;
            border-color: rgba(83, 52, 26, 0.52) !important;
            border-radius: 8px !important;
          }

          .sphinx-shell button,
          .sphinx-shell a[class*="rounded"] {
            background:
              linear-gradient(180deg, #d88a1f, #8c4e11) !important;
            color: #fff8e7 !important;
            border-color: rgba(255, 220, 145, 0.68) !important;
            border-radius: 8px !important;
            box-shadow:
              inset 0 1px 0 rgba(255, 255, 255, 0.18),
              0 12px 28px rgba(0, 0, 0, 0.28) !important;
          }

          .sphinx-shell label[for],
          .sphinx-shell label.inline-flex {
            background:
              linear-gradient(180deg, #2f3f2a 0%, #1d2a1a 100%) !important;
            color: #fff3d3 !important;
            border-color: rgba(210, 168, 103, 0.45) !important;
          }

          .sphinx-shell .simple-sphinx-steps > div {
            background:
              linear-gradient(180deg, #2f3f2a 0%, #1d2a1a 100%) !important;
            color: #fff3d3 !important;
            border-color: rgba(210, 168, 103, 0.45) !important;
            border-radius: 10px !important;
          }

          .sphinx-shell .simple-sphinx-steps strong,
          .sphinx-shell .simple-sphinx-steps p {
            color: #fff3d3 !important;
          }

          .sphinx-shell .sphinx-rendered-report {
            background: #fff8e7 !important;
            color: #1d1208 !important;
            border-radius: 10px !important;
          }

          .sphinx-shell .sphinx-rendered-report h1,
          .sphinx-shell .sphinx-rendered-report h2,
          .sphinx-shell .sphinx-rendered-report h3,
          .sphinx-shell .sphinx-rendered-report p,
          .sphinx-shell .sphinx-rendered-report li,
          .sphinx-shell .sphinx-rendered-report strong,
          .sphinx-shell .sphinx-rendered-report em {
            color: #1d1208 !important;
          }


          /* =========================================================
             CLEAN WORDS HARD READABILITY PATCH
             Stop dark input/report boxes from eating the text.
             ========================================================= */

          .sphinx-shell input[class*="bg-zinc"],
          .sphinx-shell select[class*="bg-zinc"],
          .sphinx-shell textarea[class*="bg-zinc"],
          .sphinx-shell input,
          .sphinx-shell select,
          .sphinx-shell textarea {
            background: #fff8e7 !important;
            color: #11110d !important;
            border-color: rgba(83, 52, 26, 0.58) !important;
            box-shadow: inset 0 2px 12px rgba(83, 52, 26, 0.12) !important;
          }

          .sphinx-shell textarea {
            background:
              repeating-linear-gradient(
                180deg,
                #fffaf0 0,
                #fffaf0 30px,
                rgba(74, 111, 128, 0.34) 31px,
                #fffaf0 32px
              ) !important;
          }

          .sphinx-shell input::placeholder,
          .sphinx-shell textarea::placeholder {
            color: rgba(31, 28, 20, 0.48) !important;
            opacity: 1 !important;
          }

          .sphinx-shell .min-h-\[540px\],
          .sphinx-shell .min-h-\[500px\],
          .sphinx-shell .sphinx-rendered-report {
            background: #fff8e7 !important;
            color: #11110d !important;
            border-color: rgba(83, 52, 26, 0.58) !important;
          }

          .sphinx-shell .min-h-\[540px\] *,
          .sphinx-shell .min-h-\[500px\] *,
          .sphinx-shell .sphinx-rendered-report * {
            color: #11110d !important;
          }

          .sphinx-shell label.inline-flex,
          .sphinx-shell [class*="border-dashed"] {
            background:
              linear-gradient(180deg, #2f3f2a 0%, #1d2a1a 100%) !important;
            color: #fff3d3 !important;
            border-color: rgba(210, 168, 103, 0.45) !important;
          }

          .sphinx-shell label.inline-flex *,
          .sphinx-shell [class*="border-dashed"] * {
            color: #fff3d3 !important;
          }


          /* =========================================================
             CLEAN WORDS BLACK BOX FIX V2
             Use attribute selectors so Tailwind bracket classes match.
             ========================================================= */

          .sphinx-shell div[class*="border-dashed"],
          .sphinx-shell label[class*="border-dashed"] {
            background:
              linear-gradient(180deg, #f8e7c1 0%, #d7ad68 100%) !important;
            color: #211408 !important;
            border-color: rgba(83, 52, 26, 0.58) !important;
          }

          .sphinx-shell div[class*="border-dashed"] *,
          .sphinx-shell label[class*="border-dashed"] * {
            color: #211408 !important;
          }

          .sphinx-shell label.inline-flex,
          .sphinx-shell label.inline-flex * {
            background:
              linear-gradient(180deg, #d88a1f, #8c4e11) !important;
            color: #fff8e7 !important;
            border-color: rgba(255, 220, 145, 0.68) !important;
          }

          .sphinx-shell div[class*="min-h-[540px]"],
          .sphinx-shell div[class*="min-h-[500px]"] {
            background: #fff8e7 !important;
            color: #11110d !important;
            border-color: rgba(83, 52, 26, 0.58) !important;
          }

          .sphinx-shell div[class*="min-h-[540px]"] *,
          .sphinx-shell div[class*="min-h-[500px]"] * {
            color: #11110d !important;
          }

          .sphinx-shell div[class*="min-h-[540px]"] .animate-spin,
          .sphinx-shell div[class*="min-h-[500px]"] .animate-spin {
            border-color: rgba(83, 52, 26, 0.24) !important;
            border-top-color: #d88a1f !important;
          }

          .sphinx-shell button:disabled,
          .sphinx-shell button:disabled *,
          .sphinx-shell a[aria-disabled="true"],
          .sphinx-shell a[aria-disabled="true"] * {
            opacity: 0.72 !important;
          }


          /* =========================================================
             CLEAN WORDS FINAL READABILITY HAMMER V3
             Any old black result/upload box becomes readable.
             ========================================================= */

          .sphinx-shell div[class*="bg-zinc"],
          .sphinx-shell div[class*="bg-slate"],
          .sphinx-shell div[class*="bg-gray"],
          .sphinx-shell div[class*="border-dashed"],
          .sphinx-shell div[class*="min-h-"] {
            background: #fff8e7 !important;
            color: #11110d !important;
            border-color: rgba(83, 52, 26, 0.58) !important;
          }

          .sphinx-shell div[class*="bg-zinc"] *,
          .sphinx-shell div[class*="bg-slate"] *,
          .sphinx-shell div[class*="bg-gray"] *,
          .sphinx-shell div[class*="border-dashed"] *,
          .sphinx-shell div[class*="min-h-"] * {
            color: #11110d !important;
          }

          .sphinx-shell label.inline-flex,
          .sphinx-shell label.inline-flex * {
            background:
              linear-gradient(180deg, #d88a1f, #8c4e11) !important;
            color: #fff8e7 !important;
            border-color: rgba(255, 220, 145, 0.68) !important;
          }

          .sphinx-shell .animate-spin {
            border-color: rgba(83, 52, 26, 0.24) !important;
            border-top-color: #d88a1f !important;
          }


          /* =========================================================
             CLEAN WORDS PAGE-LEVEL READABILITY FINAL
             Page-level fix beats the inline old dark boxes.
             ========================================================= */

          .sphinx-shell section.mb-8 {
            background:
              linear-gradient(180deg, #332115 0%, #18130e 100%) !important;
            color: #f8ecd2 !important;
            border-color: rgba(222, 176, 96, 0.42) !important;
          }

          .sphinx-shell section.mb-8 h1 {
            color: #fff1cf !important;
            font-family: Georgia, "Times New Roman", serif !important;
            text-shadow: none !important;
          }

          .sphinx-shell section.mb-8 p {
            color: #f5dfb4 !important;
          }

          .sphinx-shell div[class*="bg-zinc"],
          .sphinx-shell div[class*="bg-slate"],
          .sphinx-shell div[class*="bg-gray"],
          .sphinx-shell div[class*="border-dashed"],
          .sphinx-shell div[class*="min-h"],
          .sphinx-shell div[class*="rounded-2xl"][class*="border"] {
            background: #fff8e7 !important;
            background-image: none !important;
            color: #11110d !important;
            border-color: rgba(83, 52, 26, 0.58) !important;
          }

          .sphinx-shell div[class*="bg-zinc"] *,
          .sphinx-shell div[class*="bg-slate"] *,
          .sphinx-shell div[class*="bg-gray"] *,
          .sphinx-shell div[class*="border-dashed"] *,
          .sphinx-shell div[class*="min-h"] *,
          .sphinx-shell div[class*="rounded-2xl"][class*="border"] * {
            color: #11110d !important;
          }

          .sphinx-shell textarea,
          .sphinx-shell input,
          .sphinx-shell select {
            background: #fff8e7 !important;
            color: #11110d !important;
            border-color: rgba(83, 52, 26, 0.58) !important;
          }

          .sphinx-shell textarea {
            background:
              repeating-linear-gradient(
                180deg,
                #fffaf0 0,
                #fffaf0 30px,
                rgba(74, 111, 128, 0.34) 31px,
                #fffaf0 32px
              ) !important;
          }

          .sphinx-shell button,
          .sphinx-shell a[class*="rounded"],
          .sphinx-shell label.inline-flex {
            background:
              linear-gradient(180deg, #d88a1f, #8c4e11) !important;
            background-image:
              linear-gradient(180deg, #d88a1f, #8c4e11) !important;
            color: #fff8e7 !important;
            border-color: rgba(255, 220, 145, 0.68) !important;
          }

          .sphinx-shell button *,
          .sphinx-shell a[class*="rounded"] *,
          .sphinx-shell label.inline-flex * {
            color: #fff8e7 !important;
          }

`}</style>
      <div className="mx-auto max-w-6xl">
        <nav className="mb-6 flex flex-col gap-3 rounded-3xl border border-zinc-800 bg-zinc-900/80 p-4 shadow-xl md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-amber-400">
              Clean Words
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              Paste text, clean it up, and save the result.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/submit"
              className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-200 hover:border-amber-400 hover:text-amber-300"
            >
              Check Writing
            </Link>

            <Link
              href="/dashboard"
              className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-200 hover:border-amber-400 hover:text-amber-300"
            >
              Reports
            </Link>

            {!checkingLogin && !isLoggedIn && (
              <Link
                href="/login"
                className="rounded-xl bg-amber-400 px-4 py-3 text-sm font-black text-zinc-950 hover:bg-amber-300"
              >
                Sign In to Save
              </Link>
            )}

            {!checkingLogin && isLoggedIn && (
              <span className="rounded-xl border border-green-800 bg-green-950/40 px-4 py-3 text-sm font-bold text-green-200">
                Signed In
              </span>
            )}
          </div>
        </nav>

        <section className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-2xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">
            Writing Tool
          </p>

          <h1 className="mb-3 text-4xl font-black tracking-tight text-white md:text-5xl">
            Make my words sound human
          </h1>

          <p className="max-w-3xl text-lg leading-8 text-zinc-300">
            Paste writing that sounds too polished,
            too generic, too corporate, or too much like a robot wearing a
            conference badge. We will diagnose it and rewrite it like a
            human being.
          </p>
        </section>

        <section className="simple-sphinx-guide">
  <h2>Use this page in 3 steps</h2>

  <div className="simple-sphinx-steps">
    <div>
      <strong>1. Paste words</strong>
      <span>Use the big box or upload a file.</span>
    </div>

    <div>
      <strong>2. Pick what it is</strong>
      <span>Email, grant answer, post, bio, or general cleanup.</span>
    </div>

    <div>
      <strong>3. Press Clean My Words</strong>
      <span>Copy the cleaned version when it finishes.</span>
    </div>
  </div>
</section>

<section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white">
                1. Paste or upload text
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Best for blurbs, grant answers, emails, posts, bios, and
                application responses. Beta limit: 10,000 characters.
              </p>
            </div>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Optional name for this cleanup"
              className="mb-4 w-full rounded-2xl border border-zinc-700 bg-zinc-950 p-4 text-base text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-amber-400"
            />

            <div className="mb-4 rounded-2xl border border-dashed border-zinc-700 bg-zinc-950/70 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-bold text-zinc-200">
                    Or upload a file
                  </p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    You can upload .txt, .md, or .docx files.
                  </p>
                </div>

                <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-200 hover:border-amber-400 hover:text-amber-300">
                  Pick File
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
                {uploadedFileName ? `Loaded: ${uploadedFileName}` : "Optional. You can paste instead."}
              </p>
            </div>
            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  What kind of writing is this?
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
                  How much should we clean it?
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
              placeholder="Paste the words you want cleaned here."
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
                  Try Example
                </button>

                <button
                  onClick={clearAll}
                  type="button"
                  className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-300 hover:border-zinc-500 hover:text-white"
                >
                  Clear Page
                </button>

                <button
                  onClick={runSphinx}
                  disabled={!canRunSphinx}
                  type="button"
                  className="rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-zinc-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Cleaning Words..."
                    : !isLoggedIn
                      ? "Sign In to Clean Words"
                      : "Clean My Words"}
                </button>
              </div>
            </div>

            {tooLong && (
              <div className="mt-4 rounded-2xl border border-red-900 bg-red-950/50 p-4 text-sm text-red-200">
                Clean Words beta limit is 10,000 characters. Use it for blurbs, posts, emails, application answers, and short passages, not whole manuscripts. Don&apos;t feed the little bastard a whale.
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
                      Open Saved Report
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
                  Cleaned Results
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Read the notes, then copy the cleaner version you like.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={saveSphinxReport}
                  disabled={!report || saving || Boolean(savedId)}
                  type="button"
                  className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-300 hover:border-green-400 hover:text-green-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {!isLoggedIn
                    ? "Log in to Save"
                    : saving
                      ? "Saving..."
                      : savedId
                        ? "Already Saved"
                        : "Save Results"}
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
                    type="button"
                    onClick={downloadStrongerText}
                    disabled={!strongerVersion}
                  >
                    Download Stronger
                  </button>

                <button
                  onClick={copyReport}
                  disabled={!report}
                  type="button"
                  className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-300 hover:border-amber-400 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {copied === "report" ? "Copied Report" : "Copy Notes"}
                </button>
                  <button
                    type="button"
                    onClick={downloadReportText}
                    disabled={!report}
                  >
                    Download Notes
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
                      Paste something on the left and let Clean Words sniff out the
                      robot perfume.
                    </p>
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex h-full min-h-[500px] items-center justify-center text-center text-zinc-400">
                  <div>
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-amber-400" />
                    <p className="text-lg font-semibold">Clean Words is reading.</p>
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
