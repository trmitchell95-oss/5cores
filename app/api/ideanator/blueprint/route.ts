import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { checkDailyUsageLimit, countWords, logUsageEvent } from "../../../../lib/usage";

export const runtime = "nodejs";

const client = new Anthropic();

const DEFAULT_MODEL = "claude-sonnet-4-6";
const BLUEPRINT_MIN_CHARS = 10;
const BLUEPRINT_MAX_CHARS = 30000;

type AuthResult =
 | { ok: true; userId: string; userEmail: string | null }
 | { ok: false; status: number; error: string };

type Blueprint = {
 rigName: string;
 purpose: string;
 audience: string;
 outputType: string;
 tone: string;
 constraints: string[];
 missingPieces: string[];
 promptStrategy: string;
};

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
 "Sign in before putting an idea on the lift. Sign in to run the analysis.",
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

function cleanFog(value: unknown) {
 if (typeof value !== "string") return "";

 return value
 .trim()
 .replace(/\r\n/g, "\n")
 .replace(/[ \t]+\n/g, "\n")
 .replace(/\n[ \t]+/g, "\n")
 .replace(/\n{4,}/g, "\n\n\n");
}

function cleanText(value: unknown) {
 if (typeof value !== "string") return "";
 return value.trim().replace(/\s+/g, " ");
}

function cleanStringArray(value: unknown, fallback: string[]) {
 if (!Array.isArray(value)) return fallback;

 const cleaned = value
 .filter((item): item is string => typeof item === "string")
 .map((item) => cleanText(item))
 .filter(Boolean)
 .slice(0, 8);

 return cleaned.length ? cleaned : fallback;
}

function fallbackBlueprint(fog: string): Blueprint {
 return {
 rigName: "Untitled Thinking Rig",
 purpose: "Turn the user's messy idea into a clear, usable next step.",
 audience: "A smart but unfamiliar reader.",
 outputType: "Structured thinking output.",
 tone: "Clear, practical, human, and direct.",
 constraints: [
 "Do not make the user sound generic.",
 "Do not over-polish the idea before it is understood.",
 "Separate raw thought from usable structure.",
 ],
 missingPieces: [
 "Who exactly needs this?",
 "What should this become next?",
 "What would make this feel successful?",
 ],
 promptStrategy:
 "Act as a thinking partner. Identify the user's real intent, preserve the useful mess, organize it into a practical blueprint, and prepare a prompt that can produce a useful next-step output.",
 };
}

function coerceBlueprint(raw: unknown, fallback: Blueprint): Blueprint {
 if (!raw || typeof raw !== "object") return fallback;

 const record = raw as Record<string, unknown>;

 return {
 rigName: cleanText(record.rigName) || fallback.rigName,
 purpose: cleanText(record.purpose) || fallback.purpose,
 audience: cleanText(record.audience) || fallback.audience,
 outputType: cleanText(record.outputType) || fallback.outputType,
 tone: cleanText(record.tone) || fallback.tone,
 constraints: cleanStringArray(record.constraints, fallback.constraints),
 missingPieces: cleanStringArray(record.missingPieces, fallback.missingPieces),
 promptStrategy: cleanText(record.promptStrategy) || fallback.promptStrategy,
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
 throw new Error("Claude did not return parseable blueprint JSON.");
 }

 return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
 }
}

function buildSystemPrompt() {
 return `You are The Ideanator Blueprint Engine.

You are not writing the final answer yet.
You are not trying to impress the user.
You are not a prompt builder.
You are a thinking prosthetic.

Your job is to read a messy user idea, identify the real intent, and create a practical editable blueprint.

The blueprint should feel like the system taking notes, not showing off.

Voice:
- blunt
- human
- useful
- clear
- practical
- no vague vague corporate filler
- no inflated startup language
- no empty hype
- no "unlock your potential" garbage

Return only valid JSON.
No markdown.
No commentary outside the JSON.

JSON shape:
{
 "rigName": "string",
 "purpose": "string",
 "audience": "string",
 "outputType": "string",
 "tone": "string",
 "constraints": ["string"],
 "missingPieces": ["string"],
 "promptStrategy": "string"
}

Rules:
- rigName should be short and reusable, like "School Safety Pitch Rig" or "Grant Answer Rig."
- purpose should say what the user is actually trying to accomplish.
- audience should identify who needs to understand or act on this.
- outputType should name the useful thing this rig should produce.
- tone should fit the situation.
- constraints should protect the user's voice, facts, limits, and goal.
- missingPieces should name what still needs to be answered before the idea is fully shaped.
- promptStrategy should explain how the final prompt should think.`;
}

