import { runVoiceCouncil } from "@/lib/ai/pipelines/voiceCouncil";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { manuscriptText } = await req.json();

    if (!manuscriptText) {
      return NextResponse.json(
        { error: "No manuscript text provided" },
        { status: 400 }
      );
    }

    const report = await runVoiceCouncil(manuscriptText);

    return NextResponse.json({ report });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}