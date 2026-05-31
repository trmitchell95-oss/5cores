"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

type FeedbackItem = {
  id: string;
  created_at: string;
  email: string | null;
  feedback_type: string;
  tool: string | null;
  page_path: string | null;
  message: string;
  status: string;
  admin_note: string | null;
};

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadFeedback() {
    try {
      setLoading(true);
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

      setItems(result.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeedback();
  }, []);

  return (
    <main style={{
      minHeight: "100vh",
      background: "#0e0d0b",
      color: "#f0ece4",
      padding: "48px 24px",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <nav style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <Link href="/admin/usage" style={{ color: "#c8935a" }}>Speedometer</Link>
          <Link href="/dashboard" style={{ color: "#c8935a" }}>Dashboard</Link>
          <button onClick={loadFeedback}>Refresh</button>
        </nav>

        <h1 style={{ fontFamily: "Georgia, serif", fontSize: 72, margin: 0 }}>
          The complaint box.
        </h1>

        <p style={{ color: "#aaa096", lineHeight: 1.7 }}>
          Beta feedback from testers.
        </p>

        {loading && <p>Loading feedback...</p>}
        {error && <p style={{ color: "#f0a0a0" }}>{error}</p>}

        <section style={{ display: "grid", gap: 14, marginTop: 24 }}>
          {items.map((item) => (
            <article
              key={item.id}
              style={{
                border: "1px solid #26211c",
                borderRadius: 18,
                padding: 18,
                background: "rgba(18,16,13,0.95)"
              }}
            >
              <div style={{ color: "#c8935a", fontFamily: "monospace", marginBottom: 8 }}>
                {item.feedback_type} / {item.status}
              </div>

              <div style={{ color: "#8f867b", fontSize: 13, marginBottom: 12 }}>
                {new Date(item.created_at).toLocaleString()} • {item.email || "No email"} • {item.tool || "app"}
                <br />
                {item.page_path || ""}
              </div>

              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                {item.message}
              </div>
            </article>
          ))}

          {!loading && items.length === 0 && <p>No feedback yet.</p>}
        </section>
      </div>
    </main>
  );
}
