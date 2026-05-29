import { createClient } from "@supabase/supabase-js";

export async function saveFullDiagnosis(
  manuscriptText: string,
  reports: {
    voice: string;
    structure: string;
    repetition: string;
    market: string;
    surgical: string;
    roadmap: string;
  }
) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: submission, error: submissionError } = await supabaseAdmin
    .from("submissions")
    .insert({
      status: "diagnosed",
      manuscript_type: "full",
      product_type: "full",
    })
    .select()
    .single();

  if (submissionError || !submission) {
    throw new Error("Failed to save submission");
  }

  const { data: draft, error: draftError } = await supabaseAdmin
    .from("draft_versions")
    .insert({
      submission_id: submission.id,
      version_number: 1,
      extracted_text: manuscriptText,
      extraction_status: "complete",
      word_count: manuscriptText.split(/\s+/).length,
    })
    .select()
    .single();

  if (draftError || !draft) {
    throw new Error("Failed to save draft");
  }

  await supabaseAdmin
    .from("submissions")
    .update({ active_draft_id: draft.id })
    .eq("id", submission.id);

  const reportTypes = ["voice", "structure", "repetition", "market", "surgical", "roadmap"];

  for (const reportType of reportTypes) {
    await supabaseAdmin.from("reports").insert({
      submission_id: submission.id,
      draft_version_id: draft.id,
      report_type: reportType,
      phase: 1,
      content: reports[reportType as keyof typeof reports],
    });
  }

  return submission.id;
}