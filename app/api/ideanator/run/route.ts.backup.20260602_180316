import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { checkDailyUsageLimit, countWords, logUsageEvent } from "../../../../lib/usage";

export const runtime = "nodejs";

const client = new Anthropic();

const DEFAULT_MODEL = "claude-sonnet-4-6";

/*
  This is character count, not token count.

  Important:
  The front-end "actualPrompt" is for transparency/copying.
  It repeats the fog and blueprint, so we DO NOT send it back into Claude
  during Run Rig. Otherwise large idea docs get counted twice and the route
  rejects perfectly reasonable inputs.
*/
const RUN_MAX_CHARS = 120000;

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

type AuthResult =
  | { ok: true; userId: string; userEmail: string | null }
  | { ok: false; status: number; error: string };

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";

  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authHeader.slice(7).trim();
}

async function requireUser(request: NextRequest): Promise<AuthResult> {
  const token = getBearerToken(request);

  if (!token) {
    return {
      ok: false,
      status: 401,
      error:
        "Sign in before running a rig. The showroom is free. The engine is not.",
    };
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
    return {
      ok: false,
      status: 401,
      error:
        "Your login session expired. Sign in again before running The Ideanator.",
    };
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
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

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

function buildSystemPrompt() {
  return `You are The Ideanator Run Rig Engine.

You turn a user's messy idea and editable blueprint into a useful finished output.

You are not merely summarizing.
You are not showing off.
You are not writing generic AI slop.
You are applying the thinking rig.

Voice:
- human
- useful
- clear
- practical
- honest
- no corporate filler
- no fake certainty
- no lazy startup language
- no generic motivational garbage

Rules:
- Respect the user's raw fog.
- Respect the editable blueprint.
- Use the requested tone and output type.
- If important information is missing, work around it honestly instead of inventing facts.
- Do not claim legal, patent, medical, financial, or regulatory certainty.
- If patent or market language is involved, frame it as practical preparation, not legal advice.
- Preserve the user's personality where appropriate.
- Output should be immediately useful.
- Use clean markdown headings and spacing.
- Put each major heading on its own line.

Return the finished output in clean markdown.`;
}

function buildUserPrompt({
  fog,
  blueprint,
}: {
  fog: string;
  blueprint: Blueprint;
}) {
  const constraints = blueprint.constraints?.length
    ? blueprint.constraints.map((item) => `- ${item}`).join("\n")
    : "- None supplied.";

  const missingPieces = blueprint.missingPieces?.length
    ? blueprint.missingPieces.map((item) => `- ${item}`).join("\n")
    : "- None identified.";

  return `Run this Ideanator Thinking Rig.

RIG NAME:
${blueprint.rigName || "Untitled Thinking Rig"}

PURPOSE:
${blueprint.purpose || "Not supplied."}

AUDIENCE:
${blueprint.audience || "Not supplied."}

OUTPUT TYPE:
${blueprint.outputType || "Useful structured output."}

TONE:
${blueprint.tone || "Clear, practical, and human."}

CONSTRAINTS:
${constraints}

MISSING PIECES:
${missingPieces}

PROMPT STRATEGY:
${blueprint.promptStrategy || "Think clearly, preserve the useful mess, and produce the next practical output."}

RAW USER FOG:
---
${fog}
---

Now produce the finished output.

Do not write a meta explanation of what you are doing.
Do not return JSON.
Return the useful output itself.`;
}

export async function POST(request: NextRequest) {
  const model =
    process.env.IDEANATOR_MODEL || process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  let userIdForLog: string | null = null;
  let inputChars = 0;
  let inputWords = 0;
  let titleForLog = "Ideanator Run Rig";

  try {
    const auth = await requireUser(request);

    if (!auth.ok) {
      await logUsageEvent({
        tool: "ideanator",
        status: "rejected",
        inputChars,
        inputWords,
        model,
        title: titleForLog,
        errorMessage: auth.error,
        meta: { stage: "run_auth" },
      });

      return NextResponse.json(
        {
          ok: false,
          error: auth.error,
        },
        { status: auth.status }
      );
    }

    userIdForLog = auth.userId;

    const body = await request.json();

    const fog = cleanText(body.fog);
    const blueprint = cleanBlueprint(body.blueprint);

    titleForLog =
      blueprint.rigName && blueprint.rigName.trim()
        ? blueprint.rigName.trim().slice(0, 160)
        : "Ideanator Run Rig";

    const blueprintChars = JSON.stringify(blueprint).length;

    inputChars = fog.length + blueprintChars;
    inputWords = countWords(fog);

    if (!fog) {
      await logUsageEvent({
        userId: userIdForLog,
        tool: "ideanator",
        status: "rejected",
        inputChars,
        inputWords,
        model,
        title: titleForLog,
        errorMessage: "No fog supplied.",
        meta: { stage: "run_validation" },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "The rig needs the original fog. Something came loose.",
        },
        { status: 400 }
      );
    }

    if (!blueprint.purpose) {
      await logUsageEvent({
        userId: userIdForLog,
        tool: "ideanator",
        status: "rejected",
        inputChars,
        inputWords,
        model,
        title: titleForLog,
        errorMessage: "No blueprint purpose supplied.",
        meta: { stage: "run_validation" },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Generate or fill in the blueprint before running the rig.",
        },
        { status: 400 }
      );
    }

    if (inputChars > RUN_MAX_CHARS) {
      await logUsageEvent({
        userId: userIdForLog,
        tool: "ideanator",
        status: "rejected",
        inputChars,
        inputWords,
        model,
        title: titleForLog,
        errorMessage: "Run Rig input exceeded beta limit.",
        meta: { stage: "run_validation", limit: RUN_MAX_CHARS },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "That rig is still too heavy for beta mode. Try trimming the source document or run it in sections.",
        },
        { status: 413 }
      );
    }

    const ideanatorDailyLimit = Number(process.env.IDEANATOR_DAILY_RUN_LIMIT || 5);

    const limitCheck = await checkDailyUsageLimit({
      userId: userIdForLog,
      userEmail: auth.userEmail,
      tool: "ideanator",
      dailyLimit: ideanatorDailyLimit,
    });

    if (!limitCheck.allowed) {
      await logUsageEvent({
        userId: userIdForLog,
        tool: "ideanator",
        status: "rejected",
        inputChars,
        inputWords,
        model,
        title: titleForLog,
        errorMessage: limitCheck.message || "Daily Ideanator limit reached.",
        meta: {
          stage: "run_daily_limit",
          used: limitCheck.used,
          limit: limitCheck.limit,
          resetAt: limitCheck.resetAt,
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error:
            "You have hit the daily Ideanator beta limit. Try again tomorrow, or ask Tom if you need more runs.",
        },
        { status: 429 }
      );
    }

    await logUsageEvent({
      userId: userIdForLog,
      tool: "ideanator",
      status: "started",
      inputChars,
      inputWords,
      model,
      title: titleForLog,
      meta: {
        stage: "run",
        outputType: blueprint.outputType || null,
        blueprintChars,
        fogChars: fog.length,
      },
    });

    const message = await client.messages.create({
      model,
      max_tokens: 7000,
      system: buildSystemPrompt(),
      messages: [
        {
          role: "user",
          content: buildUserPrompt({
            fog,
            blueprint,
          }),
        },
      ],
    });

    const contentBlocks = message.content as Array<{
      type: string;
      text?: string;
    }>;

    const output = contentBlocks
      .filter((block) => block.type === "text" && block.text)
      .map((block) => block.text || "")
      .join("\n")
      .trim();

    if (!output) {
      throw new Error("Claude returned an empty rig output.");
    }

    await logUsageEvent({
      userId: userIdForLog,
      tool: "ideanator",
      status: "succeeded",
      inputChars,
      inputWords,
      model,
      title: titleForLog,
      meta: {
        stage: "run",
        outputChars: output.length,
        outputType: blueprint.outputType || null,
      },
    });

    return NextResponse.json({
      ok: true,
      output,
    });
  } catch (error) {
    console.error("Ideanator run rig error:", error);

    await logUsageEvent({
      userId: userIdForLog,
      tool: "ideanator",
      status: "failed",
      inputChars,
      inputWords,
      model,
      title: titleForLog,
      errorMessage: error instanceof Error ? error.message : String(error),
      meta: { stage: "run" },
    });

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "The rig coughed smoke and refused to run.",
      },
      { status: 500 }
    );
  }
}
