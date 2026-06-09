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

function getLoginProductLabel() {
  return isIdeanatorHost() ? "The Ideanator" : "HOVEL Editor";
}

function getHomeHref() {
  return isIdeanatorHost() ? "/idea" : "/";
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
    setProductLabel(getLoginProductLabel());
    setHomeHref(getHomeHref());

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

        .wrap {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }

        .card {
          width: 100%;
          max-width: 500px;
          background: #161410;
          border: 1px solid #2a2520;
          border-radius: 24px;
          padding: 36px;
          box-shadow: 0 24px 70px rgba(0,0,0,0.4);
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
          color: #c8935a;
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
          font-size: clamp(40px, 8vw, 58px);
          line-height: 1;
          font-weight: 700;
          color: #f0ece4;
          margin-bottom: 10px;
        }

        .subtitle {
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          line-height: 1.65;
          color: #9a9186;
          margin-bottom: 26px;
        }

        .idea-login .subtitle {
          color: #ddd5c7;
        }

        .field {
          margin-bottom: 16px;
        }

        .label {
          display: block;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          color: #8f867b;
          text-transform: uppercase;
          margin-bottom: 8px;
          font-weight: 700;
        }

        .idea-login .label {
          color: #bdb4a8;
        }

        .input {
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

        .button {
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

        .button:hover:not(:disabled) {
          background: #e2a96a;
          border-color: #e2a96a;
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

        .error,
        .message {
          margin-top: 18px;
          padding: 14px;
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          line-height: 1.5;
          border-radius: 12px;
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

        @media (max-width: 520px) {
          .card {
            padding: 24px 20px;
            border-radius: 20px;
          }
        }
      `}</style>

      <div className="ideanator-login-shell wrap">
        <div className="ideanator-login-shell card">
          <a className="ideanator-login-shell back-link" href={homeHref}>
            Back to {productLabel}
          </a>

          <div className="ideanator-login-shell eyebrow">
            {isIdeanatorLogin ? "The Ideanator Access" : "HOVEL Editor Access"}
          </div>

          <div className="ideanator-login-shell title">Email Magic Link</div>

          <div className="ideanator-login-shell subtitle">
            {isIdeanatorLogin
              ? "Enter your email and we will send you a secure link. Click it and you are inside The Ideanator."
              : "Enter your email and we will send you a secure link. Click it and you are inside HOVEL Editor."}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="ideanator-login-shell field">
              <label className="ideanator-login-shell label">Email</label>
              <input
                className="ideanator-login-shell input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading || checkingSession}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <button className="ideanator-login-shell button" type="submit" disabled={loading || checkingSession}>
              {checkingSession ? "Checking..." : loading ? "Sending..." : "Send Magic Link"}
            </button>
          </form>

          {error && <div className="ideanator-login-shell error">{error}</div>}
          {message && <div className="ideanator-login-shell message">{message}</div>}

          <div className="ideanator-login-shell note">
            No password required. One email account can use HOVEL Editor and The Ideanator, but each product keeps its own front door.
            <br />
            <a className="ideanator-login-shell terms-link" href="/beta-terms">Beta Terms / Privacy</a>
          </div>
        </div>
      </div>
    </div>
  );
}

