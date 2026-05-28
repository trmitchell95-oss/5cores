"use client";

import { useState } from "react";

export default function Home() {
  const [manuscript, setManuscript] = useState("");
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(false);

  async function runDiagnosis() {
    setLoading(true);
    setReport("");

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manuscriptText: manuscript }),
    });

    const data = await response.json();
    setReport(data.report || data.error);
    setLoading(false);
  }

  return (
    <main style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>5 CORE — Voice Report Test</h1>
      <p>Paste manuscript text below and run the diagnosis.</p>

      <textarea
        value={manuscript}
        onChange={(e) => setManuscript(e.target.value)}
        rows={15}
        style={{ width: "100%", marginTop: "20px", padding: "10px" }}
        placeholder="Paste your manuscript text here..."
      />

      <button
        onClick={runDiagnosis}
        disabled={loading || !manuscript}
        style={{ marginTop: "20px", padding: "10px 30px", fontSize: "16px" }}
      >
        {loading ? "Running diagnosis..." : "Run Voice Report"}
      </button>

      {report && (
        <div style={{ marginTop: "40px", whiteSpace: "pre-wrap" }}>
          <h2>Your Report</h2>
          <p>{report}</p>
        </div>
      )}
    </main>
  );
}