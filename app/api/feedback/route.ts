import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const VALID_TYPES = new Set([
  "bug",
  "confusing",
  "useful",
  "bad_report",
  "feature",
  "general",
]);

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const feedbackType = VALID_TYPES.has(String(body.feedbackType))
      ? String(body.feedbackType)
      : "general";

    const message = String(body.message || "").trim();

    if (!message) {
      return NextResponse.json({ error: "Write a message first." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "").trim()
      : "";

    let userId: string | null = null;
    let email: string | null = null;

    if (token) {
      const {
        data: { user },
      } = await supabase.auth.getUser(token);

      userId = user?.id || null;
      email = user?.email || null;
    }

    const { error } = await supabase.from("feedback_items").insert({
      user_id: userId,
      email,
      feedback_type: feedbackType,
      tool: String(body.tool || "app").slice(0, 80),
      page_path: String(body.pagePath || "").slice(0, 500),
      message,
      status: "new",
      meta: {},
    });

    if (error) {
      return NextResponse.json(
        { error: "Could not save feedback.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Something broke while saving feedback.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
