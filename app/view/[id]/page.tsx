import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type ReportRow = {
  id: string;
  submission_id: string;
  draft_version_id: string | null;
  created_at: string;
  report_type: string;
  content: string;
};

type DraftVersionRow = {
  id: string;
  submission_id: string;
  created_at: string;
  version_number: number;
  extracted_text: string | null;
  extraction_status: string | null;
  word_count: number | null;
};

type SubmissionRow = {
  id: string;
  created_at: string;
  status: string | null;
  title: string | null;
  manuscript_type: string | null;
  product_type: string | null;
  active_draft_id: string | null;
};

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }

  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Unknown date";

  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getReportTitle(reportType: string) {
  switch (reportType) {
    case "voice":
      return "Voice Report";
    case "structure":
      return "Structure Report";
    case "repetition":
      return "Repetition Report";
    case "market":
      return "Market Report";
    case "surgical":
      return "Surgical Report";
    case "roadmap":
      return "Revision Roadmap";
    default:
      return reportType;
  }
}

export default async function SavedReportPage({ params }: PageProps) {
  const { id } = await params;

  let submission: SubmissionRow | null = null;
  let draft: DraftVersionRow | null = null;
  let reports: ReportRow[] = [];
  let errorMessage = "";

  try {
    const supabase = getSupabaseAdmin();

    const { data: submissionData, error: submissionError } = await supabase
      .from("submissions")
      .select("*")
      .eq("id", id)
      .single();

    if (submissionError || !submissionData) {
      throw new Error(
        submissionError?.message || "No saved submission was found for this ID."
      );
    }

    submission = submissionData as SubmissionRow;

    const { data: draftData, error: draftError } = await supabase
      .from("draft_versions")
      .select("*")
      .eq("submission_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (draftError) {
      throw new Error(`Could not load draft version: ${draftError.message}`);
    }

    draft = draftData as DraftVersionRow | null;

    const { data: reportData, error: reportsError } = await supabase
      .from("reports")
      .select("*")
      .eq("submission_id", id)
      .order("created_at", { ascending: true });

    if (reportsError) {
      throw new Error(`Could not load reports: ${reportsError.message}`);
    }

    reports = (reportData || []) as ReportRow[];
  } catch (err: any) {
    errorMessage = err?.message || "Unknown error loading saved report.";
  }

  const voiceReport = reports.find((report) => report.report_type === "voice");
  const otherReports = reports.filter((report) => report.report_type !== "voice");

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <header className="mb-8 border-b border-neutral-800 pb-6">
          <Link
            href="/"
            className="mb-5 inline-block text-sm font-bold text-neutral-400 transition hover:text-white"
          >
            ← Back to 5 CORE
          </Link>

          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.3em] text-neutral-500">
            The Hovel Editor
          </p>

          <h1 className="text-4xl font-black tracking-tight">Saved Report</h1>

          <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-400">
            This page loads a previously saved diagnosis from Supabase using
            the saved submission ID.
          </p>
        </header>

        {errorMessage && (
          <section className="rounded-2xl border border-red-800 bg-red-950/40 p-6 text-red-100">
            <h2 className="mb-3 text-2xl font-black">Could Not Load Report</h2>
            <p className="whitespace-pre-wrap leading-7">{errorMessage}</p>
          </section>
        )}

        {!errorMessage && submission && (
          <>
            <section className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
              <h2 className="mb-4 text-2xl font-black">Submission Details</h2>

              <div className="grid gap-4 text-sm text-neutral-300 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                    Submission ID
                  </p>
                  <p className="mt-1 break-all font-mono">{submission.id}</p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                    Created
                  </p>
                  <p className="mt-1">{formatDate(submission.created_at)}</p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                    Status
                  </p>
                  <p className="mt-1">{submission.status || "Unknown"}</p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                    Product Type
                  </p>
                  <p className="mt-1">{submission.product_type || "Unknown"}</p>
                </div>

                {draft && (
                  <>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                        Draft Version
                      </p>
                      <p className="mt-1">{draft.version_number}</p>
                    </div>

                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-neutral-500">
                        Word Count
                      </p>
                      <p className="mt-1">{draft.word_count ?? "Unknown"}</p>
                    </div>
                  </>
                )}
              </div>
            </section>

            {draft?.extracted_text && (
              <section className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
                <h2 className="mb-4 text-2xl font-black">Original Text</h2>

                <article className="max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-neutral-800 bg-black p-4 text-sm leading-7 text-neutral-300">
                  {draft.extracted_text}
                </article>
              </section>
            )}

            {voiceReport && (
              <section className="mb-8 rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
                <h2 className="mb-4 text-3xl font-black">Voice Report</h2>

                <article className="whitespace-pre-wrap text-base leading-8 text-neutral-100">
                  {voiceReport.content}
                </article>
              </section>
            )}

            {otherReports.length > 0 && (
              <section className="rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
                <h2 className="mb-4 text-2xl font-black">
                  Other Saved Report Slots
                </h2>

                <div className="space-y-4">
                  {otherReports.map((report) => (
                    <details
                      key={report.id}
                      className="rounded-xl border border-neutral-800 bg-black p-4"
                    >
                      <summary className="cursor-pointer font-bold text-neutral-100">
                        {getReportTitle(report.report_type)}
                      </summary>

                      <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-neutral-300">
                        {report.content}
                      </div>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}