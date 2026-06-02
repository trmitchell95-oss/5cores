"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createClient } from "@supabase/supabase-js";

type Blueprint = {
  rigName: string;
  purpose: string;
  audience: string;
  outputType: string;
  tone: string;
  constraints: string[];
  missingPieces: string[];
  promptStrategy: string;
};

type SavedRig = {
  id: string;
  created_at: string;
  updated_at: string;
  rig_name: string;
  fog: string | null;
  blueprint: Blueprint | Record<string, unknown> | null;
  actual_prompt: string | null;
  latest_output: string | null;
  is_archived: boolean;
};

type TextBlueprintField =
  | "rigName"
  | "purpose"
  | "audience"
  | "outputType"
  | "tone"
  | "promptStrategy";

const emptyBlueprint: Blueprint = {
  rigName: "",
  purpose: "",
  audience: "",
  outputType: "",
  tone: "",
  constraints: [],
  missingPieces: [],
  promptStrategy: "",
};

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase browser settings.");
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function cleanStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function coerceBlueprint(value: unknown): Blueprint {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return emptyBlueprint;
  }

  const record = value as Record<string, unknown>;

  return {
    rigName: cleanString(record.rigName),
    purpose: cleanString(record.purpose),
    audience: cleanString(record.audience),
    outputType: cleanString(record.outputType),
    tone: cleanString(record.tone),
    constraints: cleanStringArray(record.constraints),
    missingPieces: cleanStringArray(record.missingPieces),
    promptStrategy: cleanString(record.promptStrategy),
  };
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function assemblePrompt(fog: string, blueprint: Blueprint) {
  return `You are The Ideanator, a thinking partner for turning messy human ideas into usable structure.

RIG NAME:
${blueprint.rigName || "[Not set]"}

RAW USER FOG:
${fog || "[No fog entered yet.]"}

BLUEPRINT:
Purpose: ${blueprint.purpose || "[Not set]"}
Audience: ${blueprint.audience || "[Not set]"}
Output Type: ${blueprint.outputType || "[Not set]"}
Tone: ${blueprint.tone || "[Not set]"}

Constraints:
${blueprint.constraints.length ? blueprint.constraints.map((item) => `- ${item}`).join("\n") : "- [None set]"}

Missing Pieces:
${blueprint.missingPieces.length ? blueprint.missingPieces.map((item) => `- ${item}`).join("\n") : "- [None identified]"}

Prompt Strategy:
${blueprint.promptStrategy || "[Not set]"}

TASK:
Help the user turn the raw fog into a clear, useful next step. Be practical, honest, and collaborative. Do not over-polish the idea. Preserve what makes it human.`;
}

function formatBlueprintForCopy(blueprint: Blueprint) {
  return `# ${blueprint.rigName || "Untitled Thinking Rig"}

## Purpose
${blueprint.purpose || ""}

## Audience
${blueprint.audience || ""}

## Output Type
${blueprint.outputType || ""}

## Tone
${blueprint.tone || ""}

## Constraints
${blueprint.constraints.length ? blueprint.constraints.map((item) => `- ${item}`).join("\n") : "- None"}

## Missing Pieces
${blueprint.missingPieces.length ? blueprint.missingPieces.map((item) => `- ${item}`).join("\n") : "- None"}

## Prompt Strategy
${blueprint.promptStrategy || ""}`;
}

function formatFullRigPacket({
  fog,
  blueprint,
  actualPrompt,
  output,
}: {
  fog: string;
  blueprint: Blueprint;
  actualPrompt: string;
  output: string;
}) {
  return `# Ideanator Rig Packet

## Raw Fog
${fog || ""}

---

## Blueprint
${formatBlueprintForCopy(blueprint)}

---

## Actual Prompt
${actualPrompt || ""}

---

## Rig Output
${output || ""}`;
}

function renderInlineFormatting(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-black text-neutral-50">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <span key={index}>{part}</span>;
  });
}

