"use client";

import { useState } from "react";

export default function Home() {
  const [manuscript, setManuscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [report, setReport] = useState("");
  const [error, setError] = useState("");

  async function runDiagnosis() {
    setLoading(true);
    setError("");
    setReport("");
    setStatus("Starting...");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manuscriptText: manuscript }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === "status") setStatus(data.message);
              if (data.type === "done") {
                setReport(data.report);
                setLoading(false);
              }
              if (data.type === "error") {
                setError(data.message);
                setLoading(false);
              }
            } catch {}
          }
        }
      }
    } catch {
      setError("Connection failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>5 CORE — Voice Report Test</h1>

      {!report && (
        <>
          <textarea
            value={manuscript}
            onChange={(e) => setManuscript(e.target.value)}
            rows={10}
            style={{ width: "100%", marginTop: "20px", padding: "10px" }}
            placeholder="Paste a few paragraphs here..."
            disabled={loading}
          />
          <button
            onClick={runDiagnosis}
            disabled={loading || !manuscript}
            style={{ marginTop: "20px", padding: "10px 30px", fontSize: "16px" }}
          >
            {loading ? "Running..." : "Run Voice Report"}
          </button>
        </>
      )}

      {loading && <p style={{ marginTop: "20px", color: "#c8a96e" }}>{status}</p>}
      {error && <p style={{ marginTop: "20px", color: "red" }}>{error}</p>}

      {report && (
        <div style={{ marginTop: "30px" }}>
          <h2>Your Voice Report</h2>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.7", marginTop: "15px" }}>
            {report}
          </div>
          <button
            onClick={() => { setReport(""); setManuscript(""); }}
            style={{ marginTop: "30px", padding: "10px 20px" }}
          >
            Run Another
          </button>
        </div>
      )}
    </main>
  );
}