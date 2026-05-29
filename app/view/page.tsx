"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const reportLabels: Record<string, string> = {
  voice: "Voice Report",
  structure: "Structure Report",
  surgical: "Surgical Fix Report",
  roadmap: "Revision Roadmap",
};

function ReportContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [reports, setReports] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setError("No report ID provided.");
      setLoading(false);
      return;
    }

    fetch(`/api/reports?id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setReports(data.reports);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load reports.");
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p>Loading your reports...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <p style={{ color: "#888", fontSize: "14px" }}>
        Bookmark this page to return to your reports any time.
      </p>
      <div style={{ marginTop: "40px" }}>
        {Object.entries(reportLabels).map(([key, label]) => (
          <div key={key} style={{ marginBottom: "60px" }}>
            <h2 style={{ borderBottom: "1px solid #333", paddingBottom: "10px" }}>
              {label}
            </h2>
            <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.7", marginTop: "20px" }}>
              {reports[key] || "Report not available."}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ViewPage() {
  return (
    <main style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>5 CORE — Your Diagnosis</h1>
      <Suspense fallback={<p>Loading...</p>}>
        <ReportContent />
      </Suspense>
    </main>
  );
}