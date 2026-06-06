"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function getSafeNextPath() {
  if (typeof window === "undefined") return "/idea";

  const params = new URLSearchParams(window.location.search);
  const next = params.get("next") || "";

  if (!next) return "/idea";

  try {
    const decoded = decodeURIComponent(next);

    if (!decoded.startsWith("/") || decoded.startsWith("//")) {
      return "/idea";
    }

    return decoded;
  } catch {
    return "/idea";
  }
}

export default function IdeanatorLoginPage() {
  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [destination, setDestination] = useState("/idea");

  useEffect(() => {
    const nextDestination = getSafeNextPath();
    setDestination(nextDestination);

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
    <main className="min-h-screen bg-[#020617] px-4 py-28 text-[#eaf7ff] sm:px-6">
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(circle_at_12%_4%,rgba(34,211,238,0.22),transparent_32rem),radial-gradient(circle_at_88%_16%,rgba(245,158,11,0.12),transparent_28rem),linear-gradient(135deg,#020617_0%,#06101d_48%,#0b1728_100%)]" />

      <section className="relative z-10 mx-auto w-full max-w-[480px] rounded-[2rem] border border-cyan-300/25 bg-slate-950/78 p-7 shadow-[0_28px_90px_rgba(0,0,0,0.55),0_0_42px_rgba(34,211,238,0.08)] backdrop-blur sm:p-9">
        <a
          href="/the-ideanator"
          className="mb-8 inline-block font-mono text-xs uppercase tracking-[0.18em] text-cyan-200/75 hover:text-cyan-100"
        >
          Back to The Ideanator
        </a>

        <p className="mb-3 font-mono text-xs uppercase tracking-[0.22em] text-cyan-300">
          The Ideanator Access
        </p>

        <h1 className="mb-3 text-5xl font-black tracking-[-0.06em] text-white">
          {mode === "signin"
            ? "Sign In"
            : mode === "signup"
              ? "Create Account"
              : "Reset Password"}
        </h1>

        <p className="mb-7 text-base leading-7 text-slate-300">
          {mode === "forgot"
            ? "Enter your email and we will send you a password reset link."
            : mode === "signup"
              ? "Create a beta account with your invite code."
              : "Sign in to save ideas, reopen reports, and keep working from where you left off."}
        </p>

        {mode !== "forgot" && (
          <div className="mb-6 grid grid-cols-2 overflow-hidden rounded-2xl border border-cyan-300/25 bg-slate-950/70">
            <button
              type="button"
              className={`px-4 py-3 font-mono text-xs uppercase tracking-[0.16em] transition ${
                mode === "signin"
                  ? "bg-cyan-300 text-slate-950"
                  : "text-slate-400 hover:text-cyan-200"
              }`}
              onClick={() => switchMode("signin")}
            >
              Sign In
            </button>

            <button
              type="button"
              className={`px-4 py-3 font-mono text-xs uppercase tracking-[0.16em] transition ${
                mode === "signup"
                  ? "bg-cyan-300 text-slate-950"
                  : "text-slate-400 hover:text-cyan-200"
              }`}
              onClick={() => switchMode("signup")}
            >
              Sign Up
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block font-mono text-xs uppercase tracking-[0.16em] text-slate-300">
              Email
            </label>
            <input
              className="w-full rounded-2xl border border-cyan-300/25 bg-slate-950/70 px-4 py-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/15"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="you@example.com"
            />
          </div>

          {mode !== "forgot" && (
            <div>
              <label className="mb-2 block font-mono text-xs uppercase tracking-[0.16em] text-slate-300">
                Password
              </label>
              <div className="relative">
                <input
                  className="w-full rounded-2xl border border-cyan-300/25 bg-slate-950/70 px-4 py-4 pr-24 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/15"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  placeholder="Minimum 6 characters"
                />
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl border border-cyan-300/25 bg-slate-900 px-3 py-2 font-mono text-xs uppercase tracking-[0.1em] text-cyan-200 hover:border-cyan-300"
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
            <div>
              <label className="mb-2 block font-mono text-xs uppercase tracking-[0.16em] text-slate-300">
                Beta Invite Code
              </label>
              <input
                className="w-full rounded-2xl border border-cyan-300/25 bg-slate-950/70 px-4 py-4 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-300/15"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                disabled={loading}
                placeholder="Enter invite code"
              />
              <p className="mt-2 text-sm leading-6 text-slate-400">
                New beta accounts require an invite code. Existing users can still sign in normally.
              </p>
            </div>
          )}

          <button
            className="w-full rounded-full border border-cyan-200/70 bg-[linear-gradient(180deg,#67e8f9_0%,#22d3ee_54%,#0891b2_100%)] px-6 py-4 font-mono text-sm font-black uppercase tracking-[0.18em] text-slate-950 shadow-[0_0_34px_rgba(34,211,238,0.25)] transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Working..."
              : mode === "signin"
                ? "Sign In"
                : mode === "signup"
                  ? "Create Account"
                  : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-5 flex flex-wrap justify-between gap-4">
          {mode === "signin" && (
            <button
              className="font-mono text-xs uppercase tracking-[0.12em] text-slate-400 hover:text-cyan-200"
              type="button"
              onClick={() => switchMode("forgot")}
            >
              Forgot Password?
            </button>
          )}

          {mode === "forgot" && (
            <button
              className="font-mono text-xs uppercase tracking-[0.12em] text-slate-400 hover:text-cyan-200"
              type="button"
              onClick={() => switchMode("signin")}
            >
              Back to Sign In
            </button>
          )}

          {mode === "signup" && (
            <button
              className="font-mono text-xs uppercase tracking-[0.12em] text-slate-400 hover:text-cyan-200"
              type="button"
              onClick={() => switchMode("signin")}
            >
              Already Have an Account?
            </button>
          )}
        </div>

        {error && (
          <div className="mt-5 border-l-2 border-rose-400 bg-rose-950/45 p-4 text-sm leading-6 text-rose-100">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-5 border-l-2 border-emerald-300 bg-emerald-950/35 p-4 text-sm leading-6 text-emerald-100">
            {message}
          </div>
        )}

        <p className="mt-6 text-sm leading-6 text-slate-400">
          Beta access is free for now. New accounts require an invite code. One account can use HOVEL Editor and The Ideanator, but each product keeps its own front door.
          <br />
          <a className="font-mono text-xs uppercase tracking-[0.12em] text-cyan-300 hover:text-cyan-100" href="/beta-terms">
            Beta Terms / Privacy
          </a>
        </p>
      </section>
    </main>
  );
}

