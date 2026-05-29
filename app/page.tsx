"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [manuscript, setManuscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function runDiagnosis() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manuscriptText: manuscript }),
      });

      const data = await response.json();

      if (data.submissionId) {
        router.push(`/reports/${data.submissionId}`);
      } else {
        setError("Something went wrong. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>5 CORE — Manuscript Diagnosis</h1>
      <p>Paste manuscript text below and run the full diagnosis.</p>

      <textarea
        value={manuscript}
        onChange={(e) => setManuscript(e.target.value)}
        rows={15}
        style={{ width: "100%", marginTop: "20px", padding: "10px" }}
        placeholder="Paste your manuscript text here..."
        disabled={loading}
      />

      <button
        onClick={runDiagnosis}
        disabled={loading || !manuscript}
        style={{ marginTop: "20px", padding: "10px 30px", fontSize: "16px" }}
      >
        {loading ? "Running diagnosis — this takes a few minutes..." : "Run Full Diagnosis"}
      </button>

      {loading && (
        <div style={{ marginTop: "40px", color: "#888" }}>
          <p>Reading your manuscript...</p>
          <p>Running Voice analysis...</p>
          <p>Checking structure...</p>
          <p>Counting repetition...</p>
          <p>Identifying your reader...</p>
          <p>Building your revision plan...</p>
          <p>Saving your reports...</p>
        </div>
      )}

      {error && (
        <p style={{ marginTop: "20px", color: "red" }}>{error}</p>
      )}
    </main>
  );
}