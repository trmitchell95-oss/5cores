import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function normalizeCode(value: unknown) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const inviteCode = normalizeCode(body.inviteCode);

    if (!email) {
      return NextResponse.json(
        { error: "Enter your email address." },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const expectedCode = normalizeCode(process.env.BETA_INVITE_CODE);

    if (!expectedCode) {
      return NextResponse.json(
        { error: "BETA_INVITE_CODE is not configured." },
        { status: 500 }
      );
    }

    if (!inviteCode || inviteCode !== expectedCode) {
      return NextResponse.json(
        { error: "Invalid beta invite code." },
        { status: 403 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Missing Supabase signup settings." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const origin = req.headers.get("origin") || "";

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: origin
        ? {
            emailRedirectTo: `${origin}/dashboard`,
          }
        : undefined,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      message:
        "Account created. Check your email if confirmation is required, then sign in.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Something broke during signup.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

