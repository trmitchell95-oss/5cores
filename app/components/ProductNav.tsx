"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

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

export default function ProductNav() {
  const pathname = usePathname() || "/";
  const [product, setProduct] = useState("");
  const [host, setHost] = useState("");

  useEffect(() => {
    setProduct(new URLSearchParams(window.location.search).get("product") || "");
    setHost(window.location.hostname.toLowerCase());
  }, [pathname]);

  const isIdeanator =
    isIdeanatorPath(pathname, product) ||
    host === "theideanator.com" ||
    host === "www.theideanator.com";

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
          DROP IDEA
        </a>

        <a href="/idea/saved" className="hovel-global-nav-link">
          SAVED IDEAS
        </a>
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
    </nav>
  );
}



