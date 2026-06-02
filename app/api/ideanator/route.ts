import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const client = new Anthropic();

const DEFAULT_MODEL = "claude-sonnet-4-6";
const IDEANATOR_MIN_CHARS = 10;
const IDEANATOR_MAX_CHARS = 60000;

async function hasValidIdeanatorSession(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : "";

  if (!token) {
    return false;
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

  return Boolean(!error && data.user);
}

type Verdict =
  | "Greenlight"
  | "Workbench"
  | "Distraction"
  | "Beautiful Mess"
  | "Dangerously Good";

type IdeanatorRequest = {
  ideaName?: string;
  ideaText?: string;
  ideaKind?: string;
  primaryNeed?: string;
};

type IdeanatorResponse = {
  ideaName: string;
  ideaKind: string;
  primaryNeed: string;
  verdict: Verdict;
  spark: string;
  plainEnglishVersion: string;
  strongestUseCase: string;
  weakSpots: string;
  audience: string;
  moneyValuePath: string;
  avoidance: string;
  nextThreeMoves: string[];
};

const VALID_VERDICTS: Verdict[] = [
  "Greenlight",
  "Workbench",
  "Distraction",
  "Beautiful Mess",
  "Dangerously Good",
];

function cleanText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().replace(/\s+/g, " ");
}

function cleanIdeaText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n");
}

function normalizeIdeaName(value: unknown) {
  const cleaned = cleanText(value);

  if (!cleaned) {
    return "Untitled Little Bastard";
  }

  const hasRealCharacters = /[a-zA-Z0-9]/.test(cleaned);

  if (!hasRealCharacters) {
    return "Untitled Little Bastard";
  }

  return cleaned.slice(0, 120);
}

function normalizeIdeaKind(value: unknown) {
  const cleaned = cleanText(value);

  if (!cleaned) {
    return "I have no damn clue";
  }

  return cleaned.slice(0, 80);
}

function normalizePrimaryNeed(value: unknown) {
  const cleaned = cleanText(value);

  if (!cleaned) {
    return "Is this worth pursuing?";
  }

  return cleaned.slice(0, 120);
}

function normalizeVerdict(value: unknown): Verdict {
  if (typeof value === "string" && VALID_VERDICTS.includes(value as Verdict)) {
    return value as Verdict;
  }

  return "Workbench";
}

function fallbackReport({
  ideaName,
  ideaKind,
  primaryNeed,
}: {
  ideaName: string;
  ideaKind: string;
  primaryNeed: string;
}): IdeanatorResponse {
  return {
    ideaName,
    ideaKind,
    primaryNeed,
    verdict: "Workbench",
    spark:
      "There is something alive here, but it needs a cleaner shape before anyone can judge it fairly.",
    plainEnglishVersion: `${ideaName} is an early-stage idea that needs to be reduced to one clean promise before it can be tested.`,
    strongestUseCase:
      "The strongest use case is helping a specific person solve one specific problem without making them understand the entire backstory first.",
    weakSpots:
      "The biggest weakness is vagueness. If the idea has to be explained five different ways before it makes sense, the first version is still too foggy.",
    audience:
      "The likely audience is whoever already feels the problem sharply enough to want a practical answer, not just a clever concept.",
    moneyValuePath:
      "The value path starts with proving usefulness. Once the smallest version helps real people, pricing, packaging, and expansion become easier to judge.",
    avoidance:
      "You may be protecting the big exciting version instead of building the small useful version.",
    nextThreeMoves: [
      "Write the one-sentence version.",
      "Name the first specific user.",
      "Build or describe the smallest ugly version someone could actually test.",
    ],
  };
}

function coerceReport(raw: unknown, fallback: IdeanatorResponse): IdeanatorResponse {
  if (!raw || typeof raw !== "object") {
    return fallback;
  }

  const record = raw as Record<string, unknown>;

  const nextThreeMoves = Array.isArray(record.nextThreeMoves)
    ? record.nextThreeMoves
        .filter((move): move is string => typeof move === "string")
        .map((move) => cleanText(move))
        .filter(Boolean)
        .slice(0, 3)
    : fallback.nextThreeMoves;

  while (nextThreeMoves.length < 3) {
    nextThreeMoves.push(fallback.nextThreeMoves[nextThreeMoves.length]);
  }

  return {
    ideaName: normalizeIdeaName(record.ideaName) || fallback.ideaName,
    ideaKind: normalizeIdeaKind(record.ideaKind) || fallback.ideaKind,
    primaryNeed: normalizePrimaryNeed(record.primaryNeed) || fallback.primaryNeed,
    verdict: normalizeVerdict(record.verdict),
    spark: cleanText(record.spark) || fallback.spark,
    plainEnglishVersion:
      cleanText(record.plainEnglishVersion) || fallback.plainEnglishVersion,
    strongestUseCase: cleanText(record.strongestUseCase) || fallback.strongestUseCase,
    weakSpots: cleanText(record.weakSpots) || fallback.weakSpots,
    audience: cleanText(record.audience) || fallback.audience,
    moneyValuePath: cleanText(record.moneyValuePath) || fallback.moneyValuePath,
    avoidance: cleanText(record.avoidance) || fallback.avoidance,
    nextThreeMoves,
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
      throw new Error("Claude did not return parseable JSON.");
    }

    return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
  }
}

