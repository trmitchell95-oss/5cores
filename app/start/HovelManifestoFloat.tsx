"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "hovel_manifesto_float_dismissed_v5";

export default function HovelManifestoFloat() {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(STORAGE_KEY) === "true";
      setVisible(!dismissed);
    } catch {
      setVisible(true);
    } finally {
      setReady(true);
    }
  }, []);

  function dismissForever() {
    try {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // If localStorage fails, still hide it for this session.
    }

    setVisible(false);
  }

  if (!ready || !visible) return null;

  return (
    <aside
      aria-label="The Hovel Editor manifesto"
      className="fixed bottom-5 right-5 z-50 w-[min(92vw,460px)] rounded-3xl border border-amber-700/40 bg-zinc-950/95 p-5 text-zinc-100 shadow-2xl shadow-black/50 backdrop-blur"
    >
      <div className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-amber-400">
        The Hovel Editor Manifesto
      </div>

      <h2 className="mb-3 text-2xl font-black tracking-tight text-white">
        Keep the soul in the sentence.
      </h2>

      <div className="space-y-3 text-sm leading-7 text-zinc-300">
        <p>
          The Hovel Editor was not built to replace writers. It was built
          because the machine is already in the room, and pretending otherwise
          is useless. Writers are going to use AI. Editors are going to use AI.
          Publishers, teachers, applicants, marketers, and weird little goblins
          with laptops at 2:00 in the morning are going to use it. The question
          is not whether the tool exists. The question is whether we let the
          tool sand every fingerprint off the work.
        </p>

        <p>
          AI is a tool. So is a chisel. So is a brush. Michelangelo did not use
          one sacred instrument for every cut, scrape, shadow, and color. He
          used what the work demanded. That is the point here too. Use the
          machine when it helps. Distrust it when it flatters. Argue with it.
          Ignore it when it is wrong. But do not hand it the keys to your voice.
        </p>

        <p>
          5 CORE checks the manuscript&apos;s bones. SPHINX checks the pulse.
          One asks whether the structure holds. The other leans close to the
          sentence and asks whether a human being still lives there. The goal is
          not cleaner writing, smoother writing, or prettier beige oatmeal with
          paragraph breaks. The goal is writing that still sounds stubbornly,
          unmistakably human.
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <a
          href="/help"
          className="text-sm font-bold text-amber-300 underline decoration-amber-600/60 underline-offset-4 hover:text-amber-200"
        >
          Read the help page
        </a>

        <button
          type="button"
          onClick={dismissForever}
          className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 text-sm font-black text-zinc-100 hover:border-amber-400 hover:text-amber-300"
        >
          Got it. Don&apos;t show again.
        </button>
      </div>
    </aside>
  );
}
