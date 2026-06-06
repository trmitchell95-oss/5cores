import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type AuthResult =
 | { ok: true; userId: string; userEmail: string | null }
 | { ok: false; status: number; error: string };

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

const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
 error: "Sign in before saving rigs.",
 };
 }

 const supabaseAuth = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
 {
 auth: {
 persistSession: false,
 autoRefreshToken: false,
 },
 }
 );

 const { data, error } = await supabaseAuth.auth.getUser(token);

 if (error || !data.user) {
 return {
 ok: false,
 status: 401,
 error: "Your login session expired. Sign in again.",
 };
 }

 return {
 ok: true,
 userId: data.user.id,
 userEmail: data.user.email || null,
 };
}

function cleanText(value: unknown, max = 100000) {
 if (typeof value !== "string") return "";

 return value
 .trim()
 .replace(/\r\n/g, "\n")
 .slice(0, max);
}

function cleanInline(value: unknown, fallback = "", max = 160) {
 if (typeof value !== "string") return fallback;

 const cleaned = value.trim().replace(/\s+/g, " ").slice(0, max);

 return cleaned || fallback;
}

function cleanStringArray(value: unknown) {
 if (!Array.isArray(value)) return [];

 return value
 .filter((item): item is string => typeof item === "string")
 .map((item) => item.trim().replace(/\s+/g, " "))
 .filter(Boolean)
 .slice(0, 20);
}

function cleanBlueprint(value: unknown): Blueprint {
 if (!value || typeof value !== "object" || Array.isArray(value)) {
 return {};
 }

 const record = value as Record<string, unknown>;

 return {
 rigName: cleanInline(record.rigName, "Untitled Thinking Rig"),
 purpose: cleanInline(record.purpose, "", 1000),
 audience: cleanInline(record.audience, "", 1000),
 outputType: cleanInline(record.outputType, "", 1000),
 tone: cleanInline(record.tone, "", 1000),
 constraints: cleanStringArray(record.constraints),
 missingPieces: cleanStringArray(record.missingPieces),
 promptStrategy: cleanText(record.promptStrategy, 5000),
 };
}

function cleanReadinessVerdict(value: unknown) {
 const cleaned = cleanInline(value, "", 80).toUpperCase();

 if (
 cleaned === "CLEARED FOR THE ROAD" ||
 cleaned === "BACK ON THE LIFT" ||
 cleaned === "NOT READY YET"
 ) {
 return cleaned;
 }

 return "";
}

function cleanReadinessScore(value: unknown) {
 const score = Number(value);

 if (!Number.isFinite(score)) {
 return null;
 }

 return Math.max(0, Math.min(100, Math.round(score)));
}

function cleanReadinessReport(value: unknown) {
 if (!value || typeof value !== "object" || Array.isArray(value)) {
 return null;
 }

 return value as Record<string, unknown>;
}

function selectFields() {
 return "id,user_id,created_at,updated_at,rig_name,fog,blueprint,actual_prompt,latest_output,source,is_archived,readiness_verdict,readiness_score,readiness_report,readiness_checked_at";
}

export async function GET(request: NextRequest) {
 try {
 const auth = await requireUser(request);

 if (!auth.ok) {
 return NextResponse.json(
 {
 ok: false,
 error: auth.error,
 },
 { status: auth.status }
 );
 }

 const { data, error } = await supabaseAdmin
 .from("ideanator_rigs")
 .select(selectFields())
 .eq("user_id", auth.userId)
 .eq("is_archived", false)
 .order("updated_at", { ascending: false })
 .limit(50);

 if (error) {
 return NextResponse.json(
 {
 ok: false,
 error: error.message,
 },
 { status: 500 }
 );
 }

 return NextResponse.json({
 ok: true,
 rigs: data || [],
 });
 } catch (error) {
 console.error("Load Ideanator rigs error:", error);

 return NextResponse.json(
 {
 ok: false,
 error:
 error instanceof Error
 ? error.message
 : "Could not load saved rigs.",
 },
 { status: 500 }
 );
 }
}

