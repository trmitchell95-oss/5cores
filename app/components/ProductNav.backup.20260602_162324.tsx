"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

function isIdeanatorPath(pathname: string, product: string) {
  return (
    product === "idea" ||
    pathname === "/idea" ||
    pathname.startsWith("/idea/") ||
    pathname === "/ideas" ||
    pathname === "/ideanator" ||
    pathname === "/the-ideanator" ||
    pathname.startsWith("/ideanator/") ||
    pathname.endsWith("/compare")
  );
}

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
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

  async function handleSignOut(event: React.MouseEvent<HTMLAnchorElement>) {
    event.preventDefault();

    const supabase = getSupabaseClient();
    await supabase.auth.signOut();

    window.location.href = isIdeanator ? "/idea" : "/";
  }

  const authLink = authReady && signedIn ? (
    <a href={isIdeanator ? "/idea" : "/"} className="hovel-global-nav-link" onClick={handleSignOut}>
      SIGN OUT
    </a>
  ) : (
    <a href={loginHref} className="hovel-global-nav-link">
      SIGN IN
    </a>
  );

  if (isIdeanator) {
    return (
      <nav
        className="hovel-global-nav hovel-global-nav-ideanator"
        aria-label="Ideanator navigation"
      >
        <a href="/idea" className="hovel-global-nav-mark" aria-label="Ideanator home">
          ID
        </a>

        <a href="/idea" className="hovel-global-nav-link hovel-global-nav-primary">
          IDEANATOR
        </a>

        <a href="/idea?start=intake" className="hovel-global-nav-link">
          IDEA CHECK
        </a>

        <a href="/idea/saved" className="hovel-global-nav-link">
          IDEA REPORTS
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

