"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: "implicit",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);

function getHostName() {
  if (typeof window === "undefined") return "";

  return window.location.hostname.toLowerCase();
}

function isIdeanatorHost() {
  const host = getHostName();

  return host === "theideanator.com" || host === "www.theideanator.com";
}

function isHovelEditorHost() {
  const host = getHostName();

  return host === "hoveleditor.com" || host === "www.hoveleditor.com";
}

function getCanonicalAuthOrigin() {
  if (typeof window === "undefined") return "";

  if (isIdeanatorHost()) {
    return "https://theideanator.com";
  }

  if (isHovelEditorHost()) {
    return "https://hoveleditor.com";
  }

  return window.location.origin;
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

function isIdeanatorDestination(destination: string) {
  return (
    destination === "/idea" ||
    destination.startsWith("/idea/") ||
    destination === "/ideanator" ||
    destination.startsWith("/ideanator/") ||
    destination === "/the-ideanator" ||
    destination === "/saved-ideas" ||
    destination.startsWith("/saved-ideas/") ||
    destination === "/rigs" ||
    destination.startsWith("/rigs/")
  );
}

function getLoginProductLabel(destination = "") {
  return isIdeanatorHost() || isIdeanatorDestination(destination)
    ? "The Ideanator"
    : "HOVEL Editor";
}

function getHomeHref(destination = "") {
  return isIdeanatorHost() || isIdeanatorDestination(destination) ? "/idea" : "/";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [destination, setDestination] = useState("/dashboard");
  const [productLabel, setProductLabel] = useState("HOVEL Editor");
  const [homeHref, setHomeHref] = useState("/");

  useEffect(() => {
    const nextDestination = getSafeNextPath();
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error") || "";

    setDestination(nextDestination);
    setProductLabel(getLoginProductLabel(nextDestination));
    setHomeHref(getHomeHref(nextDestination));

    if (urlError) {
      setError(urlError);
    }

    async function checkSession() {
      try {
        const result = await Promise.race([
          supabase.auth.getSession(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500)),
        ]);

        const session = result && "data" in result ? result.data.session : null;

        if (session?.access_token) {
          window.location.href = nextDestination;
          return;
        }
      } finally {
        setCheckingSession(false);
      }
    }

    checkSession();
  }, []);

  const isIdeanatorLogin = useMemo(() => productLabel === "The Ideanator", [productLabel]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    setLoading(true);
    setError("");
    setMessage("");

    if (!cleanEmail) {
      setError("Enter your email address.");
      setLoading(false);
      return;
    }

    try {
      const emailRedirectTo = `${getCanonicalAuthOrigin()}/auth/callback?next=${encodeURIComponent(destination)}`;

      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo,
          shouldCreateUser: true,
        },
      });

      if (error) {
        setError(error.message || "Could not send magic link.");
        setLoading(false);
        return;
      }

      setMessage("Magic link sent. Check your email, click the link, and you will land back inside the app.");
      setLoading(false);
    } catch {
      setError("Something went wrong sending the magic link. Try again.");
      setLoading(false);
    }
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

        .login-wrap {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }

        .login-card {
          width: 100%;
          max-width: 500px;
          background: #161410;
          border: 1px solid #2a2520;
          border-radius: 24px;
          padding: 36px;
          box-shadow: 0 24px 70px rgba(0,0,0,0.4);
        }

        .idea-login .login-card {
          background: rgba(43, 38, 30, 0.94);
          border-color: rgba(255, 221, 159, 0.22);
          border-radius: 28px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.42);
        }

        .login-back-link {
          display: inline-block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.1em;
          color: #5a5448;
          text-decoration: none;
          text-transform: uppercase;
          margin-bottom: 28px;
        }

        .idea-login .login-back-link {
          color: rgba(245, 241, 232, 0.58);
        }

        .login-back-link:hover {
          color: #c8935a;
        }

        .login-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.2em;
          color: #c8935a;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .idea-login .login-eyebrow {
          color: #f0b35f;
        }

        .login-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(40px, 8vw, 58px);
          line-height: 1;
          font-weight: 700;
          color: #f0ece4;
          margin-bottom: 10px;
        }

        .login-subtitle {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          line-height: 1.65;
          color: #9a9186;
          margin-bottom: 26px;
        }

        .idea-login .login-subtitle {
          color: #ddd5c7;
        }

        .login-field {
          margin-bottom: 16px;
        }

        .login-label {
          display: block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          color: #8f867b;
          text-transform: uppercase;
          margin-bottom: 8px;
          font-weight: 700;
        }

        .idea-login .login-label {
          color: #bdb4a8;
        }

        .login-input {
          width: 100%;
          background: #0e0d0b;
          border: 1px solid #2a2520;
          border-radius: 12px;
          color: #f0ece4;
          font-family: 'DM Sans', sans-serif;
          font-size: 16px;
          padding: 15px 16px;
          outline: none;
          min-height: 52px;
        }

        .idea-login .login-input {
          border-color: rgba(255, 221, 159, 0.18);
          background: rgba(0, 0, 0, 0.22);
          border-radius: 14px;
        }

        .login-input:focus {
          border-color: #c8935a;
        }

        .idea-login .login-input:focus {
          border-color: #f0b35f;
          box-shadow: 0 0 0 4px rgba(240, 179, 95, 0.13);
        }

        .login-button {
          width: 100%;
          margin-top: 10px;
          padding: 16px 20px;
          border: 1px solid #c8935a;
          border-radius: 14px;
          background: #c8935a;
          color: #0e0d0b;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 13px;
          font-weight: 900;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          cursor: pointer;
          min-height: 54px;
          transition: all 0.15s;
        }

        .login-button:hover:not(:disabled) {
          background: #e2a96a;
          border-color: #e2a96a;
        }

        .idea-login .login-button {
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

        .login-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .login-error,
        .login-message {
          margin-top: 18px;
          padding: 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          line-height: 1.5;
          border-radius: 12px;
        }

        .login-error {
          background: #2a1010;
          border-left: 2px solid #b84040;
          color: #d68c8c;
        }

        .login-message {
          background: #0a1a0e;
          border-left: 2px solid #4a9c6a;
          color: #8bc99d;
        }

        .login-note {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: #5a5448;
          line-height: 1.5;
          margin-top: 20px;
        }

        .idea-login .login-note {
          color: rgba(245, 241, 232, 0.5);
        }

        .login-terms-link {
          display: inline-block;
          margin-top: 8px;
          color: #c8935a;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
        }

        .idea-login .login-terms-link {
          color: #f0b35f;
        }

        .login-terms-link:hover {
          text-decoration: underline;
        }

        @media (max-width: 520px) {
          .login-card {
            padding: 24px 20px;
            border-radius: 20px;
          }
        }
      `}</style>

      <div className="login-wrap">
        <div className="login-card">
          <a className="login-back-link" href={homeHref}>
            â† Back to {productLabel}
          </a>

          <div className="login-eyebrow">
            {isIdeanatorLogin ? "The Ideanator" : "HOVEL Editor"}
          </div>

          <div className="login-title">
            {isIdeanatorLogin ? "Sign in to save idea reports." : "Sign In"}
          </div>

          <div className="login-subtitle">
            {isIdeanatorLogin
              ? "Enter your email. We will send you a secure link â€” no password needed. Click it and you are in."
              : "Enter your email and we will send you a secure link. Click it and you are inside HOVEL Editor."}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="login-field">
              <label className="login-label">Email</label>
              <input
                className="login-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || checkingSession}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <button className="login-button" type="submit" disabled={loading || checkingSession}>
              {checkingSession ? "Checking..." : loading ? "Sending..." : "Send Magic Link"}
            </button>
          </form>

          {error && <div className="login-error">{error}</div>}
          {message && <div className="login-message">{message}</div>}

          <div className="login-note">
            No password required. One email account works for both The Ideanator and HOVEL Editor.
            <br />
            <a className="login-terms-link" href="/beta-terms">Beta Terms / Privacy</a>
          </div>
        </div>
      </div>
    </div>
  );
}
