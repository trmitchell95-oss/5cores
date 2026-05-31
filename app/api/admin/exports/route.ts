import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

type ExportRow = Record<string, unknown>;

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

function csvValue(value: unknown) {
  if (value === null || value === undefined) return "";

  let text = "";

  if (typeof value === "object") {
    text = JSON.stringify(value);
  } else {
    text = String(value);
  }

  const escaped = text.replace(/"/g, '""');

  if (/[",\n\r]/.test(escaped)) {
    return `"${escaped}"`;
  }

  return escaped;
}

function toCsv(rows: ExportRow[], headers: string[]) {
  const headerLine = headers.map(csvValue).join(",");

  const bodyLines = rows.map((row) =>
    headers.map((header) => csvValue(row[header])).join(",")
  );

  return [headerLine, ...bodyLines].join("\n");
}

function filenameFor(type: string) {
  const stamp = new Date().toISOString().slice(0, 10);

  if (type === "usage") return `5core-usage-events-${stamp}.csv`;
  if (type === "feedback") return `5core-feedback-${stamp}.csv`;
  if (type === "invites") return `5core-invite-codes-${stamp}.csv`;

  return `5core-export-${stamp}.csv`;
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

    const type = req.nextUrl.searchParams.get("type") || "";
    const supabase = getSupabaseAdmin();

    let rows: ExportRow[] = [];
    let headers: string[] = [];

    if (type === "usage") {
      headers = [
        "created_at",
        "user_id",
        "tool",
        "status",
        "input_chars",
        "input_words",
        "model",
        "title",
        "report_id",
        "error_message",
      ];

      const { data, error } = await supabase
        .from("usage_events")
        .select(headers.join(","))
        .order("created_at", { ascending: false })
        .limit(5000);

      if (error) {
        return NextResponse.json(
          { error: "Could not export usage events.", details: error.message },
          { status: 500 }
        );
      }

      rows = (data || []) as ExportRow[];
    } else if (type === "feedback") {
      headers = [
        "created_at",
        "updated_at",
        "user_id",
        "email",
        "feedback_type",
        "tool",
        "page_path",
        "message",
        "status",
        "admin_note",
      ];

      const { data, error } = await supabase
        .from("feedback_items")
        .select(headers.join(","))
        .order("created_at", { ascending: false })
        .limit(5000);

      if (error) {
        return NextResponse.json(
          { error: "Could not export feedback.", details: error.message },
          { status: 500 }
        );
      }

      rows = (data || []) as ExportRow[];
    } else if (type === "invites") {
      headers = [
        "created_at",
        "updated_at",
        "code",
        "label",
        "active",
        "max_uses",
        "use_count",
        "expires_at",
        "last_used_at",
        "notes",
      ];

      const { data, error } = await supabase
        .from("beta_invite_codes")
        .select(headers.join(","))
        .order("created_at", { ascending: false })
        .limit(5000);

      if (error) {
        return NextResponse.json(
          { error: "Could not export invite codes.", details: error.message },
          { status: 500 }
        );
      }

      rows = (data || []) as ExportRow[];
    } else {
      return NextResponse.json(
        { error: "Invalid export type. Use usage, feedback, or invites." },
        { status: 400 }
      );
    }

    const csv = toCsv(rows, headers);
    const filename = filenameFor(type);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Something broke while exporting admin data.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