function cleanMarkdownLine(line: string) {
  return line
    .replace(/^#{1,6}\s*/, "")
    .replace(/\*\*/g, "")
    .trim();
}

function renderReportMarkdown(text: string) {
  const lines = text.split("\n");
  const elements: ReactNode[] = [];
  let listItems: string[] = [];
  let paragraphLines: string[] = [];

  function flushParagraph() {
    if (!paragraphLines.length) return;

    const paragraph = paragraphLines.join(" ").trim();

    if (paragraph) {
      elements.push(
        <p key={`p-${elements.length}`} className="mb-4 leading-8 text-neutral-200">
          {renderInlineFormatting(paragraph)}
        </p>
      );
    }

    paragraphLines = [];
  }

  function flushList() {
    if (!listItems.length) return;

    elements.push(
      <ul key={`ul-${elements.length}`} className="mb-5 ml-5 list-disc space-y-2 text-neutral-200">
        {listItems.map((item, index) => (
          <li key={index} className="leading-7">
            {renderInlineFormatting(item)}
          </li>
        ))}
      </ul>
    );

    listItems = [];
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      return;
    }

    if (line.startsWith("# ")) {
      flushParagraph();
      flushList();

      elements.push(
        <h1 key={`h1-${elements.length}`} className="mb-5 mt-2 text-3xl font-black tracking-tight text-amber-300 sm:text-4xl">
          {cleanMarkdownLine(line)}
        </h1>
      );
      return;
    }

    if (line.startsWith("## ")) {
      flushParagraph();
      flushList();

      elements.push(
        <h2 key={`h2-${elements.length}`} className="mb-3 mt-8 border-t border-neutral-800 pt-6 text-2xl font-black text-neutral-50">
          {cleanMarkdownLine(line)}
        </h2>
      );
      return;
    }

    if (line.startsWith("### ")) {
      flushParagraph();
      flushList();

      elements.push(
        <h3 key={`h3-${elements.length}`} className="mb-3 mt-6 text-xl font-black text-amber-200">
          {cleanMarkdownLine(line)}
        </h3>
      );
      return;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      flushParagraph();
      listItems.push(line.slice(2).trim());
      return;
    }

    if (/^\d+\.\s+/.test(line)) {
      flushParagraph();
      listItems.push(line.replace(/^\d+\.\s+/, "").trim());
      return;
    }

    paragraphLines.push(line);
  });

  flushParagraph();
  flushList();

  return elements;
}

