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
    color: "#93c5fd",
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

type ProjectOption = {
  id: string;
  title: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
};

const STATUS_MESSAGES = [
  "Reading your manuscript...",
  "Checking your writing...",
  "Checking the voice...",
  "Finding what slows it down...",
  "Checking the structure...",
  "Reading it like a real reader...",
  "Turning it into useful feedback...",
  "Preparing your feedback...",
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
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [saveManuscriptSnapshot, setSaveManuscriptSnapshot] = useState(false);
  const [versionLabel, setVersionLabel] = useState("Draft 1");
  const [snapshotMessage, setSnapshotMessage] = useState("");
  const [runningSeconds, setRunningSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const words = countWords(manuscript);
  const tooLong = manuscript.trim().length > COUNCIL_MAX_CHARS;
  const snapshotNeedsProject =
    saveManuscriptSnapshot && !selectedProjectId && !newProjectTitle.trim();
  const readyToRun =
    manuscript.trim().length >= 50 && !tooLong && !loading && !snapshotNeedsProject;
  const activePersona = PERSONAS.find((p) => p.key === activeTab);
  const activeReport = reports[activeTab];

  async function loadProjectsForSession(accessToken: string) {
    setProjectsLoading(true);

    try {
      const response = await fetch("/api/projects", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load projects.");
      }

      setProjects((data.projects || []) as ProjectOption[]);
    } catch {
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  }

  async function getProjectIdForSnapshot(accessToken: string) {
    const trimmedNewProjectTitle = newProjectTitle.trim();

    if (trimmedNewProjectTitle) {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: trimmedNewProjectTitle,
          description: "",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not create project.");
      }

      const project = data.project as ProjectOption;

      setProjects((current) => [
        project,
        ...current.filter((item) => item.id !== project.id),
      ]);
      setSelectedProjectId(project.id);
      setNewProjectTitle("");

      return project.id;
    }

    if (selectedProjectId) {
      return selectedProjectId;
    }

    throw new Error("Choose a project or enter a new project title.");
  }

  async function saveSnapshotForComparison(accessToken: string, reportId: string) {
    if (!saveManuscriptSnapshot) return;

    setSnapshotMessage("Saving manuscript snapshot for future comparison...");

    try {
      const projectId = await getProjectIdForSnapshot(accessToken);

      const response = await fetch("/api/manuscript-versions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          projectId,
          reportId,
          title: title.trim() || "Untitled",
          versionLabel: versionLabel.trim() || "Draft",
          manuscriptText: manuscript,
          source: "council",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save manuscript snapshot.");
      }

      setSnapshotMessage(
        `${versionLabel.trim() || "Draft"} saved for future Compare Drafts comparison.`
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Snapshot save failed.";

      setSnapshotMessage(
        `Report saved, but the manuscript snapshot did not save. Details: ${message}`
      );
    }
  }

  useEffect(() => {
    async function checkAuth() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
        return;
      }

      await loadProjectsForSession(session.access_token);
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
    setSnapshotMessage("");

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

        const nextSubmissionId =
          typeof data.submissionId === "string" ? data.submissionId : "";

        if (nextSubmissionId) {
          setSubmissionId(nextSubmissionId);
        }

        if (saveManuscriptSnapshot && nextSubmissionId) {
          await saveSnapshotForComparison(session.access_token, nextSubmissionId);
        } else if (saveManuscriptSnapshot && !nextSubmissionId) {
          setSnapshotMessage(
            "The report finished, but there was no saved report ID to attach this manuscript snapshot to."
          );
        }
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
    setSelectedProjectId("");
    setNewProjectTitle("");
    setSaveManuscriptSnapshot(false);
    setVersionLabel("Draft 1");
    setSnapshotMessage("");
  }

  function loadSampleManuscript() {
    setManuscript(COUNCIL_SAMPLE_MANUSCRIPT);
    setTitle("Check Writing Sample Excerpt");
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
    setSnapshotMessage("");
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
          color: #cbd5e1 !important;
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
          background: #060b16;
        }

        .submit-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(200, 147, 90, 0.13), transparent 33rem),
            radial-gradient(circle at bottom right, rgba(90, 124, 200, 0.1), transparent 30rem),
            #060b16;
          color: #eef4ff;
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
          color: #cbd5e1;
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
          color: #93c5fd;
          border-color: #93c5fd;
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
          color: #94a3b8;
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
          color: #93c5fd;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(44px, 8vw, 82px);
          font-weight: 700;
          line-height: 0.94;
          color: #eef4ff;
          margin: 0;
        }

        .subtitle {
          font-size: 16px;
          font-weight: 300;
          color: #cbd5e1;
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
          color: #eef4ff;
          margin-bottom: 8px;
        }

        .panel-note {
          color: #cbd5e1;
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
          background: #1e293b;
          border: 1px solid #332a1c;
          color: #93c5fd;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 700;
        }

        .step-title {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.14em;
          color: #93c5fd;
          text-transform: uppercase;
          margin-bottom: 5px;
        }

        .step-text {
          color: #cbd5e1;
          font-size: 13px;
          line-height: 1.55;
        }

        .field-label {
          display: block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #94a3b8;
          text-transform: uppercase;
          margin-bottom: 7px;
        }

        .title-input,
        .select-input,
        .concern-input,
        .textarea {
          width: 100%;
          background: #0f172a;
          border: 1px solid #302a24;
          color: #eef4ff;
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
          min-height: 440px;
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
          border-color: #93c5fd;
          background: #15120f;
        }

        .title-input::placeholder,
        .concern-input::placeholder,
        .textarea {
          font-size: 16px !important;
          line-height: 1.75 !important;
        }

        .textarea::placeholder {
          color: #94a3b8;
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
          color: #93c5fd;
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
          border-color: #93c5fd;
        }

        .file-name {
          color: #cbd5e1;
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
          background: #0f172a;
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
          color: #94a3b8;
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
          background: #93c5fd;
          border-radius: 999px;
          transition: width 0.2s;
        }

        .meter-help {
          color: #cbd5e1;
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
          background: #93c5fd;
          color: #060b16;
          border: 1px solid #93c5fd;
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
          background: #0f172a;
          color: #cbd5e1;
          border: 1px solid #302a24;
        }

        .reset-btn:hover,
        .dashboard-btn:hover {
          color: #93c5fd;
          border-color: #93c5fd;
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
          border-top-color: #93c5fd;
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
          color: #cbd5e1;
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
          background: #0f172a;
          border: 1px solid #302a24;
          border-left: 3px solid #93c5fd;
          border-radius: 16px;
        }

        .status-text {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          color: #93c5fd;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .council-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.15em;
          color: #94a3b8;
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
          background: #0f172a;
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
          color: #cbd5e1;
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
          color: #93c5fd;
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
          background: #0f172a;
          border: 1px solid #302a24;
          border-radius: 13px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
          color: #94a3b8;
        }

        .tab-btn.active {
          border-color: var(--tab-color);
          color: var(--tab-color);
          background: #16120e;
        }

        .tab-btn:hover:not(.active):not(.locked) {
          color: #cbd5e1;
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
          color: #cbd5e1;
          margin-top: 8px;
        }

        .report-content {
          font-size: 15px;
          font-weight: 300;
          line-height: 1.8;
          color: #dbeafe;
        }

        .report-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 30px;
          font-weight: 700;
          color: #eef4ff;
          margin: 24px 0 8px;
          line-height: 1.2;
        }

        .section-head {
          font-family: 'Cormorant Garamond', serif;
          font-size: 22px;
          font-weight: 600;
          color: #eef4ff;
          margin: 32px 0 10px;
          letter-spacing: 0.03em;
        }

        .section-subhead {
          font-family: 'Cormorant Garamond', serif;
          font-size: 17px;
          font-weight: 600;
          color: #cbd5e1;
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
          color: #94a3b8;
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
            Back to Reports
          </a>

          <div className="top-nav-actions">
            <a className="back-link" href="/beta-terms">
              Beta Terms
            </a>
            <div className="nav-pill">New Diagnosis Flow</div>
          </div>
        </nav>

        <header className="masthead">
          <div className="eyebrow">Check Writing Manuscript Diagnosis</div>
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
                      The report is saved to your dashboard after the council finishes reading. Manuscript text is only saved as a reusable snapshot if you choose that option.
                    </div>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-title">Run check</div>
                <p className="panel-note">
                  The button unlocks once there is enough text to diagnose. Saving a reusable manuscript snapshot is optional.
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

                {snapshotNeedsProject && (
                  <div className="error-msg">
                    Choose or create a project before saving a manuscript version for comparison.
                  </div>
                )}

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
                    <label className="field-label">Who is this for?</label>
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
                  <div className="field-full">
                    <label className="field-label">Step 1B: Project and version memory</label>

                    <div className="upload-box">
                      <div className="tiny-note" style={{ marginTop: 0, marginBottom: "12px" }}>
                        Optional. Writing Check only stores manuscript text when you choose to save a snapshot. The regular report saves either way, but the draft text is only kept if this box is checked.
                      </div>

                      <label className="field-label">Existing project</label>
                      <select
                        className="select-input"
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        disabled={loading || projectsLoading || Boolean(newProjectTitle.trim())}
                      >
                        <option value="">
                          {projectsLoading ? "Loading projects..." : "No project selected"}
                        </option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.title}
                          </option>
                        ))}
                      </select>

                      <div style={{ height: "14px" }} />

                      <label className="field-label">Or create new project</label>
                      <input
                        className="title-input"
                        type="text"
                        placeholder="Example: Mesquite Gospel, SafeSchool Application, Chapter One"
                        value={newProjectTitle}
                        onChange={(e) => setNewProjectTitle(e.target.value)}
                        disabled={loading}
                      />

                      <div style={{ height: "14px" }} />

                      <label className="field-label">Version label</label>
                      <input
                        className="title-input"
                        type="text"
                        placeholder="Draft 1"
                        value={versionLabel}
                        onChange={(e) => setVersionLabel(e.target.value)}
                        disabled={loading}
                      />

                      <label
                        style={{
                          display: "flex",
                          gap: "12px",
                          alignItems: "flex-start",
                          marginTop: "16px",
                          color: "#dbeafe",
                          lineHeight: 1.55,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={saveManuscriptSnapshot}
                          onChange={(e) => setSaveManuscriptSnapshot(e.target.checked)}
                          disabled={loading}
                          style={{ marginTop: "5px" }}
                        />
                        <span>
                          Save manuscript text as a snapshot for future comparison.
                          <span className="tiny-note" style={{ display: "block" }}>
                            This stores this draft under your account and project so Compare Drafts can compare it against a later revision. Leave unchecked if you only want the report saved. You can delete snapshots from Projects without deleting the saved report.
                          </span>
                        </span>
                      </label>
                    </div>
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

            {snapshotMessage && (
              <div className="saved-link">
                {snapshotMessage}
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














