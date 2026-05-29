export const maxDuration = 300;

import { NextRequest } from "next/server";
import { runAnthropicPass } from "@/lib/ai/providers/anthropic";
import { finalEditorSystemPrompt } from "@/lib/ai/personas/finalEditor";
import { voiceReportPrompt } from "@/lib/ai/prompts/voiceReport";
import { surgicalReportPrompt } from "@/lib/ai/prompts/surgicalReport";
import { revisionRoadmapPrompt } from "@/lib/ai/prompts/revisionRoadmap";
import { saveFullDiagnosis } from "@/lib/saveReports";

async function runSinglePass(manuscriptText: string, reportPrompt: string) {
  return await runAnthropicPass({
    modelRole: "sonnet",
    systemPrompt: finalEditorSystemPrompt,
    userPrompt: `${reportPrompt}\n\nManuscript:\n${manuscriptText}`,
  });
}

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
        send({ type: "status", message: "Running Voice analysis..." });
        const voice = await runSinglePass(manuscriptText, voiceReportPrompt);
        send({ type: "report", reportType: "voice" });

        send({ type: "status", message: "Building your surgical fix plan..." });
        const surgical = await runSinglePass(manuscriptText, surgicalReportPrompt);
        send({ type: "report", reportType: "surgical" });

        send({ type: "status", message: "Generating your revision roadmap..." });
        const roadmap = await runSinglePass(manuscriptText, revisionRoadmapPrompt);
        send({ type: "report", reportType: "roadmap" });

        send({ type: "status", message: "Saving your reports..." });
        const submissionId = await saveFullDiagnosis(manuscriptText, {
          voice,
          structure: "",
          repetition: "",
          market: "",
          surgical,
          roadmap,
        });

        send({ type: "complete", submissionId });

      } catch (error) {
        console.error("Generation error:", error);
        send({ type: "error", message: "Something went wrong. Please try again." });
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