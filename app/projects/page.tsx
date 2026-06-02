"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Project = {
  id: string;
  title: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
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

type ProjectReport = {
  id: string;
  created_at: string;
  title?: string | null;
  intake?: unknown;
  report_type?: string | null;
  manuscript_version_id?: string | null;
  parent_report_id?: string | null;
};

type ProjectDetail = {
  project: Project;
  versions: ManuscriptVersion[];
  reports: ProjectReport[];
};

function formatDate(value: string) {
  if (!value) return "";

  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [detail, setDetail] = useState<ProjectDetail | null>(null);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [newProjectDescription, setNewProjectDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");

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

  async function loadProjects(selectFirst = false) {
    setLoading(true);
    setError("");

    try {
      const token = await getAccessToken();
      if (!token) return;

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

      if (selectFirst && nextProjects[0]) {
        setSelectedProjectId(nextProjects[0].id);
        await loadProject(nextProjects[0].id, token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load projects.");
    } finally {
      setLoading(false);
    }
  }

  async function loadProject(projectId: string, existingToken?: string) {
    if (!projectId) {
      setDetail(null);
      return;
    }

    setLoadingDetail(true);
    setError("");

    try {
      const token = existingToken || (await getAccessToken());
      if (!token) return;

      const response = await fetch(`/api/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not load project.");
      }

      setDetail(data as ProjectDetail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load project.");
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function createProject() {
    const title = newProjectTitle.trim();

    if (!title) {
      setError("Project title is required.");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description: newProjectDescription.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not create project.");
      }

      const project = data.project as Project;

      setProjects((current) => [
        project,
        ...current.filter((item) => item.id !== project.id),
      ]);
      setSelectedProjectId(project.id);
      setNewProjectTitle("");
      setNewProjectDescription("");

      await loadProject(project.id, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create project.");
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    loadProjects(true);
  }, []);

  return (
    <main className="projects-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;700&family=IBM+Plex+Mono:wght@400;500;700&display=swap');

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #0e0d0b;
        }

        .projects-shell {
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
          max-width: 780px;
          font-size: 17px;
          font-weight: 300;
        }

        .grid {
          display: grid;
          grid-template-columns: minmax(280px, 0.9fr) minmax(0, 1.4fr);
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
          min-height: 90px;
          resize: vertical;
        }

        .input:focus,
        .textarea:focus,
        .select:focus {
          border-color: #c8935a;
        }

        .primary-btn {
          width: 100%;
          min-height: 52px;
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

        .project-list {
          display: grid;
          gap: 10px;
        }

        .project-btn {
          width: 100%;
          text-align: left;
          border: 1px solid #2a2520;
          background: #11100e;
          color: #d4cfc7;
          border-radius: 18px;
          padding: 16px;
          cursor: pointer;
        }

        .project-btn.active {
          border-color: #c8935a;
          background: #17120e;
        }

        .project-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          font-weight: 700;
          color: #f0ece4;
        }

        .project-meta,
        .item-meta {
          margin-top: 6px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #7b7168;
        }

        .item {
          border: 1px solid #2a2520;
          background: #11100e;
          border-radius: 20px;
          padding: 18px;
          margin-top: 12px;
        }

        .item-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 25px;
          font-weight: 700;
          color: #f0ece4;
        }

        .item-link {
          display: inline-flex;
          margin-top: 12px;
          color: #c8935a;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .empty,
        .error {
          border-radius: 18px;
          padding: 16px;
          line-height: 1.6;
        }

        .empty {
          border: 1px solid #2a2520;
          color: #8f867b;
          background: #11100e;
        }

        .error {
          border: 1px solid #5a2020;
          background: #2a1010;
          color: #f0a0a0;
          margin-bottom: 16px;
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
          <Link className="nav-link" href="/dashboard">
            Back to Dashboard
          </Link>

          <div className="nav-actions">
            <Link className="nav-link" href="/submit">
              Run The Council
            </Link>

            <Link className="nav-link" href="/reread">
              Council Re-Read
            </Link>

            <Link className="nav-link" href="/sphinx">
              Open SPHINX
            </Link>
          </div>
        </nav>

        <header className="masthead">
          <div className="eyebrow">HOVEL EDITOR MEMORY</div>
          <h1 className="title">Projects.</h1>
          <p className="subtitle">
            Projects hold manuscript versions and saved Council reports together.
            This is where Draft 1 becomes Draft 2, and where future Council Re-Reads
            will remember what actually changed instead of pretending every upload
            fell out of the sky.
          </p>
        </header>

        {error && <div className="error">{error}</div>}

        <section className="grid">
          <aside>
            <div className="panel">
              <div className="panel-title">Create project</div>
              <p className="panel-note">
                Use this for a book, chapter, essay, application, or anything you plan to revise over time.
              </p>

              <label className="field-label">Project title</label>
              <input
                className="input"
                value={newProjectTitle}
                onChange={(event) => setNewProjectTitle(event.target.value)}
                placeholder="Example: Mesquite Gospel"
              />

              <div style={{ height: "14px" }} />

              <label className="field-label">Description</label>
              <textarea
                className="textarea"
                value={newProjectDescription}
                onChange={(event) => setNewProjectDescription(event.target.value)}
                placeholder="Optional note about this project."
              />

              <button
                className="primary-btn"
                type="button"
                onClick={createProject}
                disabled={creating || !newProjectTitle.trim()}
              >
                {creating ? "Creating..." : "Create Project"}
              </button>
            </div>

            <div className="panel">
              <div className="panel-title">Your projects</div>
              <p className="panel-note">
                Select a project to see saved manuscript versions and attached reports.
              </p>

              {loading && <div className="empty">Loading projects...</div>}

              {!loading && projects.length === 0 && (
                <div className="empty">
                  No projects yet. Create one here, or save a manuscript snapshot from The Council.
                </div>
              )}

              <div className="project-list">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    className={`project-btn ${
                      selectedProjectId === project.id ? "active" : ""
                    }`}
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      loadProject(project.id);
                    }}
                  >
                    <div className="project-title">{project.title}</div>
                    <div className="project-meta">
                      Updated {formatDate(project.updated_at || project.created_at)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section>
            <div className="panel">
              {!detail && !loadingDetail && (
                <>
                  <div className="panel-title">No project selected.</div>
                  <p className="panel-note">
                    Pick a project on the left to see manuscript memory.
                  </p>
                </>
              )}

              {loadingDetail && (
                <>
                  <div className="panel-title">Loading project...</div>
                  <p className="panel-note">
                    Pulling versions, reports, and whatever the raccoon filed correctly.
                  </p>
                </>
              )}

              {detail && !loadingDetail && (
                <>
                  <div className="eyebrow">Selected Project</div>
                  <div className="panel-title">{detail.project.title}</div>

                  {detail.project.description && (
                    <p className="panel-note">{detail.project.description}</p>
                  )}

                  <div className="project-meta">
                    Created {formatDate(detail.project.created_at)} · Updated{" "}
                    {formatDate(detail.project.updated_at)}
                  </div>

                  <div style={{ height: "24px" }} />

                  <div className="panel-title">Manuscript versions</div>
                  <p className="panel-note">
                    These are opt-in saved drafts for future Council Re-Read comparison.
                  </p>

                  {detail.versions.length === 0 && (
                    <div className="empty">
                      No manuscript versions saved yet. Run The Council and check “Save this manuscript version for future comparison.”
                    </div>
                  )}

                  {detail.versions.map((version) => (
                    <div className="item" key={version.id}>
                      <div className="item-title">
                        {version.version_label || "Draft"} · {version.title || "Untitled"}
                      </div>
                      <div className="item-meta">
                        {version.word_count.toLocaleString()} words ·{" "}
                        {version.char_count.toLocaleString()} chars ·{" "}
                        {version.source || "council"} · {formatDate(version.created_at)}
                      </div>

                      {version.report_id && (
                        <Link className="item-link" href={`/reports/${version.report_id}`}>
                          Open attached report
                        </Link>
                      )}
                    </div>
                  ))}

                  <div style={{ height: "30px" }} />

                  <div className="panel-title">Reports</div>
                  <p className="panel-note">
                    Reports attached to this project.
                  </p>

                  {detail.reports.length === 0 && (
                    <div className="empty">No reports attached to this project yet.</div>
                  )}

                  {detail.reports.map((report) => (
                    <div className="item" key={report.id}>
                      <div className="item-title">
                        {report.title || "Untitled report"}
                      </div>
                      <div className="item-meta">
                        {report.report_type || "report"} · {formatDate(report.created_at)}
                      </div>
                      <Link className="item-link" href={`/reports/${report.id}`}>
                        Open report
                      </Link>
                    </div>
                  ))}
                </>
              )}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}

