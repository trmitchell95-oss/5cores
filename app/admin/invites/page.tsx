"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

type InviteItem = {
  id: string;
  created_at: string;
  updated_at: string;
  code: string;
  label: string | null;
  active: boolean;
  max_uses: number | null;
  use_count: number;
  expires_at: string | null;
  last_used_at: string | null;
  notes: string | null;
};

type InviteResponse = {
  adminEmail: string;
  summary: {
    total: number;
    active: number;
    inactive: number;
    used: number;
  };
  items: InviteItem[];
};

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function formatDate(value: string | null) {
  if (!value) return "None";
  return new Date(value).toLocaleString();
}

export default function AdminInvitesPage() {
  const [data, setData] = useState<InviteResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [code, setCode] = useState("");
  const [label, setLabel] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);

  async function getToken() {
    const supabase = getSupabaseClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      window.location.href = "/login";
      return "";
    }

    return session.access_token;
  }

  async function loadInvites(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = await getToken();
      if (!token) return;

      const response = await fetch("/api/admin/invites", {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not load invite codes.");
      }

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function createInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setCreating(true);
    setError("");
    setMessage("");

    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch("/api/admin/invites", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          code,
          label,
          maxUses,
          expiresAt,
          notes,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not create invite code.");
      }

      setMessage(`Invite code created: ${result.item?.code || "created"}`);
      setCode("");
      setLabel("");
      setMaxUses("");
      setExpiresAt("");
      setNotes("");
      await loadInvites(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setCreating(false);
    }
  }

  async function updateInvite(item: InviteItem, active: boolean) {
    try {
      setError("");
      setMessage("");

      const token = await getToken();
      if (!token) return;

      const response = await fetch("/api/admin/invites", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: item.id,
          active,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update invite code.");
      }

      setMessage(active ? "Invite enabled." : "Invite disabled.");
      await loadInvites(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  useEffect(() => {
    loadInvites();
  }, []);

  const items = data?.items || [];

  const activeItems = useMemo(() => {
    return items.filter((item) => item.active);
  }, [items]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0e0d0b",
        color: "#f0ece4",
        padding: "48px 24px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <nav
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 24,
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <Link href="/admin/usage" style={{ color: "#c8935a" }}>
            Speedometer
          </Link>
          <Link href="/admin/feedback" style={{ color: "#c8935a" }}>
            Feedback
          </Link>
          <Link href="/dashboard" style={{ color: "#c8935a" }}>
            Dashboard
          </Link>
          <button onClick={() => loadInvites(true)} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </nav>

        <section
          style={{
            border: "1px solid #26211c",
            borderRadius: 28,
            padding: 32,
            background: "rgba(18,16,13,0.95)",
            marginBottom: 22,
          }}
        >
          <div
            style={{
              color: "#c8935a",
              fontFamily: "monospace",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}
          >
            Admin Invites
          </div>

          <h1
            style={{
              fontFamily: "Georgia, serif",
              fontSize: "clamp(48px, 8vw, 82px)",
              margin: "12px 0 0",
            }}
          >
            The velvet rope.
          </h1>

          <p style={{ color: "#aaa096", lineHeight: 1.7 }}>
            Create and manage beta invite codes without crawling back into
            Supabase every time.
          </p>

          {data && (
            <p style={{ color: "#aaa096" }}>
              Total: {data.summary.total} / Active: {data.summary.active} /
              Inactive: {data.summary.inactive} / Used: {data.summary.used}
            </p>
          )}
        </section>

        {error && (
          <div
            style={{
              border: "1px solid #5a2020",
              background: "#2a1010",
              color: "#f0a0a0",
              padding: 14,
              borderRadius: 12,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            style={{
              border: "1px solid #214a2d",
              background: "#0a1a0e",
              color: "#98d8aa",
              padding: 14,
              borderRadius: 12,
              marginBottom: 16,
            }}
          >
            {message}
          </div>
        )}

        <section
          style={{
            border: "1px solid #26211c",
            borderRadius: 24,
            padding: 22,
            background: "rgba(18,16,13,0.95)",
            marginBottom: 22,
          }}
        >
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 34, marginTop: 0 }}>
            Create invite code
          </h2>

          <form onSubmit={createInvite} style={{ display: "grid", gap: 12 }}>
            <input
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Custom code, or leave blank to auto-generate"
              style={inputStyle}
            />

            <input
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Label, example: Cousins beta group"
              style={inputStyle}
            />

            <input
              value={maxUses}
              onChange={(event) => setMaxUses(event.target.value)}
              placeholder="Max uses, blank = unlimited"
              type="number"
              min="1"
              style={inputStyle}
            />

            <input
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              placeholder="Expires at, optional ISO date. Example: 2026-06-30T23:59:00Z"
              style={inputStyle}
            />

            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Notes, optional"
              style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
            />

            <button
              type="submit"
              disabled={creating}
              style={{
                minHeight: 48,
                borderRadius: 12,
                border: "none",
                background: "#c8935a",
                color: "#0e0d0b",
                fontFamily: "monospace",
                fontWeight: 900,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: creating ? "not-allowed" : "pointer",
                opacity: creating ? 0.55 : 1,
              }}
            >
              {creating ? "Creating..." : "Create Invite"}
            </button>
          </form>
        </section>

        <section
          style={{
            border: "1px solid #26211c",
            borderRadius: 24,
            padding: 22,
            background: "rgba(18,16,13,0.95)",
          }}
        >
          <h2 style={{ fontFamily: "Georgia, serif", fontSize: 34, marginTop: 0 }}>
            Invite codes
          </h2>

          {loading ? (
            <p>Loading invite codes...</p>
          ) : items.length === 0 ? (
            <p>No invite codes yet. Create one above.</p>
          ) : (
            <div style={{ display: "grid", gap: 14 }}>
              {items.map((item) => {
                const usedUp =
                  item.max_uses !== null &&
                  item.max_uses !== undefined &&
                  Number(item.use_count || 0) >= Number(item.max_uses);

                return (
                  <article
                    key={item.id}
                    style={{
                      border: "1px solid #26211c",
                      borderRadius: 18,
                      padding: 18,
                      background: item.active ? "#11100e" : "#171210",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontFamily: "monospace",
                            color: "#c8935a",
                            fontWeight: 900,
                            fontSize: 16,
                          }}
                        >
                          {item.code}
                        </div>

                        <div style={{ color: "#aaa096", marginTop: 6 }}>
                          {item.label || "No label"}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => updateInvite(item, !item.active)}
                        style={{
                          border: "1px solid #302a24",
                          borderRadius: 12,
                          background: item.active ? "#2a1010" : "#0a1a0e",
                          color: item.active ? "#f0a0a0" : "#98d8aa",
                          padding: "10px 12px",
                          cursor: "pointer",
                          fontFamily: "monospace",
                          fontWeight: 900,
                        }}
                      >
                        {item.active ? "Disable" : "Enable"}
                      </button>
                    </div>

                    <div
                      style={{
                        color: "#8f867b",
                        fontSize: 13,
                        lineHeight: 1.65,
                        marginTop: 12,
                      }}
                    >
                      Status: {item.active ? "Active" : "Inactive"}{" "}
                      {usedUp ? " / Used Up" : ""}
                      <br />
                      Uses: {item.use_count} / {item.max_uses ?? "unlimited"}
                      <br />
                      Created: {formatDate(item.created_at)}
                      <br />
                      Last used: {formatDate(item.last_used_at)}
                      <br />
                      Expires: {formatDate(item.expires_at)}
                      {item.notes ? (
                        <>
                          <br />
                          Notes: {item.notes}
                        </>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {activeItems.length > 0 && (
            <p style={{ color: "#8f867b", marginTop: 18 }}>
              Active codes can be used on the signup page. Existing users do not
              need a code to sign in.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 12,
  background: "#0e0d0b",
  color: "#f0ece4",
  border: "1px solid #302a24",
  boxSizing: "border-box",
};
