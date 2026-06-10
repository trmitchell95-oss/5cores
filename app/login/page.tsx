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
  return "/workshop";
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

function getLoginProductLabel(destination = "") {
  return "Hovel Ideas Workshop";
}

function getHomeHref(destination = "") {
  return "/workshop";
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
    let cancelled = false;

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

        if (cancelled) return;

        const session = result && "data" in result ? result.data.session : null;

        if (session?.access_token) {
          window.location.replace(nextDestination);
          return;
        }
      } finally {
        if (!cancelled) {
          setCheckingSession(false);
        }
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const isIdeanatorLogin = useMemo(
    () => productLabel === "The Ideanator",
    [productLabel]
  );

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

      setMessage(
        "Magic link sent. Click it once from this same browser. After that, this browser should keep you signed in."
      );
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
          ? "linear-gradient(135deg, #0b1020 0%, #0f172a 46%, #111827 100%)"
          : "#060b16",
        color: "#eef4ff",
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
          background: #0f172a;
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
          color: #94a3b8;
          text-decoration: none;
          text-transform: uppercase;
          margin-bottom: 28px;
        }

        .idea-login .login-back-link {
          color: rgba(245, 241, 232, 0.58);
        }

        .login-back-link:hover {
          color: #93c5fd;
        }

        .login-eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.2em;
          color: #93c5fd;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .idea-login .login-eyebrow {
          color: #93c5fd;
        }

        .login-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(40px, 8vw, 58px);
          line-height: 1;
          font-weight: 700;
          color: #eef4ff;
          margin-bottom: 10px;
        }

        .login-subtitle {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          line-height: 1.65;
          color: #cbd5e1;
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
          color: #cbd5e1;
          text-transform: uppercase;
          margin-bottom: 8px;
          font-weight: 700;
        }

        .idea-login .login-label {
          color: #bdb4a8;
        }

        .login-input {
          width: 100%;
          background: #060b16;
          border: 1px solid #2a2520;
          border-radius: 12px;
          color: #eef4ff;
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
          border-color: #93c5fd;
        }

        .idea-login .login-input:focus {
          border-color: #93c5fd;
          box-shadow: 0 0 0 4px rgba(240, 179, 95, 0.13);
        }

        .login-button {
          width: 100%;
          margin-top: 10px;
          padding: 16px 20px;
          border: 1px solid #93c5fd;
          border-radius: 14px;
          background: #93c5fd;
          color: #060b16;
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
          background: #bfdbfe;
          border-color: #bfdbfe;
        }

        .idea-login .login-button {
          background:
            radial-gradient(circle at 18px 50%, #dbeafe 0 4px, transparent 5px),
            linear-gradient(180deg, #dbeafe 0%, #93c5fd 52%, #60a5fa 100%);
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
          color: #94a3b8;
          line-height: 1.5;
          margin-top: 20px;
        }

        .idea-login .login-note {
          color: rgba(245, 241, 232, 0.5);
        }

        .login-terms-link {
          display: inline-block;
          margin-top: 8px;
          color: #93c5fd;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
        }

        .idea-login .login-terms-link {
          color: #93c5fd;
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
            &lt;- Back to {productLabel}
          </a>

          <div className="login-eyebrow">
            {isIdeanatorLogin ? "The Ideanator" : "HOVEL Editor"}
          </div>

          <div className="login-title">
            {isIdeanatorLogin ? "Sign in to save idea reports." : "Sign In"}
          </div>

          <div className="login-subtitle">
            {isIdeanatorLogin
              ? "Enter your email. We will send you a secure link - no password needed. Click it and you are in."
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
            No password required. One email account opens the whole Hovel Ideas Workshop.
            <br />
            <a className="login-terms-link" href="/beta-terms">Beta Terms / Privacy</a>
          </div>
        </div>
      </div>
    </div>
  );
}

