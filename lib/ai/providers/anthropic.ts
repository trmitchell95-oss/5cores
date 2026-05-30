import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODELS, CLAUDE_EFFORT } from "../modelConfig";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function runAnthropicPass({
  modelRole,
  systemPrompt,
  userPrompt,
}: {
  modelRole: "opus" | "sonnet" | "haiku";
  systemPrompt: string;
  userPrompt: string;
}) {
  const model = CLAUDE_MODELS[modelRole];
  const effort = CLAUDE_EFFORT[modelRole];

  const response = await client.messages.create({
    model,
    max_tokens: 16000,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}