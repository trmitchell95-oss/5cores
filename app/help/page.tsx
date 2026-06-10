import Link from "next/link";

const choices = [
  {
    title: "I have an idea",
    body: "Start here when the thing is still messy in your head.",
    href: "/idea?start=intake",
    cta: "Start Idea",
  },
  {
    title: "I already wrote something",
    body: "Use this for a chapter, scene, essay, proposal, grant answer, or draft.",
    href: "/submit",
    cta: "Check Writing",
  },
  {
    title: "My words sound fake",
    body: "Use this when text sounds stiff, corporate, confusing, or too much like AI.",
    href: "/sphinx",
    cta: "Clean Words",
  },
  {
    title: "I want my saved work",
    body: "Open books, ideas, reports, drafts, and projects you already started.",
    href: "/projects",
    cta: "My Work",
  },
];

export default function HelpPage() {
  return (
    <main className="support-page">
      <section className="support-wrap">
        <header className="support-hero">
          <p className="support-eyebrow">Help</p>
          <h1>Pick the button that sounds closest.</h1>
          <p>
            You do not need to know the tool names. Start with what you are
            trying to do.
          </p>
        </header>

        <section className="support-grid">
          {choices.map((choice) => (
            <Link key={choice.href} href={choice.href} className="support-card">
              <h2>{choice.title}</h2>
              <p>{choice.body}</p>
              <strong>{choice.cta}</strong>
            </Link>
          ))}
        </section>

        <section className="support-card support-wide">
          <h2>Still lost?</h2>
          <p>
            Press <strong>Start Idea</strong>. That is the safest door. You can
            always move from an idea into a draft, proposal, project, or cleaner
            version later.
          </p>

          <div className="support-actions">
            <Link href="/workshop">Back Home</Link>
            <Link href="/settings">Make Text Bigger</Link>
            <Link href="/feedback">Send Feedback</Link>
          </div>
        </section>
      </section>
    </main>
  );
}
