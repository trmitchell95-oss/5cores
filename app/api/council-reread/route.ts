import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { checkDailyUsageLimit, countWords, logUsageEvent } from "../../../lib/usage";

export const runtime = "nodejs";

const client = new Anthropic();

const DEFAULT_MODEL = "claude-sonnet-4-6";
const REREAD_MIN_CHARS = 50;
const REREAD_MAX_CHARS = 25000;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function formatPreviousReport(content: unknown) {
  if (!content) return "";

  try {
    const parsed = typeof content === "string" ? JSON.parse(content) : content;

    if (!parsed || typeof parsed !== "object") {
      return typeof content === "string" ? content : "";
    }

    const record = parsed as Record<string, string>;

    const labels: Record<string, string> = {
      brad: "Brad",
      greg: "Greg",
      vonClaude: "Von Clausen",
      juniper: "Juniper",
      finalEditor: "Final Editor",
    };

    return Object.entries(record)
      .map(([key, value]) => {
        const label = labels[key] || key;

        return `# ${label}

${typeof value === "string" ? value : JSON.stringify(value)}`;
      })
      .join("\n\n---\n\n");
  } catch {
    return typeof content === "string" ? content : "";
  }
}

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.replace("Bearer ", "").trim()
    : "";

  if (!token) {
    return { user: null, error: "Login required." };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, error: "Could not verify logged-in user." };
  }

  return { user, error: "" };
}

