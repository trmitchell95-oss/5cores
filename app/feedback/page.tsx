"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const FEEDBACK_TYPES = [
  { value: "bug", label: "Something broke" },
  { value: "confusing", label: "Something confused me" },
  { value: "useful", label: "This helped" },
  { value: "bad_report", label: "The report sucked" },
  { value: "feature", label: "Feature request" },
  { value: "general", label: "General note" },
];

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function guessTool(value: string) {
  const lower = value.toLowerCase();

  if (lower.includes("/sphinx")) return "sphinx";
  if (lower.includes("/submit")) return "5core";
  if (lower.includes("/reports/")) return "saved_report";
  if (lower.includes("/dashboard")) return "dashboard";
  if (lower.includes("/admin")) return "admin";

  return "app";
}

export default function FeedbackPage() {
  const [email, setEmail] = useState("");
  const [hasSession, setHasSession] = useState(false);
  const [pagePath, setPagePath] = useState("");
  const [tool, setTool] = useState("app");
  const [feedbackType, setFeedbackType] = useState("general");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function loadSession() {
      const params = new URLSearchParams(window.location.search);
      const from = params.get("from") || document.referrer || window.location.href;

      setPagePath(from);
      setTool(guessTool(from));

      const supabase = getSupabaseClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setHasSession(false);
        return;
      }

      setHasSession(true);
      setEmail(session.user.email || "");
    }

    loadSession();
  }, []);

  async function sendFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSending(true);
    setStatus("");
    setError("");

    try {
      const supabase = getSupabaseClient();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError("Sign in before sending feedback.");
        return;
      }

      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          feedbackType,
          message,
          tool,
          pagePath,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not send feedback.");
      }

      setStatus("Feedback sent. Thank you. The complaint has entered the sacred toolbox.");
      setMessage("");
      setFeedbackType("general");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "#0e0d0b",
      color: "#f0ece4",
      padding: "48px 24px",
      fontFamily: "Arial, sans-serif"
    }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <nav style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 24
        }}>
          <Link href="/dashboard" style={{ color: "#c8935a", textDecoration: "none", fontFamily: "monospace" }}>
            Back to Dashboard
          </Link>

          <span style={{ color: "#8f867b", fontSize: 13 }}>
            {email || "Not signed in"}
          </span>
        </nav>

        <section style={{
          border: "1px solid #26211c",
          borderRadius: 28,
          padding: 32,
          background: "rgba(18,16,13,0.95)"
        }}>
          <div style={{
            color: "#c8935a",
            fontFamily: "monospace",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            fontSize: 12,
            marginBottom: 12
          }}>
            Beta Feedback
          </div>

          <h1 style={{
            fontFamily: "Georgia, serif",
            fontSize: "clamp(48px, 8vw, 82px)",
            lineHeight: 0.95,
            margin: 0
          }}>
            Tell us what happened.
          </h1>

          <p style={{ color: "#aaa096", lineHeight: 1.7, marginTop: 18 }}>
            Found a bug, got confused, liked a report, hated a report, or thought of a feature?
            Send it here. This helps turn the beta from a neat machine into something people can actually use.
          </p>
        </section>

        {!hasSession ? (
          <section style={{
            border: "1px solid #4a3520",
            borderRadius: 22,
            padding: 24,
            marginTop: 22,
            background: "#1a130c",
            color: "#d8b072"
          }}>
            You need to sign in before sending feedback.
            <br />
            <Link href="/login" style={{ display: "inline-block", marginTop: 14, color: "#c8935a" }}>
              Sign In
            </Link>
          </section>
        ) : (
          <section style={{
            border: "1px solid #26211c",
            borderRadius: 24,
            padding: 26,
            marginTop: 22,
            background: "rgba(18,16,13,0.95)"
          }}>
            {status && (
              <div style={{
                border: "1px solid #214a2d",
                background: "#0a1a0e",
                color: "#98d8aa",
                padding: 14,
                borderRadius: 12,
                marginBottom: 16
              }}>
                {status}
              </div>
            )}

            {error && (
              <div style={{
                border: "1px solid #5a2020",
                background: "#2a1010",
                color: "#f0a0a0",
                padding: 14,
                borderRadius: 12,
                marginBottom: 16
              }}>
                {error}
              </div>
            )}

            <form onSubmit={sendFeedback}>
              <label style={{ display: "block", marginBottom: 8, color: "#8f867b", fontFamily: "monospace" }}>
                Feedback Type
              </label>

              <select
                value={feedbackType}
                onChange={(event) => setFeedbackType(event.target.value)}
                style={{
                  width: "100%",
                  padding: 14,
                  marginBottom: 16,
                  borderRadius: 12,
                  background: "#0e0d0b",
                  color: "#f0ece4",
                  border: "1px solid #302a24"
                }}
              >
                {FEEDBACK_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              <label style={{ display: "block", marginBottom: 8, color: "#8f867b", fontFamily: "monospace" }}>
                Tool / Area
              </label>

              <input
                value={tool}
                onChange={(event) => setTool(event.target.value)}
                style={{
                  width: "100%",
                  padding: 14,
                  marginBottom: 16,
                  borderRadius: 12,
                  background: "#0e0d0b",
                  color: "#f0ece4",
                  border: "1px solid #302a24",
                  boxSizing: "border-box"
                }}
              />

              <label style={{ display: "block", marginBottom: 8, color: "#8f867b", fontFamily: "monospace" }}>
                Page / Context
              </label>

              <input
                value={pagePath}
                onChange={(event) => setPagePath(event.target.value)}
                style={{
                  width: "100%",
                  padding: 14,
                  marginBottom: 16,
                  borderRadius: 12,
                  background: "#0e0d0b",
                  color: "#f0ece4",
                  border: "1px solid #302a24",
                  boxSizing: "border-box"
                }}
              />

              <label style={{ display: "block", marginBottom: 8, color: "#8f867b", fontFamily: "monospace" }}>
                Message
              </label>

              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Tell me what broke, helped, confused you, or needs to exist..."
                style={{
                  width: "100%",
                  minHeight: 180,
                  padding: 14,
                  borderRadius: 12,
                  background: "#0e0d0b",
                  color: "#f0ece4",
                  border: "1px solid #302a24",
                  resize: "vertical",
                  lineHeight: 1.6,
                  boxSizing: "border-box"
                }}
              />

              <button
                type="submit"
                disabled={sending || !message.trim()}
                style={{
                  width: "100%",
                  marginTop: 16,
                  minHeight: 52,
                  borderRadius: 14,
                  border: "none",
                  background: "#c8935a",
                  color: "#0e0d0b",
                  fontFamily: "monospace",
                  fontWeight: 900,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  cursor: sending || !message.trim() ? "not-allowed" : "pointer",
                  opacity: sending || !message.trim() ? 0.55 : 1
                }}
              >
                {sending ? "Sending..." : "Send Feedback"}
              </button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
