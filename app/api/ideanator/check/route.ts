import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { checkDailyUsageLimit, countWords, logUsageEvent } from "../../../../../lib/usage";

export const runtime = "nodejs";

const client = new Anthropic();
const DEFAULT_MODEL = "claude-sonnet-4-6";
const CHECK_MAX_CHARS = 130000;

type Blueprint = {
  rigName?: string;
  purpose?: string;
  audience?: string;
  outputType?: string;
  tone?: string;
  constraints?: string[];
  missingPieces?: string[];
  promptStrategy?: string;
};

type RigReadiness = {
  verdict: "CLEARED FOR THE ROAD" | "BACK ON THE LIFT" | "DO NOT DRIVE THIS BASTARD YET";
  score: number;
  summary: string;
  why: string[];
  biggestRisk: string;
  fixNext: string[];
  reusable: boolean;
  nextAction: string;
};

type AuthResult =
  | { ok: true; userId: string; userEmail: string | null }
  | { ok: false; status: number; error: string };

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return "";
  return authHeader.slice(7).trim();
}

async function requireUser(request: NextRequest): Promise<AuthResult> {
  const token = getBearerToken(request);

  if (!token) {
    return { ok: false, status: 401, error: "Sign in before checking a rig." };
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { ok: false, status: 401, error: "Your login session expired. Sign in again." };
  }

  return {
    ok: true,
    userId: data.user.id,
    userEmail: data.user.email || null,
  };
}

function cleanText(value: unknown) {
  if (typeof value !== "string") return "";

  return value
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n");
}

function cleanInline(value: unknown) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ");
}

function cleanStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => cleanInline(item))
    .filter(Boolean)
    .slice(0, 12);
}

function cleanBlueprint(value: unknown): Blueprint {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const record = value as Record<string, unknown>;

  return {
    rigName: cleanInline(record.rigName),
    purpose: cleanInline(record.purpose),
    audience: cleanInline(record.audience),
    outputType: cleanInline(record.outputType),
    tone: cleanInline(record.tone),
    constraints: cleanStringArray(record.constraints),
    missingPieces: cleanStringArray(record.missingPieces),
    promptStrategy: cleanText(record.promptStrategy),
  };
}

function extractJsonObject(text: string) {
  const cleaned = text.trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      throw new Error("Claude did not return parseable readiness JSON.");
    }

    return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
  }
}

function coerceReadiness(raw: unknown): RigReadiness {
  const record =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  const rawVerdict = cleanInline(record.verdict).toUpperCase();

  const verdict: RigReadiness["verdict"] =
    rawVerdict === "CLEARED FOR THE ROAD" ||
    rawVerdict === "BACK ON THE LIFT" ||
    rawVerdict === "DO NOT DRIVE THIS BASTARD YET"
      ? rawVerdict
      : "BACK ON THE LIFT";

  const rawScore = Number(record.score);
  const score = Number.isFinite(rawScore)
    ? Math.max(0, Math.min(100, Math.round(rawScore)))
    : verdict === "CLEARED FOR THE ROAD"
      ? 85
      : verdict === "DO NOT DRIVE THIS BASTARD YET"
        ? 35
        : 65;

  return {
    verdict,
    score,
    summary: cleanInline(record.summary) || "The rig needs another pass before it is reliable.",
    why: cleanStringArray(record.why).slice(0, 5),
    biggestRisk: cleanInline(record.biggestRisk) || "The rig may not produce a consistent useful output yet.",
    fixNext: cleanStringArray(record.fixNext).slice(0, 5),
    reusable: Boolean(record.reusable),
    nextAction: cleanInline(record.nextAction) || "Tighten the blueprint and run the check again.",
  };
}

function buildSystemPrompt() {
  return `You are The Ideanator Rig Readiness Inspector.

You check whether a thinking rig is ready to reuse.

Return only valid JSON. No markdown. No commentary outside JSON.

Allowed verdicts:
- CLEARED FOR THE ROAD
- BACK ON THE LIFT
- DO NOT DRIVE THIS BASTARD YET

Use CLEARED FOR THE ROAD only when the rig has a clear purpose, audience, output type, constraints, source material, and can probably be reused without confusion.

Use BACK ON THE LIFT when it is promising but needs tightening.

Use DO NOT DRIVE THIS BASTARD YET when it is too vague, contradictory, risky, empty, or likely to produce bad output.

JSON shape:
{
  "verdict": "CLEARED FOR THE ROAD",
  "score": 0,
  "summary": "string",
  "why": ["string"],
  "biggestRisk": "string",
  "fixNext": ["string"],
  "reusable": true,
  "nextAction": "string"
}

Rules:
- Score from 0 to 100.
- Be blunt but useful.
- Do not claim legal, patent, medical, financial, regulatory, market, or investment certainty.
- Treat missing specificity as a real weakness.
- Tell the user what to fix next.`;
}

