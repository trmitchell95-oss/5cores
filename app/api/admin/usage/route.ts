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

function countBy<T extends string>(items: Record<string, unknown>[], key: string) {
  const counts: Record<T, number> = {} as Record<T, number>;

  for (const item of items) {
    const value = String(item[key] || "unknown") as T;
    counts[value] = (counts[value] || 0) + 1;
  }

  return counts;
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

    const { data, error } = await supabase
      .from("usage_events")
      .select(
        "id, created_at, user_id, tool, status, input_chars, input_words, model, report_id, title, error_message, meta"
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      return NextResponse.json(
        {
          error: "Could not load usage events.",
          details: error.message,
        },
        { status: 500 }
      );
    }

    const events = data || [];

    const totalInputChars = events.reduce(
      (sum, event) => sum + Number(event.input_chars || 0),
      0
    );

    const totalInputWords = events.reduce(
      (sum, event) => sum + Number(event.input_words || 0),
      0
    );

    const summary = {
      totalEvents: events.length,
      totalInputChars,
      totalInputWords,
      byTool: countBy(events, "tool"),
      byStatus: countBy(events, "status"),
      lastEventAt: events[0]?.created_at || null,
    };

    return NextResponse.json({
      adminEmail: email,
      summary,
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

