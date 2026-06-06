"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type AdminPayload = {
  label: string;
  ok: boolean;
  data: unknown;
  error?: string;
};

type MePayload = {
  user?: {
    id?: string;
    email?: string;
  };
  isAdmin?: boolean;
  error?: string;
};

function withAdminEmail(url: string, email: string) {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}adminEmail=${encodeURIComponent(email.toLowerCase())}`;
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [me, setMe] = useState<MePayload | null>(null);
  const [sections, setSections] = useState<AdminPayload[]>([]);

  useEffect(() => {
    async function loadAdmin() {
      setLoading(true);
      setMessage("");

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const token = session?.access_token;

        if (!token) {
          setMessage("You need to sign in before the admin dashboard can load.");
          setLoading(false);
          return;
        }

        const meResponse = await fetch("/api/me", {
          headers: {
            authorization: `Bearer ${token}`,
          },
        });

        const meData = (await meResponse.json().catch(() => null)) as MePayload | null;
        setMe(meData);

        if (!meResponse.ok || !meData) {
          setMessage(meData?.error || "Could not verify your login.");
          setLoading(false);
          return;
        }

        const email = meData.user?.email || session.user.email || "";

        if (!meData.isAdmin || !email) {
          setMessage(
            `Signed in as ${email || "unknown user"}, but this account is not marked as an admin. Check ADMIN_EMAILS in Vercel.`
          );
          setLoading(false);
          return;
        }

        const endpoints: [string, string][] = [
          ["Health", "/api/admin/health"],
          ["Usage", "/api/admin/usage"],
          ["Feedback", "/api/admin/feedback"],
          ["Invites", "/api/admin/invites"],
        ];

        const results = await Promise.all(
          endpoints.map(async ([label, url]) => {
            try {
              const res = await fetch(withAdminEmail(url, email), {
                headers: {
                  authorization: `Bearer ${token}`,
                },
              });

              const data = await res.json().catch(() => null);

              return {
                label,
                ok: res.ok,
                data: data || { status: res.status },
              };
            } catch (error) {
              return {
                label,
                ok: false,
                data: null,
                error: error instanceof Error ? error.message : "Unknown error",
              };
            }
          })
        );

        setSections(results);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : String(error));
      } finally {
        setLoading(false);
      }
    }

    loadAdmin();
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "140px 24px 80px",
        background: "#080705",
        color: "#f4efe7",
      }}
    >
      <section style={{ maxWidth: 1180, margin: "0 auto" }}>
        <p
          style={{
            color: "#d29a54",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          Owner Control Room
        </p>

        <h1
          style={{
            fontSize: "clamp(44px, 8vw, 92px)",
            lineHeight: 0.95,
            margin: "18px 0 20px",
          }}
        >
          Admin Dashboard
        </h1>

        <p style={{ maxWidth: 760, color: "#cfc5b8", fontSize: 18, lineHeight: 1.7 }}>
          This is the Hovel Editor admin room. It checks your signed-in session, confirms admin access,
          and then loads the admin tools.
        </p>

        {me?.user?.email ? (
          <p style={{ color: "#d29a54", marginTop: 18 }}>
            Signed in as: <strong>{me.user.email}</strong>
          </p>
        ) : null}

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", margin: "34px 0" }}>
          <a
            href="/dashboard"
            style={{
              color: "#080705",
              background: "#d29a54",
              padding: "14px 20px",
              borderRadius: 16,
              fontWeight: 900,
              textDecoration: "none",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Dashboard
          </a>

          <a
            href="/account"
            style={{
              color: "#f4efe7",
              border: "1px solid #3a2a1f",
              padding: "14px 20px",
              borderRadius: 16,
              fontWeight: 900,
              textDecoration: "none",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Account
          </a>
        </div>

        {loading ? (
          <p style={{ color: "#cfc5b8" }}>Loading admin data...</p>
        ) : message ? (
          <article
            style={{
              border: "1px solid #3a2a1f",
              borderRadius: 24,
              padding: 24,
              background: "#0e0b08",
              color: "#f4efe7",
              maxWidth: 760,
            }}
          >
            <h2 style={{ marginTop: 0, color: "#d29a54" }}>Admin check</h2>
            <p style={{ lineHeight: 1.7 }}>{message}</p>
          </article>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 18,
            }}
          >
            {sections.map((section) => (
              <article
                key={section.label}
                style={{
                  border: "1px solid #2a211b",
                  borderRadius: 24,
                  padding: 22,
                  background: "#0e0b08",
                }}
              >
                <h2 style={{ marginTop: 0, color: section.ok ? "#d29a54" : "#ffb37a" }}>
                  {section.label}
                </h2>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    color: "#ddd2c4",
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  {JSON.stringify(section.error ? { error: section.error } : section.data, null, 2)}
                </pre>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
