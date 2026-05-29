"use client";

import { useState } from "react";

interface Reports {
  voice: string;
  structure: string;
  repetition: string;
  market: string;
  surgical: string;
  roadmap: string;
}

export default function Home() {
  const [manuscript, setManuscript] = useState("");
  const [reports, setReports] = useState<Reports | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeReport, setActiveReport] = useState("voice");

  async function runDiagnosis() {
    setLoading(true);
    setReports(null);

    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ manuscriptText: manuscript }),
    });

    const data = await response.json();
    setReports(data.reports || null);
    setLoading(false);
  }

  const reportTabs = [
    { key: "voice", label: "Voice" },
    { key: "structure", label: "Structure" },
    { key: "repetition", label: "Repetition" },
    { key: "market", label: "Market" },
    { key: "surgical", label: "Surgical Fix" },
    { key: "roadmap", label: "Roadmap" },
  ];

  return (
    <main style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>5 CORE — Manuscript Diagnosis</h1>
      <p>Paste manuscript text below and run the full diagnosis.</p>

      {!reports && (
        <>
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
            {loading ? "Running diagnosis — this takes a few minutes..." : "Run Full Diagnosis"}
          </button>
        </>
      )}

      {loading && (
        <div style={{ marginTop: "40px" }}>
          <p>Reading your manuscript...</p>
          <p>Running Voice analysis...</p>
          <p>Checking structure...</p>
          <p>Counting repetition...</p>
          <p>Identifying your reader...</p>
          <p>Building your revision plan...</p>
        </div>
      )}

      {reports && (
        <div style={{ marginTop: "40px" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "30px" }}>
            {reportTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveReport(tab.key)}
                style={{
                  padding: "8px 20px",
                  fontSize: "14px",
                  background: activeReport === tab.key ? "#c8a96e" : "#1a1a1a",
                  color: activeReport === tab.key ? "#000" : "#f0ede8",
                  border: "1px solid #c8a96e",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.7" }}>
            {reports[activeReport as keyof Reports]}
          </div>

          <button
            onClick={() => { setReports(null); setManuscript(""); }}
            style={{ marginTop: "40px", padding: "10px 30px", fontSize: "14px" }}
          >
            Start New Diagnosis
          </button>
        </div>
      )}
    </main>
  );
}