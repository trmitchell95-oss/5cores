"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function isIdeanatorHost() {
  if (typeof window === "undefined") return false;

  const host = window.location.hostname.toLowerCase();

  return host === "theideanator.com" || host === "www.theideanator.com";
}

function getProductLabel(isIdeanator: boolean) {
  return isIdeanator ? "The Ideanator" : "HOVEL Ideanator";
}

function getDestination(isIdeanator: boolean) {
  return isIdeanator ? "/idea" : "/dashboard";
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [isIdeanator, setIsIdeanator] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const productIsIdeanator = isIdeanatorHost();
    setIsIdeanator(productIsIdeanator);

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setHasSession(!!session);
      setChecking(false);
    }

    checkSession();
  }, []);

  const productLabel = useMemo(() => getProductLabel(isIdeanator), [isIdeanator]);
  const destination = useMemo(() => getDestination(isIdeanator), [isIdeanator]);

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
      setError(error.message || "Could not update password.");
      setLoading(false);
      return;
    }

    setMessage("Password updated. Redirecting...");
    setLoading(false);

    setTimeout(() => {
      window.location.href = destination;
    }, 1200);
  }

  return (
    <main className={isIdeanator ? "reset-shell idea-reset" : "reset-shell"}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #11100c;
        }

        .reset-shell {
          min-height: 100vh;
          background: #11100c;
          color: #eef4ff;
          font-family: Georgia, serif;
          padding: 48px 24px;
        }

        .idea-reset {
          background:
            radial-gradient(circle at top left, rgba(245, 158, 11, 0.28), transparent 34rem),
            radial-gradient(circle at bottom right, rgba(255, 202, 118, 0.12), transparent 32rem),
            linear-gradient(135deg, #28180d 0%, #332115 46%, #11100c 100%);
        }

        .wrap {
          min-height: calc(100vh - 96px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card {
          width: 100%;
          max-width: 480px;
          background: #332115;
          border: 1px solid #2a2520;
          padding: 36px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.34);
        }

        .idea-reset .card {
          background: rgba(43, 38, 30, 0.94);
          border-color: rgba(255, 221, 159, 0.22);
          border-radius: 28px;
        }

        .back-link {
          display: inline-block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          color: #8a8178;
          text-decoration: none;
          text-transform: uppercase;
          margin-bottom: 28px;
        }

        .back-link:hover {
          color: #d88a1f;
        }

        .eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.2em;
          color: #d88a1f;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .idea-reset .eyebrow {
          color: #d88a1f;
        }

        .title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 52px;
          line-height: 1;
          font-weight: 700;
          color: #eef4ff;
          margin-bottom: 10px;
        }

        .subtitle {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #b9afa3;
          margin-bottom: 24px;
        }

        .field {
          margin-bottom: 16px;
        }

        .label {
          display: block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          color: #bdb4a8;
          text-transform: uppercase;
          margin-bottom: 7px;
        }

        .input {
          width: 100%;
          background: rgba(0, 0, 0, 0.24);
          border: 1px solid rgba(255, 221, 159, 0.18);
          border-radius: 14px;
          color: #eef4ff;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          padding: 13px 14px;
          outline: none;
        }

        .input:focus {
          border-color: #d88a1f;
          box-shadow: 0 0 0 4px rgba(240, 179, 95, 0.13);
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
          border: 1px solid rgba(255, 221, 159, 0.2);
          background: rgba(255, 255, 255, 0.04);
          color: #d88a1f;
          border-radius: 10px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 8px 10px;
          cursor: pointer;
        }

        .button {
          width: 100%;
          margin-top: 8px;
          padding: 14px 20px 14px 34px;
          border: 1px solid rgba(255, 241, 190, 0.7);
          border-radius: 999px;
          background:
            radial-gradient(circle at 18px 50%, #fff1cf 0 4px, transparent 5px),
            linear-gradient(180deg, #fff1cf 0%, #d88a1f 52%, #8c4e11 100%);
          color: #18100a;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          font-weight: 900;
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
      
          /* =========================================================
             RESET RETRO FINAL OVERRIDES
             Directly fixes old blue reset-password page classes.
             ========================================================= */

          .reset-shell {
            background:
              radial-gradient(circle at 14% 0%, rgba(181, 90, 28, 0.25), transparent 32rem),
              radial-gradient(circle at 88% 8%, rgba(91, 117, 55, 0.16), transparent 28rem),
              linear-gradient(135deg, #28180d 0%, #11100c 48%, #2b1a0f 100%) !important;
            color: #f8ecd2 !important;
          }

          .card {
            background:
              linear-gradient(180deg, rgba(51, 33, 21, 0.97), rgba(24, 19, 14, 0.97)) !important;
            color: #f8ecd2 !important;
            border-color: rgba(222, 176, 96, 0.42) !important;
          }

          .title {
            color: #fff1cf !important;
            font-family: Georgia, "Times New Roman", serif !important;
          }

          .input {
            background: #fff8e7 !important;
            color: #11110d !important;
            border-color: rgba(83, 52, 26, 0.58) !important;
          }

          .button,
          .back-link,
          .password-toggle {
            background:
              linear-gradient(180deg, #d88a1f, #8c4e11) !important;
            color: #fff8e7 !important;
            border-color: rgba(255, 220, 145, 0.68) !important;
          }

`}</style>

      <div className="wrap">
        <section className="card">
          <a className="back-link" href="/login">
            Back to Login
          </a>

          <div className="eyebrow">{productLabel} Account Recovery</div>
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
        </section>
      </div>
    </main>
  );
}
