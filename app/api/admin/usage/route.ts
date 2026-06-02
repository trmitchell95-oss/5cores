import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing Supabase admin settings.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function countBy(items: Record<string, unknown>[], key: string) {
  const counts: Record<string, number> = {};

  for (const item of items) {
    const value = String(item[key] || "unknown");
    counts[value] = (counts[value] || 0) + 1;
  }

  return counts;
}

function mostRecentDate(values: Array<string | null | undefined>) {
  const dates = values
    .filter(Boolean)
    .map((value) => new Date(value as string).getTime())
    .filter((value) => Number.isFinite(value));

  if (!dates.length) return null;

  return new Date(Math.max(...dates)).toISOString();
}

function isProblemStatus(status: string | null | undefined) {
  return status === "failed" || status === "rejected";
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "").trim()
      : "";

    if (!token) {
      return NextResponse.json(
        { error: "Admin login required." },
        { status: 401 }
      );
    }

    const supabase = getSupabaseAdmin();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user?.email) {
      return NextResponse.json(
        { error: "Could not verify admin user." },
        { status: 401 }
      );
    }

    const email = user.email.toLowerCase();

    if (ADMIN_EMAILS.length === 0) {
      return NextResponse.json(
        { error: "ADMIN_EMAILS is not configured." },
        { status: 500 }
      );
    }

    if (!ADMIN_EMAILS.includes(email)) {
      return NextResponse.json(
        { error: "You are logged in, but this page is admin-only." },
        { status: 403 }
      );
    }

    const { data: recentEvents, error: recentEventsError } = await supabase
      .from("usage_events")
      .select(
        "id, created_at, user_id, tool, status, input_chars, input_words, model, report_id, title, error_message, meta"
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (recentEventsError) {
      return NextResponse.json(
        {
          error: "Could not load recent usage events.",
          details: recentEventsError.message,
        },
        { status: 500 }
      );
    }

    const { data: aggregateEvents, error: aggregateEventsError } = await supabase
      .from("usage_events")
      .select("id, created_at, user_id, tool, status, input_chars, input_words")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (aggregateEventsError) {
      return NextResponse.json(
        {
          error: "Could not load aggregate usage events.",
          details: aggregateEventsError.message,
        },
        { status: 500 }
      );
    }

    const { data: reports, error: reportsError } = await supabase
      .from("reports")
      .select("id, user_id, created_at, title, report_type")
      .order("created_at", { ascending: false })
      .limit(1000);

    if (reportsError) {
      return NextResponse.json(
        {
          error: "Could not load reports.",
          details: reportsError.message,
        },
        { status: 500 }
      );
    }

    const { data: usersData, error: usersError } =
      await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (usersError) {
      return NextResponse.json(
        {
          error: "Could not load beta users.",
          details: usersError.message,
        },
        { status: 500 }
      );
    }

    const events = recentEvents || [];
    const allEvents = aggregateEvents || [];
    const allReports = reports || [];
    const authUsers = usersData?.users || [];

    const totalInputChars = allEvents.reduce(
      (sum, event) => sum + Number(event.input_chars || 0),
      0
    );

    const totalInputWords = allEvents.reduce(
      (sum, event) => sum + Number(event.input_words || 0),
      0
    );

    const users = authUsers
      .map((authUser) => {
        const userEvents = allEvents.filter(
          (event) => event.user_id === authUser.id
        );

        const userReports = allReports.filter(
          (report) => report.user_id === authUser.id
        );

        const councilRuns = userEvents.filter(
          (event) => event.tool === "council" && event.status === "succeeded"
        ).length;

        const councilRereadRuns = userEvents.filter(
          (event) => event.tool === "council-reread" && event.status === "succeeded"
        ).length;

        const sphinxRuns = userEvents.filter(
          (event) => event.tool === "sphinx" && event.status === "succeeded"
        ).length;

        const sphinxSaveRuns = userEvents.filter(
          (event) => event.tool === "sphinx_save" && event.status === "succeeded"
        ).length;

        const problemCount = userEvents.filter((event) =>
          isProblemStatus(event.status)
        ).length;

        const lastEventAt = mostRecentDate(
          userEvents.map((event) => event.created_at)
        );

        const lastReportAt = mostRecentDate(
          userReports.map((report) => report.created_at)
        );

        const lastActivityAt = mostRecentDate([
          lastEventAt,
          lastReportAt,
          authUser.last_sign_in_at,
        ]);

        return {
          id: authUser.id,
          email: authUser.email || "No email",
          created_at: authUser.created_at || null,
          last_sign_in_at: authUser.last_sign_in_at || null,
          lastActivityAt,
          reportCount: userReports.length,
          councilRuns,
          councilRereadRuns,
          sphinxRuns,
          sphinxSaveRuns,
          problemCount,
        };
      })
      .sort((a, b) => {
        const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
        const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
        return bTime - aTime;
      });

    const summary = {
      totalEvents: events.length,
      aggregateEventCount: allEvents.length,
      totalInputChars,
      totalInputWords,
      totalUsers: users.length,
      totalReports: allReports.length,
      byTool: countBy(allEvents, "tool"),
      byStatus: countBy(allEvents, "status"),
      lastEventAt: events[0]?.created_at || null,
    };

    return NextResponse.json({
      adminEmail: email,
      summary,
      users,
      events,
    });
  } catch (error) {
    console.error("Admin usage route error:", error);

    return NextResponse.json(
      {
        error: "Something broke inside the admin usage route.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

