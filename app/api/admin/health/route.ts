import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

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

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "").trim()
    : "";

  if (!token) {
    return { ok: false, status: 401, error: "Admin login required.", adminEmail: "" };
  }

  const supabase = getSupabaseAdmin();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user?.email) {
    return { ok: false, status: 401, error: "Could not verify admin user.", adminEmail: "" };
  }

  const adminEmail = user.email.toLowerCase();

  if (!ADMIN_EMAILS.includes(adminEmail)) {
    return { ok: false, status: 403, error: "Admin only.", adminEmail };
  }

  return { ok: true, status: 200, error: "", adminEmail };
}

async function tableHealth(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  table: string,
  latestColumns: string
) {
  const countResult = await supabase
    .from(table)
    .select("id", { count: "exact", head: true });

  if (countResult.error) {
    return {
      table,
      ok: false,
      count: null,
      latest: null,
      error: countResult.error.message,
    };
  }

  const latestResult = await supabase
    .from(table)
    .select(latestColumns)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    table,
    ok: !latestResult.error,
    count: countResult.count ?? 0,
    latest: latestResult.data || null,
    error: latestResult.error?.message || null,
  };
}

export async function GET(req: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(req);

    if (!adminCheck.ok) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    const betaInviteCode = process.env.BETA_INVITE_CODE || "";

    const supabase = getSupabaseAdmin();

    const [usage, feedback, invites] = await Promise.all([
      tableHealth(
        supabase,
        "usage_events",
        "created_at, user_id, tool, status, input_chars, input_words, model, title, report_id, error_message"
      ),
      tableHealth(
        supabase,
        "feedback_items",
        "created_at, updated_at, email, feedback_type, tool, page_path, message, status, admin_note"
      ),
      tableHealth(
        supabase,
        "beta_invite_codes",
        "created_at, updated_at, code, label, active, max_uses, use_count, expires_at, last_used_at, notes"
      ),
    ]);

    const checks = [
      {
        name: "Supabase URL",
        ok: Boolean(supabaseUrl),
        detail: supabaseUrl ? "Configured" : "Missing NEXT_PUBLIC_SUPABASE_URL",
      },
      {
        name: "Supabase anon key",
        ok: Boolean(anonKey),
        detail: anonKey ? "Configured" : "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY",
      },
      {
        name: "Supabase service role key",
        ok: Boolean(serviceRoleKey),
        detail: serviceRoleKey ? "Configured" : "Missing SUPABASE_SERVICE_ROLE_KEY",
      },
      {
        name: "Admin emails",
        ok: ADMIN_EMAILS.length > 0,
        detail: ADMIN_EMAILS.length > 0 ? `${ADMIN_EMAILS.length} configured` : "Missing ADMIN_EMAILS",
      },
      {
        name: "Beta invite fallback code",
        ok: Boolean(betaInviteCode),
        detail: betaInviteCode ? "Configured" : "Not configured. Database invite codes can still work.",
      },
      {
        name: "usage_events table",
        ok: usage.ok,
        detail: usage.ok ? `${usage.count} rows reachable` : usage.error || "Not reachable",
      },
      {
        name: "feedback_items table",
        ok: feedback.ok,
        detail: feedback.ok ? `${feedback.count} rows reachable` : feedback.error || "Not reachable",
      },
      {
        name: "beta_invite_codes table",
        ok: invites.ok,
        detail: invites.ok ? `${invites.count} rows reachable` : invites.error || "Not reachable",
      },
    ];

    const problemCount = checks.filter((check) => !check.ok).length;

    return NextResponse.json({
      adminEmail: adminCheck.adminEmail,
      checkedAt: new Date().toISOString(),
      problemCount,
      checks,
      tables: {
        usage,
        feedback,
        invites,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Something broke inside admin health check.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
