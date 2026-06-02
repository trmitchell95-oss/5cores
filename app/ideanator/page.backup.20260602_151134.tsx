"use client";

import { useMemo, useState } from "react";
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

export default function IdeanatorPage() {
  const [fog, setFog] = useState("");
  const [blueprint, setBlueprint] = useState<Blueprint>(emptyBlueprint);
  const [showPrompt, setShowPrompt] = useState(false);
  const [output, setOutput] = useState("");
  const [savedRigs, setSavedRigs] = useState<string[]>([]);
  const [loadingBlueprint, setLoadingBlueprint] = useState(false);
  const [runningRig, setRunningRig] = useState(false);
  const [error, setError] = useState("");

  const actualPrompt = useMemo(() => assemblePrompt(fog, blueprint), [fog, blueprint]);

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

  async function generateBlueprint() {
    try {
      setLoadingBlueprint(true);
      setError("");
      setOutput("");

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong while running the rig.");
    } finally {
      setRunningRig(false);
    }
  }

  function saveRig() {
    setError("");

    const rigName = blueprint.rigName || blueprint.outputType || "Untitled Thinking Rig";

    if (!blueprint.purpose.trim()) {
      setError("Generate or fill in the blueprint before saving a rig.");
      return;
    }

    setSavedRigs((current) => [rigName, ...current]);
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
                className="rounded-xl border border-amber-400 px-4 py-3 font-bold text-amber-300 transition hover:bg-amber-400 hover:text-neutral-950"
              >
                Save Rig
              </button>
            </div>
          </div>
        </section>

        {showPrompt && (
          <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5 shadow-xl">
            <h2 className="text-xl font-bold">Actual Prompt Preview</h2>
            <p className="mt-1 text-sm text-neutral-400">
              This is the transparency drawer. The user can see what the machine is about to send.
            </p>
            <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-sm leading-6 text-neutral-200">
              {actualPrompt}
            </pre>
          </section>
        )}

        {output && (
          <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5 shadow-xl">
            <h2 className="text-xl font-bold">Rig Output</h2>
            <p className="mt-4 rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-neutral-200">
              {output}
            </p>
          </section>
        )}

        {savedRigs.length > 0 && (
          <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-5 shadow-xl">
            <h2 className="text-xl font-bold">Saved Rigs</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Mock saved in browser state for now. Backend persistence comes after Run Rig works.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {savedRigs.map((rig, index) => (
                <span
                  key={`${rig}-${index}`}
                  className="rounded-full border border-neutral-700 bg-neutral-950 px-4 py-2 text-sm text-neutral-200"
                >
                  {rig}
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

