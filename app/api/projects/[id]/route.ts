import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

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

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "").trim()
    : "";

  if (!token) {
    return { user: null, error: "Login required." };
  }

  const supabase = getSupabaseAdmin();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, error: "Could not verify logged-in user." };
  }

  return { user, error: "" };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Missing project ID." }, { status: 400 });
    }

    const { user, error: userError } = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: userError }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id, title, description, created_at, updated_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        {
          error: "Project not found or not yours.",
          details: projectError?.message || null,
        },
        { status: 404 }
      );
    }

    const { data: reports, error: reportsError } = await supabase
      .from("reports")
      .select("id, created_at, title, intake, report_type, manuscript_version_id, parent_report_id")
      .eq("user_id", user.id)
      .eq("project_id", id)
      .order("created_at", { ascending: false });

    if (reportsError) {
      return NextResponse.json(
        {
          error: "Could not load project reports.",
          details: reportsError.message,
        },
        { status: 500 }
      );
    }

    const { data: versions, error: versionsError } = await supabase
      .from("manuscript_versions")
      .select("id, project_id, report_id, title, version_label, word_count, char_count, source, created_at")
      .eq("user_id", user.id)
      .eq("project_id", id)
      .order("created_at", { ascending: false });

    if (versionsError) {
      return NextResponse.json(
        {
          error: "Could not load manuscript versions.",
          details: versionsError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      project,
      reports: reports || [],
      versions: versions || [],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Something broke while loading the project.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
