export const CLAUDE_MODELS = {
  opus: process.env.CLAUDE_OPUS_MODEL || "claude-sonnet-4-6",
  sonnet: process.env.CLAUDE_SONNET_MODEL || "claude-sonnet-4-6",
  haiku: process.env.CLAUDE_HAIKU_MODEL || "claude-haiku-4-5-20251001",
};

export const CLAUDE_EFFORT = {
  opus: process.env.CLAUDE_OPUS_EFFORT || "high",
  sonnet: process.env.CLAUDE_SONNET_EFFORT || "medium",
  haiku: "none",
};

export const FEATURE_FLAGS = {
  enableJuniperPass: process.env.ENABLE_JUNIPER_PASS === "true",
  enableCouncilNotes: process.env.ENABLE_COUNCIL_NOTES === "true",
};