export default function IdeanatorPage() {
  const [fog, setFog] = useState("");
  const [blueprint, setBlueprint] = useState<Blueprint>(emptyBlueprint);
  const [showPrompt, setShowPrompt] = useState(false);
  const [output, setOutput] = useState("");
  const [savedRigs, setSavedRigs] = useState<SavedRig[]>([]);
  const [loadingBlueprint, setLoadingBlueprint] = useState(false);
  const [runningRig, setRunningRig] = useState(false);
  const [savingRig, setSavingRig] = useState(false);
  const [loadingRigs, setLoadingRigs] = useState(false);
  const [archivingRigId, setArchivingRigId] = useState("");
  const [activeRigId, setActiveRigId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const actualPrompt = useMemo(() => assemblePrompt(fog, blueprint), [fog, blueprint]);
  const blueprintCopy = useMemo(() => formatBlueprintForCopy(blueprint), [blueprint]);
  const fullRigPacket = useMemo(
    () => formatFullRigPacket({ fog, blueprint, actualPrompt, output }),
    [fog, blueprint, actualPrompt, output]
  );

  async function getSessionToken() {
    const supabase = getSupabaseClient();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      window.location.href = "/login";
      return "";
    }

    return session.access_token;
  }

  async function loadSavedRigs(showLoadedMessage = false) {
    try {
      setLoadingRigs(true);
      setError("");

      const token = await getSessionToken();

      if (!token) return;

      const response = await fetch("/api/ideanator/rigs", {
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Could not load saved rigs.");
      }

      setSavedRigs(result.rigs || []);

      if (showLoadedMessage) {
        setMessage("Saved rigs refreshed.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load saved rigs.");
    } finally {
      setLoadingRigs(false);
    }
  }

  useEffect(() => {
    loadSavedRigs(false);
  }, []);

  async function copyToClipboard(label: string, value: string) {
    try {
      setError("");
      setMessage("");

      if (!value.trim()) {
        setError(`Nothing to copy yet for ${label}.`);
        return;
      }

      await navigator.clipboard.writeText(value);
      setMessage(`${label} copied.`);
    } catch {
      setError("Could not copy automatically. Select the text and copy it manually.");
    }
  }

  async function generateBlueprint() {
    try {
      setLoadingBlueprint(true);
      setError("");
      setMessage("");
      setOutput("");
      setActiveRigId("");

      const token = await getSessionToken();

      if (!token) {
        return;
      }

      const response = await fetch("/api/ideanator/blueprint", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fog,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Could not generate blueprint.");
      }

      setBlueprint(result.blueprint || emptyBlueprint);
      setShowPrompt(true);
      setMessage("Blueprint generated.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoadingBlueprint(false);
    }
  }

  function updateBlueprintField(field: TextBlueprintField, value: string) {
    setBlueprint((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateListField(field: "constraints" | "missingPieces", value: string) {
    setBlueprint((current) => ({
      ...current,
      [field]: value
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean),
    }));
  }

  async function runRigPreview() {
    try {
      setRunningRig(true);
      setError("");
      setMessage("");
      setOutput("");

      if (!fog.trim()) {
        setError("Dump the idea first. The rig cannot run on vibes and dust.");
        return;
      }

      if (!blueprint.purpose.trim()) {
        setError("Generate or fill in the blueprint first.");
        return;
      }

      const token = await getSessionToken();

      if (!token) {
        return;
      }

      const response = await fetch("/api/ideanator/run", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fog,
          blueprint,
          actualPrompt,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Could not run rig.");
      }

      setOutput(result.output || "");
      setMessage("Rig ran successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while running the rig.");
    } finally {
      setRunningRig(false);
    }
  }

  async function saveRig() {
    try {
      setSavingRig(true);
      setError("");
      setMessage("");

      const rigName = blueprint.rigName || blueprint.outputType || "Untitled Thinking Rig";

      if (!blueprint.purpose.trim()) {
        setError("Generate or fill in the blueprint before saving a rig.");
        return;
      }

      const token = await getSessionToken();

      if (!token) {
        return;
      }

      const response = await fetch("/api/ideanator/rigs", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rigName,
          fog,
          blueprint,
          actualPrompt,
          latestOutput: output,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Could not save rig.");
      }

      const savedRig = result.rig as SavedRig;

      setSavedRigs((current) => [savedRig, ...current]);
      setActiveRigId(savedRig.id);
      setMessage("Rig saved to your account.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save rig.");
    } finally {
      setSavingRig(false);
    }
  }

  function openSavedRig(rig: SavedRig) {
    const nextBlueprint = coerceBlueprint(rig.blueprint);

    setFog(rig.fog || "");
    setBlueprint({
      ...nextBlueprint,
      rigName: nextBlueprint.rigName || rig.rig_name || "Untitled Thinking Rig",
    });
    setOutput(rig.latest_output || "");
    setActiveRigId(rig.id);
    setShowPrompt(true);
    setError("");
    setMessage(`Opened ${rig.rig_name || "saved rig"}.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function archiveSavedRig(rig: SavedRig) {
    try {
      setArchivingRigId(rig.id);
      setError("");
      setMessage("");

      const token = await getSessionToken();

      if (!token) return;

      const response = await fetch("/api/ideanator/rigs", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: rig.id,
          isArchived: true,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "Could not archive rig.");
      }

      setSavedRigs((current) => current.filter((item) => item.id !== rig.id));

      if (activeRigId === rig.id) {
        setActiveRigId("");
      }

      setMessage("Rig archived.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not archive rig.");
    } finally {
      setArchivingRigId("");
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-6 text-neutral-100 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <section className="rounded-3xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">
            The Ideanator
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
            Fog in. Thinking Rig out.
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-neutral-300">
            Drop the messy idea on the left. The blueprint forms on the right.
            This is not a prompt builder. It is a thinking prosthetic.
          </p>
        </section>

        {error && (
          <section className="rounded-2xl border border-red-900 bg-red-950/60 p-4 text-red-200">
            {error}
          </section>
        )}

        {message && (
          <section className="rounded-2xl border border-emerald-900 bg-emerald-950/50 p-4 text-emerald-200">
            {message}
          </section>
        )}

        <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">The Fog</h2>
                <p className="text-sm text-neutral-400">
                  Messy thoughts, fragments, panic, notes, half-formed brilliance.
                </p>
              </div>
              <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-300">
                Left pane
              </span>
            </div>

            <textarea
              value={fog}
              onChange={(event) => setFog(event.target.value)}
              placeholder="Tell me the idea badly. Seriously. Dump the mess here."
              className="min-h-[420px] w-full resize-none rounded-2xl border border-neutral-700 bg-neutral-950 p-4 text-base leading-7 text-neutral-100 outline-none transition focus:border-amber-400"
            />
          </div>

          <div className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">The Blueprint</h2>
                <p className="text-sm text-neutral-400">
                  The system taking notes, not showing off.
                </p>
              </div>
              <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-300">
                Right pane
              </span>
            </div>

            <div className="mb-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => copyToClipboard("Blueprint", blueprintCopy)}
                className="rounded-xl border border-neutral-700 px-3 py-2 text-sm font-bold text-neutral-100 transition hover:border-amber-400 hover:text-amber-300"
              >
                Copy Blueprint
              </button>

              <button
                type="button"
                onClick={() => copyToClipboard("Actual Prompt", actualPrompt)}
                className="rounded-xl border border-neutral-700 px-3 py-2 text-sm font-bold text-neutral-100 transition hover:border-amber-400 hover:text-amber-300"
              >
                Copy Actual Prompt
              </button>

              {activeRigId && (
                <span className="rounded-xl border border-emerald-900 bg-emerald-950/40 px-3 py-2 text-sm font-bold text-emerald-200">
                  Opened Saved Rig
                </span>
              )}
            </div>

            <div className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-neutral-300">
                  Rig Name
                </span>
                <input
                  value={blueprint.rigName}
                  onChange={(event) => updateBlueprintField("rigName", event.target.value)}
                  placeholder="Example: School Safety Pitch Rig"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none transition focus:border-amber-400"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-neutral-300">
                  Purpose
                </span>
                <input
                  value={blueprint.purpose}
                  onChange={(event) => updateBlueprintField("purpose", event.target.value)}
                  placeholder="What is this trying to do?"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none transition focus:border-amber-400"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-neutral-300">
                  Audience
                </span>
                <input
                  value={blueprint.audience}
                  onChange={(event) => updateBlueprintField("audience", event.target.value)}
                  placeholder="Who is this for?"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none transition focus:border-amber-400"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-neutral-300">
                  Output Type
                </span>
                <input
                  value={blueprint.outputType}
                  onChange={(event) => updateBlueprintField("outputType", event.target.value)}
                  placeholder="Pitch, email, grant answer, product plan, etc."
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none transition focus:border-amber-400"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-neutral-300">
                  Tone
                </span>
                <input
                  value={blueprint.tone}
                  onChange={(event) => updateBlueprintField("tone", event.target.value)}
                  placeholder="How should this sound?"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none transition focus:border-amber-400"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-neutral-300">
                  Constraints
                </span>
                <textarea
                  value={blueprint.constraints.join("\n")}
                  onChange={(event) => updateListField("constraints", event.target.value)}
                  placeholder="One constraint per line."
                  className="min-h-[110px] w-full resize-none rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none transition focus:border-amber-400"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-neutral-300">
                  Missing Pieces
                </span>
                <textarea
                  value={blueprint.missingPieces.join("\n")}
                  onChange={(event) => updateListField("missingPieces", event.target.value)}
                  placeholder="One missing piece per line."
                  className="min-h-[110px] w-full resize-none rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none transition focus:border-amber-400"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-semibold text-neutral-300">
                  Prompt Strategy
                </span>
                <textarea
                  value={blueprint.promptStrategy}
                  onChange={(event) => updateBlueprintField("promptStrategy", event.target.value)}
                  placeholder="How should the AI approach this?"
                  className="min-h-[130px] w-full resize-none rounded-xl border border-neutral-700 bg-neutral-950 px-4 py-3 outline-none transition focus:border-amber-400"
                />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-neutral-800 bg-neutral-900/95 p-4 shadow-2xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold">Thinking Rig Controls</h2>
              <p className="text-sm text-neutral-400">
                Generate the blueprint, inspect the real prompt, run the rig, then save the pattern.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={generateBlueprint}
                disabled={loadingBlueprint}
                className="rounded-xl bg-amber-400 px-4 py-3 font-bold text-neutral-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingBlueprint ? "Thinking..." : "Generate Blueprint"}
              </button>

              <button
                onClick={() => setShowPrompt((current) => !current)}
                className="rounded-xl border border-neutral-700 px-4 py-3 font-bold text-neutral-100 transition hover:border-neutral-500"
              >
                {showPrompt ? "Hide Actual Prompt" : "Show Actual Prompt"}
              </button>

              <button
                onClick={runRigPreview}
                disabled={runningRig}
                className="rounded-xl border border-neutral-700 px-4 py-3 font-bold text-neutral-100 transition hover:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {runningRig ? "Running..." : "Run Rig"}
              </button>

              <button
                onClick={saveRig}
                disabled={savingRig}
                className="rounded-xl border border-amber-400 px-4 py-3 font-bold text-amber-300 transition hover:bg-amber-400 hover:text-neutral-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingRig ? "Saving..." : "Save Rig"}
              </button>

              <button
                onClick={() => loadSavedRigs(true)}
                disabled={loadingRigs}
                className="rounded-xl border border-neutral-700 px-4 py-3 font-bold text-neutral-100 transition hover:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loadingRigs ? "Refreshing..." : "Refresh Rigs"}
              </button>
            </div>
          </div>
        </section>

        {showPrompt && (
          <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5 shadow-xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">Actual Prompt Preview</h2>
                <p className="mt-1 text-sm text-neutral-400">
                  This is the portable rig prompt. The user can take this into another AI room if they want.
                </p>
              </div>

              <button
                type="button"
                onClick={() => copyToClipboard("Actual Prompt", actualPrompt)}
                className="rounded-xl border border-neutral-700 px-3 py-2 text-sm font-bold text-neutral-100 transition hover:border-amber-400 hover:text-amber-300"
              >
                Copy Prompt
              </button>
            </div>

            <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-sm leading-6 text-neutral-200">
              {actualPrompt}
            </pre>
          </section>
        )}

        {output && (
          <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5 shadow-xl">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-400">
                  Rig Output
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-neutral-50">
                  {blueprint.rigName || "Finished Output"}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-400">
                  Formatted report view. Copy the output, the prompt, or the full rig packet.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => copyToClipboard("Rig Output", output)}
                  className="rounded-xl border border-neutral-700 px-3 py-2 text-sm font-bold text-neutral-100 transition hover:border-amber-400 hover:text-amber-300"
                >
                  Copy Output
                </button>

                <button
                  type="button"
                  onClick={() => copyToClipboard("Full Rig Packet", fullRigPacket)}
                  className="rounded-xl border border-amber-400 px-3 py-2 text-sm font-bold text-amber-300 transition hover:bg-amber-400 hover:text-neutral-950"
                >
                  Copy Full Rig Packet
                </button>
              </div>
            </div>

            <article className="mt-5 rounded-2xl border border-neutral-800 bg-neutral-950 p-5 shadow-inner sm:p-7">
              <div className="mx-auto max-w-5xl">
                {renderReportMarkdown(output)}
              </div>
            </article>
          </section>
        )}

        <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5 shadow-xl">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">Saved Rigs</h2>
              <p className="mt-1 text-sm text-neutral-400">
                These are saved to your account. Open one, reuse it, copy it, or archive it.
              </p>
            </div>

            <button
              onClick={() => loadSavedRigs(true)}
              disabled={loadingRigs}
              className="rounded-xl border border-neutral-700 px-3 py-2 text-sm font-bold text-neutral-100 transition hover:border-amber-400 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadingRigs ? "Loading..." : "Refresh"}
            </button>
          </div>

          {loadingRigs && (
            <p className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-neutral-400">
              Loading saved rigs...
            </p>
          )}

          {!loadingRigs && savedRigs.length === 0 && (
            <p className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-neutral-400">
              No saved rigs yet. Build one, run it, then save the pattern.
            </p>
          )}

          {savedRigs.length > 0 && (
            <div className="mt-4 grid gap-3">
              {savedRigs.map((rig) => {
                const rigBlueprint = coerceBlueprint(rig.blueprint);
                const isActive = activeRigId === rig.id;

                return (
                  <article
                    key={rig.id}
                    className={`rounded-2xl border p-4 ${
                      isActive
                        ? "border-amber-400 bg-amber-950/20"
                        : "border-neutral-800 bg-neutral-950"
                    }`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-black text-neutral-50">
                          {rig.rig_name || rigBlueprint.rigName || "Untitled Thinking Rig"}
                        </h3>

                        <p className="mt-1 text-sm leading-6 text-neutral-400">
                          {rigBlueprint.outputType || "No output type saved."}
                        </p>

                        <p className="mt-2 text-xs uppercase tracking-[0.14em] text-neutral-500">
                          Updated {formatDate(rig.updated_at)}
                        </p>

                        {isActive && (
                          <p className="mt-2 text-sm font-bold text-amber-300">
                            Currently open
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openSavedRig(rig)}
                          className="rounded-xl bg-amber-400 px-3 py-2 text-sm font-black text-neutral-950 transition hover:bg-amber-300"
                        >
                          Open
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              "Saved Rig Packet",
                              formatFullRigPacket({
                                fog: rig.fog || "",
                                blueprint: {
                                  ...rigBlueprint,
                                  rigName:
                                    rigBlueprint.rigName ||
                                    rig.rig_name ||
                                    "Untitled Thinking Rig",
                                },
                                actualPrompt: rig.actual_prompt || "",
                                output: rig.latest_output || "",
                              })
                            )
                          }
                          className="rounded-xl border border-neutral-700 px-3 py-2 text-sm font-bold text-neutral-100 transition hover:border-amber-400 hover:text-amber-300"
                        >
                          Copy Packet
                        </button>

                        <button
                          type="button"
                          onClick={() => archiveSavedRig(rig)}
                          disabled={archivingRigId === rig.id}
                          className="rounded-xl border border-red-900 px-3 py-2 text-sm font-bold text-red-200 transition hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {archivingRigId === rig.id ? "Archiving..." : "Archive"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
