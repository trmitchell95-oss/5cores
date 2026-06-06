import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const supabase = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const client = new Anthropic();

const DEFAULT_MODEL = "claude-sonnet-4-6";

type SavedReportRow = {
 id: string;
 title: string | null;
 created_at: string | null;
 report_type: string | null;
 content: unknown;
 intake: unknown;
 user_id: string;
};

type VersionPayload = {
 title: string;
 submittedText: string;
 verdict: string;
 ideaKind: string;
 primaryNeed: string;
 report: Record<string, unknown>;
};

type CompareResult = {
 headline: string;
 verdictMovement: string;
 clarityDelta: string;
 whatGotStronger: string[];
 whatGotClearer: string[];
 whatGotWeaker: string[];
 weakSpotsAddressed: string[];
 stillLeaking: string[];
 nextBestRevision: string[];
 honestRead: string;
};

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

function isPlainObject(value: unknown): value is Record<string, unknown> {
 return typeof value === "object" && value !== null && !Array.isArray(value);
}

function decodeMaybeJson(value: unknown): unknown {
 let current = value;

 for (let i = 0; i < 3; i += 1) {
 if (typeof current !== "string") return current;

 const trimmed = current.trim();

 if (!trimmed) return "";

 const looksJson =
 (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
 (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
 (trimmed.startsWith('"') && trimmed.endsWith('"'));

 if (!looksJson) return current;

 try {
 current = JSON.parse(trimmed);
 } catch {
 return current;
 }
 }

 return current;
}

function getStringField(value: Record<string, unknown> | null, key: string) {
 if (!value) return "";

 const field = value[key];

 return typeof field === "string" ? field.trim() : "";
}

function getArrayField(value: unknown, fallback: string[]) {
 if (!Array.isArray(value)) return fallback;

 const cleaned = value
 .filter((item): item is string => typeof item === "string")
 .map((item) => cleanText(item))
 .filter(Boolean)
 .slice(0, 5);

 return cleaned.length ? cleaned : fallback;
}

function getObjectField(value: Record<string, unknown> | null, key: string) {
 if (!value) return null;

 const field = decodeMaybeJson(value[key]);

 return isPlainObject(field) ? field : null;
}

function extractPayload(row: SavedReportRow): VersionPayload {
 const contentDecoded = decodeMaybeJson(row.content);
 const content = isPlainObject(contentDecoded) ? contentDecoded : {};

 const intakeDecoded = decodeMaybeJson(row.intake);
 const intake = isPlainObject(intakeDecoded) ? intakeDecoded : {};

 const ideanator = getObjectField(content, "ideanator") || {};

 return {
 title: cleanText(row.title) || getStringField(ideanator, "ideaName") || "Untitled Idea",
 submittedText: cleanText(content.submittedText),
 verdict:
 getStringField(ideanator, "verdict") ||
 getStringField(intake, "verdict") ||
 "Unknown",
 ideaKind:
 getStringField(ideanator, "ideaKind") ||
 getStringField(intake, "ideaKind") ||
 "Idea",
 primaryNeed:
 getStringField(ideanator, "primaryNeed") ||
 getStringField(intake, "primaryNeed") ||
 "Idea diagnosis",
 report: ideanator,
 };
}

function getParentReportId(row: SavedReportRow) {
 const contentDecoded = decodeMaybeJson(row.content);
 const content = isPlainObject(contentDecoded) ? contentDecoded : {};

 const intakeDecoded = decodeMaybeJson(row.intake);
 const intake = isPlainObject(intakeDecoded) ? intakeDecoded : {};

 const iteration = getObjectField(content, "iteration");

 return (
 getStringField(intake, "parentReportId") ||
 getStringField(iteration, "parentReportId")
 );
}

function fallbackComparison(previous: VersionPayload, current: VersionPayload): CompareResult {
 return {
 headline: "The revised version is now linked to the earlier version.",
 verdictMovement: `${previous.verdict} â†’ ${current.verdict}`,
 clarityDelta:
 "The app saved the lineage successfully. The deeper AI comparison did not complete, so this is the fallback read.",
 whatGotStronger: [
 "The revised idea now has a saved relationship to the earlier version.",
 ],
 whatGotClearer: [
 "The version trail can now show that this was not a one-off diagnosis.",
 ],
 whatGotWeaker: [
 "No detailed weakness comparison was generated.",
 ],
 weakSpotsAddressed: [
 "No detailed weak spot comparison was generated.",
 ],
 stillLeaking: [
 "Run the comparison again if you want the deeper pressure test.",
 ],
 nextBestRevision: [
 "Review both versions side by side.",
 "Look for whether the new version actually solved the old weak spot.",
 "Put it back on the lift again if the core promise is still foggy.",
 ],
 honestRead:
 "The version trail exists. The deeper comparison needs another pass.",
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
 throw new Error("Claude did not return parseable comparison JSON.");
 }

 return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
 }
}

function coerceComparison(
 raw: unknown,
 previous: VersionPayload,
 current: VersionPayload
): CompareResult {
 const fallback = fallbackComparison(previous, current);

 if (!isPlainObject(raw)) return fallback;

 return {
 headline: cleanText(raw.headline) || fallback.headline,
 verdictMovement:
 cleanText(raw.verdictMovement) ||
 `${previous.verdict} â†’ ${current.verdict}`,
 clarityDelta: cleanText(raw.clarityDelta) || fallback.clarityDelta,
 whatGotStronger: getArrayField(raw.whatGotStronger, fallback.whatGotStronger),
 whatGotClearer: getArrayField(raw.whatGotClearer, fallback.whatGotClearer),
 whatGotWeaker: getArrayField(raw.whatGotWeaker, fallback.whatGotWeaker),
 weakSpotsAddressed: getArrayField(
 raw.weakSpotsAddressed,
 fallback.weakSpotsAddressed
 ),
 stillLeaking: getArrayField(raw.stillLeaking, fallback.stillLeaking),
 nextBestRevision: getArrayField(raw.nextBestRevision, fallback.nextBestRevision),
 honestRead: cleanText(raw.honestRead) || fallback.honestRead,
 };
}

function buildSystemPrompt() {
 return `You are The Ideanator comparison engine.

You compare two saved versions of the same idea:
- the earlier version
- the revised version

Your job is not to praise effort.
Your job is to tell the user whether the idea actually improved.

Voice:
- blunt
- useful
- human
- practical
- a little funny when natural
- no vague vague corporate filler
- no fake certainty
- no legal advice
- no patent promises

Focus on the delta:
- what got clearer
- what got stronger
- what got weaker
- whether old weak spots were actually addressed
- what is still leaking oil
- what the next revision should focus on

Return only valid JSON.
No markdown.
No commentary outside the JSON.

JSON shape:
{
 "headline": "string",
 "verdictMovement": "string",
 "clarityDelta": "string",
 "whatGotStronger": ["string"],
 "whatGotClearer": ["string"],
 "whatGotWeaker": ["string"],
 "weakSpotsAddressed": ["string"],
 "stillLeaking": ["string"],
 "nextBestRevision": ["string"],
 "honestRead": "string"
}`;
}

function buildUserPrompt(previous: VersionPayload, current: VersionPayload) {
 return `Compare these two versions of the same idea.

EARLIER VERSION
Title: ${previous.title}
Verdict: ${previous.verdict}
Idea kind: ${previous.ideaKind}
Asked for: ${previous.primaryNeed}

Submitted idea:
---
${previous.submittedText}
---

Report:
${JSON.stringify(previous.report, null, 2)}

REVISED VERSION
Title: ${current.title}
Verdict: ${current.verdict}
Idea kind: ${current.ideaKind}
Asked for: ${current.primaryNeed}

Submitted idea:
---
${current.submittedText}
---

Report:
${JSON.stringify(current.report, null, 2)}

Rules:
- Do not merely summarize both versions.
- Compare them.
- Be specific.
- If the revised version did not improve, say so.
- If the verdict improved but the idea is still weak, say so.
- Do not claim market facts, legal facts, or patentability.
- Return only valid JSON.`;
}

export async function POST(req: NextRequest) {
 const model = process.env.IDEANATOR_MODEL || process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

 try {
 const token = getBearerToken(req);

 if (!token) {
 return NextResponse.json(
 { error: "You must be logged in to compare Ideanator versions." },
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
 const reportId = cleanText(body.reportId);

 if (!reportId) {
 return NextResponse.json(
 { error: "Missing report id." },
 { status: 400 }
 );
 }

 const { data: currentRow, error: currentError } = await supabase
 .from("reports")
 .select("id,title,created_at,report_type,content,intake,user_id")
 .eq("id", reportId)
 .eq("user_id", user.id)
 .single();

 if (currentError || !currentRow) {
 return NextResponse.json(
 { error: "Could not load the current version." },
 { status: 404 }
 );
 }

 const current = currentRow as SavedReportRow;
 const parentReportId = getParentReportId(current);

 if (!parentReportId) {
 return NextResponse.json(
 { error: "This report does not have an earlier Ideanator version linked to it yet." },
 { status: 400 }
 );
 }

 const { data: previousRow, error: previousError } = await supabase
 .from("reports")
 .select("id,title,created_at,report_type,content,intake,user_id")
 .eq("id", parentReportId)
 .eq("user_id", user.id)
 .single();

 if (previousError || !previousRow) {
 return NextResponse.json(
 { error: "Could not load the earlier version." },
 { status: 404 }
 );
 }

 const previousPayload = extractPayload(previousRow as SavedReportRow);
 const currentPayload = extractPayload(current);

 let comparison: CompareResult;

 try {
 const message = await client.messages.create({
 model,
 max_tokens: 2800,
 system: buildSystemPrompt(),
 messages: [
 {
 role: "user",
 content: buildUserPrompt(previousPayload, currentPayload),
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
 throw new Error("Claude returned an empty comparison.");
 }

 comparison = coerceComparison(
 extractJsonObject(text),
 previousPayload,
 currentPayload
 );
 } catch (error) {
 console.error("Ideanator comparison fallback:", error);
 comparison = fallbackComparison(previousPayload, currentPayload);
 }

 return NextResponse.json({
 ok: true,
 parentReportId,
 currentReportId: current.id,
 previous: {
 title: previousPayload.title,
 verdict: previousPayload.verdict,
 created_at: (previousRow as SavedReportRow).created_at,
 },
 current: {
 title: currentPayload.title,
 verdict: currentPayload.verdict,
 created_at: current.created_at,
 },
 comparison,
 });
 } catch (error) {
 console.error("Ideanator compare error:", error);

 return NextResponse.json(
 {
 error: "The comparison could not run. Please try again.",
 details: error instanceof Error ? error.message : String(error),
 },
 { status: 500 }
 );
 }
}

