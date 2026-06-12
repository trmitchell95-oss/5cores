"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const mainChoices = [
  {
    label: "1",
    title: "Start Here",
    plain: "Tell us your idea in normal words. We will help you sort it out.",
    href: "/idea?start=intake",
    button: "Start Here",
    best: true,
  },
  {
    label: "2",
    title: "I wrote something",
    plain: "Paste a draft, chapter, proposal, letter, or notes you want help with.",
    href: "/submit",
    button: "Help With Writing",
    best: false,
  },
  {
    label: "3",
    title: "Clean up my words",
    plain: "Use this when something sounds stiff, awkward, fake, or too much like a robot.",
    href: "/sphinx",
    button: "Clean My Words",
    best: false,
  },
  {
    label: "4",
    title: "Open my saved work",
    plain: "Find things you already saved and keep working on them.",
    href: "/projects",
    button: "Open My Work",
    best: false,
  },
];

const smallTools = [
  {
    title: "Build a plan",
    body: "Turn a tested idea into a reusable prompt, checklist, pitch, grant answer, proposal, or project plan.",
    href: "/ideanator",
  },
  {
    title: "Compare drafts",
    body: "See whether the new version is actually better than the old one.",
    href: "/reread",
  },
  {
    title: "Reports",
    body: "Open saved Hovel Editor reports and diagnosis work.",
    href: "/dashboard",
  },
  {
    title: "Settings",
    body: "Turn on bigger text and easier reading.",
    href: "/settings",
  },
];
const councilSteps = [
  {
    name: "Step 1",
    title: "Tell us the idea",
    body: "Type it the way you would explain it to a friend. Messy is fine.",
  },
  {
    name: "Step 2",
    title: "We make it clearer",
    body: "Brad helps turn the fog into plain English.",
  },
  {
    name: "Step 3",
    title: "We look for problems",
    body: "Greg checks the weak spots before they surprise you later.",
  },
  {
    name: "Step 4",
    title: "We find who it helps",
    body: "Juniper looks for the people, purpose, and human reason it matters.",
  },
  {
    name: "Step 5",
    title: "We make a simple plan",
    body: "Von Claussen turns it into practical next steps.",
  },
  {
    name: "Step 6",
    title: "We help finish it",
    body: "Hovel Editor can later turn the strongest version into a serious document.",
  },
];

