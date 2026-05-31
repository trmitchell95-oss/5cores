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

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "").trim()
      : "";

    if (!token) {
      return NextResponse.json({ error: "Admin login required." }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const {
      data: { user },
    } = await supabase.auth.getUser(token);

    const email = user?.email?.toLowerCase() || "";

    if (!ADMIN_EMAILS.includes(email)) {
      return NextResponse.json({ error: "Admin only." }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("feedback_items")
      .select("id, created_at, email, feedback_type, tool, page_path, message, status, admin_note")
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) {
      return NextResponse.json(
        { error: "Could not load feedback.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ items: data || [] });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Something broke inside admin feedback.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