function buildSystemPrompt() {
  return `You are The Ideanator, a blunt but useful idea diagnostic engine.

You are not a hype machine.
You are not a startup guru.
You are not a pitch deck generator.
You are not here to flatter the user.

Your job is to tell the user what they actually have.

Voice:
- Direct, human, sharp, occasionally funny.
- Honest without being cruel for sport.
- Practical before clever.
- No generic SaaS language.
- No fake certainty.
- No corporate filler.
- Keep the garage / lift / truck inspection feel when natural, but do not overdo it.

You must choose exactly one verdict from this list:
Greenlight
Workbench
Distraction
Beautiful Mess
Dangerously Good

Verdict meanings:
Greenlight: Strong idea with clear use, audience, and next step.
Workbench: Something real is there, but it needs shaping.
Distraction: Interesting, but probably not worth chasing yet.
Beautiful Mess: Emotionally or creatively strong, commercially or structurally unclear.
Dangerously Good: Weird, risky, unusually promising, and worth serious testing.

Return only valid JSON.
No markdown.
No commentary outside the JSON.

JSON shape:
{
  "ideaName": "string",
  "ideaKind": "string",
  "primaryNeed": "string",
  "verdict": "Greenlight | Workbench | Distraction | Beautiful Mess | Dangerously Good",
  "spark": "string",
  "plainEnglishVersion": "string",
  "strongestUseCase": "string",
  "weakSpots": "string",
  "audience": "string",
  "moneyValuePath": "string",
  "avoidance": "string",
  "nextThreeMoves": ["string", "string", "string"]
}`;
}

function buildUserPrompt({
  ideaName,
  ideaText,
  ideaKind,
  primaryNeed,
}: {
  ideaName: string;
  ideaText: string;
  ideaKind: string;
  primaryNeed: string;
}) {
  return `Diagnose this idea.

Idea name:
${ideaName}

Idea kind:
${ideaKind}

What the user wants from the diagnosis:
${primaryNeed}

Idea text:
---
${ideaText}
---

Rules:
- Be specific to this idea.
- For long idea documents, synthesize the core concept instead of summarizing every note.
- Respect bullets, flows, sections, and diagrams when the user explains them in text.
- Do not give a generic entrepreneurship answer.
- Do not invent detailed facts, partners, customers, prices, laws, or technical claims.
- If the idea is unclear, say so in the weak spots.
- The plainEnglishVersion should explain the idea in one clean paragraph.
- The nextThreeMoves must be concrete and doable.
- Return only valid JSON.`;
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      "The Ideanator API route is alive. POST an idea here when you are ready to put the little bastard on the lift.",
    mode: "claude",
    validVerdicts: VALID_VERDICTS,
  });
}

export async function POST(request: NextRequest) {
  const model = process.env.IDEANATOR_MODEL || process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  try {
    const body = (await request.json()) as IdeanatorRequest;

    const ideaName = normalizeIdeaName(body.ideaName);
    const ideaText = cleanIdeaText(body.ideaText);
    const ideaKind = normalizeIdeaKind(body.ideaKind);
    const primaryNeed = normalizePrimaryNeed(body.primaryNeed);

    if (!ideaText) {
      return NextResponse.json(
        {
          ok: false,
          error: "Idea text is required.",
        },
        { status: 400 },
      );
    }

    if (ideaText.length < IDEANATOR_MIN_CHARS) {
      return NextResponse.json(
        {
          ok: false,
          error: "Give the Ideanator a little more meat. One sneeze is not an idea check.",
        },
        { status: 400 },
      );
    }

    if (ideaText.length > IDEANATOR_MAX_CHARS) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "This idea dump is too long for the Ideanator beta. Keep it under 60,000 characters for now. That is enough for a serious concept document, not a whole damn manuscript.",
        },
        { status: 413 },
      );
    }

    const baseFallback = fallbackReport({
      ideaName,
      ideaKind,
      primaryNeed,
    });

    const message = await client.messages.create({
      model,
      max_tokens: 3500,
      system: buildSystemPrompt(),
      messages: [
        {
          role: "user",
          content: buildUserPrompt({
            ideaName,
            ideaText,
            ideaKind,
            primaryNeed,
          }),
        },
      ],
    });

    const contentBlocks = message.content as Array<{
      type: string;
      text?: string;
    }>;

    const text = contentBlocks
      .filter((block) => block.type === "text" && block.text)
      .map((block) => block.text || "")
      .join("\n")
      .trim();

    if (!text) {
      throw new Error("Claude returned an empty Ideanator response.");
    }

    const parsed = extractJsonObject(text);
    const report = coerceReport(parsed, baseFallback);

    return NextResponse.json({
      ok: true,
      report,
    });
  } catch (error) {
    console.error("Ideanator Claude error:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "The Ideanator coughed, smoked, and refused to start.",
      },
      { status: 500 },
    );
  }
}


