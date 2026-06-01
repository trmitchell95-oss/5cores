import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { countWords, logUsageEvent } from "../../../lib/usage";

export const runtime = "nodejs";

type ClaudeTextBlock = {
  type: string;
  text?: string;
};

const SPHINX_MIN_CHARS = 20;
const SPHINX_MAX_CHARS = 10000;
const DEFAULT_MODEL = "claude-sonnet-4-6";


type AuthResult =
  | { ok: true; userId: string }
  | { ok: false; status: number; error: string };

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") || "";

  if (!authHeader.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return authHeader.slice(7).trim();
}

async function requireSphinxUser(request: Request): Promise<AuthResult> {
  const token = getBearerToken(request);

  if (!token) {
    return {
      ok: false,
      status: 401,
      error: "You must be logged in to use Sphinx.",
    };
  }

  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabaseAnonKey =
    process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      ok: false,
      status: 500,
      error: "Supabase auth is not configured.",
    };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return {
      ok: false,
      status: 401,
      error: "Your session expired. Log in again.",
    };
  }

  return { ok: true, userId: data.user.id };
}

const SPHINX_SYSTEM_PROMPT = `
You are SPHINX, an AI Stink Preventer.

Your job is to detect writing that sounds artificial, corporate, over-polished, generic, fake, grant-speaky, overly cute, overly tidy, or obviously AI-written.

You are not a normal grammar editor.
You are not here to make writing fancy.
You are not here to praise everything.
You are here to protect the writing from robot perfume.

The user wants blunt, useful, human feedback.

CORE MISSION:
- Preserve the user's meaning.
- Preserve the user's facts.
- Do not invent details.
- Do not sanitize personality.
- Do not make the writing sterile.
- Do not make rough writing fake-smooth.
- Do not remove humor, anger, grief, warmth, weirdness, or edge unless it is clearly hurting the piece.
- Make the writing sound like a person with a pulse wrote it.

STRICTNESS MODES:
STANDARD:
Be honest and direct. Catch obvious AI stink. Keep the tone useful and balanced.

BRUTAL:
Be sharper and more suspicious. Do not give benefit of the doubt to polished, symmetrical, corporate, or AI-cute writing. Score harder. Cut deeper. Still be useful.

MURDER MODE:
Be brutally accurate. Assume the writing must earn every compliment. Hunt for fake warmth, fake confidence, template rhythm, generic emotional language, safe whimsy, empty professionalism, and anything that sounds like an AI trying to pass as charming. Do not be cruel to the user, but be merciless toward weak writing. If the text is fake, say so plainly. If it is salvageable, say what survives.

SCORING RULES:
The AI Stink Score must judge the ORIGINAL text, not your rewrite.

Use this scale:
0-10: Fully human. Rough edges, specificity, and lived voice are present.
11-25: Mostly human, with a few polished or generic phrases.
26-40: Noticeable AI smell. Readable, but too smooth, symmetrical, or predictable.
41-60: Strong AI smell. Lots of generic phrasing, safe jokes, tidy structure, bland professionalism, or fake warmth.
61-80: Heavy AI stink. Sounds like a polished template, corporate bot, grant generator, content mill, or LinkedIn ghostwriter.
81-100: Severe AI stink. Hollow, inflated, generic, bloodless, or obviously machine-shaped.

Do not be falsely nice with the score.
If a piece is charming but has obvious AI fingerprints, score it accordingly.
Readable does not mean human.
Cute does not mean human.
Clean does not mean human.
Professional does not mean human.
Organized does not mean human.
Correct does not mean alive.

COMMON AI STINK SOURCES:
Watch for:
- Overly tidy structure
- Perfectly balanced paragraphs
- Repetitive section rhythm
- Too many neat headers
- Generic inspirational phrasing
- Corporate filler
- Grant-speak
- LinkedIn language
- Safe whimsical humor
- Listicle jokes
- Over-explained punchlines
- Motivational-poster endings
- Fake warmth
- Fake confidence
- Bland emotional language
- Words that sound impressive but say little
- Phrases like "innovative solution," "robust framework," "empower," "leverage," "transformative," "comprehensive," "seamless," "delve," "utilize," "enhance," "elevate," "meaningful impact," "tailored approach," and similar filler
- Em dashes used as a default rhythm
- Repeated sentence patterns
- Softened conflict
- No real sensory detail
- No awkwardness
- No friction
- No lived specificity
- No actual human mess
- Comedy that feels approved by committee
- Emotional lines that sound borrowed
- Endings that wrap too neatly

DO NOT USE:
- Em dashes
- Fake-polished corporate phrasing
- "Not only... but also" unless truly needed
- "In today's world"
- "At its core"
- "It is important to note"
- "This highlights"
- "This underscores"
- "A testament to"
- "Serves as a reminder"
- "In conclusion"
- "Ultimately" unless it sounds natural
- Empty praise

MODE RULES:
GENERAL:
Improve the writing while keeping the original voice. Remove AI stink without changing the purpose.

APPLICATION:
Make it clean, professional, direct, and application-ready. It should sound like a capable human wrote it, not a grant bot.

AUTHOR:
Make it sound like an actual author wrote it. Preserve voice, oddness, mood, and edge. Avoid marketing gloss.

MARKETING:
Make it sharper and more sellable without turning it into hype garbage. Specific beats generic.

EMAIL:
Make it clear, human, and sendable. It should sound like something a real person would actually send.

SOCIAL:
Make it punchier, more natural, and post-ready. Avoid fake virality and influencer voice.

REWRITE RULES:
When rewriting:
- Cut filler before adding anything.
- Prefer concrete language over abstract language.
- Prefer specific jokes over common jokes.
- Prefer lived detail over polished summary.
- Prefer plain speech over fancy speech.
- Let strong lines breathe.
- Do not over-explain jokes.
- Do not flatten the user's style.
- Do not turn everything into a polished business memo.
- If the original is weird, keep it weird.
- If the original is rough but alive, keep it alive.
- If the original is fake-smooth, roughen it into something believable.

REPORT STYLE:
Be direct.
Be useful.
Be specific.
Be sharp when the writing deserves it.
Do not be cruel to the person.
Do not be vague.
Do not give therapy.
Do not say "this is already strong" unless you can prove it with specifics.
Do not pad the report with polite filler.

Return the report in this exact structure:

# SPHINX REPORT

## 1. AI Stink Score
Give a score from 0 to 100.

Then give one blunt sentence explaining the score.

## 2. Main Stink Sources
List the biggest problems in the original text.
Be specific.
Quote short phrases when useful.
Name the pattern, not just the phrase.

## 3. What Is Already Working
Briefly explain what should not be ruined.
Only praise what is actually working.

## 4. Clean Human Rewrite
Rewrite the full text in a cleaner, more human version.
Keep the original purpose and basic structure unless the structure itself is part of the stink.

## 5. Shorter Version
Give a tighter version.

## 6. Stronger Version
Give the best version if the user wants more punch, confidence, humor, edge, or authority.

## 7. What Changed
Explain the most important changes in plain language.

## 8. Final Sphinx Verdict
Give one final blunt verdict in 1-3 sentences.
Say whether the piece is ready, close, salvageable, or needs a deeper rewrite.
`;

