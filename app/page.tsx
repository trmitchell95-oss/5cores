import { createClient } from "@supabase/supabase-js";

const reportTabs = [
  { key: "voice", label: "Voice Report" },
  { key: "structure", label: "Structure Report" },
  { key: "surgical", label: "Surgical Fix Report" },
  { key: "roadmap", label: "Revision Roadmap" },
];

export default async function ReportPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: reports } = await supabase
    .from("reports")
    .select("*")
    .eq("submission_id", id)
    .eq("phase", 1);

  if (!reports || reports.length === 0) {
    return (
      <main style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
        <h1>Report not found</h1>
        <p>This report may have been deleted or the ID is incorrect.</p>
      </main>
    );
  }

  const reportMap: Record<string, string> = {};
  for (const report of reports) {
    reportMap[report.report_type] = report.content;
  }

  return (
    <main style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
      <h1>5 CORE — Your Diagnosis</h1>
      <p style={{ color: "#888", fontSize: "14px" }}>
        Bookmark this page to return to your reports any time.
      </p>

      <div style={{ marginTop: "40px" }}>
        {reportTabs.map((tab) => (
          <div key={tab.key} style={{ marginBottom: "60px" }}>
            <h2 style={{ borderBottom: "1px solid #333", paddingBottom: "10px" }}>
              {tab.label}
            </h2>
            <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.7", marginTop: "20px" }}>
              {reportMap[tab.key] || "Report not available."}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}