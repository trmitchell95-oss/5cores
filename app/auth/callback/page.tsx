"use client";

import { useEffect, useState } from "react";
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

function getDefaultDestination() {
  if (typeof window === "undefined") return "/dashboard";

  const host = window.location.hostname.toLowerCase();

  return host === "theideanator.com" || host === "www.theideanator.com"
    ? "/idea"
    : "/dashboard";
}

function safeNext(rawValue: string | null) {
  const fallback = getDefaultDestination();

  if (!rawValue) return fallback;

  try {
    const decoded = decodeURIComponent(rawValue);

    if (!decoded.startsWith("/") || decoded.startsWith("//")) {
      return fallback;
    }

    return decoded;
  } catch {
    return fallback;
  }
}

export default function AuthCallbackPage() {
  const [status, setStatus] = useState("Finishing sign-in...");
  const [error, setError] = useState("");

  useEffect(() => {
    let stillMounted = true;

    async function finishSignIn() {
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const next = safeNext(params.get("next"));
      const urlError =
        params.get("error_description") ||
        params.get("error") ||
        hashParams.get("error_description") ||
        hashParams.get("error") ||
        "";

      if (urlError) {
        const message = decodeURIComponent(urlError);

        if (stillMounted) {
          setError(message);
          setStatus("Sign-in link failed.");
        }

        window.setTimeout(() => {
          window.location.replace(`/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent(message)}`);
        }, 1400);

        return;
      }

      try {
        const code = params.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            throw error;
          }
        } else {
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              throw error;
            }
          } else {
            const {
              data: { session },
            } = await supabase.auth.getSession();

            if (!session?.access_token) {
              throw new Error("No sign-in session was found. The link may have expired.");
            }
          }
        }

        if (stillMounted) {
          setStatus("Signed in. Opening the app...");
        }

        window.location.replace(next);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Could not finish sign-in. The magic link may have expired.";

        if (stillMounted) {
          setError(message);
          setStatus("Sign-in link failed.");
        }

        window.setTimeout(() => {
          window.location.replace(`/login?next=${encodeURIComponent(next)}&error=${encodeURIComponent(message)}`);
        }, 1800);
      }
    }

    finishSignIn();

    return () => {
      stillMounted = false;
    };
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0e0d0b",
        color: "#f0ece4",
        padding: 24,
        fontFamily: "Georgia, serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 520,
          border: "1px solid #2a2520",
          background: "#161410",
          borderRadius: 28,
          padding: 34,
          boxShadow: "0 24px 70px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            color: "#c8935a",
            fontFamily: "monospace",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontSize: 12,
            fontWeight: 900,
            marginBottom: 12,
          }}
        >
          Magic Link
        </div>

        <h1 style={{ margin: 0, fontSize: 44, lineHeight: 1 }}>
          {status}
        </h1>

        <p style={{ color: "#aaa096", lineHeight: 1.6, marginTop: 16 }}>
          Hold tight. We are setting your session and sending you back through the front door.
        </p>

        {error && (
          <p
            style={{
              marginTop: 18,
              padding: 14,
              borderLeft: "2px solid #b84040",
              background: "#2a1010",
              color: "#d68c8c",
              lineHeight: 1.5,
            }}
          >
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
