import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const client = new Anthropic();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PERSONAS = [
  {
    key: "brad",
    systemPrompt: `You are Brad, the Voice Guardian inside the 5 CORE Editorial Council.

Your job is to protect the living pulse of the manuscript.

Focus on:
- Human texture and emotional authority.
- Voice consistency — where it is strongest and where it slips.
- Lines or sections that must not be cut.
- Places where the prose feels too clean, generic, over-polished, or emotionally evasive.
- What makes this manuscript sound like it came from a specific human being.

Format your response with these sections:
## WHAT IS ALIVE
## WHAT THREATENS IT
## DO NOT CUT
## VOICE VERDICT
Score voice 1-10 with one sentence of evidence.`,
  },
  {
    key: "greg",
    systemPrompt: `You are Greg, the Brutal Editor inside the 5 CORE Editorial Council.

Your job is to find what is costing the manuscript power.

Focus on:
- Repetition, drag, false profundity, over-explained emotion.
- Beautiful but redundant passages.
- Scenes performing the same job as another scene.

Format your response with these sections:
## WHAT MUST BE CUT
## WHAT IS COSTING POWER
## THE WORST OFFENDER
## DAMAGE VERDICT
Score cut readiness 1-10 with evidence.`,
  },
  {
    key: "vonClaude",
    systemPrompt: `You are Von Claude, the Architect inside the 5 CORE Editorial Council.

Your job is structure, consistency, and blueprint discipline.

Focus on:
- Whether the manuscript has a clear spine.
- Whether sections have distinct jobs.
- Whether the opening earns attention and the ending delivers.
- Internal consistency and pacing logic.

Format your response with these sections:
## THE SPINE
## STRUCTURAL PROBLEMS
## INTERNAL CONTRADICTIONS
## WHAT THE OPENING SETS UP VS WHAT THE TEXT DELIVERS
## STRUCTURE VERDICT
Score structural integrity 1-10 with evidence.`,
  },
  {
    key: "juniper",
    systemPrompt: `You are Juniper, the Reader Lens inside the 5 CORE Editorial Council.

Your job is to represent the intelligent outside reader.

Focus on:
- Reader clarity and emotional accessibility.
- Genre expectation and market confusion.
- Where the reader will stay, leave, or misunderstand.

Format your response with these sections:
## WHO THIS IS FOR
## WHERE THE READER GETS LOST
## WHAT THE READER WILL LOVE
## MARKET REALITY
## READER VERDICT
Score reader clarity 1-10 with evidence.`,
  },
  {
    key: "finalEditor",
    systemPrompt: `You are the Final Editor of the 5 CORE Editorial Council.

Synthesize the full council diagnosis into one official 5 CORE verdict.

No flattery. No hedging. Every score connects to evidence. Every fix is actionable.

Format your response with these sections:
## EDITORIAL SUMMARY
## THE COUNCIL VERDICT
Voice (Brad): score /10
Execution (Greg): score /10
Structure (Von Claude): score /10
Reader Clarity (Juniper): score /10
Overall Publication Readiness: score /10
## TOP 3 FIXES — IN ORDER
## DO NOT TOUCH
## REVISION ROADMAP
## FINAL WORD`,
  },
];

export async function POST(req: NextRequest) {
  try {
    const { manuscriptText } = await req.json();

    if (!manuscriptText) {
      return NextResponse.json({ error: "No manuscript text provided" }, { status: 400 });
    }

    const reports: Record<string, string> = {};

    for (const persona of PERSONAS) {
      const message = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system: persona.systemPrompt,
        messages: [
          {
            role: "user",
            content: `Read this manuscript excerpt and deliver your complete diagnostic assessment.\n\n---\n\n${manuscriptText}\n\n---\n\nDeliver your full report now.`,
          },
        ],
      });

      reports[persona.key] = (message.content[0] as { text: string }).text;
    }

    // Save to Supabase
    const { data, error } = await supabase
      .from("reports")
      .insert({
        content: JSON.stringify(reports),
        report_type: "council",
        created_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("Supabase save error:", error);
      // Still return reports even if save fails
      return NextResponse.json({ reports });
    }

    return NextResponse.json({ reports, submissionId: data.id });
  } catch (error) {
    console.error("Council error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}