"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type ReportRecord = {
  id: string;
  created_at?: string;
  title?: string | null;
  [key: string]: unknown;
};

function formatDate(dateStr?: string) {
  if (!dateStr) return "";

  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function prettifyLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function isDisplayableReportField(key: string, value: unknown) {
  if (value === null || value === undefined || value === "") return false;

  const hiddenKeys = new Set([
    "id",
    "user_id",
    "created_at",
    "updated_at",
    "title",
    "manuscript",
    "manuscript_text",
    "manuscriptText",
    "content",
    "raw_text",
    "input",
    "input_text",
  ]);

  if (hiddenKeys.has(key)) return false;

  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "object") return true;
  if (typeof value === "number" || typeof value === "boolean") return true;

  return false;
}

function renderValue(value: unknown) {
  if (typeof value === "string") return value;

  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}

export default function ReportPage() {
  const params = useParams();

  const rawId = params?.id;
  const reportId = Array.isArray(rawId) ? rawId[0] : rawId;

  const [report, setReport] = useState<ReportRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadReport() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
        return;
      }

      if (!reportId) {
        setErrorMessage("Missing report ID.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("id", reportId)
        .single();

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      setReport(data as ReportRecord);
      setLoading(false);
    }

    loadReport();
  }, [reportId]);

  const reportSections = useMemo(() => {
    if (!report) return [];

    return Object.entries(report)
      .filter(([key, value]) => isDisplayableReportField(key, value))
      .map(([key, value]) => ({
        key,
        label: prettifyLabel(key),
        content: renderValue(value),
      }));
  }, [report]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0e0d0b",
        color: "#f0ece4",
        fontFamily: "Georgia, serif",
      }}
    >
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "48px 32px" }}>
        <a
          href="/dashboard"
          style={{
            display: "inline-block",
            color: "#6b6560",
            fontSize: "13px",
            textDecoration: "none",
            letterSpacing: "0.08em",
            marginBottom: "36px",
          }}
        >
          Back to Dashboard
        </a>

        {loading ? (
          <div style={{ padding: "80px 0", color: "#6b6560" }}>
            Loading report...
          </div>
        ) : errorMessage ? (
          <div
            style={{
              background: "#161412",
              border: "1px solid #3a2520",
              padding: "24px",
              color: "#d19a7a",
            }}
          >
            <h1 style={{ marginTop: 0 }}>Report could not be loaded.</h1>
            <p style={{ marginBottom: 0 }}>{errorMessage}</p>
          </div>
        ) : !report ? (
          <div
            style={{
              background: "#161412",
              border: "1px solid #2a2520",
              padding: "24px",
              color: "#6b6560",
            }}
          >
            Report not found.
          </div>
        ) : (
          <>
            <div
              style={{
                borderBottom: "1px solid #2a2520",
                paddingBottom: "28px",
                marginBottom: "40px",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  color: "#c8a96e",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  marginBottom: "16px",
                }}
              >
                Editorial Council Report
              </div>

              <h1
                style={{
                  fontSize: "42px",
                  lineHeight: "1.1",
                  fontWeight: "600",
                  margin: "0 0 12px",
                }}
              >
                {report.title || "Untitled Manuscript"}
              </h1>

              {report.created_at && (
                <div
                  style={{
                    fontSize: "13px",
                    color: "#4a4540",
                    fontFamily: "monospace",
                  }}
                >
                  {formatDate(report.created_at)}
                </div>
              )}
            </div>

            {reportSections.length === 0 ? (
              <div
                style={{
                  background: "#161412",
                  border: "1px solid #2a2520",
                  padding: "24px",
                  color: "#6b6560",
                }}
              >
                This report exists, but no readable report sections were found.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                {reportSections.map((section) => (
                  <section
                    key={section.key}
                    style={{
                      background: "#161412",
                      border: "1px solid #1e1c18",
                      padding: "28px",
                    }}
                  >
                    <h2
                      style={{
                        color: "#c8a96e",
                        fontSize: "20px",
                        marginTop: 0,
                        marginBottom: "18px",
                      }}
                    >
                      {section.label}
                    </h2>

                    <div
                      style={{
                        whiteSpace: "pre-wrap",
                        color: "#d8d0c4",
                        fontSize: "16px",
                        lineHeight: "1.7",
                      }}
                    >
                      {section.content}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
