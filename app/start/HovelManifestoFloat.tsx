"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "hovel_manifesto_float_dismissed_v1";

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
      aria-label="The Hovel manifesto"
      className="fixed bottom-5 right-5 z-50 w-[min(92vw,440px)] rounded-3xl border border-amber-700/40 bg-zinc-950/95 p-5 text-zinc-100 shadow-2xl shadow-black/50 backdrop-blur"
    >
      <div className="mb-2 text-xs font-black uppercase tracking-[0.28em] text-amber-400">
        The Hovel Manifesto
      </div>

      <h2 className="mb-3 text-2xl font-black tracking-tight text-white">
        Pull the human back out of the machine.
      </h2>

      <div className="space-y-3 text-sm leading-7 text-zinc-300">
        <p>
          The Hovel Editor was not built to make writers sound like machines.
          It was built because the machine has become part of the room, and
          pretending otherwise is useless. The work now is to drag the human
          pulse back through the wires: the grief, humor, dirt, rhythm,
          contradiction, and voice that make writing belong to a person instead
          of a template.
        </p>

        <p>
          Tools are not betrayals. Michelangelo did not carve with one holy
          chisel or paint with one holy brush. He used the tool the work
          demanded. That is the point here too. Use the machine when it helps,
          distrust it when it flatters, and never let it become the author. The
          Hovel exists to make the tool serve the hand, not replace it.
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
