export const maxDuration = 300;

import { NextRequest } from "next/server";
import { runAnthropicPass } from "@/lib/ai/providers/anthropic";
import { bradSystemPrompt } from "@/lib/ai/personas/brad";
import { gregSystemPrompt } from "@/lib/ai/personas/greg";
import { vonClaudeSystemPrompt } from "@/lib/ai/personas/vonClaude";
import { juniperSystemPrompt } from "@/lib/ai/personas/juniper";
import { finalEditorSystemPrompt } from "@/lib/ai/personas/finalEditor";
import { voiceReportPrompt } from "@/lib/ai/prompts/voiceReport";
import { structureReportPrompt } from "@/lib/ai/prompts/structureReport";
import { repetitionReportPrompt } from "@/lib/ai/prompts/repetitionReport";
import { marketReportPrompt } from "@/lib/ai/prompts/marketReport";
import { surgicalReportPrompt } from "@/lib/ai/prompts/surgicalReport";
import { revisionRoadmapPrompt } from "@/lib/ai/prompts/revisionRoadmap";
import { saveFullDiagnosis } from "@/lib/saveReports";

async function runCouncilPass(manuscriptText: string, reportPrompt: string) {
  const [bradNotes, gregNotes, vonNotes, juniperNotes] = await Promise.all([
    runAnthropicPass({
      modelRole: "sonnet",
      systemPrompt: bradSystemPrompt,
      userPrompt: `Read this manuscript and give your diagnostic notes:\n\n${manuscriptText}`,
    }),
    runAnthropicPass({
      modelRole: "sonnet",
      systemPrompt: gregSystemPrompt,
      userPrompt: `Read this manuscript and give your diagnostic notes:\n\n${manuscriptText}`,
    }),
    runAnthropicPass({
      modelRole: "sonnet",
      systemPrompt: vonClaudeSystemPrompt,
      userPrompt: `Read this manuscript and give your diagnostic notes:\n\n${manuscriptText}`,
    }),
    runAnthropicPass({
      modelRole: "haiku",
      systemPrompt: juniperSystemPrompt,
      userPrompt: `Read this manuscript and give your diagnostic notes:\n\n${manuscriptText}`,
    }),
  ]);

  const finalReport = await runAnthropicPass({
    modelRole: "opus",
    systemPrompt: finalEditorSystemPrompt,
    userPrompt: `${reportPrompt}

Here are the council notes:

BRAD (Voice Guardian):
${bradNotes}

GREG (Brutal Editor):
${gregNotes}

VON CLAUDE (Architect):
${vonNotes}

JUNIPER (Reader Lens):
${juniperNotes}

Manuscript:
${manuscriptText}`,
  });

  return finalReport;
}

export async function POST(req: NextRequest) {
  const { manuscriptText } = await req.json();

  if (!manuscriptText) {
    return new Response(JSON.stringify({ error: "No manuscript text provided" }), { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const reports: Record<string, string> = {};

        send({ type: "status", message: "Reading your manuscript..." });
        reports.voice = await runCouncilPass(manuscriptText, voiceReportPrompt);
        send({ type: "report", reportType: "voice", content: reports.voice });

        send({ type: "status", message: "Checking structure..." });
        reports.structure = await runCouncilPass(manuscriptText, structureReportPrompt);
        send({ type: "report", reportType: "structure", content: reports.structure });

        send({ type: "status", message: "Counting repetition..." });
        reports.repetition = await runCouncilPass(manuscriptText, repetitionReportPrompt);
        send({ type: "report", reportType: "repetition", content: reports.repetition });

        send({ type: "status", message: "Identifying your reader..." });
        reports.market = await runCouncilPass(manuscriptText, marketReportPrompt);
        send({ type: "report", reportType: "market", content: reports.market });

        send({ type: "status", message: "Building your surgical fix plan..." });
        reports.surgical = await runCouncilPass(manuscriptText, surgicalReportPrompt);
        send({ type: "report", reportType: "surgical", content: reports.surgical });

        send({ type: "status", message: "Generating your revision roadmap..." });
        reports.roadmap = await runAnthropicPass({
          modelRole: "opus",
          systemPrompt: finalEditorSystemPrompt,
          userPrompt: `${revisionRoadmapPrompt}

Based on these five diagnostic reports:

VOICE REPORT:
${reports.voice}

STRUCTURE REPORT:
${reports.structure}

REPETITION REPORT:
${reports.repetition}

MARKET REPORT:
${reports.market}

SURGICAL REPORT:
${reports.surgical}`,
        });
        send({ type: "report", reportType: "roadmap", content: reports.roadmap });

        send({ type: "status", message: "Saving your reports..." });
        const submissionId = await saveFullDiagnosis(manuscriptText, {
          voice: reports.voice,
          structure: reports.structure,
          repetition: reports.repetition,
          market: reports.market,
          surgical: reports.surgical,
          roadmap: reports.roadmap,
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