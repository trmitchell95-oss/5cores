"use client";

import { useState } from "react";

export default function Home() {
  const [manuscript, setManuscript] = useState("");
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runReport() {
    setLoading(true);
    setError("");
    setReport("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          manuscript,
          text: manuscript,
        }),
      });

      const rawText = await response.text();

      let data: any = {};

      try {
        data = JSON.parse(rawText);
      } catch {
        if (rawText.includes("<!DOCTYPE html>")) {
          throw new Error(
            "The app reached a webpage instead of the report API. The frontend is probably pointing at the wrong API route."
          );
        }

        data = { report: rawText };
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            data?.details ||
            rawText ||
            "Something went wrong while generating the report."
        );
      }

      const finalReport =
        data?.report ||
        data?.completedReport ||
        data?.voiceReport ||
        data?.result ||
        data?.output ||
        data?.content ||
        data?.message ||
        rawText;

      if (!finalReport) {
        throw new Error("The report came back empty.");
      }

      setReport(finalReport);
    } catch (err: any) {
      setError(err?.message || "Unknown error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-neutral-500">
            The Hovel Editor
          </p>

          <h1 className="text-5xl font-black tracking-tight">5 CORE</h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-neutral-400">
            Paste manuscript text below and run the diagnosis.
          </p>
        </header>

        <section className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
          <label
            htmlFor="manuscript"
            className="mb-3 block text-sm font-bold uppercase tracking-wide text-neutral-300"
          >
            Manuscript Text
          </label>

          <textarea
            id="manuscript"
            value={manuscript}
            onChange={(e) => setManuscript(e.target.value)}
            rows={16}
            placeholder="Paste your manuscript text here..."
            className="w-full resize-y rounded-xl border border-neutral-700 bg-black p-4 text-base leading-7 text-neutral-100 outline-none transition focus:border-white"
          />

          <div className="mt-5 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={runReport}
              disabled={loading || manuscript.trim().length === 0}
              className="rounded-xl bg-white px-6 py-3 font-bold text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Running Report..." : "Run Voice Report"}
            </button>

            <p className="text-sm text-neutral-500">
              Characters: {manuscript.length}
            </p>
          </div>
        </section>

        {error && (
          <section className="mt-8 rounded-2xl border border-red-800 bg-red-950/40 p-6 text-red-100">
            <h2 className="mb-3 text-2xl font-black">Error</h2>
            <p className="whitespace-pre-wrap leading-7">{error}</p>
          </section>
        )}

        {report && (
          <section className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
            <h2 className="mb-4 text-3xl font-black">Your Report</h2>

            <article className="whitespace-pre-wrap text-base leading-8 text-neutral-100">
              {report}
            </article>
          </section>
        )}
      </div>
    </main>
  );
}