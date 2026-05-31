import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

export async function POST(request: Request) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const token = authorization.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json(
        { error: "You must be logged in to save a Sphinx report." },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          error:
            "Missing Supabase settings. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);

    if (userError || !userData.user) {
      return NextResponse.json(
        {
          error: "Could not verify the logged-in user.",
          details: userError?.message || "No user returned from Supabase.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const text = cleanText(body.text);
    const report = cleanText(body.report);
    const strongerVersion = cleanText(body.strongerVersion);
    const mode = cleanText(body.mode, "GENERAL");
    const strictness = cleanText(body.strictness, "BRUTAL");
    const sourceTitle = cleanText(body.title);

    if (!text) {
      return NextResponse.json(
        { error: "There is no Sphinx input text to save." },
        { status: 400 }
      );
    }

    if (!report) {
      return NextResponse.json(
        { error: "There is no Sphinx report to save." },
        { status: 400 }
      );
    }

    const title =
      sourceTitle.length > 0
        ? `SPHINX - ${sourceTitle.slice(0, 120)}`
        : `SPHINX Report - ${strictness}`;

    const content = [
      "# SPHINX AI STINK PREVENTER",
      "",
      `Mode: ${mode}`,
      `Strictness: ${strictness}`,
      "",
      "## Original Text",
      "",
      text.slice(0, 20000),
      "",
      "## Stronger Version",
      "",
      strongerVersion || "No stronger version was extracted.",
      "",
      "## Full Sphinx Report",
      "",
      report,
    ].join("\n");

    const { data, error } = await supabase
      .from("reports")
      .insert({
        user_id: userData.user.id,
        title,
        report_type: "sphinx",
        content,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Sphinx save error:", error);

      return NextResponse.json(
        {
          error: "Sphinx report could not be saved.",
          details: error.message,
          code: error.code,
          hint: error.hint || null,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: data?.id,
      title,
      message: "Sphinx report saved.",
    });
  } catch (error) {
    console.error("Sphinx save route error:", error);

    return NextResponse.json(
      {
        error: "Something broke while saving the Sphinx report.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
