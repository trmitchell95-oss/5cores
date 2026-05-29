export const maxDuration = 300;

import { runFullDiagnosis } from "@/lib/ai/pipelines/fullDiagnosis";
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

    const reports = await runFullDiagnosis(manuscriptText);

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}