export async function POST(request: NextRequest) {
 try {
 const auth = await requireUser(request);

 if (!auth.ok) {
 return NextResponse.json(
 {
 ok: false,
 error: auth.error,
 },
 { status: auth.status }
 );
 }

 const body = await request.json();

 const blueprint = cleanBlueprint(body.blueprint);
 const rigName =
 cleanInline(body.rigName, "", 160) ||
 cleanInline(blueprint.rigName, "Untitled Thinking Rig", 160);

 const fog = cleanText(body.fog, 120000);
 const actualPrompt = cleanText(body.actualPrompt, 120000);
 const latestOutput = cleanText(body.latestOutput, 120000);

 if (!blueprint.purpose) {
 return NextResponse.json(
 {
 ok: false,
 error: "Generate or fill in the blueprint before saving a rig.",
 },
 { status: 400 }
 );
 }

 const { data, error } = await supabaseAdmin
 .from("ideanator_rigs")
 .insert({
 user_id: auth.userId,
 rig_name: rigName,
 fog,
 blueprint,
 actual_prompt: actualPrompt,
 latest_output: latestOutput,
 source: "ideanator",
 is_archived: false,
 })
 .select(selectFields())
 .single();

 if (error) {
 return NextResponse.json(
 {
 ok: false,
 error: error.message,
 },
 { status: 500 }
 );
 }

 return NextResponse.json({
 ok: true,
 rig: data,
 });
 } catch (error) {
 console.error("Save Ideanator rig error:", error);

 return NextResponse.json(
 {
 ok: false,
 error:
 error instanceof Error
 ? error.message
 : "Could not save rig.",
 },
 { status: 500 }
 );
 }
}

export async function PATCH(request: NextRequest) {
 try {
 const auth = await requireUser(request);

 if (!auth.ok) {
 return NextResponse.json(
 {
 ok: false,
 error: auth.error,
 },
 { status: auth.status }
 );
 }

 const body = await request.json();
 const id = cleanInline(body.id, "", 80);

 if (!id) {
 return NextResponse.json(
 {
 ok: false,
 error: "Missing rig id.",
 },
 { status: 400 }
 );
 }

 const updatePayload: Record<string, unknown> = {};

 if (typeof body.isArchived === "boolean") {
 updatePayload.is_archived = body.isArchived;
 }

 if (body.blueprint) {
 const blueprint = cleanBlueprint(body.blueprint);
 updatePayload.blueprint = blueprint;
 updatePayload.rig_name =
 cleanInline(body.rigName, "", 160) ||
 cleanInline(blueprint.rigName, "Untitled Thinking Rig", 160);
 }

 if (typeof body.fog === "string") {
 updatePayload.fog = cleanText(body.fog, 120000);
 }

 if (typeof body.actualPrompt === "string") {
 updatePayload.actual_prompt = cleanText(body.actualPrompt, 120000);
 }

 if (typeof body.latestOutput === "string") {
 updatePayload.latest_output = cleanText(body.latestOutput, 120000);
 }

 if (body.readinessReport) {
 const readinessReport = cleanReadinessReport(body.readinessReport);
 const readinessVerdict = cleanReadinessVerdict(
 readinessReport ? readinessReport.verdict : ""
 );
 const readinessScore = cleanReadinessScore(
 readinessReport ? readinessReport.score : null
 );

 if (readinessReport && readinessVerdict) {
 updatePayload.readiness_report = readinessReport;
 updatePayload.readiness_verdict = readinessVerdict;
 updatePayload.readiness_score = readinessScore;
 updatePayload.readiness_checked_at = new Date().toISOString();
 }
 }

 if (Object.keys(updatePayload).length === 0) {
 return NextResponse.json(
 {
 ok: false,
 error: "Nothing to update.",
 },
 { status: 400 }
 );
 }

 const { data, error } = await supabaseAdmin
 .from("ideanator_rigs")
 .update(updatePayload)
 .eq("id", id)
 .eq("user_id", auth.userId)
 .select(selectFields())
 .single();

 if (error) {
 return NextResponse.json(
 {
 ok: false,
 error: error.message,
 },
 { status: 500 }
 );
 }

 return NextResponse.json({
 ok: true,
 rig: data,
 });
 } catch (error) {
 console.error("Update Ideanator rig error:", error);

 return NextResponse.json(
 {
 ok: false,
 error:
 error instanceof Error
 ? error.message
 : "Could not update rig.",
 },
 { status: 500 }
 );
 }
}





