import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const MANUSCRIPT_SNAPSHOT_MAX_CHARS = 25000;

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

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
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

export async function GET(req: NextRequest) {
  try {
    const { user, error: userError } = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: userError }, { status: 401 });
    }

    const projectId = req.nextUrl.searchParams.get("projectId");
    const supabase = getSupabaseAdmin();

    let query = supabase
      .from("manuscript_versions")
      .select("id, project_id, report_id, title, version_label, word_count, char_count, source, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "Could not load manuscript versions.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ versions: data || [] });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Something broke while loading manuscript versions.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, error: userError } = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: userError }, { status: 401 });
    }

    const body = await req.json();

    const projectId =
      typeof body.projectId === "string" && body.projectId.trim()
        ? body.projectId.trim()
        : null;

    const reportId =
      typeof body.reportId === "string" && body.reportId.trim()
        ? body.reportId.trim()
        : null;

    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim().slice(0, 160)
        : "Untitled Draft";

    const versionLabel =
      typeof body.versionLabel === "string" && body.versionLabel.trim()
        ? body.versionLabel.trim().slice(0, 80)
        : "Draft";

    const manuscriptText =
      typeof body.manuscriptText === "string" ? body.manuscriptText.trim() : "";

    const source =
      typeof body.source === "string" && body.source.trim()
        ? body.source.trim().slice(0, 40)
        : "council";

    if (!projectId) {
      return NextResponse.json(
        { error: "Project ID is required to save a manuscript version." },
        { status: 400 }
      );
    }

    if (!manuscriptText) {
      return NextResponse.json(
        { error: "No manuscript text provided for this version." },
        { status: 400 }
      );
    }

    if (manuscriptText.length > MANUSCRIPT_SNAPSHOT_MAX_CHARS) {
      return NextResponse.json(
        {
          error:
            "This manuscript snapshot is too long for beta mode. Keep it under 25,000 characters for now.",
        },
        { status: 413 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
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

    if (reportId) {
      const { data: report, error: reportError } = await supabase
        .from("reports")
        .select("id")
        .eq("id", reportId)
        .eq("user_id", user.id)
        .single();

      if (reportError || !report) {
        return NextResponse.json(
          {
            error: "Report not found or not yours.",
            details: reportError?.message || null,
          },
          { status: 404 }
        );
      }
    }

    const { data, error } = await supabase
      .from("manuscript_versions")
      .insert({
        user_id: user.id,
        project_id: projectId,
        report_id: reportId,
        title,
        version_label: versionLabel,
        manuscript_text: manuscriptText,
        word_count: countWords(manuscriptText),
        char_count: manuscriptText.length,
        source,
      })
      .select("id, project_id, report_id, title, version_label, word_count, char_count, source, created_at")
      .single();

    if (error || !data) {
      return NextResponse.json(
        {
          error: "Could not save manuscript version.",
          details: error?.message || null,
        },
        { status: 500 }
      );
    }

    if (reportId) {
      await supabase
        .from("reports")
        .update({
          project_id: projectId,
          manuscript_version_id: data.id,
        })
        .eq("id", reportId)
        .eq("user_id", user.id);
    }

    await supabase
      .from("projects")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", projectId)
      .eq("user_id", user.id);

    return NextResponse.json({ version: data });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Something broke while saving the manuscript version.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}


export async function DELETE(req: NextRequest) {
  try {
    const { user, error: userError } = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: userError }, { status: 401 });
    }

    const versionId = req.nextUrl.searchParams.get("versionId") || "";

    if (!versionId) {
      return NextResponse.json(
        { error: "Missing manuscript version ID." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data: version, error: versionError } = await supabase
      .from("manuscript_versions")
      .select("id, project_id")
      .eq("id", versionId)
      .eq("user_id", user.id)
      .single();

    if (versionError || !version) {
      return NextResponse.json(
        {
          error: "Manuscript version not found or not yours.",
          details: versionError?.message || null,
        },
        { status: 404 }
      );
    }

    const { error: unlinkReportsError } = await supabase
      .from("reports")
      .update({ manuscript_version_id: null })
      .eq("user_id", user.id)
      .eq("manuscript_version_id", versionId);

    if (unlinkReportsError) {
      return NextResponse.json(
        {
          error: "Could not unlink reports from this manuscript version.",
          details: unlinkReportsError.message,
        },
        { status: 500 }
      );
    }

    const { error: deleteError } = await supabase
      .from("manuscript_versions")
      .delete()
      .eq("id", versionId)
      .eq("user_id", user.id);

    if (deleteError) {
      return NextResponse.json(
        {
          error: "Could not delete manuscript version.",
          details: deleteError.message,
        },
        { status: 500 }
      );
    }

    if (version.project_id) {
      await supabase
        .from("projects")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", version.project_id)
        .eq("user_id", user.id);
    }

    return NextResponse.json({
      ok: true,
      deletedId: versionId,
      projectId: version.project_id || null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Something broke while deleting the manuscript version.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
