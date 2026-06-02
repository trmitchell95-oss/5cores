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


export async function PATCH(
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

    const body = await req.json();

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const description =
      typeof body.description === "string" ? body.description.trim() : "";

    if (!title) {
      return NextResponse.json(
        { error: "Project title is required." },
        { status: 400 }
      );
    }

    if (title.length > 160) {
      return NextResponse.json(
        { error: "Project title must be 160 characters or fewer." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("projects")
      .update({
        title,
        description: description || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, title, description, created_at, updated_at")
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          error: "Could not update project.",
          details: error?.message || "Project not found or not yours.",
        },
        { status: error ? 500 : 404 }
      );
    }

    return NextResponse.json({ project: data });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Something broke while updating the project.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
      .select("id")
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

    const { error: unlinkReportsError } = await supabase
      .from("reports")
      .update({
        project_id: null,
        manuscript_version_id: null,
      })
      .eq("user_id", user.id)
      .eq("project_id", id);

    if (unlinkReportsError) {
      return NextResponse.json(
        {
          error: "Could not detach reports from this project.",
          details: unlinkReportsError.message,
        },
        { status: 500 }
      );
    }

    const { error: deleteVersionsError } = await supabase
      .from("manuscript_versions")
      .delete()
      .eq("project_id", id)
      .eq("user_id", user.id);

    if (deleteVersionsError) {
      return NextResponse.json(
        {
          error: "Could not delete project manuscript snapshots.",
          details: deleteVersionsError.message,
        },
        { status: 500 }
      );
    }

    const { error: deleteProjectError } = await supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteProjectError) {
      return NextResponse.json(
        {
          error: "Could not delete project.",
          details: deleteProjectError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, deletedId: id });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Something broke while deleting the project.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