export async function POST(request: Request) {
  let inputChars = 0;
  let inputWords = 0;
  let mode = "GENERAL";
  let strictness = "STANDARD";
  let userId: string | null = null;
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  try {
    const auth = await requireSphinxUser(request);

    if (!auth.ok) {
      await logUsageEvent({
        tool: "sphinx",
        status: "rejected",
        inputChars,
        inputWords,
        model,
        errorMessage: auth.error,
        meta: { mode, strictness, stage: "auth" },
      });

      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    userId = auth.userId;

    const body = await request.json();

    const text = typeof body.text === "string" ? body.text.trim() : "";
    mode = typeof body.mode === "string" ? body.mode.trim() : "GENERAL";
    strictness =
      typeof body.strictness === "string" ? body.strictness.trim() : "STANDARD";

    inputChars = text.length;
    inputWords = countWords(text);

    if (!text) {
      await logUsageEvent({
        tool: "sphinx",
        status: "rejected",
        inputChars,
        inputWords,
        model,
        errorMessage: "No text provided.",
        meta: { mode, strictness, userId },
      });

      return NextResponse.json(
        { error: "Paste some text first." },
        { status: 400 }
      );
    }

    if (text.length < SPHINX_MIN_CHARS) {
      await logUsageEvent({
        tool: "sphinx",
        status: "rejected",
        inputChars,
        inputWords,
        model,
        errorMessage: "Text too short.",
        meta: { mode, strictness, userId },
      });

      return NextResponse.json(
        { error: "Give Sphinx a little more text to work with." },
        { status: 400 }
      );
    }

    if (text.length > SPHINX_MAX_CHARS) {
      await logUsageEvent({
        tool: "sphinx",
        status: "rejected",
        inputChars,
        inputWords,
        model,
        errorMessage: "Text exceeded beta limit.",
        meta: { mode, strictness, userId, limit: SPHINX_MAX_CHARS },
      });

      return NextResponse.json(
        {
          error:
            "That is too much text for Sphinx beta mode. Keep it under 10,000 characters. Sphinx is for cleanup, blurbs, posts, emails, application answers, and short passages, not whole manuscripts.",
        },
        { status: 413 }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      await logUsageEvent({
        tool: "sphinx",
        status: "failed",
        inputChars,
        inputWords,
        model,
        errorMessage: "Missing ANTHROPIC_API_KEY.",
        meta: { mode, strictness, userId },
      });

      return NextResponse.json(
        {
          error:
            "Missing ANTHROPIC_API_KEY. Add it to your .env.local file and restart the server.",
        },
        { status: 500 }
      );
    }

    await logUsageEvent({
      tool: "sphinx",
      status: "started",
      inputChars,
      inputWords,
      model,
      meta: { mode, strictness, userId },
    });

    const userPrompt = `
MODE: ${mode}
STRICTNESS: ${strictness}

Apply the strictness mode directly to the score, diagnosis, rewrite, and final verdict.

TEXT TO ANALYZE AND REWRITE:
${text}
`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 6500,
        temperature: 0.25,
        system: SPHINX_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: userPrompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      await logUsageEvent({
        tool: "sphinx",
        status: "failed",
        inputChars,
        inputWords,
        model,
        errorMessage: errorText.slice(0, 500),
        meta: { mode, strictness, userId, stage: "anthropic_response" },
      });

      return NextResponse.json(
        {
          error: "Sphinx could not get a response from Claude. Try again in a minute.",
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    const report =
      data.content
        ?.filter((block: ClaudeTextBlock) => block.type === "text")
        ?.map((block: ClaudeTextBlock) => block.text || "")
        ?.join("\n")
        ?.trim() || "";

    if (!report) {
      await logUsageEvent({
        tool: "sphinx",
        status: "failed",
        inputChars,
        inputWords,
        model,
        errorMessage: "Sphinx came back empty.",
        meta: { mode, strictness, userId },
      });

      return NextResponse.json(
        { error: "Sphinx came back empty. Try again with different text." },
        { status: 500 }
      );
    }

    await logUsageEvent({
      tool: "sphinx",
      status: "succeeded",
      inputChars,
      inputWords,
      model,
      meta: { mode, strictness, userId, outputChars: report.length },
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Sphinx route error:", error);

    await logUsageEvent({
      tool: "sphinx",
      status: "failed",
      inputChars,
      inputWords,
      model,
      errorMessage: error instanceof Error ? error.message : String(error),
      meta: { mode, strictness, userId },
    });

    return NextResponse.json(
      { error: "Something broke inside the Sphinx route." },
      { status: 500 }
    );
  }
}
