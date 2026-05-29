export const maxDuration = 300;

import { NextRequest } from "next/server";
import { runAnthropicPass } from "@/lib/ai/providers/anthropic";
import { finalEditorSystemPrompt } from "@/lib/ai/personas/finalEditor";
import { voiceReportPrompt } from "@/lib/ai/prompts/voiceReport";
import { saveFullDiagnosis } from "@/lib/saveReports";

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
        const voice = await runAnthropicPass({
          modelRole: "sonnet",
          systemPrompt: finalEditorSystemPrompt,
          userPrompt: `${voiceReportPrompt}\n\nManuscript:\n${manuscriptText}`,
        });
        send({ type: "report", reportType: "voice" });

        send({ type: "status", message: "Saving..." });
        const submissionId = await saveFullDiagnosis(manuscriptText, {
          voice,
          structure: "",
          repetition: "",
          market: "",
          surgical: "",
          roadmap: "",
        });

        send({ type: "complete", submissionId });

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