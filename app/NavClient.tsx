"use client";
import { useState, useEffect } from "react";

export default function NavClient() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#problem", label: "The Problem" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#promise", label: "Our Promise" },
    { href: "#three-layers", label: "The System" },
    { href: "#pilot", label: "Pilot" },
  ];

  return (
    <nav className={`cela-nav${scrolled ? " cela-nav--scrolled" : ""}`}>
      <div className="cela-nav__inner">
        <a href="#hero" className="cela-nav__logo">
          CELA
        </a>

        {/* Desktop links */}
        <div className="cela-nav__links">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="cela-nav__link">
              {l.label}
            </a>
          ))}
          <a
            href="mailto:thomas.mitchell@hovelideas.com?cc=ahnaf.chowdhury@hovelideas.com&subject=CELA%20Pilot%20Inquiry"
            className="cela-btn cela-btn--nav"
          >
            Contact
          </a>
          <a
            href="https://hovelideas.com"
            className="cela-nav__hovel"
            target="_blank"
            rel="noopener noreferrer"
          >
            Hovel Ideas ↗
          </a>
        </div>

        {/* Mobile hamburger — Fix 7 */}
        <button
          type="button"
          className="cela-nav__hamburger"
          aria-label="Toggle menu"
          aria-expanded={open}
          aria-controls="cela-mobile-menu"
          onClick={() => setOpen((o) => !o)}
        >
          <span className={`cela-hamburger-bar${open ? " open" : ""}`} />
          <span className={`cela-hamburger-bar${open ? " open" : ""}`} />
          <span className={`cela-hamburger-bar${open ? " open" : ""}`} />
        </button>
      </div>

      {/* Mobile drawer — Fix 7 */}
      {open && (
        <div id="cela-mobile-menu" className="cela-nav__drawer">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="cela-nav__drawer-link"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <a
            href="mailto:thomas.mitchell@hovelideas.com?cc=ahnaf.chowdhury@hovelideas.com&subject=CELA%20Pilot%20Inquiry"
            className="cela-nav__drawer-link cela-nav__drawer-link--cta"
            onClick={() => setOpen(false)}
          >
            Contact
          </a>
          <a
            href="https://hovelideas.com"
            className="cela-nav__drawer-link cela-nav__drawer-link--hovel"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
          >
            Hovel Ideas ↗
          </a>
        </div>
      )}
    </nav>
  );
}
