"use client";

import { useState } from "react";

const modes = [
  { value: "GENERAL", label: "General Human Cleanup" },
  { value: "APPLICATION", label: "Application / Grant Answer" },
  { value: "AUTHOR", label: "Author Voice" },
  { value: "MARKETING", label: "Marketing Copy" },
  { value: "EMAIL", label: "Email" },
  { value: "SOCIAL", label: "Social Post" },
];

const strictnessOptions = [
  { value: "STANDARD", label: "Standard" },
  { value: "BRUTAL", label: "Brutal" },
  { value: "MURDER MODE", label: "Murder Mode" },
];

function extractSection(
  fullText: string,
  startHeading: string,
  followingHeadings: string[]
) {
  if (!fullText) return "";

  const startIndex = fullText.indexOf(startHeading);

  if (startIndex === -1) return "";

  const contentStart = startIndex + startHeading.length;
  const remaining = fullText.slice(contentStart);

  let endIndex = remaining.length;

  for (const heading of followingHeadings) {
    const foundIndex = remaining.indexOf(heading);

    if (foundIndex !== -1 && foundIndex < endIndex) {
      endIndex = foundIndex;
    }
  }

  return remaining.slice(0, endIndex).trim();
}

export default function SphinxPage() {
  const [text, setText] = useState("");
  const [mode, setMode] = useState("GENERAL");
  const [strictness, setStrictness] = useState("BRUTAL");
  const [report, setReport] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const [strongerVersion, setStrongerVersion] = useState("");

  async function runSphinx() {
    setLoading(true);
    setError("");
    setReport("");
    setCopied("");
    setStrongerVersion("");

    try {
      const response = await fetch("/api/sphinx", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ text, mode, strictness }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Sphinx failed.");
      }

      const nextReport = data.report || "";
      const nextStrongerVersion = extractSection(nextReport, "## 6. Stronger Version", [
        "## 7. What Changed",
        "## 8. Final Sphinx Verdict",
      ]);

      setReport(nextReport);
      setStrongerVersion(nextStrongerVersion);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function copyReport() {
    if (!report) return;

    await navigator.clipboard.writeText(report);
    setCopied("report");

    setTimeout(() => {
      setCopied("");
    }, 2000);
  }

  async function copyStrongerVersion() {
    if (!strongerVersion) return;

    await navigator.clipboard.writeText(strongerVersion);
    setCopied("stronger");

    setTimeout(() => {
      setCopied("");
    }, 2000);
  }

  function clearAll() {
    setText("");
    setReport("");
    setError("");
    setCopied("");
    setStrongerVersion("");
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-zinc-100">
      <div className="mx-auto max-w-6xl">
        <section className="mb-8 rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8 shadow-2xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">
            5 CORE Add-On
          </p>

          <h1 className="mb-3 text-4xl font-black tracking-tight text-white md:text-5xl">
            SPHINX
          </h1>

          <p className="max-w-3xl text-lg leading-8 text-zinc-300">
            The AI Stink Preventer. Paste writing that sounds too polished,
            too generic, too corporate, or too much like a robot wearing a
            conference badge. Sphinx will diagnose it and rewrite it like a
            human being.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white">
                Paste Your Text
              </h2>
              <p className="mt-1 text-sm text-zinc-400">
                Best for blurbs, grant answers, emails, posts, bios, and
                application responses.
              </p>
            </div>

            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Mode
                </span>
                <select
                  value={mode}
                  onChange={(event) => setMode(event.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-amber-400"
                >
                  {modes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
                  Strictness
                </span>
                <select
                  value={strictness}
                  onChange={(event) => setStrictness(event.target.value)}
                  className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none focus:border-amber-400"
                >
                  {strictnessOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Paste something that smells a little too AI in here..."
              className="min-h-[430px] w-full resize-y rounded-2xl border border-zinc-700 bg-zinc-950 p-5 text-base leading-7 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-amber-400"
            />

            <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <p className="text-sm text-zinc-500">
                {text.length.toLocaleString()} characters
              </p>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={clearAll}
                  type="button"
                  className="rounded-xl border border-zinc-700 px-5 py-3 text-sm font-semibold text-zinc-300 hover:border-zinc-500 hover:text-white"
                >
                  Clear
                </button>

                <button
                  onClick={runSphinx}
                  disabled={loading || text.trim().length < 20}
                  type="button"
                  className="rounded-xl bg-amber-400 px-5 py-3 text-sm font-black text-zinc-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Running Sphinx..." : "Run Sphinx"}
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-2xl border border-red-900 bg-red-950/50 p-4 text-sm text-red-200">
                {error}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Sphinx Report
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Diagnosis, rewrite, shorter version, and stronger version.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={copyStrongerVersion}
                  disabled={!strongerVersion}
                  type="button"
                  className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-300 hover:border-amber-400 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {copied === "stronger" ? "Copied Stronger" : "Copy Stronger"}
                </button>

                <button
                  onClick={copyReport}
                  disabled={!report}
                  type="button"
                  className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-300 hover:border-amber-400 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {copied === "report" ? "Copied Report" : "Copy Report"}
                </button>
              </div>
            </div>

            <div className="min-h-[540px] rounded-2xl border border-zinc-800 bg-zinc-950 p-5">
              {!report && !loading && (
                <div className="flex h-full min-h-[500px] items-center justify-center text-center text-zinc-500">
                  <div>
                    <p className="text-lg font-semibold text-zinc-400">
                      No report yet.
                    </p>
                    <p className="mt-2 max-w-md text-sm leading-6">
                      Paste something on the left and let Sphinx sniff out the
                      robot perfume.
                    </p>
                  </div>
                </div>
              )}

              {loading && (
                <div className="flex h-full min-h-[500px] items-center justify-center text-center text-zinc-400">
                  <div>
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-amber-400" />
                    <p className="text-lg font-semibold">Sphinx is reading.</p>
                    <p className="mt-2 text-sm text-zinc-500">
                      It is judging the stink.
                    </p>
                  </div>
                </div>
              )}

              {report && (
                <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-7 text-zinc-100">
                  {report}
                </pre>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
