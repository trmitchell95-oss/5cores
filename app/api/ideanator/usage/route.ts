import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkDailyUsageLimit } from "../../../../lib/usage";

export const runtime = "nodejs";

type AuthResult =
 | { ok: true; userId: string; userEmail: string | null }
 | { ok: false; status: number; error: string };

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
 error: "Sign in to see your Ideanator run limit.",
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
 error: "Your login session expired. Sign in again.",
 };
 }

 return {
 ok: true,
 userId: data.user.id,
 userEmail: data.user.email || null,
 };
}

export async function GET(request: NextRequest) {
 const auth = await requireUser(request);

 if (!auth.ok) {
 return NextResponse.json(
 {
 ok: false,
 signedIn: false,
 error: auth.error,
 },
 { status: auth.status }
 );
 }

 const dailyLimit = Number(process.env.IDEANATOR_DAILY_RUN_LIMIT || 5);

 const usage = await checkDailyUsageLimit({
 userId: auth.userId,
 userEmail: auth.userEmail,
 tool: "ideanator",
 dailyLimit,
 });

 return NextResponse.json({
 ok: true,
 signedIn: true,
 allowed: usage.allowed,
 used: usage.used,
 limit: usage.limit,
 remaining: usage.isAdmin
 ? usage.limit
 : Math.max(usage.limit - usage.used, 0),
 resetAt: usage.resetAt,
 isAdmin: usage.isAdmin,
 });
}



