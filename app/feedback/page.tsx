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

function isIdeanatorHostName(hostname: string) {
  return hostname === "theideanator.com" || hostname === "www.theideanator.com";
}

function guessTool(value: string, isIdeanator: boolean) {
  const lower = value.toLowerCase();

  if (isIdeanator || lower.includes("/idea") || lower.includes("/ideanator")) return "ideanator";
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
  const [isIdeanator, setIsIdeanator] = useState(false);
  const [loginHref, setLoginHref] = useState("/login");

  const backHref = isIdeanator ? "/idea" : "/dashboard";
  const backLabel = isIdeanator ? "Back to Ideanator" : "Back to Dashboard";

  useEffect(() => {
    async function loadSession() {
      const ideanatorHost = isIdeanatorHostName(window.location.hostname.toLowerCase());
      setLoginHref(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      const params = new URLSearchParams(window.location.search);
      const from = params.get("from") || document.referrer || window.location.href;

      setIsIdeanator(ideanatorHost);
      setPagePath(from);
      setTool(guessTool(from, ideanatorHost));

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
    <main
      className={isIdeanator ? "feedback-shell idea-feedback" : "feedback-shell"}
      style={{
        minHeight: "100vh",
        background: isIdeanator
          ? "linear-gradient(135deg, #0b1020 0%, #0f172a 46%, #111827 100%)"
          : "#060b16",
        color: "#eef4ff",
        padding: "48px 24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <style>{`
        .feedback-shell {
          background:
            radial-gradient(circle at top left, rgba(200,147,90,0.13), transparent 34rem),
            #060b16;
        }

        .idea-feedback {
          background:
            radial-gradient(circle at top left, rgba(245, 158, 11, 0.26), transparent 36rem),
            radial-gradient(circle at bottom right, rgba(255, 202, 118, 0.12), transparent 32rem),
            linear-gradient(135deg, #0b1020 0%, #0f172a 46%, #111827 100%) !important;
        }

        .feedback-card {
          border: 1px solid #26211c;
          border-radius: 28px;
          padding: 32px;
          background: rgba(18,16,13,0.95);
        }

        .idea-feedback .feedback-card,
        .idea-feedback .form-card {
          border-color: rgba(255, 221, 159, 0.2) !important;
          background: rgba(43, 38, 30, 0.92) !important;
        }

        .top-link {
          color: #93c5fd;
          text-decoration: none;
          font-family: monospace;
        }

        .idea-feedback .top-link {
          color: #93c5fd;
        }

        .eyebrow {
          color: #93c5fd;
          font-family: monospace;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          font-size: 12px;
          margin-bottom: 12px;
        }

        .idea-feedback .eyebrow {
          color: #93c5fd;
        }

        .title {
          font-family: Georgia, serif;
          font-size: clamp(48px, 8vw, 82px);
          line-height: 0.95;
          margin: 0;
        }

        .subtitle {
          color: #cbd5e1;
          line-height: 1.7;
          margin-top: 18px;
        }

        .idea-feedback .subtitle {
          color: #ddd5c7;
        }

        .field-label {
          display: block;
          margin-bottom: 8px;
          color: #cbd5e1;
          font-family: monospace;
        }

        .idea-feedback .field-label {
          color: #bdb4a8;
        }

        .field {
          width: 100%;
          padding: 14px;
          margin-bottom: 16px;
          border-radius: 12px;
          background: #060b16;
          color: #eef4ff;
          border: 1px solid #302a24;
          box-sizing: border-box;
        }

        .idea-feedback .field {
          border-color: rgba(255, 221, 159, 0.18);
          background: rgba(0, 0, 0, 0.22);
        }

        .submit-button {
          width: 100%;
          margin-top: 16px;
          min-height: 52px;
          border-radius: 14px;
          border: none;
          background: #93c5fd;
          color: #060b16;
          font-family: monospace;
          font-weight: 900;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .idea-feedback .submit-button {
          background:
            radial-gradient(circle at 18px 50%, #dbeafe 0 4px, transparent 5px),
            linear-gradient(180deg, #dbeafe 0%, #93c5fd 52%, #60a5fa 100%);
          border-radius: 999px;
          color: #18100a;
        }
      `}</style>

      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <nav
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <Link href={backHref} className="top-link">
            {backLabel}
          </Link>

          <span style={{ color: "#cbd5e1", fontSize: 13 }}>
            {email || "Not signed in"}
          </span>
        </nav>

        <section className="feedback-card">
          <div className="eyebrow">
            {isIdeanator ? "Ideanator Feedback" : "Beta Feedback"}
          </div>

          <h1 className="title">Tell us what happened.</h1>

          <p className="subtitle">
            {isIdeanator
              ? "Found a bug, got confused, liked an idea report, hated a verdict, or thought of a feature? Send it here. This helps turn The Ideanator from a useful working tool into something people can actually use."
              : "Found a bug, got confused, liked a report, hated a report, or thought of a feature? Send it here. This helps turn the beta from a neat machine into something people can actually use."}
          </p>
        </section>

        {!hasSession ? (
          <section
            style={{
              border: "1px solid #4a3520",
              borderRadius: 22,
              padding: 24,
              marginTop: 22,
              background: "#1a130c",
              color: "#d8b072",
            }}
          >
            You need to sign in before sending feedback.
            <br />
            <Link href={loginHref} style={{ display: "inline-block", marginTop: 14, color: "#93c5fd" }}>
              Sign In
            </Link>
          </section>
        ) : (
          <section
            className="form-card"
            style={{
              border: "1px solid #26211c",
              borderRadius: 24,
              padding: 26,
              marginTop: 22,
              background: "rgba(18,16,13,0.95)",
            }}
          >
            {status && (
              <div
                style={{
                  border: "1px solid #214a2d",
                  background: "#0a1a0e",
                  color: "#98d8aa",
                  padding: 14,
                  borderRadius: 12,
                  marginBottom: 16,
                }}
              >
                {status}
              </div>
            )}

            {error && (
              <div
                style={{
                  border: "1px solid #5a2020",
                  background: "#2a1010",
                  color: "#f0a0a0",
                  padding: 14,
                  borderRadius: 12,
                  marginBottom: 16,
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={sendFeedback}>
              <label className="field-label">Feedback Type</label>

              <select
                value={feedbackType}
                onChange={(event) => setFeedbackType(event.target.value)}
                className="field"
              >
                {FEEDBACK_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>

              <label className="field-label">Tool / Area</label>

              <input
                value={tool}
                onChange={(event) => setTool(event.target.value)}
                className="field"
              />

              <label className="field-label">Page / Context</label>

              <input
                value={pagePath}
                onChange={(event) => setPagePath(event.target.value)}
                className="field"
              />

              <label className="field-label">Message</label>

              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Tell me what broke, helped, confused you, or needs to exist..."
                className="field"
                style={{
                  minHeight: 180,
                  resize: "vertical",
                  lineHeight: 1.6,
                }}
              />

              <button
                type="submit"
                disabled={sending || !message.trim()}
                className="submit-button"
                style={{
                  cursor: sending || !message.trim() ? "not-allowed" : "pointer",
                  opacity: sending || !message.trim() ? 0.55 : 1,
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