function buildUserPrompt(fog: string) {
 return `Build an editable Ideanator blueprint from this messy user fog.

USER FOG:
---
${fog}
---

Create the blueprint now.

Remember:
- Do not write the final output.
- Do not summarize lazily.
- Find the actual intent underneath the mess.
- Preserve what makes the idea human.
- Return only valid JSON.`;
}

export async function POST(request: NextRequest) {
 const model =
 process.env.IDEANATOR_MODEL || process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

 let userIdForLog: string | null = null;
 let inputChars = 0;
 let inputWords = 0;

 try {
 const auth = await requireUser(request);

 if (!auth.ok) {
 await logUsageEvent({
 tool: "ideanator_blueprint",
 status: "rejected",
 inputChars,
 inputWords,
 model,
 errorMessage: auth.error,
 meta: { stage: "blueprint_auth" },
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
 const fog = cleanFog(body.fog);

 inputChars = fog.length;
 inputWords = countWords(fog);

 if (!fog) {
 await logUsageEvent({
 userId: userIdForLog,
 tool: "ideanator_blueprint",
 status: "rejected",
 inputChars,
 inputWords,
 model,
 errorMessage: "No fog provided.",
 meta: { stage: "blueprint_validation" },
 });

 return NextResponse.json(
 {
 ok: false,
 error: "Dump the idea first. The Ideanator cannot inspect an empty garage.",
 },
 { status: 400 }
 );
 }

 if (fog.length < BLUEPRINT_MIN_CHARS) {
 await logUsageEvent({
 userId: userIdForLog,
 tool: "ideanator_blueprint",
 status: "rejected",
 inputChars,
 inputWords,
 model,
 errorMessage: "Fog too short.",
 meta: { stage: "blueprint_validation" },
 });

 return NextResponse.json(
 {
 ok: false,
 error: "Give the Ideanator a little more fog to work with.",
 },
 { status: 400 }
 );
 }

 if (fog.length > BLUEPRINT_MAX_CHARS) {
 await logUsageEvent({
 userId: userIdForLog,
 tool: "ideanator_blueprint",
 status: "rejected",
 inputChars,
 inputWords,
 model,
 errorMessage: "Fog exceeded blueprint limit.",
 meta: { stage: "blueprint_validation", limit: BLUEPRINT_MAX_CHARS },
 });

 return NextResponse.json(
 {
 ok: false,
 error:
 "That fog dump is too big for the blueprint pass. Keep it under 30,000 characters for now.",
 },
 { status: 413 }
 );
 }

 const ideanatorDailyLimit = Number(process.env.IDEANATOR_BLUEPRINT_DAILY_LIMIT || process.env.IDEANATOR_DAILY_RUN_LIMIT || 5);

 const limitCheck = await checkDailyUsageLimit({
 userId: userIdForLog,
 userEmail: auth.userEmail,
 tool: "ideanator_blueprint",
 dailyLimit: ideanatorDailyLimit,
 });

 if (!limitCheck.allowed) {
 await logUsageEvent({
 userId: userIdForLog,
 tool: "ideanator_blueprint",
 status: "rejected",
 inputChars,
 inputWords,
 model,
 errorMessage: limitCheck.message || "Daily Ideanator limit reached.",
 meta: {
 stage: "blueprint_daily_limit",
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
 tool: "ideanator_blueprint",
 status: "started",
 inputChars,
 inputWords,
 model,
 title: "Ideanator Blueprint",
 meta: { stage: "blueprint" },
 });

 const fallback = fallbackBlueprint(fog);

 const message = await client.messages.create({
 model,
 max_tokens: 2500,
 system: buildSystemPrompt(),
 messages: [
 {
 role: "user",
 content: buildUserPrompt(fog),
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
 throw new Error("Claude returned an empty blueprint response.");
 }

 const parsed = extractJsonObject(text);
 const blueprint = coerceBlueprint(parsed, fallback);

 await logUsageEvent({
 userId: userIdForLog,
 tool: "ideanator_blueprint",
 status: "succeeded",
 inputChars,
 inputWords,
 model,
 title: blueprint.rigName,
 meta: {
 stage: "blueprint",
 outputSections: Object.keys(blueprint),
 },
 });

 return NextResponse.json({
 ok: true,
 blueprint,
 });
 } catch (error) {
 console.error("Ideanator blueprint error:", error);

 await logUsageEvent({
 userId: userIdForLog,
 tool: "ideanator_blueprint",
 status: "failed",
 inputChars,
 inputWords,
 model,
 title: "Ideanator Blueprint",
 errorMessage: error instanceof Error ? error.message : String(error),
 meta: { stage: "blueprint" },
 });

 return NextResponse.json(
 {
 ok: false,
 error:
 error instanceof Error
 ? error.message
 : "The Ideanator blueprint engine could not complete the request.",
 },
 { status: 500 }
 );
 }
}