export async function POST(req: NextRequest) {
  let userIdForLog: string | null = null;
  let titleForLog: string | null = null;
  let inputChars = 0;
  let inputWords = 0;
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  try {
    const { user, error: userError } = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: userError }, { status: 401 });
    }

    userIdForLog = user.id;

    const rereadDailyLimit = Number(process.env.REREAD_DAILY_RUN_LIMIT || 3);

    const limitCheck = await checkDailyUsageLimit({
      userId: user.id,
      userEmail: user.email || null,
      tool: "council",
      dailyLimit: rereadDailyLimit,
    });

    if (!limitCheck.allowed) {
      await logUsageEvent({
        userId: userIdForLog,
        tool: "council",
        status: "rejected",
        inputChars,
        inputWords,
        model,
        title: titleForLog,
        errorMessage: limitCheck.message || "Daily Council Re-Read limit reached.",
        meta: {
          stage: "daily_limit",
          used: limitCheck.used,
          limit: limitCheck.limit,
          resetAt: limitCheck.resetAt,
        },
      });

      return NextResponse.json(
        {
          error:
            "You have hit the daily Council Re-Read beta limit. Try again tomorrow.",
        },
        { status: 429 }
      );
    }

    const body = await req.json();

    const baseVersionId =
      typeof body.baseVersionId === "string" ? body.baseVersionId.trim() : "";

    const newManuscriptText =
      typeof body.newManuscriptText === "string"
        ? body.newManuscriptText.trim()
        : "";

    const revisionGoal =
      typeof body.revisionGoal === "string" ? body.revisionGoal.trim() : "";

    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim().slice(0, 160)
        : "Council Re-Read";

    const versionLabel =
      typeof body.versionLabel === "string" && body.versionLabel.trim()
        ? body.versionLabel.trim().slice(0, 80)
        : "Revised Draft";

    const saveNewVersion =
      typeof body.saveNewVersion === "boolean" ? body.saveNewVersion : true;

    titleForLog = title;

    if (!baseVersionId) {
      return NextResponse.json(
        { error: "Choose an earlier manuscript version to compare against." },
        { status: 400 }
      );
    }

    if (!newManuscriptText) {
      return NextResponse.json(
        { error: "Paste or upload the revised manuscript text." },
        { status: 400 }
      );
    }

    if (newManuscriptText.length < REREAD_MIN_CHARS) {
      return NextResponse.json(
        { error: "The revised manuscript text is too short." },
        { status: 400 }
      );
    }

    if (newManuscriptText.length > REREAD_MAX_CHARS) {
      return NextResponse.json(
        {
          error:
            "The revised manuscript is too long for Council Re-Read beta mode. Keep it under 25,000 characters.",
        },
        { status: 413 }
      );
    }

    const { data: baseVersion, error: baseVersionError } = await supabase
      .from("manuscript_versions")
      .select(
        "id, user_id, project_id, report_id, title, version_label, manuscript_text, word_count, char_count, created_at"
      )
      .eq("id", baseVersionId)
      .eq("user_id", user.id)
      .single();

    if (baseVersionError || !baseVersion) {
      return NextResponse.json(
        {
          error: "Earlier manuscript version not found or not yours.",
          details: baseVersionError?.message || null,
        },
        { status: 404 }
      );
    }

    const oldManuscriptText =
      typeof baseVersion.manuscript_text === "string"
        ? baseVersion.manuscript_text.trim()
        : "";

    if (!oldManuscriptText) {
      return NextResponse.json(
        {
          error:
            "The earlier manuscript version does not have saved text to compare against.",
        },
        { status: 400 }
      );
    }

    if (oldManuscriptText.length > REREAD_MAX_CHARS) {
      return NextResponse.json(
        {
          error:
            "The saved earlier draft is too long for Council Re-Read beta mode.",
        },
        { status: 413 }
      );
    }

    let previousReportText = "";
    let parentReportId: string | null = null;

    if (baseVersion.report_id) {
      const { data: previousReport } = await supabase
        .from("reports")
        .select("id, title, content, report_type, created_at")
        .eq("id", baseVersion.report_id)
        .eq("user_id", user.id)
        .single();

      if (previousReport) {
        parentReportId = previousReport.id;
        previousReportText = formatPreviousReport(previousReport.content);
      }
    }

    inputChars =
      oldManuscriptText.length +
      newManuscriptText.length +
      previousReportText.length;
    inputWords = countWords(`${oldManuscriptText}\n${newManuscriptText}`);

    await logUsageEvent({
      userId: userIdForLog,
      tool: "council",
      status: "started",
      inputChars,
      inputWords,
      model,
      title: titleForLog,
      meta: {
        baseVersionId,
        projectId: baseVersion.project_id || null,
        hasPreviousReport: Boolean(previousReportText),
      },
    });

    const systemPrompt = `You are the Council Re-Read editor inside HOVEL EDITOR.

You are not giving a fresh diagnosis in isolation.
You are comparing an earlier saved manuscript draft against a revised manuscript draft.

Your job is to tell the writer what actually changed.

Be direct, specific, and evidence-based.

Do not flatter.
Do not give generic revision advice.
Do not pretend to know changes that are not visible in the supplied drafts.
Do not quote huge passages.
Use short quoted fragments only when useful.

You may use the previous Council report as memory of what the Council noticed last time, but the manuscript texts are the source of truth.

Required report format:

# COUNCIL RE-READ

## WHAT CHANGED
Identify the major changes from the earlier draft to the revised draft.

## WHAT IMPROVED
Name specific improvements that made the piece stronger.

## WHAT YOU ACTUALLY FIXED
Connect the revision to problems that existed in the earlier draft or previous Council report.

## WHAT YOU ONLY HALF-FIXED
Name problems that improved but still need work.

## WHAT GOT WORSE
Identify anything the revision weakened, blurred, over-explained, softened, inflated, or accidentally broke.

## NEW PROBLEMS INTRODUCED
Name issues that appear in the revised draft but were not present, or were less present, before.

## BEST REVISION INSTINCT
Name the smartest move the writer made between drafts.

## WORST REVISION INSTINCT
Name the most dangerous move the writer made between drafts.

## NEXT REVISION PRIORITIES
Give the top 3 next fixes in order.

## FINAL RE-READ VERDICT
Give a blunt final verdict on whether the revision moved the manuscript forward.`;

    const userPrompt = `Compare these manuscript versions.

REVISION GOAL / WRITER NOTES:
${revisionGoal || "No revision goal provided."}

EARLIER VERSION:
Title: ${baseVersion.title || "Untitled"}
Version label: ${baseVersion.version_label || "Earlier Draft"}
Word count: ${baseVersion.word_count || countWords(oldManuscriptText)}
Character count: ${baseVersion.char_count || oldManuscriptText.length}

EARLIER MANUSCRIPT TEXT:
---
${oldManuscriptText}
---

PREVIOUS COUNCIL REPORT / MEMORY:
---
${previousReportText || "No previous Council report was attached to this saved manuscript version."}
---

REVISED VERSION:
Title: ${title}
Version label: ${versionLabel}
Word count: ${countWords(newManuscriptText)}
Character count: ${newManuscriptText.length}

REVISED MANUSCRIPT TEXT:
---
${newManuscriptText}
---

Now deliver the Council Re-Read report using the required format.`;

    const message = await client.messages.create({
      model,
      max_tokens: 12000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt,
        },
      ],
    });

    const contentBlocks = message.content as Array<{
      type: string;
      text?: string;
    }>;

    const rereadReport = contentBlocks
      .filter((block) => block.type === "text" && block.text)
      .map((block) => block.text || "")
      .join("\n")
      .trim();

    if (!rereadReport) {
      throw new Error("Council Re-Read returned an empty response.");
    }

    const { data: savedReport, error: saveReportError } = await supabase
      .from("reports")
      .insert({
        content: JSON.stringify({
          finalEditor: rereadReport,
        }),
        report_type: "council-reread",
        created_at: new Date().toISOString(),
        user_id: user.id,
        title,
        intake: JSON.stringify({
          revisionGoal: revisionGoal || null,
          baseVersionId,
          baseVersionLabel: baseVersion.version_label || null,
          newVersionLabel: versionLabel,
        }),
        project_id: baseVersion.project_id || null,
        parent_report_id: parentReportId,
      })
      .select("id")
      .single();

    if (saveReportError || !savedReport) {
      await logUsageEvent({
        userId: userIdForLog,
        tool: "council",
        status: "failed",
        inputChars,
        inputWords,
        model,
        title: titleForLog,
        errorMessage: saveReportError?.message || "Could not save Re-Read report.",
        meta: { stage: "save_report" },
      });

      return NextResponse.json({
        report: rereadReport,
        error: "Council Re-Read generated but could not be saved.",
      });
    }

    let newVersion = null;

    if (saveNewVersion && baseVersion.project_id) {
      const { data: insertedVersion, error: insertVersionError } = await supabase
        .from("manuscript_versions")
        .insert({
          user_id: user.id,
          project_id: baseVersion.project_id,
          report_id: savedReport.id,
          title,
          version_label: versionLabel,
          manuscript_text: newManuscriptText,
          word_count: countWords(newManuscriptText),
          char_count: newManuscriptText.length,
          source: "council-reread",
        })
        .select("id, project_id, report_id, title, version_label, word_count, char_count, source, created_at")
        .single();

      if (!insertVersionError && insertedVersion) {
        newVersion = insertedVersion;

        await supabase
          .from("reports")
          .update({
            manuscript_version_id: insertedVersion.id,
          })
          .eq("id", savedReport.id)
          .eq("user_id", user.id);
      }
    }

    if (baseVersion.project_id) {
      await supabase
        .from("projects")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", baseVersion.project_id)
        .eq("user_id", user.id);
    }

    await logUsageEvent({
      userId: userIdForLog,
      tool: "council",
      status: "succeeded",
      inputChars,
      inputWords,
      model,
      title: titleForLog,
      reportId: savedReport.id,
      meta: {
        baseVersionId,
        projectId: baseVersion.project_id || null,
        newVersionId: newVersion ? newVersion.id : null,
      },
    });

    return NextResponse.json({
      report: rereadReport,
      reportId: savedReport.id,
      newVersion,
    });
  } catch (error) {
    console.error("Council Re-Read error:", error);

    await logUsageEvent({
      userId: userIdForLog,
      tool: "council",
      status: "failed",
      inputChars,
      inputWords,
      model,
      title: titleForLog,
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: "Something went wrong during Council Re-Read.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
