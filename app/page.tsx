"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingLogin, setCheckingLogin] = useState(true);

  useEffect(() => {
    async function checkLogin() {
      try {
        const supabase = getSupabaseClient();

        if (!supabase) {
          setIsLoggedIn(false);
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        setIsLoggedIn(Boolean(session?.access_token));
      } catch {
        setIsLoggedIn(false);
      } finally {
        setCheckingLogin(false);
      }
    }

    checkLogin();
  }, []);

  return (
    <main className="home-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;700&family=IBM+Plex+Mono:wght@400;500;700&display=swap');

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #0e0d0b;
        }

        .home-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(200, 169, 110, 0.16), transparent 34rem),
            radial-gradient(circle at bottom right, rgba(90, 124, 200, 0.1), transparent 30rem),
            #0e0d0b;
          color: #f0ece4;
          font-family: 'DM Sans', sans-serif;
        }

        .page-wrap {
          max-width: 1180px;
          margin: 0 auto;
          padding: 34px 24px 90px;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 18px;
          border: 1px solid #26211c;
          background: rgba(18, 16, 13, 0.82);
          padding: 16px 18px;
          margin-bottom: 34px;
          border-radius: 22px;
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28);
        }

        .brand-lockup {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .brand-mark {
          width: 42px;
          height: 42px;
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #c8a96e;
          color: #0e0d0b;
          font-family: 'IBM Plex Mono', monospace;
          font-weight: 700;
          font-size: 13px;
          letter-spacing: -0.08em;
          flex-shrink: 0;
        }

        .brand-main {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: #f0ece4;
          text-transform: uppercase;
        }

        .brand-sub {
          margin-top: 3px;
          font-size: 12px;
          color: #7b7168;
        }

        .top-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 10px;
        }

        .nav-link,
        .nav-link-gold {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          border-radius: 14px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          padding: 12px 14px;
        }

        .nav-link {
          color: #9a9186;
          border: 1px solid #302a24;
          background: #11100e;
        }

        .nav-link:hover {
          color: #c8a96e;
          border-color: #c8a96e;
        }

        .nav-link-gold {
          color: #0e0d0b;
          border: 1px solid #c8a96e;
          background: #c8a96e;
        }

        .nav-link-gold:hover {
          background: #e2bf7e;
          border-color: #e2bf7e;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.38fr) minmax(310px, 0.62fr);
          gap: 22px;
          align-items: stretch;
          margin-bottom: 22px;
        }

        .hero-card,
        .side-card,
        .tool-card,
        .proof-card,
        .privacy-card,
        .how-card {
          border: 1px solid #26211c;
          background: rgba(18, 16, 13, 0.86);
          border-radius: 28px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.22);
        }

        .hero-card {
          padding: 38px;
          overflow: hidden;
          position: relative;
        }

        .hero-card::after {
          content: "";
          position: absolute;
          right: -90px;
          top: -90px;
          width: 260px;
          height: 260px;
          border-radius: 999px;
          background: rgba(200, 169, 110, 0.08);
          pointer-events: none;
        }

        .eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.22em;
          color: #c8a96e;
          text-transform: uppercase;
          margin-bottom: 14px;
        }

        .heading {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(50px, 8vw, 92px);
          line-height: 0.92;
          font-weight: 700;
          margin: 0;
          color: #f0ece4;
          max-width: 790px;
        }

        .subheading {
          font-size: 17px;
          font-weight: 300;
          color: #aaa096;
          margin-top: 20px;
          max-width: 710px;
          line-height: 1.7;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 30px;
        }

        .primary-btn,
        .secondary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 50px;
          border-radius: 15px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          padding: 14px 18px;
        }

        .primary-btn {
          background: #c8a96e;
          color: #0e0d0b;
          border: 1px solid #c8a96e;
        }

        .primary-btn:hover {
          background: #e2bf7e;
          border-color: #e2bf7e;
        }

        .secondary-btn {
          background: #11100e;
          color: #d8d0c5;
          border: 1px solid #302a24;
        }

        .secondary-btn:hover {
          border-color: #c8a96e;
          color: #c8a96e;
        }

        .side-card {
          padding: 26px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 100%;
        }

        .side-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.18em;
          color: #6f665f;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .side-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 38px;
          font-weight: 700;
          line-height: 1;
          color: #f0ece4;
          margin-bottom: 12px;
        }

        .side-text {
          color: #9c9288;
          font-size: 14px;
          font-weight: 300;
          line-height: 1.65;
        }

        .verdict-box {
          margin-top: 22px;
          border-top: 1px solid #26211c;
          padding-top: 18px;
        }

        .verdict-line {
          color: #f0ece4;
          font-family: 'Cormorant Garamond', serif;
          font-size: 25px;
          line-height: 1.15;
          font-weight: 700;
        }

        .section-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .tool-card,
        .how-card,
        .proof-card {
          padding: 22px;
        }

        .tool-number {
          width: 34px;
          height: 34px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #18140f;
          border: 1px solid #332a1c;
          color: #c8a96e;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 16px;
        }

        .card-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 30px;
          color: #f0ece4;
          line-height: 1;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .card-text {
          color: #9c9288;
          font-size: 14px;
          font-weight: 300;
          line-height: 1.65;
        }

        .tool-link {
          margin-top: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #302a24;
          background: #11100e;
          color: #d8d0c5;
          border-radius: 13px;
          padding: 12px 14px;
          text-decoration: none;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }

        .tool-link:hover {
          border-color: #c8a96e;
          color: #c8a96e;
        }

        .wide-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(300px, 0.9fr);
          gap: 16px;
          margin-bottom: 22px;
        }

        .privacy-card {
          padding: 26px;
        }

        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 38px;
          line-height: 1;
          font-weight: 700;
          margin: 0 0 12px;
          color: #f0ece4;
        }

        .mini-list {
          display: grid;
          gap: 10px;
          margin-top: 18px;
        }

        .mini-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          color: #aaa096;
          font-size: 14px;
          line-height: 1.55;
        }

        .mini-dot {
          width: 7px;
          height: 7px;
          background: #c8a96e;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 7px;
        }

        .cta-card {
          border: 1px solid #3a3020;
          background:
            linear-gradient(135deg, rgba(200, 169, 110, 0.16), rgba(18, 16, 13, 0.9)),
            #12100d;
          border-radius: 30px;
          padding: 34px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.22);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .cta-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 42px;
          line-height: 1;
          font-weight: 700;
          color: #f0ece4;
          margin: 0;
        }

        .cta-text {
          margin-top: 10px;
          color: #aaa096;
          font-size: 15px;
          line-height: 1.6;
          max-width: 640px;
        }

        @media (max-width: 950px) {
          .hero-grid,
          .section-grid,
          .wide-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .page-wrap {
            padding: 18px 14px 70px;
          }

          .topbar {
            align-items: flex-start;
            flex-direction: column;
            border-radius: 18px;
          }

          .top-actions {
            width: 100%;
            justify-content: flex-start;
          }

          .hero-card,
          .side-card,
          .tool-card,
          .proof-card,
          .privacy-card,
          .how-card,
          .cta-card {
            border-radius: 22px;
          }

          .hero-card,
          .cta-card {
            padding: 24px;
          }

          .hero-actions,
          .cta-card {
            flex-direction: column;
            align-items: stretch;
          }

          .primary-btn,
          .secondary-btn,
          .nav-link,
          .nav-link-gold {
            width: 100%;
          }
        }
      `}</style>

      <div className="page-wrap">
        <header className="topbar">
          <div className="brand-lockup">
            <div className="brand-mark">5C</div>
            <div>
              <div className="brand-main">5 CORE</div>
              <div className="brand-sub">Manuscript diagnosis engine</div>
            </div>
          </div>

          <nav className="top-actions">
            <Link href="/sphinx" className="nav-link-gold">
              Sphinx
            </Link>

            <Link href="/beta-terms" className="nav-link">
              Beta Terms
            </Link>

            {!checkingLogin && isLoggedIn ? (
              <Link href="/dashboard" className="nav-link">
                Dashboard
              </Link>
            ) : (
              <Link href="/login" className="nav-link">
                Sign In
              </Link>
            )}
          </nav>
        </header>

        <section className="hero-grid">
          <div className="hero-card">
            <div className="eyebrow">Editorial Council / Beta</div>
            <h1 className="heading">Your manuscript deserves a real diagnosis.</h1>
            <p className="subheading">
              5 CORE reads your work through five distinct editorial lenses and tells you what is alive, what is dragging, what is structurally cracked, and what to fix first. It is not a rewrite button. It is a manuscript pressure test.
            </p>

            <div className="hero-actions">
              <Link
                href={isLoggedIn ? "/submit" : "/login"}
                className="primary-btn"
              >
                {isLoggedIn ? "Start Diagnosis" : "Request Beta Access"}
              </Link>

              <Link href="/sphinx" className="secondary-btn">
                Run Sphinx Cleanup
              </Link>

              <Link
                href={isLoggedIn ? "/dashboard" : "/login"}
                className="secondary-btn"
              >
                {isLoggedIn ? "Open Dashboard" : "Sign In"}
              </Link>
            </div>
          </div>

          <aside className="side-card">
            <div>
              <div className="side-label">What it is</div>
              <div className="side-title">A diagnostic engine, not a fake editor.</div>
              <p className="side-text">
                Most AI writing tools try to polish your sentences until everything sounds like beige hotel soap. 5 CORE is built to tell you where the manuscript is actually working and where it is lying to itself.
              </p>
            </div>

            <div className="verdict-box">
              <div className="side-label">Core Promise</div>
              <div className="verdict-line">
                Honest feedback. Clear priorities. No decorative bullshit.
              </div>
            </div>
          </aside>
        </section>

        <section className="section-grid">
          <article className="tool-card">
            <div className="tool-number">01</div>
            <div className="card-title">5 CORE Diagnosis</div>
            <p className="card-text">
              For scenes, chapters, essays, memoirs, children&apos;s books, and serious excerpts that need more than a grammar pass.
            </p>
            <Link
              href={isLoggedIn ? "/submit" : "/login"}
              className="tool-link"
            >
              Start Diagnosis
            </Link>
          </article>

          <article className="tool-card">
            <div className="tool-number">02</div>
            <div className="card-title">Sphinx</div>
            <p className="card-text">
              For blurbs, bios, application answers, posts, emails, and anything that smells too polished, too stiff, or too AI.
            </p>
            <Link href="/sphinx" className="tool-link">
              Run Sphinx
            </Link>
          </article>

          <article className="tool-card">
            <div className="tool-number">03</div>
            <div className="card-title">Report Library</div>
            <p className="card-text">
              Save your reports, reopen old diagnoses, compare revision progress, and stop losing feedback in the digital junk drawer.
            </p>
            <Link
              href={isLoggedIn ? "/dashboard" : "/login"}
              className="tool-link"
            >
              Open Reports
            </Link>
          </article>
        </section>

        <section className="wide-grid">
          <div className="privacy-card">
            <div className="eyebrow">How it works</div>
            <h2 className="section-title">Five lenses. One usable verdict.</h2>
            <p className="card-text">
              Each report has a job. Brad protects the voice. Greg finds the drag. Von Clausen checks the architecture. Juniper reads like an outside reader. The Final Editor turns the council into a revision plan.
            </p>

            <div className="mini-list">
              <div className="mini-item">
                <span className="mini-dot" />
                <span>Answer a short intake so the council knows what kind of writing it is judging.</span>
              </div>

              <div className="mini-item">
                <span className="mini-dot" />
                <span>Paste or upload text and run the diagnosis.</span>
              </div>

              <div className="mini-item">
                <span className="mini-dot" />
                <span>Open the saved report and revise from priorities instead of panic.</span>
              </div>
            </div>
          </div>

          <div className="privacy-card">
            <div className="eyebrow">Privacy note</div>
            <h2 className="section-title">Your dashboard is tied to your login.</h2>
            <p className="card-text">
              Saved reports are connected to the signed-in user account. The product is being built with account separation, report history, and practical guardrails before it becomes a public-facing paid tool.
            </p>

            <div className="mini-list">
              <div className="mini-item">
                <span className="mini-dot" />
                <span>No public report wall.</span>
              </div>

              <div className="mini-item">
                <span className="mini-dot" />
                <span>No pretending every manuscript needs the same kind of feedback.</span>
              </div>

              <div className="mini-item">
                <span className="mini-dot" />
                <span>No unlimited free AI wood chipper mode. We are not idiots.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="cta-card">
          <div>
            <h2 className="cta-title">Ready to pressure-test the work?</h2>
            <p className="cta-text">
              Start with one excerpt. See if the diagnosis gives you something useful. If it does, the truck is doing its job.
            </p>
          </div>

          <Link
            href={isLoggedIn ? "/submit" : "/login"}
            className="primary-btn"
          >
            {isLoggedIn ? "Start Diagnosis" : "Request Beta Access"}
          </Link>
        </section>
      </div>
    </main>
  );
}


