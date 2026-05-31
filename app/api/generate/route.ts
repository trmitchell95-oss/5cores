import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { countWords, logUsageEvent } from "../../../lib/usage";

const client = new Anthropic();

const COUNCIL_MIN_CHARS = 50;
const COUNCIL_MAX_CHARS = 25000;
const DEFAULT_MODEL = "claude-sonnet-4-6";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const INTAKE_INSTRUCTION = (
  writingType: string,
  audience: string,
  biggestConcern: string,
  preparationGoal: string,
  feedbackTone: string
) => `
The user provided the following intake context. Use it to calibrate your critique. Do not judge all writing types by the same standard. A sermon, memoir, children's story, poem, essay, and thriller should each be evaluated according to its own purpose, audience, genre expectations, and emotional contract with the reader.

Writing type: ${writingType || "Not specified"}
Intended audience: ${audience || "Not specified"}
Biggest concern: ${biggestConcern || "Not specified"}
Preparation goal: ${preparationGoal || "Not specified"}
Feedback tone: ${feedbackTone || "Honest"}

Adjust your language and severity according to the requested tone, but do not become dishonest. Gentle still means truthful. Brutal still means useful.
`;

const PERSONAS = [
  {
    key: "brad",
    buildPrompt: (intake: string) => `You are Brad, the Voice Guardian inside the 5 CORE Editorial Council.

Your job is to protect the living pulse of the manuscript.

${intake}

Focus on:
- Human texture and emotional authority.
- Voice consistency - where it is strongest and where it slips.
- Lines or sections that must not be cut.
- Places where the prose feels too clean, generic, over-polished, or emotionally evasive.
- What makes this manuscript sound like it came from a specific human being.

You are not here to flatter. You are here to identify what is alive and protect it.

Format your response with these sections:
## WHAT IS ALIVE
## WHAT THREATENS IT
## DO NOT CUT
## VOICE VERDICT`,
  },
  {
    key: "greg",
    buildPrompt: (intake: string) => `You are Greg, the Brutal Editor inside the 5 CORE Editorial Council.

Your job is to find what is costing the manuscript power.

${intake}

Focus on:
- Repetition - same image, same move, same emotional beat done twice.
- Drag - sections that slow without earning the slowness.
- False profundity - lines that sound deep but say nothing.
- Over-explained emotion - showing AND telling when showing was enough.
- Anything the writer is hiding behind instead of saying directly.

Format your response with these sections:
## WHAT IS COSTING THIS MANUSCRIPT
## THE CUTS
## THE REWRITES
## EXECUTION VERDICT`,
  },
  {
    key: "vonClaude",
    buildPrompt: (intake: string) => `You are Von Clausen, the Architect inside the 5 CORE Editorial Council.

Your job is to assess the structural integrity of the manuscript.

${intake}

Focus on:
- Whether the piece holds together as a complete reading experience.
- Pacing - where it moves well, where it stalls.
- Whether the opening earns the reader's attention.
- Whether the ending pays off what was promised.
- Structural redundancy - sections doing the same job.

Format your response with these sections:
## STRUCTURAL ASSESSMENT
## WHERE IT HOLDS
## WHERE IT BREAKS
## ARCHITECTURE VERDICT`,
  },
  {
    key: "juniper",
    buildPrompt: (intake: string) => `You are Juniper, the Reader Lens inside the 5 CORE Editorial Council.

Your job is to represent the intelligent outside reader.

${intake}

Focus on:
- Who this manuscript is actually for.
- Where the reader will feel lost, bored, or confused.
- Where the reader will feel seen, moved, or compelled to continue.
- Whether the manuscript delivers on its implicit promise to the reader.
- Genre expectation and market confusion.

Format your response with these sections:
## WHO THIS IS FOR
## WHERE THE READER GETS LOST
## WHAT THE READER WILL LOVE
## MARKET REALITY
## READER VERDICT`,
  },
  {
    key: "finalEditor",
    buildPrompt: (intake: string) => `You are the Final Editor of the 5 CORE Editorial Council.

Synthesize the full council diagnosis into one official 5 CORE verdict.

${intake}

No flattery. No hedging. Every score connects to evidence. Every fix is actionable.

Format your response with these sections:
## EDITORIAL SUMMARY
## THE COUNCIL VERDICT
Voice (Brad): score /10
Execution (Greg): score /10
Structure (Von Clausen): score /10
Reader Clarity (Juniper): score /10
Overall Publication Readiness: score /10
## TOP 3 FIXES - IN ORDER
## DO NOT TOUCH
## REVISION ROADMAP
## FINAL WORD`,
  },
];

