"use client";

import Link from "next/link";

export default function BetaTermsPage() {
  return (
    <main className="terms-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=DM+Sans:wght@300;400;500;700&family=IBM+Plex+Mono:wght@400;500;700&display=swap');

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          background: #0e0d0b;
        }

        .terms-shell {
          min-height: 100vh;
          background:
            radial-gradient(circle at top left, rgba(200, 169, 110, 0.16), transparent 34rem),
            radial-gradient(circle at bottom right, rgba(90, 124, 200, 0.1), transparent 30rem),
            #0e0d0b;
          color: #f0ece4;
          font-family: 'DM Sans', sans-serif;
        }

        .wrap {
          max-width: 980px;
          margin: 0 auto;
          padding: 34px 24px 90px;
        }

        .topbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
          border: 1px solid #26211c;
          background: rgba(18, 16, 13, 0.86);
          border-radius: 22px;
          padding: 16px 18px;
          margin-bottom: 24px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 12px;
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
          font-weight: 800;
          font-size: 13px;
        }

        .brand-main {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          font-weight: 800;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        .brand-sub {
          margin-top: 3px;
          font-size: 12px;
          color: #7b7168;
        }

        .nav {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .nav-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 42px;
          border-radius: 14px;
          border: 1px solid #302a24;
          background: #11100e;
          color: #9a9186;
          text-decoration: none;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          padding: 12px 14px;
        }

        .nav-link:hover {
          color: #c8a96e;
          border-color: #c8a96e;
        }

        .hero,
        .section-card {
          border: 1px solid #26211c;
          background: rgba(18, 16, 13, 0.9);
          border-radius: 28px;
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.22);
        }

        .hero {
          padding: 38px;
          margin-bottom: 18px;
        }

        .eyebrow {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 0.24em;
          color: #c8a96e;
          text-transform: uppercase;
          margin-bottom: 14px;
        }

        .title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(48px, 8vw, 86px);
          line-height: 0.94;
          font-weight: 700;
          margin: 0;
        }

        .subtitle {
          margin-top: 18px;
          color: #aaa096;
          font-size: 16px;
          line-height: 1.7;
          max-width: 760px;
          font-weight: 300;
        }

        .section-card {
          padding: 26px;
          margin-bottom: 16px;
        }

        .section-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 36px;
          line-height: 1;
          font-weight: 700;
          margin: 0 0 12px;
        }

        .body-text {
          color: #aaa096;
          font-size: 15px;
          line-height: 1.75;
          font-weight: 300;
          margin: 0 0 14px;
        }

        .plain-list {
          display: grid;
          gap: 10px;
          margin-top: 16px;
        }

        .plain-item {
          display: flex;
          gap: 10px;
          align-items: flex-start;
          color: #aaa096;
          font-size: 14px;
          line-height: 1.6;
        }

        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #c8a96e;
          flex-shrink: 0;
          margin-top: 8px;
        }

        .warning {
          border-color: #4a3520;
          background:
            linear-gradient(135deg, rgba(200, 169, 110, 0.12), rgba(18, 16, 13, 0.9)),
            #12100d;
        }

        .small-note {
          margin-top: 24px;
          color: #6f665f;
          font-size: 12px;
          line-height: 1.6;
        }

        @media (max-width: 650px) {
          .wrap {
            padding: 22px 14px 70px;
          }

          .topbar,
          .hero,
          .section-card {
            border-radius: 22px;
          }

          .hero {
            padding: 24px;
          }

          .nav,
          .nav-link {
            width: 100%;
          }
        }
      `}</style>

      <div className="wrap">
        <nav className="topbar">
          <div className="brand">
            <div className="brand-mark">5C</div>
            <div>
              <div className="brand-main">The Council</div>
              <div className="brand-sub">Beta terms and privacy note</div>
            </div>
          </div>

          <div className="nav">
            <Link href="/" className="nav-link">Home</Link>
            <Link href="/login" className="nav-link">Sign In</Link>
            <Link href="/sphinx" className="nav-link">Sphinx</Link>
          </div>
        </nav>

        <section className="hero">
          <div className="eyebrow">Plain-English Beta Terms</div>
          <h1 className="title">This is a free beta tool.</h1>
          <p className="subtitle">
            The Council is still being tested, tightened, and improved. The goal is simple:
            help writers get useful diagnostic feedback without pretending this is magic,
            therapy, legal advice, or a finished paid product.
          </p>
        </section>

        <section className="section-card warning">
          <h2 className="section-title">What beta means</h2>
          <p className="body-text">
            This tool is live enough to use, but not final enough to treat like a polished
            commercial product. Features may change. Limits may change. Weird stuff may happen.
            That is why it is free right now.
          </p>

          <div className="plain-list">
            <div className="plain-item"><span className="dot" /><span>No payment is active right now.</span></div>
            <div className="plain-item"><span className="dot" /><span>Usage limits exist so the app does not get fed whole books and explode financially.</span></div>
            <div className="plain-item"><span className="dot" /><span>Use excerpts, scenes, chapters, essays, blurbs, bios, posts, or application answers.</span></div>
          </div>
        </section>

        <section className="section-card">
          <h2 className="section-title">What happens to your text</h2>
          <p className="body-text">
            When you paste or upload text, the app uses that text to generate a report.
            If you save the report, it is connected to your logged-in account and appears
            in your dashboard.
          </p>

          <div className="plain-list">
            <div className="plain-item"><span className="dot" /><span>Saved reports are tied to your account login.</span></div>
            <div className="plain-item"><span className="dot" /><span>You can rename, download, copy, and delete saved reports.</span></div>
            <div className="plain-item"><span className="dot" /><span>There is no public report wall.</span></div>
            <div className="plain-item"><span className="dot" /><span>Do not upload anything you are not comfortable testing in a beta system.</span></div>
          </div>
        </section>

        <section className="section-card">
          <h2 className="section-title">What this is not</h2>
          <p className="body-text">
            The Council and Sphinx are writing feedback tools. They are not a substitute for a human editor,
            lawyer, publisher, agent, therapist, accountant, or common sense.
          </p>

          <div className="plain-list">
            <div className="plain-item"><span className="dot" /><span>It does not guarantee publication, sales, agent interest, contest placement, or reader love.</span></div>
            <div className="plain-item"><span className="dot" /><span>It may be blunt. That is part of the tool, not a malfunction.</span></div>
            <div className="plain-item"><span className="dot" /><span>It is designed to diagnose and prioritize, not flatter.</span></div>
          </div>
        </section>

        <section className="section-card">
          <h2 className="section-title">The practical promise</h2>
          <p className="body-text">
            The app is being built around account separation, saved report history,
            user-controlled deletion, usage limits, and clear beta expectations before payment is added.
          </p>

          <p className="body-text">
            In plain English: we are trying to build the damn thing responsibly before asking anyone to pay for it.
          </p>
        </section>

        <div className="small-note">
          Last updated during beta development. This page is written in plain language so actual humans can understand it.
        </div>
      </div>
    </main>
  );
}

