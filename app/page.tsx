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
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;700&family=IBM+Plex+Mono:wght@400;500;700&display=swap');

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
          padding: 36px 24px 100px;
        }

        /* â”€â”€ Hero â”€â”€ */
        .hero-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.38fr) minmax(300px, 0.62fr);
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
          padding: 40px;
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
          margin-bottom: 16px;
        }

        .heading {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(48px, 7vw, 88px);
          line-height: 0.92;
          font-weight: 700;
          margin: 0;
          color: #f0ece4;
          max-width: 790px;
        }

        .subheading {
          font-size: 18px;
          font-weight: 400;
          color: #bdb4aa;
          margin-top: 22px;
          max-width: 680px;
          line-height: 1.72;
        }

        /* Plain-language hook for non-technical users */
        .plain-hook {
          margin-top: 18px;
          padding: 16px 20px;
          border: 1px solid #302a24;
          background: #11100e;
          border-radius: 16px;
          font-size: 16px;
          color: #c8a96e;
          line-height: 1.6;
          max-width: 580px;
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
        }

        .start-here-card {
          margin-top: 24px;
          border: 1px solid rgba(200, 169, 110, 0.28);
          background:
            linear-gradient(135deg, rgba(200, 169, 110, 0.12), rgba(17, 16, 14, 0.82)),
            #11100e;
          border-radius: 20px;
          padding: 20px;
          max-width: 760px;
        }

        .start-here-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.18em;
          color: #c8a96e;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        .start-here-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 32px;
          line-height: 1;
          color: #f0ece4;
          margin: 0 0 12px;
          font-weight: 700;
        }

        .start-here-steps {
          display: grid;
          gap: 10px;
          margin-top: 14px;
        }

        .start-here-step {
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr);
          gap: 12px;
          align-items: start;
          color: #bdb4aa;
          line-height: 1.55;
          font-size: 15px;
        }

        .start-here-number {
          width: 30px;
          height: 30px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #c8a96e;
          color: #0e0d0b;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          font-weight: 900;
        }

        .primary-btn,
        .secondary-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 52px;
          border-radius: 15px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          text-decoration: none;
          padding: 14px 22px;
          transition: all 0.15s;
        }

        .primary-btn {
          background: #c8a96e;
          color: #0e0d0b;
          border: 1px solid #c8a96e;
          box-shadow: 0 8px 24px rgba(200, 169, 110, 0.22);
        }

        .primary-btn:hover {
          background: #e2bf7e;
          border-color: #e2bf7e;
          transform: translateY(-1px);
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

        /* â”€â”€ Side card â”€â”€ */
        .side-card {
          padding: 28px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
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
          font-size: 36px;
          font-weight: 700;
          line-height: 1.05;
          color: #f0ece4;
          margin-bottom: 14px;
        }

        .side-text {
          color: #9c9288;
          font-size: 15px;
          font-weight: 400;
          line-height: 1.68;
        }

        .verdict-box {
          margin-top: 24px;
          border-top: 1px solid #26211c;
          padding-top: 18px;
        }

        .verdict-line {
          color: #f0ece4;
          font-family: 'Cormorant Garamond', serif;
          font-size: 24px;
          line-height: 1.2;
          font-weight: 700;
        }

        /* â”€â”€ Tool cards â”€â”€ */
        .section-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 22px;
        }

        .tool-card,
        .how-card,
        .proof-card {
          padding: 24px;
        }

        .tool-number {
          width: 36px;
          height: 36px;
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
          margin-bottom: 18px;
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
          font-size: 15px;
          font-weight: 400;
          line-height: 1.66;
        }

        .tool-link {
          margin-top: 20px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 46px;
          border: 1px solid #302a24;
          background: #11100e;
          color: #d8d0c5;
          border-radius: 13px;
          padding: 12px 16px;
          text-decoration: none;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          transition: all 0.15s;
        }

        .tool-link:hover {
          border-color: #c8a96e;
          color: #c8a96e;
        }

        /* â”€â”€ Wide / privacy grid â”€â”€ */
        .wide-grid {
          display: grid;
          grid-template-columns: minmax(0, 1.1fr) minmax(300px, 0.9fr);
          gap: 16px;
          margin-bottom: 22px;
        }

        .privacy-card {
          padding: 28px;
        }

        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 36px;
          line-height: 1;
          font-weight: 700;
          margin: 0 0 14px;
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
          font-size: 15px;
          line-height: 1.6;
        }

        .mini-dot {
          width: 7px;
          height: 7px;
          background: #c8a96e;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 8px;
        }

        /* â”€â”€ CTA banner â”€â”€ */
        .cta-card {
          border: 1px solid #3a3020;
          background:
            linear-gradient(135deg, rgba(200, 169, 110, 0.16), rgba(18, 16, 13, 0.9)),
            #12100d;
          border-radius: 30px;
          padding: 36px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.22);
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
        }

        .cta-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 40px;
          line-height: 1.05;
          font-weight: 700;
          color: #f0ece4;
          margin: 0;
        }

        .cta-text {
          margin-top: 10px;
          color: #aaa096;
          font-size: 16px;
          line-height: 1.65;
          max-width: 600px;
        }

        /* â”€â”€ Responsive â”€â”€ */
        @media (max-width: 950px) {
          .hero-grid,
          .section-grid,
          .wide-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 650px) {
          .page-wrap {
            padding: 20px 16px 80px;
          }

          .hero-card {
            padding: 24px;
            border-radius: 22px;
          }

          .side-card,
          .tool-card,
          .proof-card,
          .privacy-card,
          .how-card,
          .cta-card {
            border-radius: 20px;
          }

          .hero-actions {
            flex-direction: column;
            align-items: stretch;
          }

          .primary-btn,
          .secondary-btn {
            width: 100%;
            text-align: center;
          }

          .cta-card {
            flex-direction: column;
            padding: 24px;
          }

          .cta-title {
            font-size: 32px;
          }
        }
      `}</style>

      <div className="page-wrap">
        <section className="hero-grid">
          <div className="hero-card">
            <div className="eyebrow">Editorial Council / Beta</div>
            <h1 className="heading">Your manuscript deserves a real diagnosis.</h1>
            <p className="subheading">
              Upload or paste your writing. The Council reads it through five distinct editorial lenses and tells you what is working, what is dragging, and what to fix first.
            </p>

            <div className="plain-hook">
              Not a rewrite button. Not a grammar checker. An honest editorial read "” for writers who are serious about their work.
            </div>

            <nav className="hero-actions" aria-label="Primary actions">
              <Link
                href={isLoggedIn ? "/submit" : "/login"}
                className="primary-btn"
              >
                {isLoggedIn ? "Start Diagnosis" : "Get Magic Link"}
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
            </nav>

            <section className="start-here-card" aria-label="Start here">
              <div className="start-here-label">New here? Sit here first.</div>
              <h2 className="start-here-title">Run one honest diagnosis.</h2>

              <div className="card-text">
                Do not explore the whole truck yet. Start with one piece of writing and see if the Council gives you something useful.
              </div>

              <div className="start-here-steps">
                <div className="start-here-step">
                  <span className="start-here-number">1</span>
                  <span>{isLoggedIn ? "Click Start Diagnosis." : "Click Get Magic Link and sign in with your email."}</span>
                </div>

                <div className="start-here-step">
                  <span className="start-here-number">2</span>
                  <span>Paste one chapter, scene, essay, post, or serious excerpt. You do not need a perfect draft.</span>
                </div>

                <div className="start-here-step">
                  <span className="start-here-number">3</span>
                  <span>Run the Council, read the top fixes, and save the report if it helps.</span>
                </div>
              </div>
            </section>
          </div>

          <aside className="side-card">
            <div>
              <div className="side-label">What it is</div>
              <div className="side-title">A diagnostic engine, not a fake editor.</div>
              <p className="side-text">
                Most AI writing tools try to polish your sentences until everything sounds the same. The Council tells you where your manuscript is actually working "” and where it is lying to itself.
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

        <section className="section-grid" aria-label="Available tools">
          <article className="tool-card">
            <div className="tool-number">01</div>
            <div className="card-title">The Council Diagnosis</div>
            <p className="card-text">
              For manuscripts, chapters, scenes, essays, and serious excerpts. Five editorial lenses. One honest synthesis.
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
              For blurbs, bios, grant answers, posts, and anything that sounds too polished, too stiff, or too AI-generated.
            </p>
            <Link href="/sphinx" className="tool-link">
              Run Sphinx
            </Link>
          </article>

          <article className="tool-card">
            <div className="tool-number">03</div>
            <div className="card-title">Report Library</div>
            <p className="card-text">
              Save reports, reopen old diagnoses, compare revision progress, and stop losing feedback in your downloads folder.
            </p>
            <Link
              href={isLoggedIn ? "/dashboard" : "/login"}
              className="tool-link"
            >
              Open Reports
            </Link>
          </article>
        </section>

        <section className="wide-grid" aria-label="How it works">
          <div className="privacy-card">
            <div className="eyebrow">How it works</div>
            <h2 className="section-title">Five lenses. One usable verdict.</h2>
            <p className="card-text">
              Each report has a job. Brad protects the voice. Greg finds the drag. Von Clausen checks the architecture. Juniper reads like an outside reader. The Final Editor turns the council into a clear revision plan.
            </p>

            <div className="mini-list">
              <div className="mini-item">
                <span className="mini-dot" />
                <span>Answer a short intake so the council knows what kind of writing it is judging.</span>
              </div>

              <div className="mini-item">
                <span className="mini-dot" />
                <span>Paste or upload your manuscript and run the diagnosis.</span>
              </div>

              <div className="mini-item">
                <span className="mini-dot" />
                <span>Open the saved report and revise from clear priorities instead of panic.</span>
              </div>
            </div>
          </div>

          <div className="privacy-card">
            <div className="eyebrow">Privacy note</div>
            <h2 className="section-title">Your dashboard is tied to your login.</h2>
            <p className="card-text">
              Saved reports are connected only to the signed-in user account. The product is being built with account separation and practical guardrails before becoming a public paid tool.
            </p>

            <div className="mini-list">
              <div className="mini-item">
                <span className="mini-dot" />
                <span>No public report wall.</span>
              </div>

              <div className="mini-item">
                <span className="mini-dot" />
                <span>No pretending every manuscript needs the same feedback.</span>
              </div>

              <div className="mini-item">
                <span className="mini-dot" />
                <span>No unlimited free AI wood-chipper mode.</span>
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
            {isLoggedIn ? "Start Diagnosis" : "Get Magic Link"}
          </Link>
        </section>
      </div>
    </main>
  );
}



