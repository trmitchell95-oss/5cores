import Link from "next/link";

export default function IdeaHelpPage() {
 return (
 <main className="idea-help-shell">
 <style>{`
 body {
 margin: 0;
 background: #1c211e;
 }

 .idea-help-shell {
 min-height: 100vh;
 padding: 88px 24px 90px;
 color: #f5f1e8;
 font-family: Arial, sans-serif;
 background:
 radial-gradient(circle at top left, rgba(245, 158, 11, 0.30), transparent 36rem),
 radial-gradient(circle at bottom right, rgba(255, 202, 118, 0.14), transparent 32rem),
 linear-gradient(135deg, #332313 0%, #242018 46%, #1c211e 100%);
 }

 .wrap {
 max-width: 1100px;
 margin: 0 auto;
 }

 .top-nav {
 display: flex;
 gap: 14px;
 margin-bottom: 24px;
 flex-wrap: wrap;
 align-items: center;
 }

 .top-nav a {
 color: #f0b35f;
 text-decoration: none;
 font-family: monospace;
 font-size: 12px;
 font-weight: 900;
 letter-spacing: 0.08em;
 text-transform: uppercase;
 }

 .hero,
 .panel,
 .card {
 border: 1px solid rgba(255, 221, 159, 0.2);
 background: rgba(43, 38, 30, 0.92);
 box-shadow: 0 24px 80px rgba(0,0,0,0.22);
 }

 .hero {
 border-radius: 28px;
 padding: 32px;
 margin-bottom: 22px;
 }

 .eyebrow,
 .mini-label {
 color: #f0b35f;
 font-family: monospace;
 letter-spacing: 0.2em;
 text-transform: uppercase;
 font-size: 12px;
 font-weight: 900;
 }

 .title {
 font-family: Georgia, serif;
 font-size: clamp(48px, 8vw, 82px);
 line-height: 0.95;
 margin: 12px 0 0;
 }

 .subtitle,
 .card p,
 .panel p,
 li {
 color: #ddd5c7;
 line-height: 1.65;
 font-size: 16px;
 }

 .subtitle {
 max-width: 860px;
 font-size: 18px;
 }

 .grid {
 display: grid;
 grid-template-columns: repeat(2, minmax(0, 1fr));
 gap: 16px;
 margin-bottom: 22px;
 }

 .three-grid {
 display: grid;
 grid-template-columns: repeat(3, minmax(0, 1fr));
 gap: 16px;
 margin-bottom: 22px;
 }

 .card,
 .panel {
 border-radius: 24px;
 padding: 24px;
 }

 .card h2,
 .panel h2 {
 font-family: Georgia, serif;
 font-size: 34px;
 line-height: 1;
 margin: 0 0 14px;
 }

 ul {
 margin: 12px 0 0;
 padding-left: 22px;
 }

 li {
 margin-bottom: 10px;
 }

 .steps {
 display: grid;
 gap: 12px;
 margin-top: 14px;
 }

 .step {
 border: 1px solid rgba(255, 221, 159, 0.14);
 background: rgba(0, 0, 0, 0.16);
 border-radius: 18px;
 padding: 16px;
 color: #ddd5c7;
 line-height: 1.6;
 }

 .step strong {
 color: #fff7ea;
 }

 .callout {
 border: 1px solid rgba(240, 179, 95, 0.35);
 background: rgba(240, 179, 95, 0.09);
 border-radius: 20px;
 padding: 18px;
 color: #f0d3a3;
 line-height: 1.65;
 margin-top: 16px;
 }

 .button-row {
 display: flex;
 flex-wrap: wrap;
 gap: 12px;
 margin-top: 18px;
 }

 .button,
 .button-dark {
 border-radius: 999px;
 padding: 13px 16px;
 font-family: monospace;
 font-size: 11px;
 font-weight: 900;
 letter-spacing: 0.12em;
 text-transform: uppercase;
 text-decoration: none;
 }

 .button {
 background:
 radial-gradient(circle at 18px 50%, #fff3c4 0 4px, transparent 5px),
 linear-gradient(180deg, #ffd27a 0%, #f0b35f 52%, #c98438 100%);
 color: #18100a;
 border: 1px solid rgba(255, 241, 190, 0.7);
 padding-left: 34px;
 }

 .button-dark {
 color: #f0b35f;
 border: 1px solid rgba(255, 221, 159, 0.22);
 background:
 radial-gradient(circle at 16px 50%, rgba(255, 220, 143, 0.72) 0 3px, transparent 4px),
 rgba(255, 255, 255, 0.04);
 padding-left: 32px;
 }

 @media (max-width: 920px) {
 .grid,
 .three-grid {
 grid-template-columns: 1fr;
 }
 }

 @media (max-width: 820px) {
 .idea-help-shell {
 padding: 78px 14px 90px;
 }

 .hero,
 .panel,
 .card {
 border-radius: 20px;
 padding: 18px;
 }

 .title {
 font-size: clamp(42px, 12vw, 60px);
 }

 .button-row {
 display: grid;
 }

 .button,
 .button-dark {
 text-align: center;
 }
 }
 `}</style>

 <div className="wrap">
 <nav className="top-nav">
 <Link href="/ideanator">Rig Workbench</Link>
 <Link href="/idea?start=intake">Idea Check</Link>
 <Link href="/idea/saved">Idea Reports</Link>
 <Link href="/rigs">Rig Library</Link>
 <Link href="/feedback?from=%2Fhelp">Feedback</Link>
 <Link href="/beta-terms">Beta Terms</Link>
 </nav>

 <section className="hero">
 <div className="eyebrow">Ideanator Help</div>
 <h1 className="title">Fog in. Thinking Rig out.</h1>
 <p className="subtitle">
 The Ideanator now has two connected lanes. Idea Check diagnoses the messy idea.
 Rig Workbench turns that diagnosis, document, or rough material into a reusable working structure.
 The goal is not to flatter the idea. The goal is to help you keep working without missing the clearer version.
 </p>

 <div className="button-row">
 <Link className="button" href="/idea?start=intake">Run Idea Check</Link>
 <Link className="button-dark" href="/ideanator">Open Rig Workbench</Link>
 <Link className="button-dark" href="/idea/saved">Open Idea Reports</Link>
 <Link className="button-dark" href="/rigs">Open Rig Library</Link>
 </div>
 </section>

 <section className="grid">
 <article className="card">
 <div className="mini-label">Lane One</div>
 <h2>Idea Check diagnoses the idea.</h2>
 <p>
 Use Idea Check when you have a raw idea, invention note, product concept,
 story seed, business thought, grant angle, feature map, or strategy dump
 and need to know what the hell it actually is.
 </p>
 <ul>
 <li>Gives a verdict, spark, weak spots, audience, value path, and next moves.</li>
 <li>Best for early ideas that are still foggy.</li>
 <li>Saves as an Idea Report when you choose to save it.</li>
 </ul>
 </article>

 <article className="card">
 <div className="mini-label">Lane Two</div>
 <h2>Rig Workbench builds the reusable pattern.</h2>
 <p>
 Use Rig Workbench when you want to turn fog into a reusable structure.
 The left side is the Fog. The right side is the Blueprint. The buttons below
 run, save, copy, or export the rig.
 </p>
 <ul>
 <li>Fog is the messy source material.</li>
 <li>Blueprint is the organized instruction structure.</li>
 <li>Run Rig creates the finished output.</li>
 </ul>
 </article>
 </section>

 <section className="panel">
 <h2>The basic Ideanator loop.</h2>

 <div className="steps">
 <div className="step">
 <strong>1. Drop the idea into Idea Check.</strong> Get the diagnosis first.
 </div>

 <div className="step">
 <strong>2. Save the Idea Report.</strong> This preserves the verdict and useful notes.
 </div>

 <div className="step">
 <strong>3. Click Build Rig.</strong> The report opens in Rig Workbench and fills the Fog and Blueprint.
 </div>

 <div className="step">
 <strong>4. Review the Blueprint.</strong> Change the purpose, audience, tone, constraints, or missing pieces.
 </div>

 <div className="step">
 <strong>5. Click Run Rig.</strong> This generates the finished working output.
 </div>

 <div className="step">
 <strong>6. Save as New Rig.</strong> The reusable pattern goes to Rig Library.
 </div>
 </div>

 <div className="callout">
 When you arrive from Build Rig and feel lost, scroll up. Fog is on the left.
 Blueprint is on the right. You usually do not need to generate the blueprint again.
 Review it, then click Run Rig.
 </div>
 </section>

 <section className="three-grid">
 <article className="card">
 <div className="mini-label">Idea Reports</div>
 <h2>Reports are diagnosis.</h2>
 <p>
 Idea Reports are saved checkups. They tell you what the idea is,
 what is strong, what leaks oil, and what to try next.
 </p>
 <ul>
 <li>Use Back on the Lift to revise and rerun.</li>
 <li>Use Compare when you have multiple versions.</li>
 <li>Use Build Rig to turn the report into a reusable structure.</li>
 </ul>
 </article>

 <article className="card">
 <div className="mini-label">Rig Library</div>
 <h2>Rigs are reusable tools.</h2>
 <p>
 A saved rig is not just a report. It is a reusable working pattern.
 Open it, revise it, run it again, update it, copy it, export it, or archive it.
 </p>
 <ul>
 <li>Open a saved rig from Rig Library.</li>
 <li>Update Open Rig saves changes to the current rig.</li>
 <li>Save as New Rig creates a new version.</li>
 </ul>
 </article>

 <article className="card">
 <div className="mini-label">Portable Prompt</div>
 <h2>Take the rig elsewhere.</h2>
 <p>
 The Portable Prompt is the copyable structure you can take to another AI room.
 It is for portability and trust, not because you have to leave the app.
 </p>
 <ul>
 <li>Copy the Blueprint when you want the structure only.</li>
 <li>Copy the Portable Prompt when you want to use the rig elsewhere.</li>
 <li>Copy Full Rig Packet when you want everything together.</li>
 </ul>
 </article>
 </section>

 <section className="panel">
 <h2>Uploads and exports.</h2>
 <p>
 Rig Workbench can accept pasted text or uploaded documents. Current upload support is for TXT,
 Markdown, and modern Word DOCX files. Old DOC files and PDFs are not supported yet.
 </p>

 <ul>
 <li>Use Upload TXT / MD / DOCX in the Fog panel.</li>
 <li>Use exports when you want to keep the prompt, output, or full packet outside the app.</li>
 <li>Do not upload confidential legal, medical, financial, or third-party material unless you are comfortable testing it in beta.</li>
 </ul>

 <div className="callout">
 This is a beta workshop, not a legal vault, patent opinion, investor guarantee,
 therapist, accountant, or magic money machine.
 </div>
 </section>

 <section className="panel">
 <h2>Still confused?</h2>
 <p>
 Start with Idea Check when the idea is unclear. Start with Rig Workbench when you already have material
 and want a reusable working structure. Open Rig Library when you want to reuse something you already saved.
 </p>

 <div className="button-row">
 <Link className="button" href="/ideanator">Open Rig Workbench</Link>
 <Link className="button-dark" href="/feedback?from=%2Fhelp">Send Feedback</Link>
 <Link className="button-dark" href="/beta-terms">Read Beta Terms</Link>
 </div>
 </section>
 </div>
 </main>
 );
}


