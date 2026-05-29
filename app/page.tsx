"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [manuscript, setManuscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [completedReports, setCompletedReports] = useState([]);
  const [error, setError] = useState("");
  const router = useRouter();

  const reportLabels = {
    voice: "Voice Report",
    structure: "Structure Report",
    surgical: "Surgical Fix Report",
    roadmap: "Revision Roadmap",
  };

  async function runDiagnosis() {
    setLoading(true);
    setError("");
    setCompletedReports([]);
    setStatus("Starting diagnosis...");

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
              if (data.type === "status") {
                setStatus(data.message);
              } else if (data.type === "report") {
                setCompletedReports(function(prev) { return [...prev, data.reportType]; });
              } else if (data.type === "complete") {
                router.push("/view?id=" + data.submissionId);
              } else if (data.type === "error") {
                setError(data.message);
                setLoading(false);
              }
            } catch (e) {}
          }
        }
      }
    } catch (e) {
      setError("Connection failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>5 CORE Manuscript Diagnosis</h1>
      <p>Paste manuscript text below and run the full diagnosis.</p>

      {!loading && !error && (
        <div>
          <textarea
            value={manuscript}
            onChange={function(e) { setManuscript(e.target.value); }}
            rows={12}
            style={{ width: "100%", marginTop: "20px", padding: "10px" }}
            placeholder="Paste your manuscript text here..."
          />
          <button
            onClick={runDiagnosis}
            disabled={!manuscript}
            style={{ marginTop: "20px", padding: "10px 30px", fontSize: "16px" }}
          >
            Run Full Diagnosis
          </button>
        </div>
      )}

      {loading && (
        <div style={{ marginTop: "40px" }}>
          <p style={{ fontSize: "18px", color: "#c8a96e" }}>{status}</p>
          <div style={{ marginTop: "20px" }}>
            {completedReports.map(function(r) {
              return (
                <p key={r} style={{ color: "#4a7c59", margin: "8px 0" }}>
                  {"Done: " + (reportLabels[r] || r)}
                </p>
              );
            })}
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginTop: "20px" }}>
          <p style={{ color: "red" }}>{error}</p>
          <button
            onClick={function() {
              setLoading(false);
              setError("");
              setCompletedReports([]);
              setStatus("");
            }}
            style={{ marginTop: "10px", padding: "8px 20px" }}
          >
            Try Again
          </button>
        </div>
      )}
    </main>
  );
}
