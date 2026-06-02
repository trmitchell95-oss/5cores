"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import JSZip from "jszip";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Project = {
  id: string;
  title: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
};

type ManuscriptVersion = {
  id: string;
  project_id: string;
  report_id?: string | null;
  title?: string | null;
  version_label?: string | null;
  word_count: number;
  char_count: number;
  source: string;
  created_at: string;
};

const REREAD_MAX_CHARS = 25000;

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function formatDate(value?: string | null) {
  if (!value) return "";

  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderMarkdown(text: string) {
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
      html.push("<br/>");
      continue;
    }

    if (line.startsWith("# ")) {
      closeList();
      html.push(`<h1 class="report-title">${escapeHtml(line.replace(/^#\s+/, ""))}</h1>`);
      continue;
    }

    if (line.startsWith("## ")) {
      closeList();
      html.push(`<h2 class="section-head">${escapeHtml(line.replace(/^##\s+/, ""))}</h2>`);
      continue;
    }

    if (line.startsWith("### ")) {
      closeList();
      html.push(`<h3 class="section-subhead">${escapeHtml(line.replace(/^###\s+/, ""))}</h3>`);
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("• ")) {
      if (!inList) {
        html.push("<ul class='report-list'>");
        inList = true;
      }

      html.push(`<li>${escapeHtml(line.replace(/^[-•]\s+/, ""))}</li>`);
      continue;
    }

    closeList();
    html.push(`<p class="para">${escapeHtml(line)}</p>`);
  }

  closeList();

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

