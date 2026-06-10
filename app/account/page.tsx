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
  return isIdeanator ? "The Ideanator" : "HOVEL Editor";
}

function getHomeHref(isIdeanator: boolean) {
  return isIdeanator ? "/idea" : "/dashboard";
}

export default function AccountPage() {
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [isIdeanator, setIsIdeanator] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const productIsIdeanator = isIdeanatorHost();
    setIsIdeanator(productIsIdeanator);

    async function loadAccount() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = `/login?next=${encodeURIComponent("/account")}`;
        return;
      }

      setEmail(session.user.email || "");
      setChecking(false);
    }

    loadAccount();
  }, []);

  const productLabel = useMemo(() => getProductLabel(isIdeanator), [isIdeanator]);
  const homeHref = useMemo(() => getHomeHref(isIdeanator), [isIdeanator]);

  async function handlePasswordChange(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setUpdating(true);
    setError("");
    setMessage("");

    if (!newPassword || !confirmPassword) {
      setError("Enter and confirm your new password.");
      setUpdating(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      setUpdating(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setUpdating(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setError(error.message || "Could not update password.");
      setUpdating(false);
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setMessage("Password updated. The front door has a new lock.");
    setUpdating(false);
  }

  async function handleSendResetEmail() {
    setSendingReset(true);
    setError("");
    setMessage("");

    if (!email) {
      setError("No account email found.");
      setSendingReset(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message || "Could not send reset email.");
      setSendingReset(false);
      return;
    }

    setMessage("Password reset email sent. Check your inbox.");
    setSendingReset(false);
  }

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    window.location.href = isIdeanator ? "/idea" : "/";
  }

  return (
    <main className={isIdeanator ? "account-shell idea-account" : "account-shell"}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #060b16;
        }

        .account-shell {
          min-height: 100vh;
          background: #060b16;
          color: #eef4ff;
          font-family: Georgia, serif;
          padding: 48px 24px;
        }

        .idea-account {
          background:
            radial-gradient(circle at top left, rgba(245, 158, 11, 0.28), transparent 34rem),
            radial-gradient(circle at bottom right, rgba(255, 202, 118, 0.12), transparent 32rem),
            linear-gradient(135deg, #0b1020 0%, #0f172a 46%, #111827 100%);
        }

        .wrap {
          min-height: calc(100vh - 96px);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card {
          width: 100%;
          max-width: 520px;
          background: #0f172a;
          border: 1px solid #2a2520;
          padding: 36px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.34);
        }

        .idea-account .card {
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
          color: #93c5fd;
        }

        .eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.2em;
          color: #93c5fd;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .idea-account .eyebrow {
          color: #93c5fd;
        }

        .title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 52px;
          line-height: 1;
          font-weight: 700;
          color: #eef4ff;
          margin-bottom: 10px;
        }

        .subtitle,
        .note {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #b9afa3;
          margin-bottom: 24px;
        }

        .account-box {
          border: 1px solid rgba(255, 221, 159, 0.14);
          background: rgba(0, 0, 0, 0.18);
          border-radius: 18px;
          padding: 16px;
          margin-bottom: 22px;
          font-family: 'DM Sans', sans-serif;
          color: #ddd5c7;
        }

        .account-box strong {
          display: block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.12em;
          color: #93c5fd;
          text-transform: uppercase;
          margin-bottom: 6px;
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
          border-color: #93c5fd;
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
          color: #93c5fd;
          border-radius: 10px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 8px 10px;
          cursor: pointer;
        }

        .button,
        .button-secondary,
        .button-danger {
          width: 100%;
          margin-top: 8px;
          padding: 14px 20px;
          border-radius: 999px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .button {
          border: 1px solid rgba(255, 241, 190, 0.7);
          background:
            radial-gradient(circle at 18px 50%, #dbeafe 0 4px, transparent 5px),
            linear-gradient(180deg, #dbeafe 0%, #93c5fd 52%, #60a5fa 100%);
          color: #18100a;
          padding-left: 34px;
        }

        .button-secondary {
          border: 1px solid rgba(255, 221, 159, 0.22);
          background: rgba(255, 255, 255, 0.04);
          color: #93c5fd;
        }

        .button-danger {
          border: 1px solid rgba(184, 64, 64, 0.55);
          background: rgba(70, 16, 16, 0.34);
          color: #f0a0a0;
        }

        .button:disabled,
        .button-secondary:disabled,
        .button-danger:disabled {
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
        <section className="card">
          <a className="back-link" href={homeHref}>
            Back to {productLabel}
          </a>

          <div className="eyebrow">{productLabel} Account</div>
          <div className="title">Account</div>

          <div className="subtitle">
            Change your password, send yourself a reset email, or sign out. No passwords are stored in the app database.
          </div>

          {checking ? (
            <div className="subtitle">Checking account...</div>
          ) : (
            <>
              <div className="account-box">
                <strong>Signed in as</strong>
                {email || "Unknown email"}
              </div>

              <form onSubmit={handlePasswordChange}>
                <div className="field">
                  <label className="label">New Password</label>
                  <div className="password-wrap">
                    <input
                      className="input"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      disabled={updating}
                      placeholder="Minimum 6 characters"
                    />

                    <button
                      className="password-toggle"
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      disabled={updating}
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
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      disabled={updating}
                      placeholder="Retype password"
                    />

                    <button
                      className="password-toggle"
                      type="button"
                      onClick={() => setShowConfirmPassword((current) => !current)}
                      disabled={updating}
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <button className="button" type="submit" disabled={updating}>
                  {updating ? "Updating..." : "Update Password"}
                </button>
              </form>

              <button
                className="button-secondary"
                type="button"
                onClick={handleSendResetEmail}
                disabled={sendingReset}
              >
                {sendingReset ? "Sending..." : "Email Reset Link"}
              </button>

              <button
                className="button-danger"
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                {signingOut ? "Signing Out..." : "Sign Out"}
              </button>

              <div className="note">
                Password changes use Supabase Auth. The app never receives or stores your old password.
              </div>
            </>
          )}

          {error && <div className="error">{error}</div>}
          {message && <div className="message">{message}</div>}
        </section>
      </div>
    </main>
  );
}

