"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
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

type InviteDraft = {
  label: string;
  maxUses: string;
  expiresAt: string;
  notes: string;
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

function isUsedUp(item: InviteItem) {
  return (
    item.max_uses !== null &&
    item.max_uses !== undefined &&
    Number(item.use_count || 0) >= Number(item.max_uses)
  );
}

function isExpired(item: InviteItem) {
  return item.expires_at ? new Date(item.expires_at).getTime() < Date.now() : false;
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

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

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

  async function patchInvite(id: string, payload: Record<string, unknown>, successMessage: string) {
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
          id,
          ...payload,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Could not update invite code.");
      }

      setMessage(successMessage);
      await loadInvites(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  async function updateInviteActive(item: InviteItem, active: boolean) {
    await patchInvite(
      item.id,
      { active },
      active ? "Invite enabled." : "Invite disabled."
    );
  }

  async function updateInviteDetails(item: InviteItem, draft: InviteDraft) {
    await patchInvite(
      item.id,
      {
        label: draft.label,
        maxUses: draft.maxUses,
        expiresAt: draft.expiresAt,
        notes: draft.notes,
      },
      "Invite details saved."
    );
  }

  async function copyCode(codeToCopy: string) {
    try {
      await navigator.clipboard.writeText(codeToCopy);
      setMessage(`Copied invite code: ${codeToCopy}`);
      setError("");
    } catch {
      setError("Could not copy automatically. Select and copy the code manually.");
    }
  }

  useEffect(() => {
    loadInvites();
  }, []);

  const items = data?.items || [];

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    return items.filter((item) => {
      const matchesSearch =
        !term ||
        item.code.toLowerCase().includes(term) ||
        String(item.label || "").toLowerCase().includes(term) ||
        String(item.notes || "").toLowerCase().includes(term);

      const usedUp = isUsedUp(item);
      const expired = isExpired(item);

      const matchesFilter =
        filter === "all" ||
        (filter === "active" && item.active) ||
        (filter === "inactive" && !item.active) ||
        (filter === "used" && Number(item.use_count || 0) > 0) ||
        (filter === "unused" && Number(item.use_count || 0) === 0) ||
        (filter === "used-up" && usedUp) ||
        (filter === "expired" && expired);

      return matchesSearch && matchesFilter;
    });
  }, [items, search, filter]);

  return (
    <main className="invite-shell">
      <style>{`
        body {
          margin: 0;
          background: #0e0d0b;
        }

        .invite-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(200,147,90,0.13), transparent 34rem),
            radial-gradient(circle at bottom right, rgba(90,124,200,0.1), transparent 32rem),
            #0e0d0b;
          color: #f0ece4;
          padding: 48px 24px 90px;
          font-family: Arial, sans-serif;
        }

        .wrap {
          max-width: 1180px;
          margin: 0 auto;
        }

        .top-nav {
          display: flex;
          gap: 14px;
          margin-bottom: 24px;
          flex-wrap: wrap;
          align-items: center;
        }

        .top-nav a,
        .text-button {
          color: #c8935a;
          background: none;
          border: none;
          padding: 0;
          font: inherit;
          cursor: pointer;
          text-decoration: none;
        }

        .hero,
        .panel,
        .invite-card {
          border: 1px solid #26211c;
          background: rgba(18,16,13,0.95);
          box-shadow: 0 24px 80px rgba(0,0,0,0.22);
        }

        .hero {
          border-radius: 28px;
          padding: 32px;
          margin-bottom: 22px;
        }

        .eyebrow {
          color: #c8935a;
          font-family: monospace;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          font-size: 12px;
          font-weight: 900;
        }

        .title {
          font-family: Georgia, serif;
          font-size: clamp(48px, 8vw, 82px);
          line-height: 0.95;
          margin: 12px 0 0;
        }

        .subtitle {
          color: #aaa096;
          line-height: 1.7;
          max-width: 820px;
        }

        .summary-line {
          color: #aaa096;
          line-height: 1.6;
        }

        .notice-good,
        .notice-bad {
          padding: 14px;
          border-radius: 12px;
          margin-bottom: 16px;
          line-height: 1.5;
        }

        .notice-good {
          border: 1px solid #214a2d;
          background: #0a1a0e;
          color: #98d8aa;
        }

        .notice-bad {
          border: 1px solid #5a2020;
          background: #2a1010;
          color: #f0a0a0;
        }

        .panel {
          border-radius: 24px;
          padding: 22px;
          margin-bottom: 22px;
        }

        .panel-title {
          font-family: Georgia, serif;
          font-size: 34px;
          line-height: 1;
          margin: 0 0 16px;
        }

        .form-grid {
          display: grid;
          gap: 12px;
        }

        .input,
        .textarea,
        .select {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          background: #0e0d0b;
          color: #f0ece4;
          border: 1px solid #302a24;
          box-sizing: border-box;
          outline: none;
          font-size: 15px;
        }

        .textarea {
          min-height: 90px;
          resize: vertical;
          line-height: 1.5;
        }

        .input:focus,
        .textarea:focus,
        .select:focus {
          border-color: #c8935a;
        }

        .primary-button {
          min-height: 48px;
          border-radius: 12px;
          border: none;
          background: #c8935a;
          color: #0e0d0b;
          font-family: monospace;
          font-weight: 900;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .primary-button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .toolbar {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 220px;
          gap: 12px;
          margin-bottom: 18px;
        }

        .invite-list {
          display: grid;
          gap: 14px;
        }

        .invite-card {
          border-radius: 18px;
          padding: 18px;
        }

        .invite-head {
          display: flex;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          align-items: flex-start;
        }

        .code {
          font-family: monospace;
          color: #c8935a;
          font-weight: 900;
          font-size: 17px;
          letter-spacing: 0.04em;
          word-break: break-word;
        }

        .label {
          color: #aaa096;
          margin-top: 6px;
          line-height: 1.5;
        }

        .badge-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-top: 12px;
        }

        .badge {
          border: 1px solid #302a24;
          border-radius: 999px;
          padding: 6px 9px;
          color: #aaa096;
          font-family: monospace;
          font-size: 11px;
          background: #0e0d0b;
        }

        .badge.active {
          color: #98d8aa;
          border-color: #214a2d;
        }

        .badge.warning {
          color: #f0d08a;
          border-color: #5a4620;
        }

        .badge.bad {
          color: #f0a0a0;
          border-color: #5a2020;
        }

        .meta {
          color: #8f867b;
          font-size: 13px;
          line-height: 1.65;
          margin-top: 12px;
        }

        .card-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .secondary-button,
        .danger-button,
        .good-button {
          border: 1px solid #302a24;
          border-radius: 12px;
          padding: 10px 12px;
          cursor: pointer;
          font-family: monospace;
          font-weight: 900;
          background: #11100e;
          color: #c8935a;
        }

        .danger-button {
          background: #2a1010;
          color: #f0a0a0;
        }

        .good-button {
          background: #0a1a0e;
          color: #98d8aa;
        }

        .edit-grid {
          display: grid;
          grid-template-columns: 1fr 120px;
          gap: 10px;
          margin-top: 16px;
        }

        .full {
          grid-column: 1 / -1;
        }

        @media (max-width: 760px) {
          .invite-shell {
            padding: 28px 14px 90px;
          }

          .hero,
          .panel,
          .invite-card {
            border-radius: 20px;
            padding: 18px;
          }

          .title {
            font-size: clamp(42px, 12vw, 60px);
          }

          .toolbar,
          .edit-grid {
            grid-template-columns: 1fr;
          }

          .invite-head {
            display: grid;
            gap: 12px;
          }

          .card-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .secondary-button,
          .danger-button,
          .good-button {
            width: 100%;
          }
        }
      `}</style>

      <div className="wrap">
        <nav className="top-nav">
          <Link href="/admin/usage">Speedometer</Link>
          <Link href="/admin/feedback">Feedback</Link>
          <Link href="/dashboard">Dashboard</Link>
          <button className="text-button" onClick={() => loadInvites(true)} disabled={refreshing}>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </nav>

        <section className="hero">
          <div className="eyebrow">Admin Invites</div>
          <h1 className="title">The velvet rope.</h1>
          <p className="subtitle">
            Create, copy, search, edit, disable, and track beta invite codes without crawling back into Supabase every time.
          </p>

          {data && (
            <p className="summary-line">
              Total: {data.summary.total} / Active: {data.summary.active} / Inactive: {data.summary.inactive} / Used: {data.summary.used}
            </p>
          )}
        </section>

        {error && <div className="notice-bad">{error}</div>}
        {message && <div className="notice-good">{message}</div>}

        <section className="panel">
          <h2 className="panel-title">Create invite code</h2>

          <form onSubmit={createInvite} className="form-grid">
            <input
              className="input"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="Custom code, or leave blank to auto-generate"
            />

            <input
              className="input"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
              placeholder="Label, example: Cousins beta group"
            />

            <input
              className="input"
              value={maxUses}
              onChange={(event) => setMaxUses(event.target.value)}
              placeholder="Max uses, blank = unlimited"
              type="number"
              min="1"
            />

            <input
              className="input"
              value={expiresAt}
              onChange={(event) => setExpiresAt(event.target.value)}
              placeholder="Expires at, optional ISO date. Example: 2026-06-30T23:59:00Z"
            />

            <textarea
              className="textarea"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Notes, optional"
            />

            <button className="primary-button" type="submit" disabled={creating}>
              {creating ? "Creating..." : "Create Invite"}
            </button>
          </form>
        </section>

        <section className="panel">
          <h2 className="panel-title">Invite codes</h2>

          <div className="toolbar">
            <input
              className="input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search code, label, or notes..."
            />

            <select
              className="select"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">All invites</option>
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
              <option value="used">Used at least once</option>
              <option value="unused">Unused only</option>
              <option value="used-up">Used up</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          {loading ? (
            <p>Loading invite codes...</p>
          ) : filteredItems.length === 0 ? (
            <p>No invite codes match this view.</p>
          ) : (
            <div className="invite-list">
              {filteredItems.map((item) => (
                <InviteCard
                  key={item.id}
                  item={item}
                  onCopy={copyCode}
                  onToggle={updateInviteActive}
                  onSave={updateInviteDetails}
                />
              ))}
            </div>
          )}

          {items.length > 0 && (
            <p className="meta">
              Active codes can be used on the signup page. Existing users do not need a code to sign in.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

function InviteCard({
  item,
  onCopy,
  onToggle,
  onSave,
}: {
  item: InviteItem;
  onCopy: (code: string) => Promise<void>;
  onToggle: (item: InviteItem, active: boolean) => Promise<void>;
  onSave: (item: InviteItem, draft: InviteDraft) => Promise<void>;
}) {
  const [label, setLabel] = useState(item.label || "");
  const [maxUses, setMaxUses] = useState(item.max_uses === null || item.max_uses === undefined ? "" : String(item.max_uses));
  const [expiresAt, setExpiresAt] = useState(item.expires_at || "");
  const [notes, setNotes] = useState(item.notes || "");
  const [saving, setSaving] = useState(false);

  const usedUp = isUsedUp(item);
  const expired = isExpired(item);

  async function saveDetails() {
    setSaving(true);

    try {
      await onSave(item, {
        label,
        maxUses,
        expiresAt,
        notes,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="invite-card">
      <div className="invite-head">
        <div>
          <div className="code">{item.code}</div>
          <div className="label">{item.label || "No label"}</div>

          <div className="badge-row">
            <span className={item.active ? "badge active" : "badge bad"}>
              {item.active ? "active" : "inactive"}
            </span>

            <span className={usedUp ? "badge bad" : "badge"}>
              {item.use_count} / {item.max_uses ?? "unlimited"} uses
            </span>

            {expired && <span className="badge bad">expired</span>}
            {!expired && item.expires_at && <span className="badge warning">expires</span>}
          </div>
        </div>

        <div className="card-buttons">
          <button className="secondary-button" type="button" onClick={() => onCopy(item.code)}>
            Copy
          </button>

          <button
            className={item.active ? "danger-button" : "good-button"}
            type="button"
            onClick={() => onToggle(item, !item.active)}
          >
            {item.active ? "Disable" : "Enable"}
          </button>
        </div>
      </div>

      <div className="meta">
        Created: {formatDate(item.created_at)}
        <br />
        Last used: {formatDate(item.last_used_at)}
        <br />
        Expires: {formatDate(item.expires_at)}
      </div>

      <div className="edit-grid">
        <input
          className="input"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          placeholder="Label"
        />

        <input
          className="input"
          value={maxUses}
          onChange={(event) => setMaxUses(event.target.value)}
          placeholder="Max uses"
          type="number"
          min="1"
        />

        <input
          className="input full"
          value={expiresAt}
          onChange={(event) => setExpiresAt(event.target.value)}
          placeholder="Expiration ISO date, optional"
        />

        <textarea
          className="textarea full"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Notes"
        />

        <button className="primary-button full" type="button" onClick={saveDetails} disabled={saving}>
          {saving ? "Saving..." : "Save Invite Details"}
        </button>
      </div>
    </article>
  );
}

const inputStyle: CSSProperties = {
  width: "100%",
};
