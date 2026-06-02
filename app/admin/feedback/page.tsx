"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

type FeedbackItem = {
  id: string;
  created_at: string;
  updated_at: string;
  email: string | null;
  feedback_type: string;
  tool: string | null;
  page_path: string | null;
  message: string;
  status: string;
  admin_note: string | null;
};

type FeedbackResponse = {
  adminEmail: string;
  summary: {
    total: number;
    newCount: number;
    reviewedCount: number;
    fixedCount: number;
    ignoredCount: number;
  };
  items: FeedbackItem[];
};

const STATUS_OPTIONS = ["new", "reviewed", "fixed", "ignored"];

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function typeLabel(value: string) {
  if (value === "bug") return "Bug";
  if (value === "confusing") return "Confusing";
  if (value === "useful") return "Useful";
  if (value === "bad_report") return "Bad Report";
  if (value === "feature") return "Feature";
  return "General";
}

function toolLabel(value: string | null) {
  if (!value) return "App";
  if (value === "ideanator") return "Ideanator";
  if (value === "5core") return "The Council";
  if (value === "council") return "The Council";
  if (value === "sphinx") return "Sphinx";
  if (value === "dashboard") return "Dashboard";
  if (value === "saved_report") return "Saved Report";
  if (value === "admin") return "Admin";
  return value;
}

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

export default function AdminFeedbackPage() {
  const [data, setData] = useState<FeedbackResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [toolFilter, setToolFilter] = useState("all");
  const [error, setError] = useState("");

  async function loadFeedback(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const supabase = getSupabaseClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/admin/feedback", {
        headers: {
          authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load feedback.");
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function updateItem(id: string, status: string, adminNote: string) {
    try {
      setError("");

      const supabase = getSupabaseClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/admin/feedback", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          id,
          status,
          adminNote,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update feedback.");
      }

      await loadFeedback(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  useEffect(() => {
    loadFeedback();
  }, []);

  const items = data?.items || [];

  const toolOptions = useMemo(() => {
    const tools = Array.from(
      new Set(items.map((item) => item.tool || "app"))
    ).sort();

    return tools;
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const statusMatches = statusFilter === "all" || item.status === statusFilter;
      const toolMatches = toolFilter === "all" || (item.tool || "app") === toolFilter;

      return statusMatches && toolMatches;
    });
  }, [items, statusFilter, toolFilter]);

  return (
    <main style={{
      minHeight: "100vh",
      background: "#0e0d0b",
      color: "#f0ece4",
      padding: "48px 24px",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <nav style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          <Link href="/admin/usage" style={{ color: "#c8935a" }}>Speedometer</Link>
          <Link href="/dashboard" style={{ color: "#c8935a" }}>Dashboard</Link>
          <button onClick={() => loadFeedback(true)} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </nav>

        <section style={{
          border: "1px solid #26211c",
          borderRadius: 28,
          padding: 32,
          background: "rgba(18,16,13,0.95)",
          marginBottom: 22
        }}>
          <div style={{ color: "#c8935a", fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase" }}>
            Admin Feedback
          </div>

          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(48px, 8vw, 82px)", margin: "12px 0 0" }}>
            The complaint box.
          </h1>

          {data && (
            <p style={{ color: "#aaa096", lineHeight: 1.7 }}>
              Total: {data.summary.total} / New: {data.summary.newCount} / Reviewed: {data.summary.reviewedCount} / Fixed: {data.summary.fixedCount} / Ignored: {data.summary.ignoredCount}
            </p>
          )}
        </section>

        {loading && <p>Loading feedback...</p>}
        {error && <p style={{ color: "#f0a0a0" }}>{error}</p>}

        {data && (
          <section style={{
            border: "1px solid #26211c",
            borderRadius: 24,
            padding: 22,
            background: "rgba(18,16,13,0.95)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 18 }}>
              <h2 style={{ fontFamily: "Georgia, serif", fontSize: 34, margin: 0 }}>Feedback items</h2>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  style={{ padding: 10, borderRadius: 10, background: "#0e0d0b", color: "#f0ece4", border: "1px solid #302a24" }}
                >
                  <option value="all">All Statuses</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>

                <select
                  value={toolFilter}
                  onChange={(event) => setToolFilter(event.target.value)}
                  style={{ padding: 10, borderRadius: 10, background: "#0e0d0b", color: "#f0ece4", border: "1px solid #302a24" }}
                >
                  <option value="all">All Tools</option>
                  {toolOptions.map((tool) => (
                    <option key={tool} value={tool}>{toolLabel(tool)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              {filteredItems.map((item) => (
                <FeedbackCard key={item.id} item={item} onSave={updateItem} />
              ))}

              {filteredItems.length === 0 && <p>No feedback matches this filter.</p>}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function FeedbackCard({
  item,
  onSave,
}: {
  item: FeedbackItem;
  onSave: (id: string, status: string, adminNote: string) => Promise<void>;
}) {
  const [status, setStatus] = useState(item.status);
  const [adminNote, setAdminNote] = useState(item.admin_note || "");

  return (
    <article style={{
      border: "1px solid #26211c",
      borderRadius: 18,
      padding: 18,
      background: "#11100e"
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 10 }}>
        <div style={{ color: "#c8935a", fontFamily: "monospace", fontWeight: 900 }}>
          {typeLabel(item.feedback_type)} / {item.status}
        </div>

        <div style={{ color: "#8f867b", fontSize: 13 }}>
          {formatDate(item.created_at)} • {item.email || "No email"} • {toolLabel(item.tool)}
        </div>
      </div>

      <div style={{ color: "#8f867b", fontSize: 13, marginBottom: 12 }}>
        Page: {item.page_path || "Unknown"}
      </div>

      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.65, marginBottom: 16 }}>
        {item.message}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "160px 1fr auto", gap: 10 }}>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          style={{ padding: 10, borderRadius: 10, background: "#0e0d0b", color: "#f0ece4", border: "1px solid #302a24" }}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>

        <input
          value={adminNote}
          onChange={(event) => setAdminNote(event.target.value)}
          placeholder="Admin note..."
          style={{ padding: 10, borderRadius: 10, background: "#0e0d0b", color: "#f0ece4", border: "1px solid #302a24" }}
        />

        <button
          type="button"
          onClick={() => onSave(item.id, status, adminNote)}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "none",
            background: "#c8935a",
            color: "#0e0d0b",
            fontFamily: "monospace",
            fontWeight: 900,
            cursor: "pointer"
          }}
        >
          Save
        </button>
      </div>
    </article>
  );
}