export async function POST(req: NextRequest) {
  let userIdForLog: string | null = null;
  let titleForLog: string | null = null;
  let inputChars = 0;
  let inputWords = 0;
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "")
      : "";

    if (!token) {
      return NextResponse.json(
        { error: "You must be logged in to run the council." },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Your login session expired. Please sign in again." },
        { status: 401 }
      );
    }

    userIdForLog = user.id;

    const {
      manuscriptText,
      title,
      writingType,
      audience,
      biggestConcern,
      preparationGoal,
      feedbackTone,
    } = await req.json();

    titleForLog = typeof title === "string" ? title.slice(0, 160) : null;

    const cleanManuscript =
      typeof manuscriptText === "string" ? manuscriptText.trim() : "";

    inputChars = cleanManuscript.length;
    inputWords = countWords(cleanManuscript);

    if (!cleanManuscript) {
      await logUsageEvent({
        userId: userIdForLog,
        tool: "council",
        status: "rejected",
        inputChars,
        inputWords,
        model,
        title: titleForLog,
        errorMessage: "No manuscript text provided.",
      });

      return NextResponse.json(
        { error: "No manuscript text provided." },
        { status: 400 }
      );
    }

    if (cleanManuscript.length < COUNCIL_MIN_CHARS) {
      await logUsageEvent({
        userId: userIdForLog,
        tool: "council",
        status: "rejected",
        inputChars,
        inputWords,
        model,
        title: titleForLog,
        errorMessage: "Manuscript text is too short.",
      });

      return NextResponse.json(
        { error: "Manuscript text is too short." },
        { status: 400 }
      );
    }

    if (cleanManuscript.length > COUNCIL_MAX_CHARS) {
      await logUsageEvent({
        userId: userIdForLog,
        tool: "council",
        status: "rejected",
        inputChars,
        inputWords,
        model,
        title: titleForLog,
        errorMessage: "Manuscript text exceeded beta limit.",
        meta: { limit: COUNCIL_MAX_CHARS },
      });

      return NextResponse.json(
        {
          error:
            "This excerpt is too long for the beta diagnosis. Keep it under 25,000 characters for now. Use a chapter, scene, essay, or substantial excerpt instead of the whole damn book.",
        },
        { status: 413 }
      );
    }

    await logUsageEvent({
      userId: userIdForLog,
      tool: "council",
      status: "started",
      inputChars,
      inputWords,
      model,
      title: titleForLog,
      meta: {
        writingType: writingType || null,
        audience: audience || null,
        preparationGoal: preparationGoal || null,
        feedbackTone: feedbackTone || "Honest",
      },
    });

    const intakeContext = INTAKE_INSTRUCTION(
      writingType || "",
      audience || "",
      biggestConcern || "",
      preparationGoal || "",
      feedbackTone || "Honest"
    );

    const results = await Promise.all(
      PERSONAS.map(async (persona) => {
        const message = await client.messages.create({
          model,
          max_tokens: 16000,
          system: persona.buildPrompt(intakeContext),
          messages: [
            {
              role: "user",
              content: `Read this manuscript excerpt and deliver your complete diagnostic assessment.\n\n---\n\n${cleanManuscript}\n\n---\n\nDeliver your full report now.`,
            },
          ],
        });

        return {
          key: persona.key,
          text: (message.content[0] as { text: string }).text,
        };
      })
    );

    const reports: Record<string, string> = {};

    for (const result of results) {
      reports[result.key] = result.text;
    }

    const { data, error } = await supabase
      .from("reports")
      .insert({
        content: JSON.stringify(reports),
        report_type: "council",
        created_at: new Date().toISOString(),
        user_id: user.id,
        title: title || null,
        intake: JSON.stringify({
          writingType: writingType || null,
          audience: audience || null,
          biggestConcern: biggestConcern || null,
          preparationGoal: preparationGoal || null,
          feedbackTone: feedbackTone || "Honest",
        }),
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase save error:", error);

      await logUsageEvent({
        userId: userIdForLog,
        tool: "council",
        status: "failed",
        inputChars,
        inputWords,
        model,
        title: titleForLog,
        errorMessage: error.message,
        meta: { stage: "save_report" },
      });

      return NextResponse.json({
        reports,
        error: "Report generated but could not be saved.",
      });
    }

    await logUsageEvent({
      userId: userIdForLog,
      tool: "council",
      status: "succeeded",
      inputChars,
      inputWords,
      model,
      title: titleForLog,
      reportId: data.id,
      meta: {
        sections: Object.keys(reports),
      },
    });

    return NextResponse.json({ reports, submissionId: data.id });
  } catch (error) {
    console.error("Council error:", error);

    await logUsageEvent({
      userId: userIdForLog,
      tool: "council",
      status: "failed",
      inputChars,
      inputWords,
      model,
      title: titleForLog,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "Something went wrong." },
      { status: 500 }
    );
  }
}
