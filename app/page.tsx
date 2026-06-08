import type { Metadata } from "next";
import NavClient from "./NavClient";
import RevealSection from "./RevealSection";

export const metadata: Metadata = {
  title: "CELA — Concern Becomes Action",
  description:
    "CELA is a proactive accountability protocol for schools that turns student concerns into assigned, time-bound, verified human responses.",
};

export default function Home() {
  return (
    <div className="cela-root">
      <NavClient />

      {/* ── HERO ── */}
      <section className="cela-hero" id="hero">
        <div className="cela-hero__inner">
          <div className="cela-hero__eyebrow">Compassion. Empathy. Listening. Accountability.</div>
          <h1 className="cela-hero__headline">
            A kid should not have to disappear inside a busy school day because
            every adult thought someone else had it.
          </h1>
          <p className="cela-hero__sub">
            CELA makes sure concern becomes action.
          </p>
          <p className="cela-hero__body">
            A proactive accountability protocol for schools that turns student
            concerns into assigned, time-bound, verified human responses.
            Whether the concern begins with a student token, a teacher note, a
            parent call, a nurse visit, or a re-entry follow-up — CELA makes
            sure someone owns it, responds to it, and closes the loop.
          </p>
          <div className="cela-hero__pills">
            <span className="cela-pill cela-pill--no">No surveillance.</span>
            <span className="cela-pill cela-pill--no">No student tracking.</span>
            <span className="cela-pill cela-pill--no">No prediction.</span>
            <span className="cela-pill cela-pill--yes">
              Verified human follow-through.
            </span>
          </div>
          <div className="cela-hero__cta-row">
            <a href="#pilot" className="cela-btn cela-btn--primary">
              Learn About the Pilot
            </a>
            <a href="#how-it-works" className="cela-btn cela-btn--ghost">
              See How It Works
            </a>
          </div>
        </div>
        <div className="cela-hero__loop-visual" aria-hidden="true">
          <div className="cela-loop">
            <div className="cela-loop__node cela-loop__node--in">
              <span className="cela-loop__icon">⬡</span>
              <span className="cela-loop__label">Concern Enters</span>
            </div>
            <div className="cela-loop__arrow">↓</div>
            <div className="cela-loop__node">
              <span className="cela-loop__icon">◎</span>
              <span className="cela-loop__label">Advocate Owns It</span>
            </div>
            <div className="cela-loop__arrow">↓</div>
            <div className="cela-loop__node">
              <span className="cela-loop__icon">◷</span>
              <span className="cela-loop__label">Timer Starts</span>
            </div>
            <div className="cela-loop__arrow">↓</div>
            <div className="cela-loop__node">
              <span className="cela-loop__icon">✓</span>
              <span className="cela-loop__label">Human Responds</span>
            </div>
            <div className="cela-loop__arrow">↓</div>
            <div className="cela-loop__node cela-loop__node--out">
              <span className="cela-loop__icon">◉</span>
              <span className="cela-loop__label">Loop Closes</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ── */}
      <RevealSection id="problem" className="cela-section cela-section--problem">
        <div className="cela-section__inner">
          <div className="cela-label">The Problem</div>
          <h2 className="cela-section__headline">
            Schools don't fail kids because nobody cares.
          </h2>
          <p className="cela-section__lead">
            They fail because care is too often informal.
          </p>
          <div className="cela-problem__grid">
            <div className="cela-problem__card">
              <p>"I told the counselor yesterday."</p>
            </div>
            <div className="cela-problem__card">
              <p>"I thought someone talked to her."</p>
            </div>
            <div className="cela-problem__card">
              <p>"I sent an email."</p>
            </div>
            <div className="cela-problem__card">
              <p>"I assumed admin knew."</p>
            </div>
            <div className="cela-problem__card">
              <p>"I meant to circle back."</p>
            </div>
            <div className="cela-problem__card cela-problem__card--dark">
              <p>
                Then the day kept moving. And a student who needed someone
                quietly disappeared into the noise.
              </p>
            </div>
          </div>
          <p className="cela-section__body">
            Schools receive student concerns every single day — through hallway
            conversations, parent calls, teacher observations, nurse visits,
            and student disclosures. Most of the people involved genuinely
            care. But caring does not automatically create structure. Human
            memory was never designed to scale to 1,200 students per campus.
          </p>
          <p className="cela-section__body">
            CELA does not create new responsibilities for schools. It organizes
            the ones they already carry so that known concerns do not disappear
            into inboxes, assumptions, and the fog of a busy day.
          </p>
        </div>
      </RevealSection>

      {/* ── WHAT CELA IS ── */}
      <RevealSection id="what-cela-is" className="cela-section cela-section--alt">
        <div className="cela-section__inner">
          <div className="cela-label">What CELA Is</div>
          <h2 className="cela-section__headline">The loop is the product.</h2>
          <p className="cela-section__lead">
            CELA is a proactive accountability protocol for schools that turns
            student concerns into assigned, time-bound, verified human
            responses. The token is one quiet input. The loop is the product.
          </p>
          <div className="cela-is-not__grid">
            <div className="cela-is-not__col">
              <div className="cela-label cela-label--small">CELA is</div>
              <ul className="cela-list cela-list--yes">
                <li>Student concern response accountability</li>
                <li>Structured ownership for concerns schools already carry</li>
                <li>Time-bound, verified human follow-through</li>
                <li>A closed loop with a complete audit record</li>
                <li>Privacy-protective by architecture</li>
                <li>Quiet infrastructure that works when a student needs it</li>
              </ul>
            </div>
            <div className="cela-is-not__col">
              <div className="cela-label cela-label--small">CELA is not</div>
              <ul className="cela-list cela-list--no">
                <li>Surveillance or student tracking</li>
                <li>AI prediction or behavioral scoring</li>
                <li>A mental health management platform</li>
                <li>A compliance monster or ticketing system</li>
                <li>Another burden added to overloaded staff</li>
                <li>Asking teachers to become therapists</li>
              </ul>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ── HOW IT WORKS ── */}
      <RevealSection id="how-it-works" className="cela-section">
        <div className="cela-section__inner">
          <div className="cela-label">How It Works</div>
          <h2 className="cela-section__headline">
            Many doors in. One accountable loop out.
          </h2>
          <p className="cela-section__lead">
            The input can change. The loop stays the same.
          </p>

          <div className="cela-inputs__grid">
            <div className="cela-input__card">
              <span className="cela-input__icon">⬡</span>
              <span className="cela-input__name">Student Token</span>
              <span className="cela-input__desc">
                A quiet physical signal — no phone, no scene, no words required
              </span>
            </div>
            <div className="cela-input__card">
              <span className="cela-input__icon">✎</span>
              <span className="cela-input__name">Teacher Note</span>
              <span className="cela-input__desc">
                Staff create a CELA Check when they notice something
              </span>
            </div>
            <div className="cela-input__card">
              <span className="cela-input__icon">☎</span>
              <span className="cela-input__name">Parent Call</span>
              <span className="cela-input__desc">
                A parent concern becomes an assigned action, not a voicemail
              </span>
            </div>
            <div className="cela-input__card">
              <span className="cela-input__icon">♡</span>
              <span className="cela-input__name">Nurse or Counselor</span>
              <span className="cela-input__desc">
                Any trusted adult can open a loop on behalf of a student
              </span>
            </div>
            <div className="cela-input__card">
              <span className="cela-input__icon">↩</span>
              <span className="cela-input__name">Re-entry Flag</span>
              <span className="cela-input__desc">
                A brief check when a student returns after absence, bullying,
                grief, or a known event
              </span>
            </div>
            <div className="cela-input__card">
              <span className="cela-input__icon">⊞</span>
              <span className="cela-input__name">Fixed Station</span>
              <span className="cela-input__desc">
                Wall or desk buttons in hallways, bathrooms, and common areas
              </span>
            </div>
          </div>

          <div className="cela-steps">
            <div className="cela-step">
              <div className="cela-step__num">01</div>
              <div className="cela-step__content">
                <h3>Concern enters the system</h3>
                <p>
                  From any adult on campus or from a student's quiet signal.
                  Every input creates a CELA Check — an owned, time-stamped
                  action, not a buried email.
                </p>
              </div>
            </div>
            <div className="cela-step">
              <div className="cela-step__num">02</div>
              <div className="cela-step__content">
                <h3>An Advocate is assigned</h3>
                <p>
                  A designated staff member owns the response — counselor,
                  assistant principal, nurse, coach, or trusted teacher.
                  CELA creates ownership where there was only assumption.
                </p>
              </div>
            </div>
            <div className="cela-step">
              <div className="cela-step__num">03</div>
              <div className="cela-step__content">
                <h3>The timer starts</h3>
                <p>
                  The Advocate must acknowledge within a configured window.
                  Miss it and the system escalates automatically — no buried
                  notification, no passive failure hiding inside a busy day.
                </p>
              </div>
            </div>
            <div className="cela-step">
              <div className="cela-step__num">04</div>
              <div className="cela-step__content">
                <h3>A human responds — and the loop verifies it</h3>
                <p>
                  The Advocate checks on the student and documents what
                  happened. Physical arrival can be verified through a
                  proximity handshake. A CELA Check requires verified
                  follow-through, not just digital closure.
                </p>
              </div>
            </div>
            <div className="cela-step">
              <div className="cela-step__num">05</div>
              <div className="cela-step__content">
                <h3>The loop closes with a complete record</h3>
                <p>
                  Every step — concern, assignment, acknowledgment, arrival,
                  resolution — is logged. The school can see where the system
                  worked and where it broke. That record is the artifact.
                </p>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ── CELA PROMISE / NO SURVEILLANCE ── */}
      <RevealSection id="promise" className="cela-section cela-section--promise">
        <div className="cela-section__inner">
          <div className="cela-label">The CELA Promise</div>
          <h2 className="cela-section__headline">
            Privacy is not a policy. It is the architecture.
          </h2>
          <p className="cela-section__lead">
            The difference between a policy and architecture is this: a policy
            can be quietly reversed in a future release. Architecture cannot.
          </p>
          <div className="cela-promise__grid">
            <div className="cela-promise__item">
              <span className="cela-promise__icon">✗</span>
              <span>No GPS. Ever.</span>
            </div>
            <div className="cela-promise__item">
              <span className="cela-promise__icon">✗</span>
              <span>No cameras or microphones.</span>
            </div>
            <div className="cela-promise__item">
              <span className="cela-promise__icon">✗</span>
              <span>No student tracking or location history.</span>
            </div>
            <div className="cela-promise__item">
              <span className="cela-promise__icon">✗</span>
              <span>No AI behavioral prediction.</span>
            </div>
            <div className="cela-promise__item">
              <span className="cela-promise__icon">✗</span>
              <span>No student risk scoring.</span>
            </div>
            <div className="cela-promise__item">
              <span className="cela-promise__icon">✗</span>
              <span>No selling or training on student data.</span>
            </div>
            <div className="cela-promise__item">
              <span className="cela-promise__icon">✗</span>
              <span>No student profiles owned by the vendor.</span>
            </div>
            <div className="cela-promise__item">
              <span className="cela-promise__icon">✗</span>
              <span>No content monitoring.</span>
            </div>
          </div>
          <p className="cela-section__body cela-section__body--center">
            The school owns student identity. CELA owns the accountability
            loop. Those two things stay separate. That is not a promise we make
            in a terms-of-service document. It is a constraint built into the
            data model.
          </p>
        </div>
      </RevealSection>

      {/* ── THREE LAYERS ── */}
      <RevealSection id="three-layers" className="cela-section cela-section--alt">
        <div className="cela-section__inner">
          <div className="cela-label">The Three-Layer Model</div>
          <h2 className="cela-section__headline">
            A program, a dashboard, and a quiet student voice.
          </h2>
          <div className="cela-layers">
            <div className="cela-layer">
              <div className="cela-layer__num">01</div>
              <div className="cela-layer__body">
                <h3 className="cela-layer__title">CELA Protocol</h3>
                <p className="cela-layer__sub">The human operating system</p>
                <p>
                  The protocol is what makes CELA a school accountability
                  program — not just software. It defines who can create a CELA
                  Check, who serves as Advocate, how quickly a response is
                  required, when escalation triggers, and how failures are
                  reviewed. Schools can become CELA Ready by adopting the
                  protocol before a single token ships.
                </p>
              </div>
            </div>
            <div className="cela-layer">
              <div className="cela-layer__num">02</div>
              <div className="cela-layer__body">
                <h3 className="cela-layer__title">CELA Loop Software</h3>
                <p className="cela-layer__sub">The practical MVP</p>
                <p>
                  A clean dashboard that does one thing: makes student concerns
                  harder to lose. Staff create CELA Checks. Advocates receive
                  them, acknowledge them, and close the loop. The system
                  escalates automatically when SLAs are missed. Every completed
                  check creates an audit record. The monthly review shows where
                  the system is working and where it is breaking.
                </p>
              </div>
            </div>
            <div className="cela-layer">
              <div className="cela-layer__num">03</div>
              <div className="cela-layer__body">
                <h3 className="cela-layer__title">CELA Token &amp; Station Family</h3>
                <p className="cela-layer__sub">The quiet student voice layer</p>
                <p>
                  The token gives students a way to ask for help without
                  speaking aloud, pulling out a phone, or explaining themselves
                  before an adult arrives. Wearable token, badge insert,
                  lanyard clip, fixed wall button, QR/NFC station,
                  ADA-accessible input — same electronics, different housings.
                  The token is one door into the loop. The invention is the
                  loop itself.
                </p>
              </div>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ── WHY NOW ── */}
      <RevealSection id="why-now" className="cela-section">
        <div className="cela-section__inner">
          <div className="cela-label">Why Now</div>
          <h2 className="cela-section__headline">
            Phone restrictions changed the school day. CELA gives schools a
            structured replacement pathway.
          </h2>
          <p className="cela-section__lead">
            Texas HB 1481 and similar legislation across multiple states
            removed phones from the structured school day. That decision is
            defensible. But it is incomplete without a structured replacement.
          </p>
          <p className="cela-section__body">
            For many students, a phone was not just a distraction. It was their
            only quiet way to reach out — to a parent, a sibling, a trusted
            adult, a friend who would notice. When that disappears without a
            replacement, the school inherits a responsibility it has not yet
            answered:
          </p>
          <blockquote className="cela-quote">
            If a student cannot quietly ask for help through a phone, what
            pathway did you leave them?
          </blockquote>
          <p className="cela-section__body">
            CELA is built for that moment. Not as a loophole around phone bans.
            As school-owned, privacy-conscious, structured support
            infrastructure. The timing is not incidental. It is the opening.
          </p>
          <div className="cela-forces__grid">
            <div className="cela-force__card">
              <h4>Phone restrictions are expanding</h4>
              <p>
                HB 1481 and equivalent legislation are removing the student's
                informal help channel district by district.
              </p>
            </div>
            <div className="cela-force__card">
              <h4>Student mental health needs are rising</h4>
              <p>
                Counselors are overwhelmed. The gap between concern and
                follow-through is wider than it has ever been.
              </p>
            </div>
            <div className="cela-force__card">
              <h4>Districts need clearer documentation and accountability</h4>
              <p>
                Schools need a defensible audit trail showing they responded
                when a student needed someone. Most cannot produce one.
              </p>
            </div>
            <div className="cela-force__card">
              <h4>Parents want transparency without surveillance</h4>
              <p>
                Parents want to know concerns become action without turning
                school into a surveillance system. CELA creates a record of
                follow-through without tracking students.
              </p>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ── WHAT CELA GIVES A CAMPUS ── */}
      <RevealSection id="product-visual" className="cela-section">
        <div className="cela-section__inner">
          <div className="cela-label">The Product</div>
          <h2 className="cela-section__headline">
            What CELA gives a campus
          </h2>
          <p className="cela-section__lead">
            Four things a school currently lacks and a district needs to see.
          </p>
          <div className="cela-product__grid">
            <div className="cela-product__card">
              <div className="cela-product__icon">◎</div>
              <h3 className="cela-product__title">Open Checks</h3>
              <p className="cela-product__desc">
                Every active student concern is visible in one place — who
                created it, when, and who owns the response. Nothing buried in
                an inbox. Nothing depending on memory.
              </p>
            </div>
            <div className="cela-product__card">
              <div className="cela-product__icon">◷</div>
              <h3 className="cela-product__title">Response Timers</h3>
              <p className="cela-product__desc">
                Every CELA Check has a countdown. Advocates see how much time
                remains. Administrators see which checks are approaching or
                past their SLA. The clock makes ownership real.
              </p>
            </div>
            <div className="cela-product__card">
              <div className="cela-product__icon">↑</div>
              <h3 className="cela-product__title">Escalation Visibility</h3>
              <p className="cela-product__desc">
                When a response is missed, the system escalates automatically
                and logs the failure. Administrators see where the loop broke —
                not to punish, but to fix it before it happens again.
              </p>
            </div>
            <div className="cela-product__card">
              <div className="cela-product__icon">◉</div>
              <h3 className="cela-product__title">Closed Loop Proof</h3>
              <p className="cela-product__desc">
                Every completed check produces a timestamped record: concern
                received, Advocate assigned, student checked, resolution
                documented. That record is the artifact a district can stand
                behind.
              </p>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* ── PILOT ── */}
      <RevealSection id="pilot" className="cela-section cela-section--pilot">
        <div className="cela-section__inner">
          <div className="cela-label">Pilot Program</div>
          <h2 className="cela-section__headline">
            The pilot does not ask: will every student use a token?
          </h2>
          <p className="cela-section__lead">
            The pilot asks: can a campus reliably close the loop when someone
            is worried about a student?
          </p>
          <p className="cela-section__body">
            That is a stronger question. It is measurable before full hardware
            deployment. And it is the question that actually matters.
          </p>
          <div className="cela-pilot__cols">
            <div className="cela-pilot__col">
              <h3>Pilot structure</h3>
              <ul className="cela-list">
                <li>One campus, one grade band or support team</li>
                <li>10–15 trained staff members</li>
                <li>2–4 designated Advocates</li>
                <li>30–60 day test window</li>
                <li>Staff-created CELA Checks from day one</li>
                <li>Optional QR/NFC station for proof-of-concept input</li>
                <li>Optional limited token group introduced later</li>
              </ul>
            </div>
            <div className="cela-pilot__col">
              <h3>What we measure</h3>
              <ul className="cela-list">
                <li>How concerns entered the system and from whom</li>
                <li>Time to acknowledgment and completed check</li>
                <li>Missed SLA count and escalation frequency</li>
                <li>Whether the workflow reduced fog or added burden</li>
                <li>Whether administrators gained better visibility</li>
                <li>Whether known concerns became harder to lose</li>
              </ul>
            </div>
          </div>
          <div className="cela-pilot__claim">
            <p>
              We are not claiming we solved student mental health. We are
              claiming something measurable and achievable:
            </p>
            <p className="cela-pilot__claim-line">
              CELA makes known student concerns harder to lose.
            </p>
          </div>
          <div className="cela-pilot__cta">
            <a href="mailto:thomas.mitchell@hovelideas.com?cc=ahnaf.chowdhury@hovelideas.com&subject=CELA%20Pilot%20Inquiry" className="cela-btn cela-btn--primary">
              Talk to Us About a Pilot
            </a>
          </div>
        </div>
      </RevealSection>

      {/* ── CELA READY ── */}
      <RevealSection id="cela-ready" className="cela-section cela-section--alt">
        <div className="cela-section__inner cela-section__inner--narrow">
          <div className="cela-label">CELA Ready Campus</div>
          <h2 className="cela-section__headline">
            Structure sets you free.
          </h2>
          <p className="cela-section__lead">
            A CELA Ready campus has made one commitment: when someone is
            worried about a student, that concern will not disappear.
          </p>
          <div className="cela-ready__items">
            <div className="cela-ready__item">
              <span className="cela-ready__check">✓</span>
              <span>Every concern has an owner.</span>
            </div>
            <div className="cela-ready__item">
              <span className="cela-ready__check">✓</span>
              <span>Every urgent concern has a response timer.</span>
            </div>
            <div className="cela-ready__item">
              <span className="cela-ready__check">✓</span>
              <span>Every missed response escalates automatically.</span>
            </div>
            <div className="cela-ready__item">
              <span className="cela-ready__check">✓</span>
              <span>Every response is documented.</span>
            </div>
            <div className="cela-ready__item">
              <span className="cela-ready__check">✓</span>
              <span>Students have a quiet way to ask for help.</span>
            </div>
            <div className="cela-ready__item">
              <span className="cela-ready__check">✓</span>
              <span>Adults know who owns what.</span>
            </div>
            <div className="cela-ready__item">
              <span className="cela-ready__check">✓</span>
              <span>The campus reviews where the loop broke each month.</span>
            </div>
          </div>
          <p className="cela-section__body cela-section__body--center">
            That is not surveillance. That is structure. And structure is what
            turns good intentions into reliable care.
          </p>
        </div>
      </RevealSection>

      {/* ── CLOSING ── */}
      <RevealSection id="closing" className="cela-section cela-section--closing">
        <div className="cela-section__inner cela-section__inner--narrow">
          <h2 className="cela-closing__headline">
            Concern enters.
            <br />
            Ownership attaches.
            <br />
            Time matters.
            <br />
            A human responds.
            <br />
            The loop closes.
          </h2>
          <p className="cela-closing__sub">
            CELA is the missing infrastructure between concern and
            follow-through. Built for the student who needs someone to notice
            before they have to break down to be seen.
          </p>
          <div className="cela-closing__cta-row">
            <a href="mailto:thomas.mitchell@hovelideas.com?cc=ahnaf.chowdhury@hovelideas.com&subject=CELA%20Pilot%20Inquiry" className="cela-btn cela-btn--primary">
              Get in Touch
            </a>
            <a href="#pilot" className="cela-btn cela-btn--ghost">
              Learn About the Pilot
            </a>
          </div>
        </div>
      </RevealSection>

      {/* ── FOOTER ── */}
      <footer className="cela-footer">
        <div className="cela-footer__inner">
          <div className="cela-footer__brand">
            <span className="cela-footer__logo">CELA</span>
            <span className="cela-footer__tagline">
              Compassion. Empathy. Listening. Accountability.
            </span>
          </div>
          <div className="cela-footer__links">
            <a href="#hero">Home</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#promise">Our Promise</a>
            <a href="#pilot">Pilot</a>
            <a href="mailto:thomas.mitchell@hovelideas.com?cc=ahnaf.chowdhury@hovelideas.com&subject=CELA%20Pilot%20Inquiry">Contact</a>
          </div>
          <div className="cela-footer__legal">
            <p>A Hovel Ideas product. meetcela.com</p>
            <p>
              thomas.mitchell@hovelideas.com &nbsp;·&nbsp;
              ahnaf.chowdhury@hovelideas.com
            </p>
            <p>© 2026 Hovel Ideas. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
