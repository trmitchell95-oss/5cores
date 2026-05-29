import { runAnthropicPass } from "../providers/anthropic";
import { bradSystemPrompt } from "../personas/brad";
import { gregSystemPrompt } from "../personas/greg";
import { vonClaudeSystemPrompt } from "../personas/vonClaude";
import { juniperSystemPrompt } from "../personas/juniper";
import { finalEditorSystemPrompt } from "../personas/finalEditor";
import { voiceReportPrompt } from "../prompts/voiceReport";
import { structureReportPrompt } from "../prompts/structureReport";
import { repetitionReportPrompt } from "../prompts/repetitionReport";
import { marketReportPrompt } from "../prompts/marketReport";
import { surgicalReportPrompt } from "../prompts/surgicalReport";
import { revisionRoadmapPrompt } from "../prompts/revisionRoadmap";

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

export async function runFullDiagnosis(manuscriptText: string) {
  const voice = await runCouncilPass(manuscriptText, voiceReportPrompt);
  const structure = await runCouncilPass(manuscriptText, structureReportPrompt);
  const repetition = await runCouncilPass(manuscriptText, repetitionReportPrompt);
  const market = await runCouncilPass(manuscriptText, marketReportPrompt);
  const surgical = await runCouncilPass(manuscriptText, surgicalReportPrompt);

  const roadmap = await runAnthropicPass({
    modelRole: "opus",
    systemPrompt: finalEditorSystemPrompt,
    userPrompt: `${revisionRoadmapPrompt}

Based on these five diagnostic reports, generate the revision roadmap.

VOICE REPORT:
${voice}

STRUCTURE REPORT:
${structure}

REPETITION REPORT:
${repetition}

MARKET REPORT:
${market}

SURGICAL REPORT:
${surgical}`,
  });

  return { voice, structure, repetition, market, surgical, roadmap };
}