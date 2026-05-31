"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        window.location.href = "/dashboard";
      }
    }

    checkSession();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Enter your email address.");
      setLoading(false);
      return;
    }

    try {
      if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        setMessage("Password reset email sent. Check your inbox and follow the link.");
        setLoading(false);
        return;
      }

      if (!password.trim()) {
        setError("Enter your password.");
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setLoading(false);
        return;
      }

      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        window.location.href = "/dashboard";
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          setError(error.message);
          setLoading(false);
          return;
        }

        setMessage("Account created. Check your email if confirmation is required, then sign in.");
        setMode("signin");
        setPassword("");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  function switchMode(nextMode: "signin" | "signup" | "forgot") {
    setMode(nextMode);
    setError("");
    setMessage("");
    setPassword("");
    setShowPassword(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0e0d0b", color: "#f0ece4", fontFamily: "Georgia, serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
        }

        .wrap {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
        }

        .card {
          width: 100%;
          max-width: 460px;
          background: #161410;
          border: 1px solid #2a2520;
          padding: 36px;
        }

        .back-link {
          display: inline-block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          color: #5a5448;
          text-decoration: none;
          text-transform: uppercase;
          margin-bottom: 28px;
        }

        .back-link:hover {
          color: #9a9186;
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
          font-size: 46px;
          line-height: 1;
          font-weight: 700;
          color: #f0ece4;
          margin-bottom: 10px;
        }

        .subtitle {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #9a9186;
          margin-bottom: 28px;
        }

        .tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border: 1px solid #2a2520;
          margin-bottom: 22px;
        }

        .tab {
          border: none;
          background: transparent;
          color: #6b6560;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 12px;
          cursor: pointer;
        }

        .tab.active {
          background: #c8935a;
          color: #0e0d0b;
        }

        .field {
          margin-bottom: 16px;
        }

        .label {
          display: block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          color: #6b6560;
          text-transform: uppercase;
          margin-bottom: 7px;
        }

        .input {
          width: 100%;
          background: #0e0d0b;
          border: 1px solid #2a2520;
          color: #f0ece4;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          padding: 13px 14px;
          outline: none;
        }

        .input:focus {
          border-color: #c8935a;
        }

        .password-wrap {
          position: relative;
        }

        .password-wrap .input {
          padding-right: 86px;
        }

        .password-toggle {
          position: absolute;
          right: 8px;
          top: 50%;
          transform: translateY(-50%);
          border: 1px solid #2a2520;
          background: #161410;
          color: #c8935a;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 8px 10px;
          cursor: pointer;
        }

        .password-toggle:hover {
          border-color: #c8935a;
          color: #f0ece4;
        }

        .button {
          width: 100%;
          margin-top: 8px;
          padding: 14px 20px;
          border: none;
          background: #c8935a;
          color: #0e0d0b;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .link-row {
          margin-top: 18px;
          display: flex;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
        }

        .text-link {
          border: none;
          background: none;
          color: #6b6560;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          padding: 0;
        }

        .text-link:hover {
          color: #c8935a;
        }

        .error,
        .message {
          margin-top: 18px;
          padding: 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          line-height: 1.5;
        }

        .error {
          background: #2a1010;
          border-left: 2px solid #b84040;
          color: #d68c8c;
        }

        .message {
          background: #0a1a0e;
          border-left: 2px solid #4a9c6a;
          color: #8bc99d;
        }

        .note {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: #5a5448;
          line-height: 1.5;
          margin-top: 20px;
        }
      `}</style>

      <div className="wrap">
        <div className="card">
          <a className="back-link" href="/">Back to Home</a>

          <div className="eyebrow">5 CORE Beta Access</div>

          <div className="title">
            {mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Reset Password"}
          </div>

          <div className="subtitle">
            {mode === "forgot"
              ? "Enter your email and we will send you a password reset link."
              : "Sign in to submit manuscripts, run the council, and reopen saved reports."}
          </div>

          {mode !== "forgot" && (
            <div className="tabs">
              <button
                type="button"
                className={`tab ${mode === "signin" ? "active" : ""}`}
                onClick={() => switchMode("signin")}
              >
                Sign In
              </button>

              <button
                type="button"
                className={`tab ${mode === "signup" ? "active" : ""}`}
                onClick={() => switchMode("signup")}
              >
                Sign Up
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="you@example.com"
              />
            </div>

            {mode !== "forgot" && (
              <div className="field">
                <label className="label">Password</label>
                <div className="password-wrap">
                  <input
                    className="input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    placeholder="Minimum 6 characters"
                  />
                  <button
                    className="password-toggle"
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    disabled={loading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>
            )}

            <button className="button" type="submit" disabled={loading}>
              {loading
                ? "Working..."
                : mode === "signin"
                  ? "Sign In"
                  : mode === "signup"
                    ? "Create Account"
                    : "Send Reset Link"}
            </button>
          </form>

          <div className="link-row">
            {mode === "signin" && (
              <button className="text-link" type="button" onClick={() => switchMode("forgot")}>
                Forgot Password?
              </button>
            )}

            {mode === "forgot" && (
              <button className="text-link" type="button" onClick={() => switchMode("signin")}>
                Back to Sign In
              </button>
            )}

            {mode === "signup" && (
              <button className="text-link" type="button" onClick={() => switchMode("signin")}>
                Already Have an Account?
              </button>
            )}
          </div>

          {error && <div className="error">{error}</div>}
          {message && <div className="message">{message}</div>}

          <div className="note">
            Beta access is free for now. Each account keeps its own dashboard and saved report history.
          </div>
        </div>
      </div>
    </div>
  );
}

