"use client";

import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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
    tagline: "Resolves the council. Writes the official report.",
  },
];

const COUNCIL_MAX_CHARS = 25000;

const STATUS_MESSAGES = [
  "Reading your manuscript...",
  "Calling the council...",
  "Brad is protecting the voice...",
  "Greg is finding the drag...",
  "Von Clausen is checking structure...",
  "Juniper is reading as a reader...",
  "Final Editor is synthesizing...",
  "Preparing your reports...",
];
const COUNCIL_SAMPLE_MANUSCRIPT = `Mara stood at the edge of the old bridge and thought about everything she had ever lost. The river below moved like a long gray animal, carrying leaves, bottles, and pieces of the storm toward somewhere she could not see. She knew this place mattered. She knew it because her father had brought her here when she was small, back before sickness made him quiet and before everyone in the house learned how to whisper around closed doors.

She gripped the envelope in her coat pocket. Inside was the letter she had written three times and hated every version of. The first version was too angry. The second was too forgiving. The third was a coward dressed up as a daughter.

The wind pushed against her back.

For a moment, Mara imagined throwing the letter into the river and letting the water decide what kind of person she was. That would be easier. That would be cleaner. That would let her pretend she had made a choice without actually making one.

Behind her, a truck slowed on the road. Its headlights washed over the bridge railing, then moved on. Mara did not turn around. She was tired of turning around. She was tired of looking for someone who was not coming.

She pulled out the envelope, held it over the river, and waited for her hand to open.`;

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
      html.push(`<hr class="report-divider"/>`);
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
    throw new Error("Could not find document text inside the Word file.");
  }

  const xmlText = await documentFile.async("string");
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "application/xml");

  if (xml.getElementsByTagName("parsererror").length > 0) {
    throw new Error("Could not parse the Word document.");
  }

  const paragraphs = Array.from(xml.getElementsByTagName("w:p"));

  const text = paragraphs
    .map(extractDocxParagraphText)
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n\n");

  if (!text.trim()) {
    throw new Error("The Word document did not contain readable text.");
  }

  return text;
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
function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export default function SubmitPage() {
  const [manuscript, setManuscript] = useState("");
  const [title, setTitle] = useState("");
  const [writingType, setWritingType] = useState("Fiction");
  const [audience, setAudience] = useState("Readers");
  const [biggestConcern, setBiggestConcern] = useState("");
  const [preparationGoal, setPreparationGoal] = useState("Revision");
  const [feedbackTone, setFeedbackTone] = useState("Honest");

  const [reports, setReports] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("brad");
  const [statusMsg, setStatusMsg] = useState("");
  const [hasRun, setHasRun] = useState(false);
  const [error, setError] = useState("");
  const [submissionId, setSubmissionId] = useState("");
  const [fileName, setFileName] = useState("");
  const [runningSeconds, setRunningSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const words = countWords(manuscript);
  const tooLong = manuscript.trim().length > COUNCIL_MAX_CHARS;
  const readyToRun = manuscript.trim().length >= 50 && !tooLong && !loading;
  const activePersona = PERSONAS.find((p) => p.key === activeTab);
  const activeReport = reports[activeTab];

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
      }
    }

    checkAuth();
  }, []);

  useEffect(() => {
    if (!loading) {
      setRunningSeconds(0);
      return;
    }

    const timer = setInterval(() => {
      setRunningSeconds((seconds) => seconds + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [loading]);
  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setFileName(file.name);
    setError("");

    const lowerName = file.name.toLowerCase();

    const allowed =
      file.type === "text/plain" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      lowerName.endsWith(".txt") ||
      lowerName.endsWith(".md") ||
      lowerName.endsWith(".docx");

    if (!allowed) {
      setError("For now, upload a .txt, .md, or .docx file, or paste the manuscript directly into the box. Old .doc files and PDFs are not supported yet.");
      event.target.value = "";
      return;
    }

    try {
      const text = await readUploadedFile(file);
      setManuscript(text);

      if (!title.trim()) {
        setTitle(titleFromFileName(file.name));
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not read that file. Paste the manuscript into the box instead."
      );
    }
  }

  async function runCouncil() {
    if (!manuscript.trim()) return;

    const intake = {
      writingType,
      audience,
      biggestConcern: biggestConcern.trim(),
      preparationGoal,
      feedbackTone,
    };

    setLoading(true);
    setReports({});
    setHasRun(false);
    setActiveTab("brad");
    setError("");

    let idx = 0;
    setStatusMsg(STATUS_MESSAGES[0]);

    intervalRef.current = setInterval(() => {
      idx = Math.min(idx + 1, STATUS_MESSAGES.length - 1);
      setStatusMsg(STATUS_MESSAGES[idx]);
    }, 3500);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("You must be logged in to run the council.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          manuscriptText: manuscript,
          title: title.trim() || "Untitled",
          intake,
          writingType,
          audience,
          biggestConcern: biggestConcern.trim(),
          preparationGoal,
          feedbackTone,
        }),
      });

      const data = await response.json();

      if (data.reports) {
        setReports(data.reports);
        setHasRun(true);
        setActiveTab("brad");
        if (data.submissionId) setSubmissionId(data.submissionId);
      } else {
        setError(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setError("Connection failed before the council answered. Check your connection, wait a minute, and try again. If it keeps happening, send the admin what you were trying to run.");
    } finally {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setLoading(false);
      setStatusMsg("");
    }
  }

  function reset() {
    setManuscript("");
    setTitle("");
    setWritingType("Fiction");
    setAudience("Readers");
    setBiggestConcern("");
    setPreparationGoal("Revision");
    setFeedbackTone("Honest");
    setReports({});
    setHasRun(false);
    setActiveTab("brad");
    setError("");
    setSubmissionId("");
    setFileName("");
  }

  function loadSampleManuscript() {
    setManuscript(COUNCIL_SAMPLE_MANUSCRIPT);
    setTitle("The Council Sample Excerpt");
    setWritingType("Fiction");
    setAudience("Readers");
    setBiggestConcern("I want to know if the emotion is working or if the scene is overexplaining itself.");
    setPreparationGoal("Revision");
    setFeedbackTone("Honest");
    setReports({});
    setHasRun(false);
    setActiveTab("brad");
    setError("");
    setSubmissionId("");
    setFileName("Sample excerpt");
  }

  return (
    <main className="submit-shell">
      <style>{`
        /* Beta readability pass: larger text, clearer buttons, stronger contrast */
        .submit-shell {
          font-size: 17px;
        }

        .subtitle,
        .panel-note,
        .step-text,
        .meter-help,
        .tiny-note,
        .file-name,
        .status-subtext {
          font-size: 15px !important;
          line-height: 1.65 !important;
          color: #bdb4aa !important;
        }

        .field-label,
        .step-title,
        .meter-row,
        .status-text,
        .council-label,
        .persona-name-sm,
        .nav-pill,
        .back-link {
          font-size: 12px !important;
          letter-spacing: 0.11em !important;
        }

        .title-input,
        .select-input,
        .concern-input,
        .textarea {
          font-size: 17px !important;
          line-height: 1.75 !important;
        }

        .select-input {
          min-height: 54px !important;
        }

        .run-btn,
        .reset-btn,
        .dashboard-btn,
        .file-label,
        .back-link {
          min-height: 54px !important;
          font-size: 12px !important;
          padding: 15px 18px !important;
        }

        .panel-title {
          font-size: 34px !important;
        }

        .tool-note-strong,
        .error-msg,
        .saved-link,
        .slow-note {
          font-size: 14px !important;
          line-height: 1.65 !important;
        }


        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;700&family=IBM+Plex+Mono:wght@400;500;700&display=swap');

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #0e0d0b;
        }

        .submit-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(200, 147, 90, 0.13), transparent 33rem),
            radial-gradient(circle at bottom right, rgba(90, 124, 200, 0.1), transparent 30rem),
            #0e0d0b;
          color: #f0ece4;
          font-family: 'DM Sans', sans-serif;
        }

        .app-wrap {
          max-width: 1180px;
          margin: 0 auto;
          padding: 34px 24px 90px;
        }

        .top-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 26px;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          border: 1px solid #302a24;
          background: rgba(18, 16, 13, 0.8);
          color: #9a9186;
          text-decoration: none;
          border-radius: 14px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 12px 14px;
        }

        .back-link:hover {
          color: #c8935a;
          border-color: #c8935a;
        }

        .top-nav-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
          justify-content: flex-end;
        }

        .nav-pill {
          border: 1px solid #302a24;
          background: rgba(18, 16, 13, 0.8);
          color: #6f665f;
          border-radius: 14px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 12px 14px;
        }

        .masthead {
          border: 1px solid #26211c;
          background: rgba(18, 16, 13, 0.86);
          border-radius: 30px;
          padding: 34px;
          margin-bottom: 22px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.22);
        }

        .eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.2em;
          color: #c8935a;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(44px, 8vw, 82px);
          font-weight: 700;
          line-height: 0.94;
          color: #f0ece4;
          margin: 0;
        }

        .subtitle {
          font-size: 16px;
          font-weight: 300;
          color: #aaa096;
          margin-top: 16px;
          max-width: 760px;
          line-height: 1.65;
        }

        .workflow-grid {
          display: grid;
          grid-template-columns: minmax(0, 0.82fr) minmax(0, 1.18fr);
          gap: 22px;
          align-items: start;
        }

        .panel {
          border: 1px solid #26211c;
          background: rgba(18, 16, 13, 0.9);
          border-radius: 28px;
          padding: 24px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.18);
        }

        .panel + .panel {
          margin-top: 16px;
        }

        .panel-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 30px;
          font-weight: 700;
          line-height: 1;
          color: #f0ece4;
          margin-bottom: 8px;
        }

        .panel-note {
          color: #8f867b;
          font-size: 13px;
          line-height: 1.55;
          font-weight: 300;
          margin-bottom: 18px;
        }

        .step-row {
          display: flex;
          gap: 12px;
          margin-bottom: 18px;
        }

        .step-number {
          width: 34px;
          height: 34px;
          border-radius: 13px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #18140f;
          border: 1px solid #332a1c;
          color: #c8935a;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 700;
        }

        .step-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          color: #c8935a;
          text-transform: uppercase;
          margin-bottom: 5px;
        }

        .step-text {
          color: #8f867b;
          font-size: 13px;
          line-height: 1.55;
        }

        .field-label {
          display: block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #7b7168;
          text-transform: uppercase;
          margin-bottom: 7px;
        }

        .title-input,
        .select-input,
        .concern-input,
        .textarea {
          width: 100%;
          background: #11100e;
          border: 1px solid #302a24;
          color: #f0ece4;
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          border-radius: 16px;
        }

        .title-input {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          padding: 15px 18px;
        }

        .select-input {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          padding: 13px 14px;
        }

        .concern-input {
          min-height: 94px;
          resize: vertical;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          line-height: 1.55;
          padding: 14px;
        }

        .textarea {
          min-height: 430px;
          resize: vertical;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          line-height: 1.75;
          padding: 20px;
        }

        .title-input:focus,
        .select-input:focus,
        .concern-input:focus,
        .textarea:focus {
          border-color: #c8935a;
          background: #15120f;
        }

        .title-input::placeholder,
        .concern-input::placeholder,
        .textarea::placeholder {
          color: #5a5448;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .field-full {
          grid-column: 1 / -1;
        }

        .upload-box {
          border: 1px dashed #3a332b;
          background: #100f0d;
          border-radius: 18px;
          padding: 18px;
          margin-bottom: 14px;
        }

        .upload-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }

        .file-input {
          display: none;
        }

        .file-label {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #302a24;
          background: #16120e;
          color: #c8935a;
          border-radius: 14px;
          padding: 12px 14px;
          cursor: pointer;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .file-label:hover {
          border-color: #c8935a;
        }

        .file-name {
          color: #8f867b;
          font-size: 13px;
        }

        .tiny-note {
          color: #5f574f;
          font-size: 12px;
          line-height: 1.45;
          margin-top: 10px;
        }

        .meter-card {
          border: 1px solid #26211c;
          background: #11100e;
          border-radius: 18px;
          padding: 18px;
          margin-top: 16px;
        }

        .meter-row {
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #7b7168;
          margin-bottom: 10px;
        }

        .meter-bar {
          height: 8px;
          background: #24201b;
          border-radius: 999px;
          overflow: hidden;
        }

        .meter-fill {
          height: 100%;
          background: #c8935a;
          border-radius: 999px;
          transition: width 0.2s;
        }

        .meter-help {
          color: #8f867b;
          font-size: 12px;
          line-height: 1.5;
          margin-top: 11px;
        }

        .button-row {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 18px;
        }

        .run-btn,
        .reset-btn,
        .dashboard-btn {
          min-height: 48px;
          border-radius: 15px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 14px 18px;
          cursor: pointer;
          text-decoration: none;
        }

        .run-btn {
          background: #c8935a;
          color: #0e0d0b;
          border: 1px solid #c8935a;
        }

        .run-btn:hover:not(:disabled) {
          background: #e0aa70;
          border-color: #e0aa70;
        }

        .run-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .reset-btn,
        .dashboard-btn {
          background: #11100e;
          color: #8f867b;
          border: 1px solid #302a24;
        }

        .reset-btn:hover,
        .dashboard-btn:hover {
          color: #c8935a;
          border-color: #c8935a;
        }

        .error-msg {
          margin-top: 18px;
          padding: 16px 18px;
          background: #2a1010;
          border: 1px solid #5a2020;
          border-left: 3px solid #b84040;
          border-radius: 16px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          line-height: 1.5;
          color: #f0a0a0;
        }

        .running-panel {
          position: relative;
          overflow: hidden;
        }

        .running-panel::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background: linear-gradient(90deg, transparent, rgba(200, 147, 90, 0.05), transparent);
          animation: run-sheen 2.8s linear infinite;
        }

        @keyframes run-sheen {
          0% {
            transform: translateX(-100%);
          }

          100% {
            transform: translateX(100%);
          }
        }

        .run-spinner {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          border: 4px solid #302a24;
          border-top-color: #c8935a;
          animation: spin 0.9s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .status-subtext {
          margin-top: 10px;
          color: #8f867b;
          font-size: 13px;
          line-height: 1.5;
        }

        .slow-note {
          margin-top: 12px;
          padding: 12px;
          border: 1px solid #4a3520;
          background: #1a130c;
          border-radius: 13px;
          color: #d8b072;
          font-size: 12px;
          line-height: 1.5;
        }
        .status-bar {
          margin-top: 22px;
          padding: 18px;
          background: #11100e;
          border: 1px solid #302a24;
          border-left: 3px solid #c8935a;
          border-radius: 16px;
        }

        .status-text {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          color: #c8935a;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .council-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          color: #5a5448;
          text-transform: uppercase;
          margin-top: 18px;
          margin-bottom: 8px;
        }

        .council-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 8px;
        }

        .persona-progress {
          padding: 12px 8px;
          text-align: center;
          border: 1px solid #2a2520;
          border-radius: 14px;
          background: #11100e;
        }

        .persona-progress.done {
          border-color: #3a332b;
        }

        .persona-progress.pending {
          opacity: 0.5;
        }

        .persona-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          margin: 0 auto 7px;
        }

        .persona-name-sm {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.1em;
          color: #9a9186;
          text-transform: uppercase;
        }

        .results-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          margin-bottom: 18px;
        }

        .saved-link {
          margin-bottom: 18px;
          padding: 16px 18px;
          background: #0a1a0e;
          border: 1px solid #214a2d;
          border-left: 3px solid #4a9c6a;
          border-radius: 16px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          line-height: 1.6;
          color: #98d8aa;
        }

        .saved-link a {
          color: #c8935a;
          font-weight: 700;
        }

        .tabs-wrap {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid #2a2520;
          padding-bottom: 12px;
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

        .tab-btn:hover:not(.active):not(.locked) {
          color: #9a9186;
        }

        .tab-btn.locked {
          opacity: 0.3;
          cursor: default;
        }

        .persona-header {
          padding: 24px 0 20px;
          border-bottom: 1px solid #2a2520;
          margin-bottom: 24px;
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }

        .persona-badge {
          width: 48px;
          height: 48px;
          border-radius: 17px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 700;
          flex-shrink: 0;
          border: 1px solid var(--badge-border);
        }

        .persona-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 30px;
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

        .report-content {
          font-size: 15px;
          font-weight: 300;
          line-height: 1.8;
          color: #d4cfc7;
        }

        .report-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 30px;
          font-weight: 700;
          color: #f0ece4;
          margin: 24px 0 8px;
          line-height: 1.2;
        }

        .section-head {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 600;
          color: #f0ece4;
          margin: 32px 0 10px;
          letter-spacing: 0.03em;
        }

        .section-subhead {
          font-family: 'Cormorant Garamond', serif;
          font-size: 17px;
          font-weight: 600;
          color: #9a9186;
          margin: 20px 0 8px;
        }

        .report-divider {
          border: none;
          border-top: 1px solid #2a2520;
          margin: 28px 0;
        }

        .report-list {
          padding-left: 20px;
          margin: 12px 0;
        }

        .report-list li {
          margin-bottom: 8px;
          line-height: 1.7;
        }

        .para {
          margin-bottom: 12px;
        }

        .empty-state {
          padding: 48px 0;
          text-align: center;
        }

        .empty-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.15em;
          color: #5a5448;
          text-transform: uppercase;
          margin-top: 12px;
        }

        @media (max-width: 940px) {
          .workflow-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 700px) {
          .app-wrap {
            padding: 22px 14px 70px;
          }

          .top-nav,
          .results-head {
            align-items: flex-start;
            flex-direction: column;
          }

          .masthead,
          .panel {
            border-radius: 22px;
            padding: 22px;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .field-full {
            grid-column: auto;
          }

          .council-grid {
            grid-template-columns: 1fr;
          }

          .button-row {
            flex-direction: column;
          }

          .run-btn,
          .reset-btn,
          .dashboard-btn {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>

      <div className="app-wrap">
                <nav className="top-nav">
          <a className="back-link" href="/dashboard">
            Back to Dashboard
          </a>

          <div className="top-nav-actions">
            <a className="back-link" href="/beta-terms">
              Beta Terms
            </a>
            <div className="nav-pill">New Diagnosis Flow</div>
          </div>
        </nav>

        <header className="masthead">
          <div className="eyebrow">The Council Manuscript Diagnosis</div>
          <h1 className="title">Start a new diagnosis.</h1>
          <p className="subtitle">
            Tell the council what kind of work this is, what you are preparing for, and how sharp the feedback should be. Then paste the manuscript and run the diagnosis.
          </p>
        </header>

        {!hasRun && (
          <section className="workflow-grid">
            <aside>
              <div className="panel">
                <div className="panel-title">How this works</div>
                <p className="panel-note">
                  This page is the steering wheel. The council engine is still under the hood.
                </p>

                <div className="step-row">
                  <div className="step-number">01</div>
                  <div>
                    <div className="step-title">Intake</div>
                    <div className="step-text">
                      Give the council context so it does not judge a memoir like a thriller or a children&apos;s book like a sermon.
                    </div>
                  </div>
                </div>

                <div className="step-row">
                  <div className="step-number">02</div>
                  <div>
                    <div className="step-title">Manuscript</div>
                    <div className="step-text">
                      Paste the writing directly, or upload a .txt, .md, or .docx file. Old .doc files and PDFs come later.
                    </div>
                  </div>
                </div>

                <div className="step-row">
                  <div className="step-number">03</div>
                  <div>
                    <div className="step-title">Diagnosis</div>
                    <div className="step-text">
                      The report is saved to your dashboard after the council finishes reading.
                    </div>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-title">Run check</div>
                <p className="panel-note">
                  The button unlocks once there is enough text to diagnose.
                </p>

                <div className="meter-card">
                  <div className="meter-row">
                    <span>{words.toLocaleString()} words</span>
                    <span>{tooLong ? "Too long" : readyToRun ? "Ready" : "Need text"}</span>
                  </div>

                  <div className="meter-bar">
                    <div
                      className="meter-fill"
                      style={{ width: `${Math.min(100, Math.max(0, manuscript.trim().length / 2))}%` }}
                    />
                  </div>

                  <div className="meter-help">
                    Beta limit: 25,000 characters. Use a chapter, scene, essay, or substantial excerpt. Do not paste a whole book unless you enjoy setting money on fire.
                  </div>
                </div>

                <div className="button-row">
                  <button
                    className="run-btn"
                    onClick={runCouncil}
                    disabled={!readyToRun}
                  >
                    {loading ? `Running... ${runningSeconds}s` : "Run Diagnosis"}
                  </button>

                  <button
                    className="reset-btn"
                    onClick={loadSampleManuscript}
                    disabled={loading}
                    type="button"
                  >
                    Try Sample Excerpt
                  </button>

                  <button
                    className="reset-btn"
                    onClick={reset}
                    disabled={loading}
                    type="button"
                  >
                    Clear
                  </button>
                </div>

                {tooLong && <div className="error-msg">This excerpt is too long for beta mode. Keep it under 25,000 characters. Pick a chapter, scene, essay, or strong excerpt instead of feeding the truck the whole damn library.</div>}

                {error && <div className="error-msg">{error}</div>}
              </div>
              {loading && (
                <div className="panel running-panel">
                  <div className="run-spinner" />

                  <div className="status-bar">
                    <div className="status-text">
                      {statusMsg || "The council is working..."}
                    </div>

                    <div className="status-subtext">
                      Running for {runningSeconds}s. Do not refresh, do not click away, and do not feed it another manuscript while the council is chewing.
                    </div>

                    {runningSeconds >= 35 && (
                      <div className="slow-note">
                        Larger excerpts can take a little while. If this fails, the app should show an error instead of pretending nothing happened.
                      </div>
                    )}
                  </div>

                  <div className="council-label">Council Status</div>

                  <div className="council-grid">
                    {PERSONAS.map((p) => (
                      <div
                        key={p.key}
                        className={`persona-progress ${reports[p.key] ? "done" : "pending"}`}
                      >
                        <div
                          className="persona-dot"
                          style={{ background: reports[p.key] ? p.color : "#2a2520" }}
                        />
                        <div className="persona-name-sm">{p.name}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </aside>

            <section>
              <div className="panel">
                <div className="panel-title">Step 1: Tell us what this is</div>
                <p className="panel-note">
                  Plain answers are fine. This is context, not homework.
                </p>

                <div className="form-grid">
                  <div className="field-full">
                    <label className="field-label">Manuscript title</label>
                    <input
                      className="title-input"
                      type="text"
                      placeholder="Optional, but useful for saved reports"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="field-label">Writing type</label>
                    <select
                      className="select-input"
                      value={writingType}
                      onChange={(e) => setWritingType(e.target.value)}
                      disabled={loading}
                    >
                      <option>Fiction</option>
                      <option>Novel</option>
                      <option>Short Story</option>
                      <option>Memoir</option>
                      <option>Essay</option>
                      <option>Poetry</option>
                      <option>Inspirational</option>
                      <option>Children&apos;s</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="field-label">Audience</label>
                    <select
                      className="select-input"
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      disabled={loading}
                    >
                      <option>Readers</option>
                      <option>Family</option>
                      <option>Publisher</option>
                      <option>Agent</option>
                      <option>Contest</option>
                      <option>Beta Readers</option>
                      <option>Personal</option>
                      <option>Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="field-label">Goal</label>
                    <select
                      className="select-input"
                      value={preparationGoal}
                      onChange={(e) => setPreparationGoal(e.target.value)}
                      disabled={loading}
                    >
                      <option>Revision</option>
                      <option>Submission</option>
                      <option>Publication</option>
                      <option>Personal feedback</option>
                      <option>Contest</option>
                      <option>Beta readers</option>
                    </select>
                  </div>

                  <div>
                    <label className="field-label">Feedback level</label>
                    <select
                      className="select-input"
                      value={feedbackTone}
                      onChange={(e) => setFeedbackTone(e.target.value)}
                      disabled={loading}
                    >
                      <option>Gentle</option>
                      <option>Honest</option>
                      <option>Blunt</option>
                      <option>Brutal</option>
                    </select>
                  </div>

                  <div className="field-full">
                    <label className="field-label">Biggest concern</label>
                    <textarea
                      className="concern-input"
                      placeholder="Example: I worry the ending overexplains itself, or that the voice gets too heavy."
                      value={biggestConcern}
                      onChange={(e) => setBiggestConcern(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-title">Step 2: Add the manuscript</div>
                <p className="panel-note">
                  For this build, paste text directly or upload a .txt, .md, or .docx file. Old .doc files and PDFs are not supported yet.
                </p>

                <div className="upload-box">
                  <div className="upload-actions">
                    <label className="file-label">
                      Upload Document
                      <input
                        className="file-input"
                        type="file"
                        accept=".txt,.md,.docx,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        onChange={handleFileUpload}
                        disabled={loading}
                      />
                    </label>

                    <span className="file-name">
                      {fileName ? fileName : "No file selected"}
                    </span>
                  </div>

                  <div className="tiny-note">
                    Upload is optional. Supported files: .txt, .md, and .docx. Pasting is still the safest test path right now.
                  </div>
                </div>

                <label className="field-label">Manuscript text</label>
                <textarea
                  className="textarea"
                  placeholder="Paste your manuscript excerpt here. The council will read it before delivering the diagnosis."
                  value={manuscript}
                  onChange={(e) => setManuscript(e.target.value)}
                  disabled={loading}
                />
              </div>
            </section>
          </section>
        )}

        {hasRun && !loading && (
          <section className="panel">
            <div className="results-head">
              <div>
                <div className="eyebrow">Council Reports</div>
                <div className="panel-title">Diagnosis complete.</div>
              </div>

              <button className="reset-btn" onClick={reset}>
                New Manuscript
              </button>
            </div>

            {submissionId && (
              <div className="saved-link">
                Report saved.{" "}
                <a href={`/reports/${submissionId}`}>Open the full saved report</a>
                <br />
                <a href="/dashboard">Back to dashboard</a>
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
                  {p.name}
                  {p.key === "finalEditor" ? " *" : ""}
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
                    <div
                      className="persona-name"
                      style={{ color: activePersona.color }}
                    >
                      {activePersona.name}
                    </div>
                    <div
                      className="persona-role"
                      style={{ color: activePersona.color + "99" }}
                    >
                      {activePersona.role}
                    </div>
                    <div className="persona-tagline">
                      {activePersona.tagline}
                    </div>
                  </div>
                </div>

                {activeReport ? (
                  <div
                    className="report-content"
                    dangerouslySetInnerHTML={{ __html: renderMarkdown(activeReport) }}
                  />
                ) : (
                  <div className="empty-state">
                    <div className="empty-label">Loading...</div>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}










