"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TextSize = "normal" | "large" | "huge";

function applySettings(easyMode: boolean, textSize: TextSize) {
  document.body.classList.toggle("hovel-easy-mode", easyMode);

  if (textSize === "huge") {
    document.documentElement.style.fontSize = "21px";
  } else if (textSize === "large" || easyMode) {
    document.documentElement.style.fontSize = "19px";
  } else {
    document.documentElement.style.fontSize = "16px";
  }
}

export default function SettingsPage() {
  const [easyMode, setEasyMode] = useState(false);
  const [textSize, setTextSize] = useState<TextSize>("normal");

  useEffect(() => {
    const savedEasy = window.localStorage.getItem("hovel-easy-mode") === "on";
    const savedSize = (window.localStorage.getItem("hovel-text-size") || "normal") as TextSize;

    setEasyMode(savedEasy);
    setTextSize(savedSize);
    applySettings(savedEasy, savedSize);
  }, []);

  function updateEasyMode(next: boolean) {
    setEasyMode(next);
    window.localStorage.setItem("hovel-easy-mode", next ? "on" : "off");
    applySettings(next, textSize);
  }

  function updateTextSize(next: TextSize) {
    setTextSize(next);
    window.localStorage.setItem("hovel-text-size", next);
    applySettings(easyMode, next);
  }

  return (
    <main className="support-page">
      <section className="support-wrap">
        <header className="support-hero">
          <p className="support-eyebrow">Settings</p>
          <h1>Make the app easier to read.</h1>
          <p>
            Bigger text, bigger buttons, and simpler spacing. This only changes
            how the app looks for you.
          </p>
        </header>

        <section className="support-grid two">
          <article className="support-card">
            <h2>Easy Mode</h2>
            <p>Bigger buttons, bigger text, and less cramped spacing.</p>

            <button
              type="button"
              className={easyMode ? "support-primary" : ""}
              onClick={() => updateEasyMode(!easyMode)}
            >
              {easyMode ? "Easy Mode Is On" : "Turn On Easy Mode"}
            </button>
          </article>

          <article className="support-card">
            <h2>Text Size</h2>
            <p>Pick what feels easiest on your eyes.</p>

            <div className="support-actions">
              <button
                type="button"
                className={textSize === "normal" ? "support-primary" : ""}
                onClick={() => updateTextSize("normal")}
              >
                Normal
              </button>

              <button
                type="button"
                className={textSize === "large" ? "support-primary" : ""}
                onClick={() => updateTextSize("large")}
              >
                Large
              </button>

              <button
                type="button"
                className={textSize === "huge" ? "support-primary" : ""}
                onClick={() => updateTextSize("huge")}
              >
                Huge
              </button>
            </div>
          </article>
        </section>

        <section className="support-card support-wide">
          <h2>Quick guide</h2>

          <div className="support-list">
            <p><strong>Idea in your head?</strong> Start Idea.</p>
            <p><strong>Words already written?</strong> Check Writing.</p>
            <p><strong>Words sound fake?</strong> Clean Words.</p>
            <p><strong>Looking for old work?</strong> My Work.</p>
          </div>

          <div className="support-actions">
            <Link href="/workshop">Back Home</Link>
            <Link href="/idea/help">Help</Link>
          </div>
        </section>
      </section>
    </main>
  );
}
