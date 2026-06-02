"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type VersionSummary = {
  title: string;
  verdict: string;
  created_at?: string | null;
};

type CompareResult = {
  headline: string;
  verdictMovement: string;
  clarityDelta: string;
  whatGotStronger: string[];
  whatGotClearer: string[];
  whatGotWeaker: string[];
  weakSpotsAddressed: string[];
  stillLeaking: string[];
  nextBestRevision: string[];
  honestRead: string;
};

type CompareApiResponse =
  | {
      ok: true;
      parentReportId: string;
      currentReportId: string;
      previous: VersionSummary;
      current: VersionSummary;
      comparison: CompareResult;
    }
  | {
      ok?: false;
      error: string;
      details?: string;
    };

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase browser settings.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

function formatDate(value?: string | null) {
  if (!value) return "Date unavailable";

  try {
    return new Date(value).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function BulletList({ items }: { items: string[] }) {
  if (!items.length) {
    return <p className="muted">Nothing useful came back here.</p>;
  }

  return (
    <ul>
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
}

export default function IdeanatorComparePage() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<Extract<CompareApiResponse, { ok: true }> | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadComparison() {
      try {
        setLoading(true);
        setError("");

        if (!id) {
          throw new Error("Missing report id.");
        }

        const supabase = getSupabaseClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          window.location.href = "/login";
          return;
        }

        const response = await fetch("/api/ideanator/compare", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ reportId: id }),
        });

        const result = (await response.json()) as CompareApiResponse;

        if (!response.ok || !("ok" in result) || !result.ok) {
          const message =
            "error" in result && typeof result.error === "string"
              ? result.error
              : "Could not compare versions.";

          throw new Error(message);
        }

        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not compare versions.");
      } finally {
        setLoading(false);
      }
    }

    loadComparison();
  }, [id]);

  const copyText = useMemo(() => {
    if (!data) return "";

    const c = data.comparison;

    function section(title: string, items: string[]) {
      return `${title}\n${items.map((item) => `- ${item}`).join("\n")}`;
    }

    return `IDEANATOR VERSION COMPARISON

${data.previous.title} â†’ ${data.current.title}

VERDICT MOVEMENT
${c.verdictMovement}

HEADLINE
${c.headline}

CLARITY DELTA
${c.clarityDelta}

${section("WHAT GOT STRONGER", c.whatGotStronger)}

${section("WHAT GOT CLEARER", c.whatGotClearer)}

${section("WHAT GOT WEAKER", c.whatGotWeaker)}

${section("WEAK SPOTS ADDRESSED", c.weakSpotsAddressed)}

${section("STILL LEAKING", c.stillLeaking)}

${section("NEXT BEST REVISION", c.nextBestRevision)}

HONEST READ
${c.honestRead}`;
  }, [data]);

  async function copyComparison() {
    if (!copyText) return;

    await navigator.clipboard.writeText(copyText);
    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1800);
  }

  return (
    <main className="compare-shell">
      <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #101010;
        }

        .compare-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(245, 158, 11, 0.18), transparent 34rem),
            radial-gradient(circle at bottom right, rgba(125, 211, 252, 0.1), transparent 30rem),
            #101010;
          color: #f5f1e8;
          font-family:
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .wrap {
          width: min(1120px, 100%);
          margin: 0 auto;
          padding: 34px 24px 90px;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          margin-bottom: 24px;
        }

        .nav-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: flex-end;
        }

        .nav-link,
        .action-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 44px;
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(255, 255, 255, 0.06);
          color: #f5f1e8;
          text-decoration: none;
          border-radius: 999px;
          padding: 11px 15px;
          font-weight: 900;
          font-size: 0.78rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
        }

        .nav-link:hover,
        .action-button:hover {
          border-color: #f0b35f;
          color: #f0b35f;
        }

        .hero,
        .panel,
        .loading-box,
        .error-box {
          border: 1px solid rgba(255, 255, 255, 0.14);
          background: rgba(20, 20, 20, 0.88);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
          border-radius: 30px;
          padding: clamp(24px, 5vw, 44px);
        }

        .hero {
          margin-bottom: 22px;
        }

        .eyebrow {
          margin: 0 0 10px;
          color: #f0b35f;
          font-size: 0.75rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          font-weight: 900;
        }

        h1 {
          margin: 0;
          font-size: clamp(2.5rem, 6vw, 5.5rem);
          line-height: 0.92;
          letter-spacing: -0.08em;
        }

        h2 {
          margin: 0 0 12px;
          font-size: clamp(1.7rem, 3vw, 2.7rem);
          line-height: 1;
          letter-spacing: -0.04em;
        }

        h3 {
          margin: 0 0 10px;
          color: #fff7ea;
          font-size: 1.05rem;
        }

        p {
          color: #ddd5c7;
          line-height: 1.65;
        }

        .version-row {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 24px;
        }

        .version-card {
          border: 1px solid rgba(240, 179, 95, 0.22);
          background: rgba(240, 179, 95, 0.07);
          border-radius: 20px;
          padding: 18px;
        }

        .version-card span {
          display: block;
          color: #bdb4a8;
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          font-weight: 900;
          margin-bottom: 8px;
        }

        .version-card strong {
          display: block;
          color: #fff7ea;
          font-size: 1.2rem;
          overflow-wrap: anywhere;
        }

        .version-card small {
          display: block;
          color: #bdb4a8;
          margin-top: 8px;
        }

        .movement {
          display: inline-flex;
          width: fit-content;
          margin-top: 22px;
          border-radius: 999px;
          background: #f0b35f;
          color: #18100a;
          font-weight: 1000;
          padding: 10px 14px;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
        }

        .panel.full {
          grid-column: 1 / -1;
        }

        ul {
          margin: 0;
          padding-left: 20px;
        }

        li {
          color: #ddd5c7;
          line-height: 1.65;
          margin-bottom: 8px;
        }

        .muted {
          color: #a99f92;
        }

        .loading-box,
        .error-box {
          color: #ddd5c7;
        }

        .error-box {
          border-color: rgba(248, 113, 113, 0.45);
          background: rgba(248, 113, 113, 0.1);
        }

        @media (max-width: 760px) {
          .wrap {
            padding: 22px 14px 90px;
          }

          .topbar {
            flex-direction: column;
            align-items: stretch;
          }

          .nav-actions,
          .version-row,
          .grid {
            grid-template-columns: 1fr;
            flex-direction: column;
          }

          .nav-link,
          .action-button {
            width: 100%;
          }
        }
      `}</style>

      <div className="wrap">
        <div className="topbar">
          <Link href={`/reports/${id}`} className="nav-link">
            Back to Report
          </Link>

          <div className="nav-actions">
            <Link href="/ideanator" className="nav-link">
              Open Ideanator
            </Link>

            <button
              className="action-button"
              type="button"
              onClick={copyComparison}
              disabled={!copyText}
            >
              {copied ? "Copied" : "Copy Comparison"}
            </button>
          </div>
        </div>

        {loading && (
          <div className="loading-box">
            Comparing versions. The little bastard is back on the alignment rack.
          </div>
        )}

        {error && <div className="error-box">{error}</div>}

        {!loading && !error && data && (
          <>
            <section className="hero">
              <p className="eyebrow">IDEANATOR VERSION COMPARISON</p>
              <h1>{data.comparison.headline}</h1>

              <div className="movement">{data.comparison.verdictMovement}</div>

              <div className="version-row">
                <div className="version-card">
                  <span>Earlier Version</span>
                  <strong>{data.previous.title}</strong>
                  <small>
                    {data.previous.verdict} â€¢ {formatDate(data.previous.created_at)}
                  </small>
                </div>

                <div className="version-card">
                  <span>Revised Version</span>
                  <strong>{data.current.title}</strong>
                  <small>
                    {data.current.verdict} â€¢ {formatDate(data.current.created_at)}
                  </small>
                </div>
              </div>
            </section>

            <section className="grid">
              <article className="panel full">
                <h2>Clarity Delta</h2>
                <p>{data.comparison.clarityDelta}</p>
              </article>

              <article className="panel">
                <h3>What Got Stronger</h3>
                <BulletList items={data.comparison.whatGotStronger} />
              </article>

              <article className="panel">
                <h3>What Got Clearer</h3>
                <BulletList items={data.comparison.whatGotClearer} />
              </article>

              <article className="panel">
                <h3>What Got Weaker</h3>
                <BulletList items={data.comparison.whatGotWeaker} />
              </article>

              <article className="panel">
                <h3>Weak Spots Addressed</h3>
                <BulletList items={data.comparison.weakSpotsAddressed} />
              </article>

              <article className="panel">
                <h3>Still Leaking Oil</h3>
                <BulletList items={data.comparison.stillLeaking} />
              </article>

              <article className="panel">
                <h3>Next Best Revision</h3>
                <BulletList items={data.comparison.nextBestRevision} />
              </article>

              <article className="panel full">
                <h2>Honest Read</h2>
                <p>{data.comparison.honestRead}</p>
              </article>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
