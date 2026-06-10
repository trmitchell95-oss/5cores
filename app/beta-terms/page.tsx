import Link from "next/link";

export default function BetaTermsPage() {
  return (
    <main className="support-page">
      <section className="support-wrap">
        <header className="support-hero">
          <p className="support-eyebrow">Beta Terms</p>
          <h1>This is a working beta.</h1>
          <p>
            The workshop is being tested and improved. Use it as a helper, not
            as a final authority.
          </p>
        </header>

        <section className="support-grid two">
          <article className="support-card">
            <h2>What beta means</h2>
            <p>
              Features may change. Pages may improve. Results may need human
              review. Feedback helps us make the app easier and better.
            </p>
          </article>

          <article className="support-card">
            <h2>Use your judgment</h2>
            <p>
              The app can help with ideas, writing, drafts, proposals, and
              structure. You are still responsible for reviewing anything before
              you send, publish, file, or rely on it.
            </p>
          </article>

          <article className="support-card">
            <h2>Private drafts</h2>
            <p>
              Only save drafts and projects you actually want stored for later.
              If you do not want something saved, copy your result and clear the
              page instead.
            </p>
          </article>

          <article className="support-card">
            <h2>Tell us what breaks</h2>
            <p>
              Confusing buttons, weird pages, bad wording, login trouble, and
              broken flows are exactly what beta feedback is for.
            </p>
          </article>
        </section>

        <section className="support-card support-wide">
          <h2>Need help?</h2>
          <div className="support-actions">
            <Link href="/workshop">Back Home</Link>
            <Link href="/idea/help">Help</Link>
            <Link href="/feedback">Send Feedback</Link>
          </div>
        </section>
      </section>
    </main>
  );
}