function buildUserPrompt({
  fog,
  blueprint,
  output,
}: {
  fog: string;
  blueprint: Blueprint;
  output: string;
}) {
  const constraints = blueprint.constraints?.length
    ? blueprint.constraints.map((item) => `- ${item}`).join("\n")
    : "- None supplied.";

  const missingPieces = blueprint.missingPieces?.length
    ? blueprint.missingPieces.map((item) => `- ${item}`).join("\n")
    : "- None identified.";

  return `Inspect this Ideanator Thinking Rig for readiness.

RIG NAME:
${blueprint.rigName || "Untitled Thinking Rig"}

PURPOSE:
${blueprint.purpose || "Not supplied."}

AUDIENCE:
${blueprint.audience || "Not supplied."}

OUTPUT TYPE:
${blueprint.outputType || "Not supplied."}

TONE:
${blueprint.tone || "Not supplied."}

CONSTRAINTS:
${constraints}

MISSING PIECES:
${missingPieces}

PROMPT STRATEGY:
${blueprint.promptStrategy || "Not supplied."}

RAW USER FOG:
---
${fog || "No fog supplied."}
---

LATEST OUTPUT, IF ANY:
---
${output || "No output has been generated yet."}
---

Now return the readiness JSON.`;
}

export async function POST(request: NextRequest) {
  const model =
    process.env.IDEANATOR_MODEL || process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  let userIdForLog: string | null = null;
  let inputChars = 0;
  let inputWords = 0;
  let titleForLog = "Ideanator Rig Check";

  try {
    const auth = await requireUser(request);

    if (!auth.ok) {
      await logUsageEvent({
        tool: "ideanator_rig_check",
        status: "rejected",
        inputChars,
        inputWords,
        model,
        title: titleForLog,
        errorMessage: auth.error,
        meta: { stage: "rig_check_auth" },
      });

      return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
    }

    userIdForLog = auth.userId;

    const body = await request.json();

    const fog = cleanText(body.fog);
    const blueprint = cleanBlueprint(body.blueprint);
    const output = cleanText(body.output);

    titleForLog =
      blueprint.rigName && blueprint.rigName.trim()
        ? blueprint.rigName.trim().slice(0, 160)
        : "Ideanator Rig Check";

    inputChars = fog.length + JSON.stringify(blueprint).length + output.length;
    inputWords = countWords(`${fog}\n${output}`);

    if (!fog.trim()) {
      return NextResponse.json(
        { ok: false, error: "The rig needs fog/source material before it can be checked." },
        { status: 400 }
      );
    }

    if (!blueprint.purpose) {
      return NextResponse.json(
        { ok: false, error: "The rig needs a blueprint before it can be checked." },
        { status: 400 }
      );
    }

    if (inputChars > CHECK_MAX_CHARS) {
      return NextResponse.json(
        {
          ok: false,
          error: "That rig is too heavy for the readiness check. Trim the source or output and try again.",
        },
        { status: 413 }
      );
    }

    const dailyLimit = Number(
      process.env.IDEANATOR_RIG_CHECK_DAILY_LIMIT ||
        process.env.IDEANATOR_DAILY_RUN_LIMIT ||
        10
    );

    const limitCheck = await checkDailyUsageLimit({
      userId: userIdForLog,
      userEmail: auth.userEmail,
      tool: "ideanator_rig_check",
      dailyLimit,
    });

    if (!limitCheck.allowed) {
      return NextResponse.json(
        { ok: false, error: "You have hit the daily rig check beta limit. Try again tomorrow." },
        { status: 429 }
      );
    }

    await logUsageEvent({
      userId: userIdForLog,
      tool: "ideanator_rig_check",
      status: "started",
      inputChars,
      inputWords,
      model,
      title: titleForLog,
      meta: { stage: "rig_check", hasOutput: Boolean(output) },
    });

    const message = await client.messages.create({
      model,
      max_tokens: 1800,
      system: buildSystemPrompt(),
      messages: [
        {
          role: "user",
          content: buildUserPrompt({ fog, blueprint, output }),
        },
      ],
    });

    const contentBlocks = message.content as Array<{ type: string; text?: string }>;

    const text = contentBlocks
      .filter((block) => block.type === "text" && block.text)
      .map((block) => block.text || "")
      .join("\n")
      .trim();

    if (!text) {
      throw new Error("Claude returned an empty readiness check.");
    }

    const readiness = coerceReadiness(extractJsonObject(text));

    await logUsageEvent({
      userId: userIdForLog,
      tool: "ideanator_rig_check",
      status: "succeeded",
      inputChars,
      inputWords,
      model,
      title: titleForLog,
      meta: {
        stage: "rig_check",
        verdict: readiness.verdict,
        score: readiness.score,
      },
    });

    return NextResponse.json({ ok: true, readiness });
  } catch (error) {
    console.error("Ideanator rig check error:", error);

    await logUsageEvent({
      userId: userIdForLog,
      tool: "ideanator_rig_check",
      status: "failed",
      inputChars,
      inputWords,
      model,
      title: titleForLog,
      errorMessage: error instanceof Error ? error.message : String(error),
      meta: { stage: "rig_check" },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "The rig check coughed smoke and refused to inspect the vehicle.",
      },
      { status: 500 }
    );
  }
}
