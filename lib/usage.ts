import { createClient } from "@supabase/supabase-js";

type UsageStatus = "started" | "succeeded" | "failed" | "rejected";

type UsageEvent = {
  userId?: string | null;
  tool: "council" | "sphinx" | "sphinx_save";
  status: UsageStatus;
  inputChars?: number;
  inputWords?: number;
  model?: string | null;
  reportId?: string | null;
  title?: string | null;
  errorMessage?: string | null;
  meta?: Record<string, unknown>;
};

export function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function logUsageEvent(event: UsageEvent) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn("Usage logging skipped: missing Supabase service settings.");
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { error } = await supabase.from("usage_events").insert({
      user_id: event.userId || null,
      tool: event.tool,
      status: event.status,
      input_chars: event.inputChars || 0,
      input_words: event.inputWords || 0,
      model: event.model || null,
      report_id: event.reportId || null,
      title: event.title || null,
      error_message: event.errorMessage || null,
      meta: event.meta || {},
    });

    if (error) {
      console.warn("Usage logging skipped:", error.message);
    }
  } catch (error) {
    console.warn(
      "Usage logging failed:",
      error instanceof Error ? error.message : String(error)
    );
  }
}
