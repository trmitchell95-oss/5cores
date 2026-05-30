"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LandingPage() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        window.location.href = "/dashboard";
      } else {
        setChecking(false);
      }
    }
    check();
  }, []);

  if (checking) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#0e0d0b", color: "#f0ece4", fontFamily: "Georgia, serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .wrap { max-width: 960px; margin: 0 auto; padding: 48px 32px 100px; }
        .nav { display: flex; align-items: center; justify-content: space-between; margin-bottom: 80px; }
        .nav-logo { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 700; color: #f0ece4; }
        .nav-link { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #9a9186; text-decoration: none; }
        .nav-link:hover { color: #f0ece4; }
        .hero { max-width: 720px; margin-bottom: 80px; }
        .eyebrow { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.2em; color: #c8935a; text-transform: uppercase; margin-bottom: 24px; }
        .headline { font-family: 'Cormorant Garamond', serif; font-size: clamp(40px, 7vw, 72px); font-weight: 700; line-height: 1.05; color: #f0ece4; margin-bottom: 24px; }
        .subhead { font-family: 'DM Sans', sans-serif; font-size: 18px; font-weight: 300; color: #9a9186; line-height: 1.6; margin-bottom: 40px; max-width: 560px; }
        .cta-btn { display: inline-block; padding: 16px 40px; background: #c8935a; color: #0e0d0b; font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; text-decoration: none; transition: background 0.2s; }
        .cta-btn:hover { background: #e0aa70; }
        .divider { border: none; border-top: 1px solid #2a2520; margin: 80px 0; }
        .section-label { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.2em; color: #5a5448; text-transform: uppercase; margin-bottom: 32px; }
        .problem-block { margin-bottom: 80px; }
        .problem-text { font-family: 'Cormorant Garamond', serif; font-size: clamp(24px, 4vw, 36px); font-weight: 400; line-height: 1.4; color: #f0ece4; max-width: 680px; }
        .council-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1px; background: #2a2520; margin-bottom: 80px; }
        .council-card { background: #0e0d0b; padding: 32px; }
        .card-initial { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 700; margin-bottom: 12px; }
        .card-name { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; margin-bottom: 8px; }
        .card-desc { font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 300; color: #9a9186; line-height: 1.6; }
        .how-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 40px; margin-bottom: 80px; }
        .how-step { }
        .step-num { font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #c8935a; letter-spacing: 0.1em; margin-bottom: 12px; }
        .step-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #f0ece4; margin-bottom: 8px; }
        .step-desc { font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 300; color: #9a9186; line-height: 1.6; }
        .price-block { background: #161410; border: 1px solid #2a2520; padding: 48px; margin-bottom: 80px; display: flex; align-items: center; justify-content: space-between; flex-wrap: gap; gap: 32px; }
        .price-left { }
        .price-label { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.2em; color: #5a5448; text-transform: uppercase; margin-bottom: 12px; }
        .price-amount { font-family: 'Cormorant Garamond', serif; font-size: 56px; font-weight: 700; color: #f0ece4; line-height: 1; }
        .price-desc { font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 300; color: #9a9186; margin-top: 8px; }
        .footer { border-top: 1px solid #2a2520; padding-top: 32px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #5a5448; letter-spacing: 0.1em; }
      `}</style>

      <div className="wrap">
        <nav className="nav">
          <div className="nav-logo">5 CORE</div>
          <a className="nav-link" href="/login">Sign In</a>
        </nav>

        <div className="hero">
          <div className="eyebrow">Editorial Council — Beta</div>
          <h1 className="headline">Your manuscript deserves a real diagnosis.</h1>
          <p className="subhead">Five distinct editorial minds read your work and tell you exactly what is working, what is costing you power, and what to fix first. No flattery. No hedging. No bullshit.</p>
          <a className="cta-btn" href="/login">Request Beta Access</a>
        </div>

        <hr className="divider" />

        <div className="problem-block">
          <div className="section-label">The Problem</div>
          <p className="problem-text">You are too close to your own work. Professional editing is expensive. Generic AI feedback is useless. You need something that actually reads your manuscript like an editor would — and tells you the truth.</p>
        </div>

        <div className="section-label">The Editorial Council</div>
        <div className="council-grid">
          <div className="council-card">
            <div className="card-initial" style={{ color: "#c8935a" }}>B</div>
            <div className="card-name" style={{ color: "#c8935a" }}>Brad — Voice Guardian</div>
            <div className="card-desc">Protects what is alive in the manuscript. Finds the pulse and makes sure no one cuts it.</div>
          </div>
          <div className="council-card">
            <div className="card-initial" style={{ color: "#b84040" }}>G</div>
            <div className="card-name" style={{ color: "#b84040" }}>Greg — Brutal Editor</div>
            <div className="card-desc">Finds what is costing the manuscript power. Cuts without mercy. Explains why.</div>
          </div>
          <div className="council-card">
            <div className="card-initial" style={{ color: "#5a7cc8" }}>V</div>
            <div className="card-name" style={{ color: "#5a7cc8" }}>Von Claude — Architect</div>
            <div className="card-desc">Structure, consistency, blueprint discipline. Whether the spine holds or collapses.</div>
          </div>
          <div className="council-card">
            <div className="card-initial" style={{ color: "#4a9c6a" }}>J</div>
            <div className="card-name" style={{ color: "#4a9c6a" }}>Juniper — Reader Lens</div>
            <div className="card-desc">Represents the intelligent outside reader. Where they stay. Where they leave. Why.</div>
          </div>
          <div className="council-card">
            <div className="card-initial" style={{ color: "#9c7ac8" }}>★</div>
            <div className="card-name" style={{ color: "#9c7ac8" }}>Final Editor — Synthesis</div>
            <div className="card-desc">Resolves the council into one official verdict. Scores. Fixes. Roadmap. No hedging.</div>
          </div>
        </div>

        <hr className="divider" />

        <div className="section-label">How It Works</div>
        <div className="how-grid">
          <div className="how-step">
            <div className="step-num">01</div>
            <div className="step-title">Paste Your Manuscript</div>
            <div className="step-desc">A few paragraphs to a few pages. The council reads everything before delivering any verdict.</div>
          </div>
          <div className="how-step">
            <div className="step-num">02</div>
            <div className="step-title">The Council Convenes</div>
            <div className="step-desc">Five editorial minds read your work simultaneously. Each from a different angle. Each with a different job.</div>
          </div>
          <div className="how-step">
            <div className="step-num">03</div>
            <div className="step-title">You Get the Truth</div>
            <div className="step-desc">Five complete reports. Scores with evidence. A revision roadmap. A shareable permalink to return anytime.</div>
          </div>
        </div>

        <hr className="divider" />

        <div className="price-block">
          <div className="price-left">
            <div className="price-label">Beta Access</div>
            <div className="price-amount">Free</div>
            <div className="price-desc">During beta. Five full reports per submission. No bullshit.</div>
          </div>
          <a className="cta-btn" href="/login">Request Beta Access</a>
        </div>

        <div className="footer">
          5 CORE Editorial Council — Built for independent writers.
        </div>
      </div>
    </div>
  );
}