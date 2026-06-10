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
  report_type?: string | null;
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
  const [deletingVersionId, setDeletingVersionId] = useState("");
  const [error, setError] = useState("");

  async function getAccessToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      window.location.href = "/login?next=/projects";
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
        throw new Error(data.error || "Could not load your saved work.");
      }

      const nextProjects = (data.projects || []) as Project[];
      setProjects(nextProjects);

      if (selectFirst && nextProjects[0]) {
        setSelectedProjectId(nextProjects[0].id);
        await loadProject(nextProjects[0].id, token);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your saved work.");
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
        throw new Error(data.error || "Could not open this saved work.");
      }

      setDetail(data as ProjectDetail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open this saved work.");
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  async function createProject() {
    const title = newProjectTitle.trim();

    if (!title) {
      setError("Give this work a name first.");
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
        throw new Error(data.error || "Could not create this work.");
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
      setError(err instanceof Error ? err.message : "Could not create this work.");
    } finally {
      setCreating(false);
    }
  }

  async function deleteSavedDraft(version: ManuscriptVersion) {
    const label = version.version_label || "Draft";
    const title = version.title || "Untitled";

    const confirmed = window.confirm(
      `Delete saved draft "${label} - ${title}"?\n\nThis only deletes the stored draft copy. Reports stay saved.`
    );

    if (!confirmed) return;

    setDeletingVersionId(version.id);
    setError("");

    try {
      const token = await getAccessToken();
      if (!token) return;

      const response = await fetch(`/api/manuscript-versions?versionId=${encodeURIComponent(version.id)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Could not delete this saved draft.");
      }

      if (selectedProjectId) {
        await loadProject(selectedProjectId, token);
      }

      await loadProjects(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not delete this saved draft.";
      setError(message);
      window.alert(message);
    } finally {
      setDeletingVersionId("");
    }
  }

  useEffect(() => {
    loadProjects(true);
  }, []);

  return (
    <main className="mywork-page">
      <section className="mywork-wrap">
        <header className="mywork-hero">
          <p className="eyebrow">My Work</p>
          <h1>Find, save, and keep working.</h1>
          <p>
            This is where your books, ideas, drafts, reports, proposals, grant
            answers, and longer projects live.
          </p>

          <div className="quick-row">
            <Link href="/workshop">Home</Link>
            <Link href="/idea?start=intake">Start New Idea</Link>
            <Link href="/submit">Check Writing</Link>
            <Link href="/sphinx">Clean Words</Link>
          </div>
        </header>

        {error && <div className="error-box">{error}</div>}

        <section className="simple-next">
          <h2>What do you want to do?</h2>

          <div className="next-grid">
            <a href="#create-work">
              <strong>Create New Work</strong>
              <span>Start a folder for a book, idea, proposal, or project.</span>
            </a>

            <a href="#saved-work">
              <strong>Open Saved Work</strong>
              <span>Pick something you already started.</span>
            </a>

            <Link href="/submit">
              <strong>Check Writing</strong>
              <span>Run feedback on a draft, chapter, essay, or scene.</span>
            </Link>

            <Link href="/sphinx">
              <strong>Clean Words</strong>
              <span>Make stiff text sound more human.</span>
            </Link>
          </div>
        </section>

        <section className="work-grid">
          <aside className="left-stack">
            <section id="create-work" className="panel">
              <h2>Create New Work</h2>
              <p>
                Make one saved place for a book, story, proposal, grant, email
                series, product idea, or anything you want to keep improving.
              </p>

              <label>Name this work</label>
              <input
                value={newProjectTitle}
                onChange={(event) => setNewProjectTitle(event.target.value)}
                placeholder="Example: Mesquite Gospel"
              />

              <label>Small note</label>
              <textarea
                value={newProjectDescription}
                onChange={(event) => setNewProjectDescription(event.target.value)}
                placeholder="Optional. Example: novel draft, grant idea, restaurant app, patent prep..."
              />

              <button
                type="button"
                onClick={createProject}
                disabled={creating || !newProjectTitle.trim()}
              >
                {creating ? "Creating..." : "Create New Work"}
              </button>
            </section>

            <section id="saved-work" className="panel">
              <h2>My Saved Work</h2>
              <p>Pick one to see its drafts and reports.</p>

              {loading && <div className="empty-box">Loading your saved work...</div>}

              {!loading && projects.length === 0 && (
                <div className="empty-box">
                  Nothing saved yet. Create New Work above, or start with an idea.
                </div>
              )}

              <div className="project-list">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    className={selectedProjectId === project.id ? "project-button active" : "project-button"}
                    onClick={() => {
                      setSelectedProjectId(project.id);
                      loadProject(project.id);
                    }}
                  >
                    <strong>{project.title}</strong>
                    <span>Updated {formatDate(project.updated_at || project.created_at)}</span>
                  </button>
                ))}
              </div>
            </section>
          </aside>

          <section className="panel detail-panel">
            {!detail && !loadingDetail && (
              <>
                <h2>No saved work selected.</h2>
                <p>
                  Pick something from My Saved Work. If this is your first time,
                  create one on the left.
                </p>
              </>
            )}

            {loadingDetail && (
              <>
                <h2>Opening saved work...</h2>
                <p>Loading drafts and reports.</p>
              </>
            )}

            {detail && !loadingDetail && (
              <>
                <p className="eyebrow">Selected Work</p>
                <h2>{detail.project.title}</h2>

                {detail.project.description && <p>{detail.project.description}</p>}

                <div className="date-line">
                  Created {formatDate(detail.project.created_at)}. Updated {formatDate(detail.project.updated_at)}.
                </div>

                <div className="action-row">
                  <Link href="/submit">Check New Draft</Link>
                  <Link href="/sphinx">Clean Text</Link>
                  <Link href={`/reread?projectId=${detail.project.id}`}>Compare Drafts</Link>
                </div>

                <section className="section-block">
                  <h3>Saved Drafts</h3>
                  <p>
                    These are draft copies you chose to save so you can compare
                    old and new versions later.
                  </p>

                  {detail.versions.length === 0 && (
                    <div className="empty-box">
                      No saved drafts yet. Use Check Writing and choose to save the draft.
                    </div>
                  )}

                  {detail.versions.map((version) => (
                    <article className="saved-item" key={version.id}>
                      <h4>{version.version_label || "Draft"}: {version.title || "Untitled"}</h4>
                      <p>
                        {version.word_count.toLocaleString()} words. Saved {formatDate(version.created_at)}.
                      </p>

                      <div className="item-actions">
                        {version.report_id && (
                          <Link href={`/reports/${version.report_id}`}>
                            Open Report
                          </Link>
                        )}

                        <Link href={`/reread?projectId=${detail.project.id}&baseVersionId=${version.id}`}>
                          Compare From This Draft
                        </Link>

                        <button
                          type="button"
                          className="danger"
                          disabled={deletingVersionId === version.id}
                          onClick={() => deleteSavedDraft(version)}
                        >
                          {deletingVersionId === version.id ? "Deleting..." : "Delete Draft Copy"}
                        </button>
                      </div>
                    </article>
                  ))}
                </section>

                <section className="section-block">
                  <h3>Saved Reports</h3>
                  <p>Feedback and results attached to this work.</p>

                  {detail.reports.length === 0 && (
                    <div className="empty-box">No reports saved here yet.</div>
                  )}

                  {detail.reports.map((report) => (
                    <article className="saved-item" key={report.id}>
                      <h4>{report.title || "Untitled report"}</h4>
                      <p>{report.report_type || "Report"} saved {formatDate(report.created_at)}.</p>
                      <Link href={`/reports/${report.id}`}>Open Report</Link>
                    </article>
                  ))}
                </section>
              </>
            )}
          </section>
        </section>
      </section>

      <style>{`
        .mywork-page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(59, 130, 246, 0.24), transparent 34rem),
            radial-gradient(circle at bottom right, rgba(148, 163, 184, 0.18), transparent 30rem),
            linear-gradient(135deg, #060b16 0%, #0b1020 52%, #111827 100%);
          color: #eef4ff;
          padding: 30px 20px 110px;
          font-family: Arial, Helvetica, sans-serif;
        }

        .mywork-wrap {
          width: min(1180px, 100%);
          margin: 0 auto;
        }

        .mywork-hero,
        .simple-next,
        .panel,
        .saved-item,
        .empty-box,
        .error-box {
          border: 1px solid rgba(147, 197, 253, 0.28);
          background: rgba(15, 23, 42, 0.92);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.28);
        }

        .mywork-hero {
          border-radius: 34px;
          padding: clamp(28px, 5vw, 54px);
          margin-bottom: 16px;
        }

        .eyebrow {
          margin: 0 0 12px;
          color: #93c5fd;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-size: 0.9rem;
        }

        .mywork-hero h1 {
          margin: 0;
          max-width: 900px;
          font-size: clamp(3.2rem, 8vw, 6.6rem);
          line-height: 0.92;
          letter-spacing: -0.06em;
          color: #ffffff;
        }

        .mywork-hero p,
        .panel p,
        .simple-next p,
        .saved-item p {
          color: #cbd5e1;
          font-size: 1.15rem;
          line-height: 1.65;
        }

        .quick-row,
        .action-row,
        .item-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 22px;
        }

        .quick-row a,
        .action-row a,
        .item-actions a,
        .next-grid a,
        .saved-item > a,
        button {
          min-height: 58px;
          border-radius: 999px;
          border: 1px solid rgba(147, 197, 253, 0.34);
          background: rgba(30, 41, 59, 0.92);
          color: #eef4ff;
          padding: 0 22px;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          cursor: pointer;
        }

        .quick-row a:first-child,
        .next-grid a:first-child,
        .panel button:not(.danger) {
          background: linear-gradient(180deg, #dbeafe 0%, #93c5fd 55%, #60a5fa 100%);
          color: #07111f;
          border-color: rgba(219, 234, 254, 0.75);
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .simple-next {
          border-radius: 28px;
          padding: 26px;
          margin-bottom: 16px;
        }

        .simple-next h2,
        .panel h2,
        .section-block h3 {
          margin: 0 0 14px;
          color: #ffffff;
          font-size: clamp(2rem, 4vw, 3rem);
          line-height: 1;
        }

        .next-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .next-grid a {
          min-height: 140px;
          border-radius: 24px;
          padding: 20px;
          align-items: flex-start;
          flex-direction: column;
          text-align: left;
        }

        .next-grid strong {
          color: inherit;
          font-size: 1.25rem;
        }

        .next-grid span {
          margin-top: 8px;
          color: #cbd5e1;
          line-height: 1.45;
        }

        .work-grid {
          display: grid;
          grid-template-columns: minmax(300px, 0.85fr) minmax(0, 1.35fr);
          gap: 16px;
          align-items: start;
        }

        .left-stack {
          display: grid;
          gap: 16px;
        }

        .panel {
          border-radius: 28px;
          padding: 26px;
        }

        label {
          display: block;
          margin: 18px 0 8px;
          color: #dbeafe;
          font-weight: 900;
          font-size: 1rem;
        }

        input,
        textarea {
          width: 100%;
          background: #0f172a;
          color: #eef4ff;
          border: 1px solid rgba(147, 197, 253, 0.28);
          border-radius: 18px;
          padding: 16px;
          font-size: 1.08rem;
          line-height: 1.55;
          outline: none;
          font-family: Arial, Helvetica, sans-serif;
        }

        textarea {
          min-height: 130px;
          resize: vertical;
        }

        input:focus,
        textarea:focus {
          border-color: #93c5fd;
          box-shadow: 0 0 0 4px rgba(147, 197, 253, 0.16);
        }

        .project-list {
          display: grid;
          gap: 10px;
        }

        .project-button {
          min-height: 92px;
          width: 100%;
          border-radius: 22px;
          align-items: flex-start;
          flex-direction: column;
          text-align: left;
          padding: 18px;
        }

        .project-button strong {
          color: #ffffff;
          font-size: 1.2rem;
        }

        .project-button span,
        .date-line {
          color: #94a3b8;
          margin-top: 6px;
        }

        .project-button.active {
          background: linear-gradient(180deg, #dbeafe 0%, #93c5fd 55%, #60a5fa 100%);
          color: #07111f;
        }

        .project-button.active strong,
        .project-button.active span {
          color: #07111f;
        }

        .section-block {
          margin-top: 34px;
        }

        .saved-item,
        .empty-box,
        .error-box {
          border-radius: 22px;
          padding: 18px;
          margin-top: 12px;
          box-shadow: none;
        }

        .saved-item h4 {
          margin: 0;
          color: #ffffff;
          font-size: 1.35rem;
        }

        .danger {
          border-color: rgba(248, 113, 113, 0.4);
          color: #fecaca;
          background: rgba(127, 29, 29, 0.35);
        }

        .error-box {
          color: #fecaca;
          border-color: rgba(248, 113, 113, 0.4);
          background: rgba(127, 29, 29, 0.35);
          margin-bottom: 16px;
        }

        @media (max-width: 960px) {
          .work-grid,
          .next-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .mywork-page {
            padding: 18px 12px 110px;
          }

          .quick-row a,
          .action-row a,
          .item-actions a,
          .item-actions button,
          .panel button {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
