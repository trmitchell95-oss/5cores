import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function cleanText(value: unknown) {
 if (typeof value !== "string") return "";
 return value.trim().replace(/\s+/g, " ");
}

function getBearerToken(req: NextRequest) {
 const authHeader = req.headers.get("authorization") || "";

 if (!authHeader.startsWith("Bearer ")) {
 return "";
 }

 return authHeader.replace("Bearer ", "").trim();
}

function getReportField(report: Record<string, unknown>, key: string, fallback = "") {
 const value = report[key];
 return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function getNextMoves(report: Record<string, unknown>) {
 const raw = report.nextThreeMoves;

 if (!Array.isArray(raw)) {
 return [
 "Write the one-sentence version.",
 "Show it to someone who might actually use it.",
 "Build the smallest ugly version possible.",
 ];
 }

 const moves = raw
 .filter((move): move is string => typeof move === "string")
 .map((move) => move.trim())
 .filter(Boolean)
 .slice(0, 3);

 while (moves.length < 3) {
 moves.push("Clarify the next practical step.");
 }

 return moves;
}

function formatIdeanatorReport(report: Record<string, unknown>, submittedText: string) {
 const ideaName = getReportField(report, "ideaName", "Untitled Idea");
 const ideaKind = getReportField(report, "ideaKind", "Idea");
 const primaryNeed = getReportField(report, "primaryNeed", "Idea diagnosis");
 const verdict = getReportField(report, "verdict", "Workbench");

 const moves = getNextMoves(report)
 .map((move, index) => `${index + 1}. ${move}`)
 .join("\n");

 return `# THE IDEANATOR REPORT

## IDEA
${ideaName}

## TYPE
${ideaKind}

## ASKED FOR
${primaryNeed}

## HONEST READ
${verdict}

## WHAT YOU DROPPED IN
${submittedText || "No submitted idea text saved."}

## THE SPARK
${getReportField(report, "spark")}

## THE PLAIN-ENGLISH VERSION
${getReportField(report, "plainEnglishVersion")}

## THE STRONGEST USE CASE
${getReportField(report, "strongestUseCase")}

## THE WEAK SPOTS
${getReportField(report, "weakSpots")}

## THE AUDIENCE
${getReportField(report, "audience")}

## THE MONEY / VALUE PATH
${getReportField(report, "moneyValuePath")}

## THE PART YOU ARE PROBABLY AVOIDING
${getReportField(report, "avoidance")}

## NEXT THREE MOVES
${moves}`;
}

export async function POST(req: NextRequest) {
 try {
 const token = getBearerToken(req);

 if (!token) {
 return NextResponse.json(
 { error: "You must be logged in to save an Ideanator report." },
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

 const body = await req.json();
 const rawReport = body.report;

 if (!rawReport || typeof rawReport !== "object") {
 return NextResponse.json(
 { error: "Invalid Ideanator report payload." },
 { status: 400 }
 );
 }

 const report = rawReport as Record<string, unknown>;
 const submittedText = cleanText(body.submittedText);
 const title = getReportField(report, "ideaName", "Untitled Idea");
 const formattedReport = formatIdeanatorReport(report, submittedText);

 const { data, error } = await supabase
 .from("reports")
 .insert({
 content: JSON.stringify({
 finalEditor: formattedReport,
 ideanator: report,
 submittedText,
 }),
 report_type: "ideanator",
 created_at: new Date().toISOString(),
 user_id: user.id,
 title,
 intake: JSON.stringify({
 tool: "ideanator",
 ideaKind: getReportField(report, "ideaKind", "Idea"),
 primaryNeed: getReportField(report, "primaryNeed", "Idea diagnosis"),
 verdict: getReportField(report, "verdict", "Workbench"),
 }),
 })
 .select("id")
 .single();

 if (error || !data) {
 return NextResponse.json(
 {
 error: "Could not save Ideanator report.",
 details: error
 ? `${error.message || ""} ${error.details || ""} ${error.hint || ""}`.trim()
 : "No saved report id returned.",
 },
 { status: 500 }
 );
 }

 return NextResponse.json({
 id: data.id,
 });
 } catch (error) {
 console.error("Ideanator save error:", error);

 return NextResponse.json(
 {
 error: "Something went wrong while saving the Ideanator report.",
 details: error instanceof Error ? error.message : String(error),
 },
 { status: 500 }
 );
 }
}



