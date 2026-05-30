"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "https://5scores.vercel.app/auth/callback",
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0e0d0b", color: "#f0ece4", fontFamily: "Georgia, serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .login-wrap { max-width: 480px; width: 100%; padding: 48px 32px; }
        .eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.2em; color: #c8935a; text-transform: uppercase; margin-bottom: 12px; }
        .title { font-family: 'Cormorant Garamond', serif; font-size: 48px; font-weight: 700; line-height: 1; color: #f0ece4; margin-bottom: 12px; }
        .subtitle { font-family: 'DM Sans', sans-serif; font-size: 15px; font-weight: 300; color: #9a9186; margin-bottom: 40px; }
        .input { width: 100%; background: #161410; border: 1px solid #2a2520; color: #f0ece4; font-family: 'DM Sans', sans-serif; font-size: 15px; padding: 14px 16px; outline: none; transition: border-color 0.2s; }
        .input:focus { border-color: #c8935a; }
        .input::placeholder { color: #5a5448; }
        .btn { width: 100%; margin-top: 12px; padding: 14px; background: #c8935a; color: #0e0d0b; font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; border: none; cursor: pointer; transition: background 0.2s; }
        .btn:hover:not(:disabled) { background: #e0aa70; }
        .btn:disabled { opacity: 0.45; cursor: not-allowed; }
        .sent-msg { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #4a9c6a; letter-spacing: 0.1em; margin-top: 20px; padding: 16px; background: #0a1a0e; border-left: 2px solid #4a9c6a; }
        .error-msg { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #b84040; margin-top: 12px; padding: 16px; background: #2a1010; border-left: 2px solid #b84040; }
        .back-link { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #5a5448; text-decoration: none; letter-spacing: 0.1em; display: inline-block; margin-bottom: 40px; }
        .back-link:hover { color: #9a9186; }
      `}</style>

      <div className="login-wrap">
        <a className="back-link" href="/">← Back to 5 CORE</a>
        <div className="eyebrow">Editorial Council</div>
        <div className="title">5 CORE</div>
        <div className="subtitle">Enter your email and we'll send you a login link. No password required.</div>

        {!sent ? (
          <div>
            <input
              className="input"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              disabled={loading}
            />
            <button
              className="btn"
              onClick={handleLogin}
              disabled={loading || !email.trim()}
            >
              {loading ? "Sending..." : "Send Login Link"}
            </button>
            {error && <div className="error-msg">{error}</div>}
          </div>
        ) : (
          <div className="sent-msg">
            ✓ Check your email. Click the link to sign in.
          </div>
        )}
      </div>
    </div>
  );
}