export default function CouncilReReadPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [versions, setVersions] = useState<ManuscriptVersion[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [baseVersionId, setBaseVersionId] = useState("");
  const [title, setTitle] = useState("");
  const [versionLabel, setVersionLabel] = useState("Draft 2");
  const [revisionGoal, setRevisionGoal] = useState("");
  const [newManuscriptText, setNewManuscriptText] = useState("");
  const [saveNewVersion, setSaveNewVersion] = useState(true);
  const [fileName, setFileName] = useState("");
  const [report, setReport] = useState("");
  const [reportId, setReportId] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [error, setError] = useState("");

  const tooLong = newManuscriptText.trim().length > REREAD_MAX_CHARS;
  const readyToRun =
    Boolean(baseVersionId) &&
    newManuscriptText.trim().length >= 50 &&
    !tooLong &&
    !loading;

  async function getAccessToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      window.location.href = "/login";
      return "";
    }

    return session.access_token;
  }

  async function loadProjects() {
    setLoadingProjects(true);
    setError("");

    try {
      const token = await getAccessToken();
      if (!token) return;

      const params =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search)
          : new URLSearchParams();

      const requestedProjectId = params.get("projectId") || "";
      const requestedBaseVersionId = params.get("baseVersionId") || "";

      const response = await fetch("/api/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load projects.");
      }

      const nextProjects = (data.projects || []) as Project[];
      setProjects(nextProjects);

      const projectToOpen =
        nextProjects.find((project) => project.id === requestedProjectId) ||
        nextProjects[0];

      if (projectToOpen) {
        setSelectedProjectId(projectToOpen.id);
        await loadVersions(projectToOpen.id, token, requestedBaseVersionId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load projects.");
    } finally {
      setLoadingProjects(false);
    }
  }

  async function loadVersions(
    projectId: string,
    existingToken?: string,
    preferredVersionId?: string
  ) {
    if (!projectId) {
      setVersions([]);
      setBaseVersionId("");
      return;
    }

    setLoadingVersions(true);
    setError("");

    try {
      const token = existingToken || (await getAccessToken());
      if (!token) return;

      const response = await fetch(`/api/manuscript-versions?projectId=${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load manuscript versions.");
      }

      const nextVersions = (data.versions || []) as ManuscriptVersion[];
      setVersions(nextVersions);

      const preferredVersion = preferredVersionId
        ? nextVersions.find((version) => version.id === preferredVersionId)
        : null;

      setBaseVersionId(preferredVersion?.id || nextVersions[0]?.id || "");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load manuscript versions."
      );
      setVersions([]);
      setBaseVersionId("");
    } finally {
      setLoadingVersions(false);
    }
  }

  async function handleFileUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setFileName(file.name);

    const lowerName = file.name.toLowerCase();

    const allowed =
      file.type === "text/plain" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      lowerName.endsWith(".txt") ||
      lowerName.endsWith(".md") ||
      lowerName.endsWith(".docx");

    if (!allowed) {
      setError("Upload a .txt, .md, or .docx file, or paste the revised draft directly.");
      event.target.value = "";
      return;
    }

    try {
      const text = await readUploadedFile(file);
      setNewManuscriptText(text);

      if (!title.trim()) {
        setTitle(titleFromFileName(file.name));
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not read that file. Paste the revised draft instead."
      );
    } finally {
      event.target.value = "";
    }
  }

  async function runReRead() {
    if (!readyToRun) return;

    setLoading(true);
    setError("");
    setReport("");
    setReportId("");

    try {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch("/api/council-reread", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          baseVersionId,
          newManuscriptText,
          revisionGoal,
          title: title.trim() || "Council Re-Read",
          versionLabel: versionLabel.trim() || "Revised Draft",
          saveNewVersion,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Council Re-Read failed.");
      }

      setReport(data.report || "");
      setReportId(data.reportId || "");

      if (selectedProjectId) {
        await loadVersions(selectedProjectId, token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Council Re-Read failed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <main className="reread-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;700&family=IBM+Plex+Mono:wght@400;500;700&display=swap');

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #0e0d0b;
        }

        .reread-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(200, 147, 90, 0.14), transparent 34rem),
            radial-gradient(circle at bottom right, rgba(90, 124, 200, 0.1), transparent 30rem),
            #0e0d0b;
          color: #f0ece4;
          font-family: 'DM Sans', sans-serif;
          padding: 34px 24px 90px;
        }

        .wrap {
          max-width: 1180px;
          margin: 0 auto;
        }

        .top-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          margin-bottom: 26px;
        }

        .nav-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          justify-content: flex-end;
        }

        .nav-link,
        .small-btn {
          min-height: 48px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #302a24;
          background: rgba(18, 16, 13, 0.82);
          color: #9a9186;
          text-decoration: none;
          border-radius: 14px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 13px 16px;
          cursor: pointer;
        }

        .nav-link:hover,
        .small-btn:hover {
          color: #c8935a;
          border-color: #c8935a;
        }

        .masthead {
          border: 1px solid #26211c;
          background: rgba(18, 16, 13, 0.88);
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
          font-size: clamp(44px, 8vw, 78px);
          font-weight: 700;
          line-height: 0.96;
          margin: 0;
        }

        .subtitle {
          margin-top: 16px;
          color: #aaa096;
          line-height: 1.7;
          max-width: 820px;
          font-size: 17px;
          font-weight: 300;
        }

        .grid {
          display: grid;
          grid-template-columns: minmax(300px, 0.9fr) minmax(0, 1.25fr);
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
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .panel-note {
          color: #9a9186;
          font-size: 15px;
          line-height: 1.65;
          margin-bottom: 18px;
        }

        .field-label {
          display: block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.13em;
          color: #7b7168;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .input,
        .textarea,
        .select {
          width: 100%;
          background: #11100e;
          border: 1px solid #302a24;
          color: #f0ece4;
          outline: none;
          border-radius: 16px;
          padding: 14px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          line-height: 1.6;
        }

        .textarea {
          min-height: 230px;
          resize: vertical;
        }

        .draft-textarea {
          min-height: 500px;
        }

        .input:focus,
        .textarea:focus,
        .select:focus {
          border-color: #c8935a;
        }

        .primary-btn {
          width: 100%;
          min-height: 54px;
          margin-top: 14px;
          border-radius: 15px;
          border: 1px solid #c8935a;
          background: #c8935a;
          color: #0e0d0b;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.13em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .primary-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .upload-box {
          border: 1px dashed #3a332b;
          background: #100f0d;
          border-radius: 18px;
          padding: 16px;
          margin-bottom: 14px;
        }

        .file-input {
          display: none;
        }

        .file-label {
          display: inline-flex;
          min-height: 48px;
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

        .tiny-note {
          color: #8f867b;
          font-size: 13px;
          line-height: 1.5;
          margin-top: 10px;
        }

        .error,
        .saved {
          border-radius: 18px;
          padding: 16px;
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .error {
          border: 1px solid #5a2020;
          background: #2a1010;
          color: #f0a0a0;
        }

        .saved {
          border: 1px solid #214a2d;
          background: #0a1a0e;
          color: #98d8aa;
        }

        .saved a {
          color: #c8935a;
          font-weight: 700;
        }

        .meta {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          color: #7b7168;
          text-transform: uppercase;
          margin-top: 6px;
        }

        .report-card {
          border: 1px solid #26211c;
          background: #11100e;
          border-radius: 24px;
          padding: 24px;
          margin-top: 18px;
        }

        .report-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 34px;
          font-weight: 700;
          margin: 22px 0 12px;
        }

        .section-head {
          font-family: 'Cormorant Garamond', serif;
          font-size: 25px;
          font-weight: 700;
          color: #f0ece4;
          border-bottom: 1px solid #2a2520;
          padding-bottom: 10px;
          margin: 30px 0 14px;
        }

        .section-subhead {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.12em;
          color: #c8935a;
          text-transform: uppercase;
          margin-top: 22px;
        }

        .para,
        .report-list li {
          color: #d4cfc7;
          font-size: 16px;
          font-weight: 300;
          line-height: 1.8;
        }

        .report-list {
          padding-left: 22px;
        }

        @media (max-width: 900px) {
          .grid {
            grid-template-columns: 1fr;
          }

          .top-nav {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>

      <div className="wrap">
        <nav className="top-nav">
          <Link className="nav-link" href="/projects">
            Back to Projects
          </Link>

          <div className="nav-actions">
            <Link className="nav-link" href="/submit">
              Run The Council
            </Link>

            <Link className="nav-link" href="/dashboard">
              Dashboard
            </Link>
          </div>
        </nav>

        <header className="masthead">
          <div className="eyebrow">HOVEL EDITOR MEMORY</div>
          <h1 className="title">Council Re-Read.</h1>
          <p className="subtitle">
            Compare a revised draft against an earlier saved manuscript version.
            This is where The Council stops treating every draft like it fell out of the sky
            and starts judging whether the revision actually moved the work forward.
          </p>
        </header>

        {error && <div className="error">{error}</div>}

        {reportId && (
          <div className="saved">
            Council Re-Read saved.{" "}
            <Link href={`/reports/${reportId}`}>Open saved Re-Read report</Link>
          </div>
        )}

        <section className="grid">
          <aside>
            <div className="panel">
              <div className="panel-title">1. Choose the old draft</div>
              <p className="panel-note">
                Pick the saved manuscript version you want the revised draft compared against.
              </p>

              <label className="field-label">Project</label>
              <select
                className="select"
                value={selectedProjectId}
                disabled={loading || loadingProjects}
                onChange={(event) => {
                  const projectId = event.target.value;
                  setSelectedProjectId(projectId);
                  setBaseVersionId("");
                  loadVersions(projectId);
                }}
              >
                <option value="">
                  {loadingProjects ? "Loading projects..." : "Select a project"}
                </option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>

              <div style={{ height: "16px" }} />

              <label className="field-label">Earlier saved version</label>
              <select
                className="select"
                value={baseVersionId}
                disabled={loading || loadingVersions || versions.length === 0}
                onChange={(event) => setBaseVersionId(event.target.value)}
              >
                <option value="">
                  {loadingVersions
                    ? "Loading versions..."
                    : versions.length === 0
                      ? "No saved versions in this project"
                      : "Select earlier draft"}
                </option>
                {versions.map((version) => (
                  <option key={version.id} value={version.id}>
                    {version.version_label || "Draft"} · {version.title || "Untitled"} ·{" "}
                    {formatDate(version.created_at)}
                  </option>
                ))}
              </select>

              {baseVersionId && (
                <div className="tiny-note">
                  Earlier draft selected. The server will pull the saved manuscript text securely.
                </div>
              )}
            </div>

            <div className="panel">
              <div className="panel-title">2. Name the new draft</div>

              <label className="field-label">Re-Read report title</label>
              <input
                className="input"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                disabled={loading}
                placeholder="Example: Mesquite Gospel Draft 2 Re-Read"
              />

              <div style={{ height: "16px" }} />

              <label className="field-label">New version label</label>
              <input
                className="input"
                value={versionLabel}
                onChange={(event) => setVersionLabel(event.target.value)}
                disabled={loading}
                placeholder="Draft 2"
              />

              <label
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "flex-start",
                  marginTop: "16px",
                  color: "#d4cfc7",
                  lineHeight: 1.55,
                }}
              >
                <input
                  type="checkbox"
                  checked={saveNewVersion}
                  onChange={(event) => setSaveNewVersion(event.target.checked)}
                  disabled={loading}
                  style={{ marginTop: "5px" }}
                />
                <span>
                  Save this revised draft as a new manuscript version.
                  <span className="tiny-note" style={{ display: "block" }}>
                    This lets Draft 2 become the comparison point for Draft 3 later.
                  </span>
                </span>
              </label>
            </div>

            <div className="panel">
              <div className="panel-title">3. Revision notes</div>
              <p className="panel-note">
                Optional, but useful. Tell The Council what you tried to fix.
              </p>

              <textarea
                className="textarea"
                value={revisionGoal}
                onChange={(event) => setRevisionGoal(event.target.value)}
                disabled={loading}
                placeholder="Example: I tried to cut repetition, sharpen the ending, and make the opening less slow."
              />

              <button
                className="primary-btn"
                type="button"
                disabled={!readyToRun}
                onClick={runReRead}
              >
                {loading ? "Running Re-Read..." : "Run Council Re-Read"}
              </button>

              {tooLong && (
                <div className="tiny-note" style={{ color: "#f0a0a0" }}>
                  Revised draft is over 25,000 characters. Use a chapter, scene, essay, or excerpt for beta mode.
                </div>
              )}
            </div>
          </aside>

          <section>
            <div className="panel">
              <div className="panel-title">4. Paste the revised draft</div>
              <p className="panel-note">
                Paste Draft 2 here, or upload a .txt, .md, or .docx file.
              </p>

              <div className="upload-box">
                <label className="file-label">
                  Upload Revised Draft
                  <input
                    className="file-input"
                    type="file"
                    accept=".txt,.md,.docx,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileUpload}
                    disabled={loading}
                  />
                </label>

                <div className="tiny-note">
                  {fileName ? `Loaded: ${fileName}` : "No file selected. Pasting directly is fine."}
                </div>
              </div>

              <div className="meta">
                {countWords(newManuscriptText).toLocaleString()} words ·{" "}
                {newManuscriptText.length.toLocaleString()} / 25,000 characters
              </div>

              <div style={{ height: "12px" }} />

              <textarea
                className="textarea draft-textarea"
                value={newManuscriptText}
                onChange={(event) => setNewManuscriptText(event.target.value)}
                disabled={loading}
                placeholder="Paste the revised manuscript text here."
              />
            </div>

            {report && (
              <div className="report-card">
                <div
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(report) }}
                />
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
