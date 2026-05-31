import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { countWords, logUsageEvent } from "../../../../lib/usage";

export const runtime = "nodejs";

const SPHINX_SAVE_MAX_CHARS = 10000;

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

export async function POST(request: Request) {
  let userIdForLog: string | null = null;
  let inputChars = 0;
  let inputWords = 0;
  let titleForLog: string | null = null;
  let modeForLog = "GENERAL";
  let strictnessForLog = "BRUTAL";

  try {
    const authorization = request.headers.get("authorization") || "";
    const token = authorization.replace("Bearer ", "").trim();

    if (!token) {
      await logUsageEvent({
        tool: "sphinx_save",
        status: "rejected",
        errorMessage: "No login token provided.",
      });

      return NextResponse.json(
        { error: "You must be logged in to save a Sphinx report." },
        { status: 401 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      await logUsageEvent({
        tool: "sphinx_save",
        status: "failed",
        errorMessage: "Missing Supabase browser settings.",
      });

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
      await logUsageEvent({
        tool: "sphinx_save",
        status: "rejected",
        errorMessage: userError?.message || "No user returned from Supabase.",
      });

      return NextResponse.json(
        {
          error: "Could not verify the logged-in user.",
          details: userError?.message || "No user returned from Supabase.",
        },
        { status: 401 }
      );
    }

    userIdForLog = userData.user.id;

    const body = await request.json();

    const text = cleanText(body.text);
    const report = cleanText(body.report);
    const strongerVersion = cleanText(body.strongerVersion);
    const mode = cleanText(body.mode, "GENERAL");
    const strictness = cleanText(body.strictness, "BRUTAL");
    const sourceTitle = cleanText(body.title);

    modeForLog = mode;
    strictnessForLog = strictness;
    inputChars = text.length;
    inputWords = countWords(text);

    if (!text) {
      await logUsageEvent({
        userId: userIdForLog,
        tool: "sphinx_save",
        status: "rejected",
        inputChars,
        inputWords,
        title: sourceTitle || null,
        errorMessage: "No Sphinx input text to save.",
        meta: { mode, strictness },
      });

      return NextResponse.json(
        { error: "There is no Sphinx input text to save." },
        { status: 400 }
      );
    }

    if (!report) {
      await logUsageEvent({
        userId: userIdForLog,
        tool: "sphinx_save",
        status: "rejected",
        inputChars,
        inputWords,
        title: sourceTitle || null,
        errorMessage: "No Sphinx report to save.",
        meta: { mode, strictness },
      });

      return NextResponse.json(
        { error: "There is no Sphinx report to save." },
        { status: 400 }
      );
    }

    if (text.length > SPHINX_SAVE_MAX_CHARS) {
      await logUsageEvent({
        userId: userIdForLog,
        tool: "sphinx_save",
        status: "rejected",
        inputChars,
        inputWords,
        title: sourceTitle || null,
        errorMessage: "Sphinx input exceeded save limit.",
        meta: { mode, strictness, limit: SPHINX_SAVE_MAX_CHARS },
      });

      return NextResponse.json(
        {
          error:
            "This Sphinx input is too long to save in beta mode. Keep it under 10,000 characters.",
        },
        { status: 413 }
      );
    }

    const title =
      sourceTitle.length > 0
        ? `SPHINX - ${sourceTitle.slice(0, 120)}`
        : `SPHINX Report - ${strictness}`;

    titleForLog = title;

    await logUsageEvent({
      userId: userIdForLog,
      tool: "sphinx_save",
      status: "started",
      inputChars,
      inputWords,
      title: titleForLog,
      meta: { mode, strictness },
    });

    const content = [
      "# SPHINX AI STINK PREVENTER",
      "",
      `Mode: ${mode}`,
      `Strictness: ${strictness}`,
      "",
      "## Original Text",
      "",
      text,
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

      await logUsageEvent({
        userId: userIdForLog,
        tool: "sphinx_save",
        status: "failed",
        inputChars,
        inputWords,
        title: titleForLog,
        errorMessage: error.message,
        meta: {
          mode,
          strictness,
          code: error.code,
          hint: error.hint || null,
          stage: "save_report",
        },
      });

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

    await logUsageEvent({
      userId: userIdForLog,
      tool: "sphinx_save",
      status: "succeeded",
      inputChars,
      inputWords,
      title: titleForLog,
      reportId: data?.id || null,
      meta: { mode, strictness },
    });

    return NextResponse.json({
      id: data?.id,
      title,
      message: "Sphinx report saved.",
    });
  } catch (error) {
    console.error("Sphinx save route error:", error);

    await logUsageEvent({
      userId: userIdForLog,
      tool: "sphinx_save",
      status: "failed",
      inputChars,
      inputWords,
      title: titleForLog,
      errorMessage: error instanceof Error ? error.message : String(error),
      meta: {
        mode: modeForLog,
        strictness: strictnessForLog,
      },
    });

    return NextResponse.json(
      {
        error: "Something broke while saving the Sphinx report.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
