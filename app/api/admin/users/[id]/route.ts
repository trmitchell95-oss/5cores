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

  if (ADMIN_EMAILS.length === 0) {
    return { ok: false, status: 500, error: "ADMIN_EMAILS is not configured.", adminEmail };
  }

  if (!ADMIN_EMAILS.includes(adminEmail)) {
    return { ok: false, status: 403, error: "Admin only.", adminEmail };
  }

  return { ok: true, status: 200, error: "", adminEmail };
}

function mostRecentDate(values: Array<string | null | undefined>) {
  const dates = values
    .filter(Boolean)
    .map((value) => new Date(value as string).getTime())
    .filter((value) => Number.isFinite(value));

  if (!dates.length) return null;
  return new Date(Math.max(...dates)).toISOString();
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const adminCheck = await verifyAdmin(req);

    if (!adminCheck.ok) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const supabase = getSupabaseAdmin();

    const { data: userResult, error: userError } =
      await supabase.auth.admin.getUserById(id);

    if (userError || !userResult?.user) {
      return NextResponse.json(
        { error: "Could not load beta user.", details: userError?.message || "No user returned." },
        { status: 404 }
      );
    }

    const targetUser = userResult.user;

    const { data: reports, error: reportsError } = await supabase
      .from("reports")
      .select("id, created_at, title, report_type")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (reportsError) {
      return NextResponse.json({ error: "Could not load user reports.", details: reportsError.message }, { status: 500 });
    }

    const { data: events, error: eventsError } = await supabase
      .from("usage_events")
      .select("id, created_at, tool, status, input_chars, input_words, model, title, error_message")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(200);

    if (eventsError) {
      return NextResponse.json({ error: "Could not load user activity.", details: eventsError.message }, { status: 500 });
    }

    const safeReports = reports || [];
    const safeEvents = events || [];

    const lastReportAt = mostRecentDate(safeReports.map((report) => report.created_at));
    const lastEventAt = mostRecentDate(safeEvents.map((event) => event.created_at));

    return NextResponse.json({
      adminEmail: adminCheck.adminEmail,
      user: {
        id: targetUser.id,
        email: targetUser.email || "No email",
        created_at: targetUser.created_at || null,
        last_sign_in_at: targetUser.last_sign_in_at || null,
      },
      summary: {
        reportCount: safeReports.length,
        eventCount: safeEvents.length,
        succeededCouncilRuns: safeEvents.filter((event) => event.tool === "council" && event.status === "succeeded").length,
        succeededCouncilRereadRuns: safeEvents.filter((event) => event.tool === "council-reread" && event.status === "succeeded").length,
        succeededSphinxRuns: safeEvents.filter((event) => event.tool === "sphinx" && event.status === "succeeded").length,
        succeededSphinxSaves: safeEvents.filter((event) => event.tool === "sphinx_save" && event.status === "succeeded").length,
        problemCount: safeEvents.filter((event) => event.status === "failed" || event.status === "rejected").length,
        totalInputChars: safeEvents.reduce((sum, event) => sum + Number(event.input_chars || 0), 0),
        totalInputWords: safeEvents.reduce((sum, event) => sum + Number(event.input_words || 0), 0),
        lastActivityAt: mostRecentDate([targetUser.last_sign_in_at, lastReportAt, lastEventAt]),
      },
      reports: safeReports,
      events: safeEvents,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Something broke inside the admin user detail route.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

