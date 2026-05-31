import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function normalizeCode(value: unknown) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

function getSupabasePublicAuth() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

async function validateInviteCode(inviteCode: string) {
  const expectedEnvCode = normalizeCode(process.env.BETA_INVITE_CODE);

  if (expectedEnvCode && inviteCode === expectedEnvCode) {
    return {
      ok: true,
      source: "env",
      inviteId: "",
      useCount: 0,
      error: "",
    };
  }

  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("beta_invite_codes")
    .select("id, code, active, max_uses, use_count, expires_at")
    .eq("code", inviteCode)
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      source: "database",
      inviteId: "",
      useCount: 0,
      error: "Could not verify beta invite code.",
    };
  }

  if (!data) {
    return {
      ok: false,
      source: "database",
      inviteId: "",
      useCount: 0,
      error: "Invalid beta invite code.",
    };
  }

  if (!data.active) {
    return {
      ok: false,
      source: "database",
      inviteId: data.id,
      useCount: Number(data.use_count || 0),
      error: "That beta invite code is no longer active.",
    };
  }

  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    return {
      ok: false,
      source: "database",
      inviteId: data.id,
      useCount: Number(data.use_count || 0),
      error: "That beta invite code has expired.",
    };
  }

  if (
    data.max_uses !== null &&
    data.max_uses !== undefined &&
    Number(data.use_count || 0) >= Number(data.max_uses)
  ) {
    return {
      ok: false,
      source: "database",
      inviteId: data.id,
      useCount: Number(data.use_count || 0),
      error: "That beta invite code has already been used up.",
    };
  }

  return {
    ok: true,
    source: "database",
    inviteId: data.id,
    useCount: Number(data.use_count || 0),
    error: "",
  };
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

    if (!inviteCode) {
      return NextResponse.json(
        { error: "Enter the beta invite code." },
        { status: 400 }
      );
    }

    const inviteCheck = await validateInviteCode(inviteCode);

    if (!inviteCheck.ok) {
      return NextResponse.json(
        { error: inviteCheck.error || "Invalid beta invite code." },
        { status: 403 }
      );
    }

    const supabaseAuth = getSupabasePublicAuth();
    const origin = req.headers.get("origin") || "";

    const { error } = await supabaseAuth.auth.signUp({
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

    if (inviteCheck.source === "database" && inviteCheck.inviteId) {
      const supabaseAdmin = getSupabaseAdmin();

      await supabaseAdmin
        .from("beta_invite_codes")
        .update({
          use_count: Number(inviteCheck.useCount || 0) + 1,
          last_used_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", inviteCheck.inviteId);
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
