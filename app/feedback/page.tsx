"use client";

import { useState } from "react";
import Link from "next/link";

export default function FeedbackPage() {
  const [message, setMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState("general");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function sendFeedback(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSending(true);
    setStatus("");
    setError("");

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          feedbackType,
          message,
          tool: "app",
          pagePath: typeof window !== "undefined" ? window.location.href : "",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not send feedback.");
      }

      setStatus("Feedback sent. Thank you.");
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
      <div style={{ maxWidth: 820, margin: "0 auto" }}>
        <Link href="/dashboard" style={{ color: "#c8935a", textDecoration: "none" }}>
          Back to Dashboard
        </Link>

        <section style={{
          border: "1px solid #26211c",
          borderRadius: 28,
          padding: 32,
          marginTop: 24,
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
            Send it here.
          </p>
        </section>

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
              <option value="bug">Something broke</option>
              <option value="confusing">Something confused me</option>
              <option value="useful">This helped</option>
              <option value="bad_report">The report sucked</option>
              <option value="feature">Feature request</option>
              <option value="general">General note</option>
            </select>

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
                lineHeight: 1.6
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
      </div>
    </main>
  );
}
