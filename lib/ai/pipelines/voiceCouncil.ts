import { runAnthropicPass } from "../providers/anthropic";
import { bradSystemPrompt } from "../personas/brad";
import { gregSystemPrompt } from "../personas/greg";
import { vonClaudeSystemPrompt } from "../personas/vonClaude";
import { juniperSystemPrompt } from "../personas/juniper";
import { finalEditorSystemPrompt } from "../personas/finalEditor";
import { voiceReportPrompt } from "../prompts/voiceReport";

export async function runVoiceCouncil(manuscriptText: string) {
  const bradNotes = await runAnthropicPass({
    modelRole: "sonnet",
    systemPrompt: bradSystemPrompt,
    userPrompt: `Read this manuscript and give your diagnostic notes:\n\n${manuscriptText}`,
  });

  const gregNotes = await runAnthropicPass({
    modelRole: "sonnet",
    systemPrompt: gregSystemPrompt,
    userPrompt: `Read this manuscript and give your diagnostic notes:\n\n${manuscriptText}`,
  });

  const vonNotes = await runAnthropicPass({
    modelRole: "sonnet",
    systemPrompt: vonClaudeSystemPrompt,
    userPrompt: `Read this manuscript and give your diagnostic notes:\n\n${manuscriptText}`,
  });

  const juniperNotes = await runAnthropicPass({
    modelRole: "haiku",
    systemPrompt: juniperSystemPrompt,
    userPrompt: `Read this manuscript and give your diagnostic notes:\n\n${manuscriptText}`,
  });

  const finalReport = await runAnthropicPass({
    modelRole: "opus",
    systemPrompt: finalEditorSystemPrompt,
    userPrompt: `${voiceReportPrompt}

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