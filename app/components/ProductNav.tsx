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
  const [authReady, setAuthReady] = useState(false);
  const [loginHref, setLoginHref] = useState("/login");

  useEffect(() => {
    const currentProduct =
      new URLSearchParams(window.location.search).get("product") || "";
    const currentHost = window.location.hostname.toLowerCase();
    const nextPath = `${window.location.pathname}${window.location.search}`;

    setProduct(currentProduct);
    setHost(currentHost);
    setLoginHref(`/login?next=${encodeURIComponent(nextPath)}`);

    let stillMounted = true;

    async function loadSession() {
      try {
        const supabase = getSupabaseClient();

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!stillMounted) return;

        setSignedIn(Boolean(session?.access_token));
      } catch {
        if (!stillMounted) return;

        setSignedIn(false);
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
      window.location.href = isIdeanator ? "/idea" : "/";
    }
  }

  const authLink = authReady && signedIn ? (
    <>
      <a href="/account" className="hovel-global-nav-link">
        ACCOUNT
      </a>

      <a
        href={isIdeanator ? "/idea" : "/"}
        className="hovel-global-nav-link"
        onClick={handleSignOut}
      >
        SIGN OUT
      </a>
    </>
  ) : (
    <a href={loginHref} className="hovel-global-nav-link">
      SIGN IN
    </a>
  );

  if (isIdeanator) {
    const rigWorkbenchActive =
      pathname === "/ideanator" || pathname.startsWith("/ideanator/");
    const ideaReportsActive = pathname === "/idea/saved";
    const ideaCheckActive =
      (pathname === "/idea" || pathname.startsWith("/idea/")) &&
      !ideaReportsActive;
    const rigLibraryActive =
      pathname === "/rigs" ||
      pathname.startsWith("/rigs/") ||
      pathname === "/saved-ideas" ||
      pathname.startsWith("/saved-ideas/");

    return (
      <nav
        className="hovel-global-nav hovel-global-nav-ideanator"
        aria-label="Ideanator navigation"
      >
        <a href="/idea" className="hovel-global-nav-mark" aria-label="Ideanator home">
          ID
        </a>

        <a href="/idea?start=intake" className={navClass(ideaCheckActive)}>
          CHECK
        </a>

        <a href="/ideanator" className={navClass(rigWorkbenchActive)}>
          RIGS
        </a>

        <a href="/idea/saved" className={navClass(ideaReportsActive)}>
          REPORTS
        </a>

        <a href="/saved-ideas" className={navClass(rigLibraryActive)}>
          LIBRARY
        </a>

        {authLink}
      </nav>
    );
  }

  return (
    <nav className="hovel-global-nav" aria-label="Hovel Editor navigation">
      <a href="/" className="hovel-global-nav-mark" aria-label="Hovel Editor home">
        5C
      </a>

      <a href="/dashboard" className="hovel-global-nav-link">
        DASHBOARD
      </a>

      <a href="/sphinx" className="hovel-global-nav-link hovel-global-nav-primary">
        SPHINX
      </a>

      <a href="/projects" className="hovel-global-nav-link">
        PROJECTS
      </a>

      <a href="/reread" className="hovel-global-nav-link">
        RE-READ
      </a>

      {authLink}
    </nav>
  );
}
