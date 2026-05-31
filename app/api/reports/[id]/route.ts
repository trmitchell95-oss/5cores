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

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Missing report ID." }, { status: 400 });
    }

    const { user, error: userError } = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: userError }, { status: 401 });
    }

    const body = await req.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";

    if (!title) {
      return NextResponse.json(
        { error: "Report title cannot be blank." },
        { status: 400 }
      );
    }

    if (title.length > 160) {
      return NextResponse.json(
        { error: "Report title must be 160 characters or fewer." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase
      .from("reports")
      .update({ title })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, title")
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: "Could not rename report.",
          details: error.message,
        },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Report not found or not yours." },
        { status: 404 }
      );
    }

    return NextResponse.json({ id: data.id, title: data.title });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Something broke while renaming the report.",
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
      return NextResponse.json({ error: "Missing report ID." }, { status: 400 });
    }

    const { user, error: userError } = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: userError }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json(
        {
          error: "Could not delete report.",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Something broke while deleting the report.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
