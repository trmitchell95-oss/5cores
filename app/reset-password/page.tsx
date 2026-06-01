"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setHasSession(!!session);
      setChecking(false);
    }

    checkSession();
  }, []);

  async function handleReset(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    if (!password || !confirmPassword) {
      setError("Enter and confirm your new password.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMessage("Password updated. Redirecting to your dashboard...");
    setLoading(false);

    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1200);
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
      `}</style>

      <div className="wrap">
        <div className="card">
          <a className="back-link" href="/login">Back to Login</a>

          <div className="eyebrow">The Council Account Recovery</div>
          <div className="title">New Password</div>
          <div className="subtitle">
            Enter a new password for your account.
          </div>

          {checking ? (
            <div className="subtitle">Checking reset link...</div>
          ) : !hasSession ? (
            <div className="error">
              This reset link is missing, expired, or already used. Go back to login and request a new password reset email.
            </div>
          ) : (
            <form onSubmit={handleReset}>
              <div className="field">
                <label className="label">New Password</label>
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

              <div className="field">
                <label className="label">Confirm New Password</label>
                <div className="password-wrap">
                  <input
                    className="input"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    placeholder="Retype password"
                  />
                  <button
                    className="password-toggle"
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    disabled={loading}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button className="button" type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          )}

          {error && <div className="error">{error}</div>}
          {message && <div className="message">{message}</div>}
        </div>
      </div>
    </div>
  );
}


