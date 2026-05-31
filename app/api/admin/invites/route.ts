import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "crypto";

export const runtime = "nodejs";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function normalizeCode(value: unknown) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function makeInviteCode() {
  return `HOVEL-${randomBytes(4).toString("hex").toUpperCase()}`;
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

async function verifyAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "").trim()
    : "";

  if (!token) {
    return { ok: false, status: 401, error: "Admin login required.", adminEmail: "", adminId: "" };
  }

  const supabase = getSupabaseAdmin();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user?.email) {
    return { ok: false, status: 401, error: "Could not verify admin user.", adminEmail: "", adminId: "" };
  }

  const adminEmail = user.email.toLowerCase();

  if (!ADMIN_EMAILS.includes(adminEmail)) {
    return { ok: false, status: 403, error: "Admin only.", adminEmail, adminId: user.id };
  }

  return { ok: true, status: 200, error: "", adminEmail, adminId: user.id };
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

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("beta_invite_codes")
      .select("id, created_at, updated_at, code, label, active, max_uses, use_count, expires_at, last_used_at, notes")
      .order("created_at", { ascending: false })
      .limit(300);

    if (error) {
      return NextResponse.json(
        { error: "Could not load invite codes.", details: error.message },
        { status: 500 }
      );
    }

    const items = data || [];

    return NextResponse.json({
      adminEmail: adminCheck.adminEmail,
      summary: {
        total: items.length,
        active: items.filter((item) => item.active).length,
        inactive: items.filter((item) => !item.active).length,
        used: items.filter((item) => Number(item.use_count || 0) > 0).length,
      },
      items,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Something broke while loading invite codes.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(req);

    if (!adminCheck.ok) {
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const body = await req.json();

    const code = normalizeCode(body.code) || makeInviteCode();
    const label = String(body.label || "").trim() || null;
    const notes = String(body.notes || "").trim() || null;

    const rawMaxUses =
      body.maxUses === "" || body.maxUses === null || body.maxUses === undefined
        ? null
        : Number(body.maxUses);

    const maxUses =
      rawMaxUses === null || Number.isNaN(rawMaxUses)
        ? null
        : Math.max(1, Math.floor(rawMaxUses));

    const expiresAt = String(body.expiresAt || "").trim() || null;

    if (code.length < 4 || code.length > 60) {
      return NextResponse.json(
        { error: "Invite code must be 4 to 60 characters." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("beta_invite_codes")
      .insert({
        code,
        label,
        notes,
        max_uses: maxUses,
        expires_at: expiresAt,
        active: true,
        created_by: adminCheck.adminId || null,
      })
      .select("id, created_at, updated_at, code, label, active, max_uses, use_count, expires_at, last_used_at, notes")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Could not create invite code.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ item: data });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Something broke while creating invite code.",
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
      return NextResponse.json(
        { error: adminCheck.error },
        { status: adminCheck.status }
      );
    }

    const body = await req.json();

    const id = String(body.id || "").trim();

    if (!id) {
      return NextResponse.json(
        { error: "Missing invite code ID." },
        { status: 400 }
      );
    }

    const update: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (typeof body.active === "boolean") {
      update.active = body.active;
    }

    if (typeof body.label === "string") {
      update.label = body.label.trim() || null;
    }

    if (typeof body.notes === "string") {
      update.notes = body.notes.trim() || null;
    }

    if ("maxUses" in body) {
      const rawMaxUses =
        body.maxUses === "" || body.maxUses === null
          ? null
          : Number(body.maxUses);

      update.max_uses =
        rawMaxUses === null || Number.isNaN(rawMaxUses)
          ? null
          : Math.max(1, Math.floor(rawMaxUses));
    }

    if ("expiresAt" in body) {
      update.expires_at = String(body.expiresAt || "").trim() || null;
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("beta_invite_codes")
      .update(update)
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "Could not update invite code.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Something broke while updating invite code.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
