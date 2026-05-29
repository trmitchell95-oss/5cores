export const maxDuration = 300;

import { NextRequest } from "next/server";
import { runAnthropicPass } from "@/lib/ai/providers/anthropic";
import { finalEditorSystemPrompt } from "@/lib/ai/personas/finalEditor";
import { voiceReportPrompt } from "@/lib/ai/prompts/voiceReport";
import { structureReportPrompt } from "@/lib/ai/prompts/structureReport";
import { repetitionReportPrompt } from "@/lib/ai/prompts/repetitionReport";
import { marketReportPrompt } from "@/lib/ai/prompts/marketReport";
import { surgicalReportPrompt } from "@/lib/ai/prompts/surgicalReport";
import { revisionRoadmapPrompt } from "@/lib/ai/prompts/revisionRoadmap";
import { createClient } from "@supabase/supabase-js";

const steps = [
  { key: "voice", prompt: voiceReportPrompt, status: "Running Voice analysis..." },
  { key: "structure", prompt: structureReportPrompt, status: "Checking structure..." },
  { key: "repetition", prompt: repetitionReportPrompt, status: "Counting repetition..." },
  { key: "market", prompt: marketReportPrompt, status: "Identifying your reader..." },
  { key: "surgical", prompt: surgicalReportPrompt, status: "Building your surgical fix plan..." },
  { key: "roadmap", prompt: revisionRoadmapPrompt, status: "Generating your revision roadmap..." },
];

export async function POST(req: NextRequest) {
  const { manuscriptText } = await req.json();

  if (!manuscriptText) {
    return new Response(JSON.stringify({ error: "No manuscript text" }), { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const reports: Record<string, string> = {};

        for (const step of steps) {
          send({ type: "status", message: step.status });
          reports[step.key] = await runAnthropicPass({
            modelRole: "sonnet",
            systemPrompt: finalEditorSystemPrompt,
            userPrompt: `${step.prompt}\n\nManuscript:\n${manuscriptText}`,
          });
          send({ type: "report", reportType: step.key });
        }

        send({ type: "status", message: "Saving your reports..." });

        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: submission } = await supabase
          .from("submissions")
          .insert({ status: "diagnosed", product_type: "full" })
          .select()
          .single();

        if (submission) {
          const { data: draft } = await supabase
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

          if (draft) {
            await supabase
              .from("submissions")
              .update({ active_draft_id: draft.id })
              .eq("id", submission.id);

            for (const key of Object.keys(reports)) {
              await supabase.from("reports").insert({
                submission_id: submission.id,
                draft_version_id: draft.id,
                report_type: key,
                phase: 1,
                content: reports[key],
              });
            }
          }

          send({ type: "complete", submissionId: submission.id });
        } else {
          send({ type: "done", reports });
        }

      } catch (error) {
        console.error("Generation error:", error);
        send({ type: "error", message: "Something went wrong: " + String(error) });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}