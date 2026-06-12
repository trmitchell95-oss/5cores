"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const navItems = [
  { href: "/workshop", label: "Home" },
  { href: "/idea?start=intake", label: "Start Idea" },
  { href: "/sphinx", label: "Clean Words" },
  { href: "/submit", label: "Check Writing" },
  { href: "/projects", label: "My Work" },
  { href: "/reread", label: "Compare Drafts" },
  { href: "/settings", label: "Settings" },
  { href: "/idea/help", label: "Help" },
];

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createClient(url, key);
}

function isActive(pathname: string, href: string) {
  if (href === "/workshop") return pathname === "/" || pathname === "/workshop";
  if (href.startsWith("/idea")) {
    return (
      pathname === "/idea" ||
      pathname.startsWith("/idea/") ||
      pathname === "/ideanator" ||
      pathname.startsWith("/ideanator/") ||
      pathname === "/the-ideanator" ||
      pathname === "/saved-ideas" ||
      pathname.startsWith("/saved-ideas/") ||
      pathname === "/rigs" ||
      pathname.startsWith("/rigs/")
    );
  }

  if (href === "/sphinx") return pathname === "/sphinx" || pathname.startsWith("/sphinx/");
  if (href === "/submit") return pathname === "/submit";
  if (href === "/projects") return pathname === "/projects" || pathname.startsWith("/projects/");
  if (href === "/reread") return pathname === "/reread" || pathname.startsWith("/reread/");
  if (href === "/settings") return pathname === "/settings" || pathname.startsWith("/settings/");
  if (href === "/idea/help") return pathname === "/help" || pathname === "/idea/help";

  return pathname === href;
}

function applyEasyPrefs() {
  if (typeof window === "undefined") return;

  const easy = window.localStorage.getItem("hovel-easy-mode") === "on";
  document.documentElement.style.fontSize = easy ? "19px" : "16px";
  document.body.classList.toggle("hovel-easy-mode", easy);
}

export default function ProductNav() {
  const pathname = usePathname() || "/";
  const [signedIn, setSignedIn] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [loginHref, setLoginHref] = useState("/login?next=%2Fworkshop");

  useEffect(() => {
    let alive = true;

    applyEasyPrefs();
    setLoginHref(`/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);

    async function loadSession() {
      try {
        const supabase = getSupabaseClient();

        if (!supabase) {
          setSignedIn(false);
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (alive) {
          setSignedIn(Boolean(session?.access_token));
        }
      } finally {
        if (alive) setAuthReady(true);
      }
    }

    loadSession();

    return () => {
      alive = false;
    };
  }, [pathname]);

  async function signOut(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    const supabase = getSupabaseClient();

    if (supabase) {
      await supabase.auth.signOut();
    }

    window.location.href = "/workshop";
  }

  return (
    <>
      <style>{`
        .hi-nav {
          position: sticky;
          top: 0;
          z-index: 10000;
          width: 100%;
          background: rgba(7, 11, 31, 0.97);
          border-bottom: 1px solid rgba(147, 197, 253, 0.28);
          backdrop-filter: blur(14px);
        }

        .hi-nav-inner {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 16px;
          min-height: 72px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .hi-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          color: #eef4ff;
          text-decoration: none;
          flex-shrink: 0;
        }

        .hi-mark {
          width: 44px;
          height: 44px;
          border-radius: 16px;
          background: linear-gradient(180deg, #dbeafe 0%, #93c5fd 55%, #60a5fa 100%);
          color: #07111f;
          font-family: monospace;
          font-weight: 900;
          display: grid;
          place-items: center;
        }

        .hi-name {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }

        .hi-name strong {
          font-family: monospace;
          font-size: 12px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }

        .hi-name span {
          color: #94a3b8;
          font-size: 12px;
        }

        .hi-links {
          flex: 1;
          display: flex;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          align-items: center;
        }

        .hi-links::-webkit-scrollbar {
          display: none;
        }

        .hi-link {
          min-height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          border: 1px solid rgba(147, 197, 253, 0.18);
          background: rgba(15, 23, 42, 0.7);
          color: #dbeafe;
          padding: 0 14px;
          font-family: monospace;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          text-decoration: none;
          white-space: nowrap;
        }

        .hi-link:hover {
          color: #ffffff;
          border-color: rgba(147, 197, 253, 0.55);
          background: rgba(30, 41, 59, 0.95);
        }

        .hi-active {
          background: #93c5fd;
          color: #07111f;
          border-color: #93c5fd;
        }

        .hi-account {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }

        @media (max-width: 760px) {
          .hi-name {
            display: none;
          }

          .hi-nav-inner {
            min-height: 64px;
            padding: 0 10px;
          }

          .hi-link {
            min-height: 42px;
            font-size: 10px;
            padding: 0 11px;
          }
        }
      `}</style>

      <nav className="hi-nav" aria-label="Main navigation">
        <div className="hi-nav-inner">
          <a href="/workshop" className="hi-brand" aria-label="Hovel Ideanator home">
            <div className="hi-mark">HI</div>
            <span className="hi-name">
              <strong>Hovel Ideanator</strong>
              <span>by Hovel Ideas</span>
            </span>
          </a>

          <div className="hi-links">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={isActive(pathname, item.href) ? "hi-link hi-active" : "hi-link"}
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="hi-account">
            {authReady && signedIn ? (
              <>
                <a href="/account" className="hi-link">Account</a>
                <a href="/workshop" className="hi-link" onClick={signOut}>Sign Out</a>
              </>
            ) : authReady ? (
              <a href={loginHref} className="hi-link hi-active">Sign In</a>
            ) : null}
          </div>
        </div>
      </nav>
    </>
  );
}