export default function WorkshopPage() {
  const [easyMode, setEasyMode] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("hovel-easy-mode") === "on";
    setEasyMode(saved);
    document.documentElement.style.fontSize = saved ? "19px" : "16px";
  }, []);

  function toggleEasyMode() {
    const next = !easyMode;
    setEasyMode(next);
    window.localStorage.setItem("hovel-easy-mode", next ? "on" : "off");
    document.documentElement.style.fontSize = next ? "19px" : "16px";
  }

  return (
    <main className={easyMode ? "easy page" : "page"}>
      <section className="wrap">
        <header className="hero">
          <div className="topline">
            <p className="eyebrow">Hovel Ideanator</p>

            <button type="button" className="easyButton" onClick={toggleEasyMode}>
              {easyMode ? "Easy Mode On" : "Make Text Bigger"}
            </button>
          </div>

          <h1>Tell us your idea. We will help you sort it out.</h1>

          <p className="subhead">
            Start with the big button. You do not need to know which tool to use.
          </p>

          <div className="startHelp">
            <strong>Not sure?</strong> Press <span>Start Here</span>. That is the safest place to begin.
          </div>
        </header>

        <section className="choiceGrid" aria-label="Main choices">
          {mainChoices.map((choice) => (
            <Link
              key={choice.title}
              href={choice.href}
              className={choice.best ? "choice choiceBest" : "choice"}
            >
              <div className="number">{choice.label}</div>
              <div>
                <h2>{choice.title}</h2>
                <p>{choice.plain}</p>
                <strong>{choice.button}</strong>
              </div>
            </Link>
          ))}
        </section>
        <section className="councilWorkbench" aria-label="Council workflow">
          <div className="councilIntro">
            <p className="eyebrow">What happens next</p>
            <h2>We walk the idea forward one step at a time.</h2>
            <p>
              Hovel Ideanator works like a plain notebook and a helpful workbench: tell us the rough thing,
              we make it clearer, look for weak spots, and show you what to do next.
            </p>
          </div>

          <div className="councilSteps">
            {councilSteps.map((step, index) => (
              <article key={step.name} className="councilStep">
                <span>{index + 1}</span>
                <strong>{step.name}</strong>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>


        <section className="simpleGuide">
          <h2>Plain English guide</h2>

          <div className="guideList">
            <p><strong>Idea in your head?</strong> Press Start Here.</p>
            <p><strong>Words already written?</strong> Press I wrote something.</p>
            <p><strong>Sounds weird or fake?</strong> Press Clean up my words.</p>
            <p><strong>Looking for old stuff?</strong> Press Open my saved work.</p>
          </div>
        </section>

        <section className="toolStrip" aria-label="Extra tools">
          {smallTools.map((tool) => (
            <Link key={tool.title} href={tool.href} className="smallTool">
              <h3>{tool.title}</h3>
              <p>{tool.body}</p>
            </Link>
          ))}
        </section>

        <footer className="bottomHelp">
          <Link href="/idea/help">Help</Link>
          <Link href="/settings">Settings</Link>
          <Link href="/beta-terms">Beta Terms</Link>
        </footer>
      </section>

      <style>{`
        .page {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(59, 130, 246, 0.28), transparent 34rem),
            radial-gradient(circle at bottom right, rgba(148, 163, 184, 0.22), transparent 30rem),
            linear-gradient(135deg, #060b16 0%, #0b1020 52%, #111827 100%);
          color: #eef4ff;
          padding: 18px 20px 96px;
          font-family: Arial, Helvetica, sans-serif;
        }

        .wrap {
          width: min(1180px, 100%);
          margin: 0 auto;
        }

        .hero,
        .choice,
        .councilWorkbench,
        .councilStep,
        .simpleGuide,
        .smallTool {
          border: 1px solid rgba(147, 197, 253, 0.28);
          background: rgba(15, 23, 42, 0.92);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.34);
        }

        .hero {
          border-radius: 34px;
          padding: clamp(22px, 3.4vw, 38px);
          margin-bottom: 16px;
        }

        .topline {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        .eyebrow {
          margin: 0;
          color: #93c5fd;
          font-family: monospace;
          font-size: 0.88rem;
          font-weight: 900;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .hero h1 {
          margin: 16px 0 0;
          max-width: 900px;
          font-size: clamp(2.75rem, 6vw, 5.15rem);
          line-height: 0.94;
          letter-spacing: -0.06em;
        }

        .subhead {
          max-width: 760px;
          color: #dbeafe;
          font-size: clamp(1.12rem, 1.9vw, 1.35rem);
          line-height: 1.55;
          margin: 14px 0 0;
        }

        .easyButton,
        .choice strong,
        .bottomHelp a {
          min-height: 58px;
          border-radius: 999px;
          border: 1px solid rgba(219, 234, 254, 0.75);
          background: linear-gradient(180deg, #dbeafe 0%, #93c5fd 55%, #60a5fa 100%);
          color: #07111f;
          padding: 0 24px;
          font-family: monospace;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
        }

        .startHelp {
          margin-top: 14px;
          border-left: 6px solid #93c5fd;
          background: rgba(255, 255, 255, 0.07);
          border-radius: 18px;
          padding: 14px 16px;
          color: #dbeafe;
          font-size: 1.2rem;
          line-height: 1.55;
        }

        .startHelp strong,
        .startHelp span {
          color: #ffffff;
          font-weight: 900;
        }

        .choiceGrid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .choice {
          display: grid;
          grid-template-columns: 58px minmax(0, 1fr);
          gap: 16px;
          border-radius: 24px;
          padding: 18px;
          color: inherit;
          text-decoration: none;
          min-height: 188px;
        }

        .choiceBest {
          grid-column: 1 / -1;
          min-height: 160px;
          background:
            radial-gradient(circle at top left, rgba(147, 197, 253, 0.2), transparent 18rem),
            rgba(30, 41, 59, 0.98);
          border-color: rgba(147, 197, 253, 0.62);
        }

        .choice:hover {
          transform: translateY(-2px);
          border-color: rgba(147, 197, 253, 0.75);
        }

        .number {
          width: 52px;
          height: 52px;
          border-radius: 18px;
          display: grid;
          place-items: center;
          background: #dbeafe;
          color: #07111f;
          font-size: 1.55rem;
          font-weight: 900;
          font-family: monospace;
        }

        .choice h2 {
          margin: 0;
          color: #ffffff;
          font-size: clamp(1.6rem, 3vw, 2.35rem);
          line-height: 1;
        }

        .choice p {
          margin: 10px 0 14px;
          color: #cbd5e1;
          font-size: 1.04rem;
          line-height: 1.5;
        }

        .choice strong {
          width: fit-content;
        }
        .councilWorkbench {
          border-radius: 30px;
          padding: clamp(24px, 4vw, 38px);
          margin-bottom: 16px;
          background:
            linear-gradient(180deg, rgba(248, 237, 210, 0.10), rgba(15, 23, 42, 0.94)),
            repeating-linear-gradient(
              0deg,
              transparent,
              transparent 34px,
              rgba(248, 237, 210, 0.045) 35px
            );
        }

        .councilIntro {
          max-width: 900px;
          margin-bottom: 22px;
        }

        .councilIntro h2 {
          margin: 0;
          color: #ffffff;
          font-size: clamp(2.4rem, 5vw, 4.4rem);
          line-height: 0.95;
          letter-spacing: -0.045em;
        }

        .councilIntro p:last-child {
          color: #d8c7ad;
          font-size: clamp(1.1rem, 2vw, 1.35rem);
          line-height: 1.58;
          margin: 16px 0 0;
        }

        .councilSteps {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .councilStep {
          position: relative;
          border-radius: 22px;
          padding: 18px;
          min-height: 210px;
          background:
            linear-gradient(180deg, rgba(255, 248, 226, 0.08), rgba(15, 23, 42, 0.88));
        }

        .councilStep span {
          width: 42px;
          height: 42px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          background: #f8e7bd;
          color: #111827;
          font-family: monospace;
          font-weight: 900;
          margin-bottom: 14px;
        }

        .councilStep strong {
          display: block;
          color: #93c5fd;
          font-family: monospace;
          font-size: 0.78rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .councilStep h3 {
          margin: 0;
          color: #ffffff;
          font-size: 1.45rem;
          line-height: 1.08;
        }

        .councilStep p {
          margin: 12px 0 0;
          color: #d8c7ad;
          font-size: 1.02rem;
          line-height: 1.55;
        }


        .simpleGuide {
          border-radius: 28px;
          padding: 26px;
          margin-bottom: 16px;
        }

        .simpleGuide h2 {
          margin: 0 0 16px;
          color: #ffffff;
          font-size: clamp(2rem, 4vw, 3rem);
          line-height: 1;
        }

        .guideList {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .guideList p {
          margin: 0;
          border: 1px solid rgba(148, 163, 184, 0.22);
          background: rgba(255, 255, 255, 0.045);
          border-radius: 18px;
          padding: 16px;
          color: #cbd5e1;
          font-size: 1.08rem;
          line-height: 1.55;
        }

        .guideList strong {
          color: #ffffff;
        }

        .toolStrip {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
        }

        .smallTool {
          border-radius: 22px;
          padding: 18px;
          color: inherit;
          text-decoration: none;
          box-shadow: none;
        }

        .smallTool h3 {
          margin: 0;
          color: #ffffff;
          font-size: 1.35rem;
        }

        .smallTool p {
          color: #cbd5e1;
          line-height: 1.5;
          margin-bottom: 0;
        }

        .bottomHelp {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 18px;
          justify-content: center;
        }

        .bottomHelp a {
          background: rgba(30, 41, 59, 0.92);
          color: #eef4ff;
          border-color: rgba(148, 163, 184, 0.34);
        }

        .easy .choice p,
        .easy .guideList p,
        .easy .councilIntro p:last-child,
        .easy .councilStep p,
        .easy .smallTool p,
        .easy .startHelp,
        .easy .subhead {
          font-size: 1.35rem;
        }

        .easy .choice strong,
        .easy .easyButton,
        .easy .bottomHelp a {
          min-height: 72px;
          font-size: 1.05rem;
          padding-left: 30px;
          padding-right: 30px;
        }

        @media (max-width: 900px) {
          .choiceGrid,
          .guideList,
          .councilSteps,
          .toolStrip {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 640px) {
          .page {
            padding: 18px 12px 110px;
          }

          .hero,
          .choice,
          .councilWorkbench,
          .simpleGuide {
            border-radius: 22px;
          }

          .choice {
            grid-template-columns: 1fr;
            min-height: auto;
          }

          .choice strong,
          .easyButton,
          .bottomHelp a {
            width: 100%;
          }
        }
      
        /* =========================================================
           TARGETED 80S WORKSHOP OVERRIDES
           Old library basement, microfiche machine, Spielberg garage.
           Uses real workshop class names only.
           ========================================================= */

        .page {
          background:
            radial-gradient(circle at 12% 0%, rgba(181, 90, 28, 0.26), transparent 32rem),
            radial-gradient(circle at 88% 8%, rgba(91, 117, 55, 0.18), transparent 28rem),
            linear-gradient(135deg, #28180d 0%, #11100c 48%, #2b1a0f 100%) !important;
          color: #f8ecd2 !important;
        }

        .page::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          background:
            repeating-linear-gradient(
              90deg,
              rgba(255, 230, 174, 0.025) 0,
              rgba(255, 230, 174, 0.025) 1px,
              transparent 1px,
              transparent 5px
            ),
            radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.34) 76%);
          opacity: 0.9;
        }

        .wrap {
          position: relative;
          z-index: 1;
        }

        .hero {
          background:
            linear-gradient(90deg, rgba(128, 55, 22, 0.18) 0 54px, transparent 54px),
            radial-gradient(circle at 82% 16%, rgba(216, 138, 31, 0.16), transparent 18rem),
            linear-gradient(180deg, #332115 0%, #18130e 100%) !important;
          border: 1px solid rgba(222, 176, 96, 0.42) !important;
          border-radius: 14px !important;
          box-shadow:
            0 28px 90px rgba(0, 0, 0, 0.46),
            inset 0 1px 0 rgba(255, 238, 190, 0.08) !important;
        }

        .hero h1 {
          color: #fff1cf !important;
          font-family: Georgia, "Times New Roman", serif !important;
          letter-spacing: -0.055em !important;
          text-shadow: 0 3px 18px rgba(0, 0, 0, 0.36) !important;
        }

        .eyebrow {
          color: #d99a2b !important;
          font-family: "Courier New", ui-monospace, monospace !important;
          letter-spacing: 0.22em !important;
          text-shadow: none !important;
        }

        .subhead {
          color: #f5dfb4 !important;
          text-shadow: none !important;
        }

        .startHelp {
          background: #263b24 !important;
          color: #fff3d3 !important;
          border-left: 8px solid #d99a2b !important;
          border-radius: 10px !important;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.08),
            0 14px 34px rgba(0, 0, 0, 0.3) !important;
        }

        .startHelp strong,
        .startHelp span {
          color: #fff3d3 !important;
        }

        .choice,
        .councilWorkbench,
        .simpleGuide,
        .smallTool {
          background:
            linear-gradient(180deg, #f8e7c1 0%, #d7ad68 100%) !important;
          color: #211408 !important;
          border: 1px solid rgba(83, 52, 26, 0.58) !important;
          border-radius: 10px !important;
          box-shadow:
            0 22px 70px rgba(0, 0, 0, 0.36),
            inset 0 1px 0 rgba(255, 255, 255, 0.45) !important;
        }

        .choiceBest {
          background:
            linear-gradient(90deg, rgba(128, 55, 22, 0.12) 0 50px, transparent 50px),
            linear-gradient(180deg, #fff0c9 0%, #e4bd7b 100%) !important;
          border-color: rgba(216, 138, 31, 0.72) !important;
        }

        .choice h2,
        .councilIntro h2,
        .simpleGuide h2,
        .smallTool h3 {
          color: #1d1208 !important;
          font-family: Georgia, "Times New Roman", serif !important;
          text-shadow: none !important;
        }

        .choice p,
        .councilIntro p:last-child,
        .councilStep p,
        .guideList p,
        .smallTool p {
          color: #2b1a0c !important;
          text-shadow: none !important;
        }

        .number {
          background:
            linear-gradient(180deg, #f7e6bc, #bf8431) !important;
          color: #211408 !important;
          border: 1px solid rgba(83, 52, 26, 0.5) !important;
          border-radius: 8px !important;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.45),
            0 8px 18px rgba(0, 0, 0, 0.22) !important;
        }

        .choice strong,
        .easyButton,
        .bottomHelp a {
          background:
            linear-gradient(180deg, #d88a1f, #8c4e11) !important;
          color: #fff8e7 !important;
          border: 1px solid rgba(255, 220, 145, 0.68) !important;
          border-radius: 8px !important;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.18),
            0 12px 28px rgba(0, 0, 0, 0.28) !important;
        }

        .councilStep {
          background:
            linear-gradient(180deg, #2f3f2a 0%, #1d2a1a 100%) !important;
          color: #fff3d3 !important;
          border: 1px solid rgba(210, 168, 103, 0.45) !important;
          border-radius: 10px !important;
        }

        .councilStep span,
        .councilStep strong,
        .councilStep h3,
        .councilStep p {
          color: #fff3d3 !important;
        }

        .guideList strong {
          color: #8c4e11 !important;
        }

        .bottomHelp {
          color: #f8ecd2 !important;
        }

`}</style>
    </main>
  );
}
