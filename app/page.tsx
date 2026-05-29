"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const [manuscript, setManuscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [completedReports, setCompletedReports] = useState<string[]>([]);
  const [error, setError] = useState("");
  const router = useRouter();

  const reportLabels: Record<string, string> = {
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
                setCompletedReports((prev) => [...prev, data.reportType]);
              } else if (data.type === "complete") {
                router.push("/view?id=" + data.submissionId);
              } else if (data.type === "error") {
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
      <h1>5 CORE — Manuscript Diagnosis</h1>
      <p>Paste manuscript text below and run the full diagnosis.</p>

      {!loading && !error && (
        <div>
          <textarea
            value={manuscript}
            onChange={(e) => setManuscript(e.target.value)}
            rows={12}
            styl