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

function getDefaultDestination() {
  return isIdeanatorHost() ? "/idea" : "/dashboard";
}

function getSafeNextPath() {
  if (typeof window === "undefined") return "/dashboard";

  const params = new URLSearchParams(window.location.search);
  const next = params.get("next") || "";

  if (!next) {
    return getDefaultDestination();
  }

  try {
    const decoded = decodeURIComponent(next);

    if (!decoded.startsWith("/") || decoded.startsWith("//")) {
      return getDefaultDestination();
    }

    return decoded;
  } catch {
    return getDefaultDestination();
  }
}

function getLoginProductLabel() {
  return isIdeanatorHost() ? "The Ideanator" : "HOVEL Editor";
}

function getHomeHref() {
  return isIdeanatorHost() ? "/idea" : "/";
}

export default function LoginPage() {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [destination, setDestination] = useState("/dashboard");
  const [productLabel, setProductLabel] = useState("HOVEL Editor");
  const [homeHref, setHomeHref] = useState("/");

  useEffect(() => {
    const nextDestination = getSafeNextPath();

    setDestination(nextDestination);
    setProductLabel(getLoginProductLabel());
    setHomeHref(getHomeHref());

    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        window.location.href = nextDestination;
      }
    }

    checkSession();
  }, []);

  const isIdeanatorLogin = useMemo(() => productLabel === "The Ideanator", [productLabel]);

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

        window.location.href = destination;
        return;
      }

      if (!inviteCode.trim()) {
        setError("Enter the beta invite code.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
          inviteCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not create account.");
        setLoading(false);
        return;
      }

      setMessage(
        data.message ||
          "Account created. Check your email if confirmation is required, then sign in."
      );
      setMode("signin");
      setPassword("");
      setInviteCode("");
      setShowPassword(false);
      setLoading(false);
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
    setInviteCode("");
    setShowPassword(false);
  }

  return (
    <div
      className={isIdeanatorLogin ? "login-shell idea-login" : "login-shell"}
      style={{
        minHeight: "100vh",
        background: isIdeanatorLogin
          ? "linear-gradient(135deg, #332313 0%, #242018 46%, #1c211e 100%)"
          : "#0e0d0b",
        color: "#f0ece4",
        fontFamily: "Georgia, serif",
      }}
    >
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

        .idea-login .card {
          background: rgba(43, 38, 30, 0.94);
          border-color: rgba(255, 221, 159, 0.22);
          border-radius: 28px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.42);
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

        .idea-login .back-link {
          color: rgba(245, 241, 232, 0.58);
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

        .idea-login .eyebrow {
          color: #f0b35f;
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

        .idea-login .subtitle {
          color: #ddd5c7;
        }

        .tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border: 1px solid #2a2520;
          margin-bottom: 22px;
        }

        .idea-login .tabs {
          border-color: rgba(255, 221, 159, 0.2);
          border-radius: 16px;
          overflow: hidden;
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

        .idea-login .tab.active {
          background: #f0b35f;
          color: #18100a;
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

        .idea-login .label {
          color: #bdb4a8;
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

        .idea-login .input {
          border-color: rgba(255, 221, 159, 0.18);
          background: rgba(0, 0, 0, 0.22);
          border-radius: 14px;
        }

        .input:focus {
          border-color: #c8935a;
        }

        .idea-login .input:focus {
          border-color: #f0b35f;
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

        .idea-login .password-toggle {
          color: #f0b35f;
          border-color: rgba(255, 221, 159, 0.2);
          background: rgba(255, 255, 255, 0.04);
          border-radius: 10px;
        }

        .password-toggle:hover {
          border-color: #c8935a;
          color: #f0ece4;
        }

        .invite-help {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: #6b6560;
          line-height: 1.45;
          margin-top: 7px;
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

        .idea-login .button {
          background:
            radial-gradient(circle at 18px 50%, #fff3c4 0 4px, transparent 5px),
            linear-gradient(180deg, #ffd27a 0%, #f0b35f 52%, #c98438 100%);
          color: #18100a;
          border: 1px solid rgba(255, 241, 190, 0.7);
          border-radius: 999px;
          padding-left: 34px;
          font-weight: 900;
          box-shadow:
            0 0 0 1px rgba(255, 208, 122, 0.18),
            0 0 22px rgba(240, 179, 95, 0.28),
            inset 0 1px 0 rgba(255, 255, 255, 0.42);
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

        .idea-login .text-link {
          color: rgba(245, 241, 232, 0.58);
        }

        .text-link:hover {
          color: #c8935a;
        }

        .idea-login .text-link:hover {
          color: #f0b35f;
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

        .idea-login .note {
          color: rgba(245, 241, 232, 0.5);
        }

        .terms-link {
          display: inline-block;
          margin-top: 8px;
          color: #c8935a;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
        }

        .idea-login .terms-link {
          color: #f0b35f;
        }

        .terms-link:hover {
          text-decoration: underline;
        }
      `}</style>

      <div className="ideanator-login-shell wrap">
        <div className="ideanator-login-shell card">
          <a className="ideanator-login-shell back-link" href={homeHref}>
            Back to {productLabel}
          </a>

          <div className="ideanator-login-shell eyebrow">
            {isIdeanatorLogin ? "The Ideanator Access" : "The Council Beta Access"}
          </div>

          <div className="ideanator-login-shell title">
            {mode === "signin" ? "Sign In" : mode === "signup" ? "Create Account" : "Reset Password"}
          </div>

          <div className="ideanator-login-shell subtitle">
            {mode === "forgot"
              ? "Enter your email and we will send you a password reset link."
              : mode === "signup"
                ? "Create a beta account with your invite code."
                : isIdeanatorLogin
                  ? "Sign in to save ideas, reopen reports, and keep working from where you left off."
                  : "Sign in to submit manuscripts, run the council, and reopen saved reports."}
          </div>

          {mode !== "forgot" && (
            <div className="ideanator-login-shell tabs">
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
            <div className="ideanator-login-shell field">
              <label className="ideanator-login-shell label">Email</label>
              <input
                className="ideanator-login-shell input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="you@example.com"
              />
            </div>

            {mode !== "forgot" && (
              <div className="ideanator-login-shell field">
                <label className="ideanator-login-shell label">Password</label>
                <div className="ideanator-login-shell password-wrap">
                  <input
                    className="ideanator-login-shell input"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    placeholder="Minimum 6 characters"
                  />
                  <button
                    className="ideanator-login-shell password-toggle"
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

            {mode === "signup" && (
              <div className="ideanator-login-shell field">
                <label className="ideanator-login-shell label">Beta Invite Code</label>
                <input
                  className="ideanator-login-shell input"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  disabled={loading}
                  placeholder="Enter invite code"
                />
                <div className="ideanator-login-shell invite-help">
                  New beta accounts require an invite code. Existing users can still sign in normally.
                </div>
              </div>
            )}

            <button className="ideanator-login-shell button" type="submit" disabled={loading}>
              {loading
                ? "Working..."
                : mode === "signin"
                  ? "Sign In"
                  : mode === "signup"
                    ? "Create Account"
                    : "Send Reset Link"}
            </button>
          </form>

          <div className="ideanator-login-shell link-row">
            {mode === "signin" && (
              <button className="ideanator-login-shell text-link" type="button" onClick={() => switchMode("forgot")}>
                Forgot Password?
              </button>
            )}

            {mode === "forgot" && (
              <button className="ideanator-login-shell text-link" type="button" onClick={() => switchMode("signin")}>
                Back to Sign In
              </button>
            )}

            {mode === "signup" && (
              <button className="ideanator-login-shell text-link" type="button" onClick={() => switchMode("signin")}>
                Already Have an Account?
              </button>
            )}
          </div>

          {error && <div className="ideanator-login-shell error">{error}</div>}
          {message && <div className="ideanator-login-shell message">{message}</div>}

          <div className="ideanator-login-shell note">
            Beta access is free for now. New accounts require an invite code. One account can use HOVEL Editor and The Ideanator, but each product keeps its own front door.
            <br />
            <a className="ideanator-login-shell terms-link" href="/beta-terms">Beta Terms / Privacy</a>
          </div>
        </div>
      </div>
    </div>
  );
}


