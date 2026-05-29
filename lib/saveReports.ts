import { createClient } from "@supabase/supabase-js";

type FullDiagnosisReports = {
  voice: string;
  structure: string;
  repetition: string;
  market: string;
  surgical: string;
  roadmap: string;
};

export async function saveFullDiagnosis(
  manuscriptText: string,
  reports: FullDiagnosisReports
) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in environment variables.");
  }

  if (!supabaseServiceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY in environment variables.");
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const wordCount = manuscriptText
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  const { data: submission, error: submissionError } = await supabaseAdmin
    .from("submissions")
    .insert({
      status: "diagnosed",
      manuscript_type: "full",
      product_type: "full",
    })
    .select()
    .single();

  if (submissionError) {
    throw new Error(
      `Failed to save submission: ${submissionError.message}${
        submissionError.details ? ` Details: ${submissionError.details}` : ""
      }${submissionError.hint ? ` Hint: ${submissionError.hint}` : ""}`
    );
  }

  if (!submission) {
    throw new Error("Failed to save submission: Supabase returned no submission.");
  }

  const { data: draft, error: draftError } = await supabaseAdmin
    .from("draft_versions")
    .insert({
      submission_id: submission.id,
      version_number: 1,
      extracted_text: manuscriptText,
      extraction_status: "complete",
      word_count: wordCount,
    })
    .select()
    .single();

  if (draftError) {
    throw new Error(
      `Failed to save draft: ${draftError.message}${
        draftError.details ? ` Details: ${draftError.details}` : ""
      }${draftError.hint ? ` Hint: ${draftError.hint}` : ""}`
    );
  }

  if (!draft) {
    throw new Error("Failed to save draft: Supabase returned no draft.");
  }

  const { error: updateError } = await supabaseAdmin
    .from("submissions")
    .update({ active_draft_id: draft.id })
    .eq("id", submission.id);

  if (updateError) {
    throw new Error(
      `Failed to update submission active draft: ${updateError.message}${
        updateError.details ? ` Details: ${updateError.details}` : ""
      }${updateError.hint ? ` Hint: ${updateError.hint}` : ""}`
    );
  }

  const reportTypes = [
    "voice",
    "structure",
    "repetition",
    "market",
    "surgical",
    "roadmap",
  ] as const;

  for (const reportType of reportTypes) {
    const { error: reportError } = await supabaseAdmin.from("reports").insert({
      submission_id: submission.id,
      draft_version_id: draft.id,
      report_type: reportType,
      phase: 1,
      content: reports[reportType],
    });

    if (reportError) {
      throw new Error(
        `Failed to save ${reportType} report: ${reportError.message}${
          reportError.details ? ` Details: ${reportError.details}` : ""
        }${reportError.hint ? ` Hint: ${reportError.hint}` : ""}`
      );
    }
  }

  return submission.id;
}