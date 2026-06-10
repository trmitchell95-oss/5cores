"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

function isIdeanatorPath(pathname: string, product: string) {
  return (
    product === "idea" ||
    product === "ideanator" ||
    pathname === "/idea" ||
    pathname.startsWith("/idea/") ||
    pathname === "/ideas" ||
    pathname === "/ideanator" ||
    pathname.startsWith("/ideanator/") ||
    pathname === "/ideanator-login" ||
    pathname.startsWith("/ideanator-login/") ||
    pathname === "/the-ideanator" ||
    pathname === "/rigs" ||
    pathname.startsWith("/rigs/") ||
    pathname === "/saved-ideas" ||
    pathname.startsWith("/saved-ideas/")
  );
}

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

function navClass(isActive: boolean) {
  return isActive
    ? "hovel-global-nav-link hovel-global-nav-primary"
    : "hovel-global-nav-link";
}

export default function ProductNav() {
  const pathname = usePathname() || "/";
  const [product, setProduct] = useState("");
  const [host, setHost] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [authReady, setAuthReady] = useState(false);
  const [loginHref, setLoginHref] = useState("/login");

  useEffect(() => {
    const currentProduct =
      new URLSearchParams(window.location.search).get("product") || "";
    const currentHost = window.location.hostname.toLowerCase();
    const nextPath = `${window.location.pathname}${window.location.search}`;
    const isIdeanator =
      currentHost === "theideanator.com" ||
      currentHost === "www.theideanator.com" ||
      isIdeanatorPath(window.location.pathname, currentProduct);

    setProduct(currentProduct);
    setHost(currentHost);
    setLoginHref(
      isIdeanator
        ? `/login?next=${encodeURIComponent(nextPath)}`
        : `/login?next=${encodeURIComponent(nextPath)}`
    );

    let stillMounted = true;

    async function loadSession() {
      try {
        const supabase = getSupabaseClient();

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!stillMounted) return;

        setSignedIn(Boolean(session?.access_token));
        setUserEmail(session?.user?.email || "");
      } catch {
        if (!stillMounted) return;

        setSignedIn(false);
        setUserEmail("");
      } finally {
        if (stillMounted) {
          setAuthReady(true);
        }
      }
    }

    loadSession();

    return () => {
      stillMounted = false;
    };
  }, [pathname]);

  const isIdeanator =
    isIdeanatorPath(pathname, product) ||
    host === "theideanator.com" ||
    host === "www.theideanator.com";

  async function handleSignOut(event: MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } finally {
      window.location.href = isIdeanator ? "/the-ideanator" : "/";
    }
  }

  // â”€â”€ Ideanator nav â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (isIdeanator) {
    const rigWorkbenchActive =
      pathname === "/ideanator" || pathname.startsWith("/ideanator/");
    const ideaReportsActive =
      pathname === "/idea/saved" ||
      pathname === "/saved-ideas" ||
      pathname.startsWith("/saved-ideas/") ||
      pathname === "/rigs" ||
      pathname.startsWith("/rigs/");
    const ideaCheckActive =
      (pathname === "/idea" || pathname.startsWith("/idea/")) &&
      !ideaReportsActive;

    const authLink =
      authReady && signedIn ? (
        <div className="ideanator-nav-account">
          <span className="ideanator-nav-signed-in">
            Signed in as {userEmail}
          </span>
          <a href="/account" className="hovel-global-nav-link">
            Account
          </a>
          <a
            href="/idea"
            className="hovel-global-nav-link"
            onClick={handleSignOut}
          >
            Sign Out
          </a>
        </div>
      ) : authReady ? (
        <a href={loginHref} className="hovel-global-nav-link">
          Sign In
        </a>
      ) : null;

    return (
      <>
        <style>{`
          .ideanator-nav-account {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
          }

          .ideanator-nav-signed-in {
            font-size: 11px;
            color: #f0b35f;
            font-family: monospace;
            letter-spacing: 0.05em;
            white-space: nowrap;
            opacity: 0.85;
          }

          @media (max-width: 700px) {
            .ideanator-nav-signed-in {
              display: none;
            }
          }
        `}</style>

        <nav
          className="hovel-global-nav hovel-global-nav-ideanator"
          aria-label="Ideanator navigation"
        >
          <a href="/the-ideanator" className="hovel-global-nav-mark" aria-label="Ideanator home">
            ID
          </a>

          <a href="/idea?start=intake" className={navClass(ideaCheckActive)}>
            Test an Idea
          </a>

          <a href="/ideanator" className={navClass(rigWorkbenchActive)}>
            Build a Rig
          </a>

          <a href="/idea/saved" className={navClass(ideaReportsActive)}>
            My Reports
          </a>

          <a href="/idea/help" className={navClass(pathname === "/idea/help")}>
            Help
          </a>

          {authLink}
        </nav>
      </>
    );
  }

  // â”€â”€ Hovel Editor nav (unchanged) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const authLink =
    authReady && signedIn ? (
      <>
        <a href="/account" className="he-nav-link">
          Account
        </a>
        <a
          href="/"
          className="he-nav-link"
          onClick={handleSignOut}
        >
          Sign Out
        </a>
      </>
    ) : (
      <a href={loginHref} className="he-nav-link he-nav-link-primary">
        Sign In
      </a>
    );

  return (
    <>
      <style>{`
        .he-nav {
          position: sticky;
          top: 0;
          z-index: 10000;
          width: 100%;
          background: rgba(14, 12, 10, 0.95);
          border-bottom: 1px solid rgba(200, 147, 90, 0.22);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }

        .he-nav-inner {
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 20px;
          height: 62px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .he-nav-brand {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          flex-shrink: 0;
          margin-right: 8px;
        }

        .he-nav-mark {
          width: 36px;
          height: 36px;
          border-radius: 12px;
          background: #c8935a;
          color: #0e0d0b;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: -0.04em;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .he-nav-brand-text {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #f0ece4;
          white-space: nowrap;
        }

        .he-nav-links {
          display: flex;
          align-items: center;
          gap: 4px;
          flex: 1;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .he-nav-links::-webkit-scrollbar {
          display: none;
        }

        .he-nav-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-height: 36px;
          padding: 0 13px;
          border-radius: 999px;
          border: 1px solid transparent;
          background: transparent;
          color: #9a9186;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          text-decoration: none;
          white-space: nowrap;
          transition: color 140ms ease, border-color 140ms ease, background 140ms ease;
          cursor: pointer;
        }

        .he-nav-link:hover {
          color: #c8a96e;
          border-color: rgba(200, 147, 90, 0.35);
          background: rgba(200, 147, 90, 0.08);
        }

        .he-nav-link-sphinx {
          color: #c8a96e;
          border-color: rgba(200, 147, 90, 0.4);
          background: rgba(200, 147, 90, 0.1);
        }

        .he-nav-link-sphinx:hover {
          background: rgba(200, 147, 90, 0.18);
          border-color: rgba(200, 147, 90, 0.65);
        }

        .he-nav-link-primary {
          color: #0e0d0b;
          background: #c8a96e;
          border-color: #c8a96e;
        }

        .he-nav-link-primary:hover {
          background: #e2bf7e;
          border-color: #e2bf7e;
          color: #0e0d0b;
        }

        .he-nav-sep {
          width: 1px;
          height: 20px;
          background: rgba(255,255,255,0.1);
          flex-shrink: 0;
          margin: 0 4px;
        }

        @media (max-width: 700px) {
          .he-nav-inner {
            height: 56px;
            padding: 0 14px;
            gap: 6px;
          }

          .he-nav-brand-text {
            display: none;
          }

          .he-nav-link {
            font-size: 10px;
            padding: 0 10px;
            min-height: 34px;
            letter-spacing: 0.07em;
          }
        }

        @media (max-width: 420px) {
          .he-nav-link {
            font-size: 9px;
            padding: 0 8px;
          }
        }
      `}</style>

      <nav className="he-nav" aria-label="Hovel Editor navigation">
        <div className="he-nav-inner">
          <a href="/" className="he-nav-brand" aria-label="Hovel Editor home">
            <div className="he-nav-mark">5C</div>
            <span className="he-nav-brand-text">Hovel Editor</span>
          </a>

          <div className="he-nav-links" role="list">
            <a href="/dashboard" className="he-nav-link">Dashboard</a>
            <a href="/sphinx" className="he-nav-link he-nav-link-sphinx">Sphinx</a>
            <a href="/projects" className="he-nav-link">Projects</a>
            <a href="/reread" className="he-nav-link">Re-Read</a>
            <a href="/submit" className="he-nav-link">New Diagnosis</a>
            <a href="/admin" className="he-nav-link">Admin</a>

            <div className="he-nav-sep" aria-hidden="true" />

            {authLink}
          </div>
        </div>
      </nav>
    </>
  );
}
