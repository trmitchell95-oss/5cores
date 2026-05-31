import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

const VALID_STATUS = new Set(["new", "reviewed", "fixed", "ignored"]);

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

export async function GET(req: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(req);

    if (!adminCheck.ok) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("feedback_items")
      .select("id, created_at, updated_at, email, feedback_type, tool, page_path, message, status, admin_note")
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) {
      return NextResponse.json(
        { error: "Could not load feedback.", details: error.message },
        { status: 500 }
      );
    }

    const items = data || [];

    return NextResponse.json({
      adminEmail: adminCheck.adminEmail,
      summary: {
        total: items.length,
        newCount: items.filter((item) => item.status === "new").length,
        reviewedCount: items.filter((item) => item.status === "reviewed").length,
        fixedCount: items.filter((item) => item.status === "fixed").length,
        ignoredCount: items.filter((item) => item.status === "ignored").length,
      },
      items,
    });
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

export async function PATCH(req: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(req);

    if (!adminCheck.ok) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const body = await req.json();
    const id = String(body.id || "").trim();
    const status = String(body.status || "").trim();
    const adminNote = String(body.adminNote || "").trim();

    if (!id) {
      return NextResponse.json({ error: "Missing feedback ID." }, { status: 400 });
    }

    if (!VALID_STATUS.has(status)) {
      return NextResponse.json({ error: "Invalid feedback status." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("feedback_items")
      .update({
        status,
        admin_note: adminNote || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "Could not update feedback.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Something broke while updating feedback.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
