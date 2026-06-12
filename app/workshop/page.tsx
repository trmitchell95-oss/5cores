"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const mainChoices = [
  {
    label: "1",
    title: "I have an idea",
    plain: "Start here when the idea is still messy, half-built, or hard to explain.",
    href: "/idea?start=intake",
    button: "Start Here",
    best: true,
  },
  {
    label: "2",
    title: "I already wrote something",
    plain: "Send writing through the Hovel Editor report engine.",
    href: "/submit",
    button: "Check My Writing",
    best: false,
  },
  {
    label: "3",
    title: "Make my words sound human",
    plain: "Clean stiff, fake, corporate, or AI-sounding text without sanding off the human voice.",
    href: "/sphinx",
    button: "Clean My Words",
    best: false,
  },
  {
    label: "4",
    title: "Find my saved work",
    plain: "Reopen ideas, projects, reports, drafts, rigs, and unfinished work.",
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
    name: "You",
    title: "Dump the mess",
    body: "Say the idea badly. Paste the rough draft. Drop the fog. No polish required.",
  },
  {
    name: "Brad",
    title: "Clarify it",
    body: "Brad turns the mess into plain English and finds the actual thing we are building.",
  },
  {
    name: "Greg",
    title: "Challenge it",
    body: "Greg kicks the tires, finds weak spots, calls out confusion, and protects you from fooling yourself.",
  },
  {
    name: "Juniper",
    title: "Humanize it",
    body: "Juniper looks for the emotional core, audience, story, use case, and soul of the work.",
  },
  {
    name: "Von Claussen",
    title: "Structure it",
    body: "Von Claussen turns the idea into architecture: steps, systems, prompts, plans, and next moves.",
  },
  {
    name: "Hovel Editor",
    title: "Finish it",
    body: "The final editor pass turns the work into a serious report, draft, proposal, launch plan, or manuscript path.",
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

          <h1>What are we building today?</h1>

          <p className="subhead">
            One button at a time. The council helps turn the mess into a plan, then Hovel Editor takes the final pass.
          </p>

          <div className="startHelp">
            <strong>Not sure?</strong> Press <span>I have an idea</span>. The council will walk it forward one plain step at a time.
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
            <p className="eyebrow">Council Workbench</p>
            <h2>Six steps. No tool-name guessing.</h2>
            <p>
              Hovel Ideanator is built like an old workbench notebook: drop the rough thing,
              let the council mark it up, then send the strongest version into the final editor.
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
            <p><strong>Idea in your head?</strong> Press I have an idea.</p>
            <p><strong>Words already written?</strong> Press I already wrote something.</p>
            <p><strong>Sounds weird or fake?</strong> Press Make my words sound human.</p>
            <p><strong>Looking for old stuff?</strong> Press Find my saved work.</p>
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
          padding: 28px 20px 110px;
          font-family: Arial, Helvetica, sans-serif;
        }

        .wrap {
          width: min(1120px, 100%);
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
          padding: clamp(28px, 5vw, 54px);
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
          margin: 24px 0 0;
          max-width: 900px;
          font-size: clamp(3.2rem, 8vw, 6.8rem);
          line-height: 0.92;
          letter-spacing: -0.06em;
        }

        .subhead {
          max-width: 760px;
          color: #dbeafe;
          font-size: clamp(1.25rem, 2.4vw, 1.6rem);
          line-height: 1.55;
          margin: 22px 0 0;
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
          margin-top: 22px;
          border-left: 6px solid #93c5fd;
          background: rgba(255, 255, 255, 0.07);
          border-radius: 18px;
          padding: 18px;
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
          grid-template-columns: 72px minmax(0, 1fr);
          gap: 20px;
          border-radius: 28px;
          padding: 24px;
          color: inherit;
          text-decoration: none;
          min-height: 245px;
        }

        .choiceBest {
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
          width: 64px;
          height: 64px;
          border-radius: 22px;
          display: grid;
          place-items: center;
          background: #dbeafe;
          color: #07111f;
          font-size: 2rem;
          font-weight: 900;
          font-family: monospace;
        }

        .choice h2 {
          margin: 0;
          color: #ffffff;
          font-size: clamp(2rem, 4vw, 3.1rem);
          line-height: 1;
        }

        .choice p {
          margin: 14px 0 20px;
          color: #cbd5e1;
          font-size: 1.18rem;
          line-height: 1.55;
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
      `}</style>
    </main>
  );
}
