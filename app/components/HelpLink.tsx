"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function HelpLink() {
  const pathname = usePathname(); const isIdeanator = pathname === "/the-ideanator" || pathname === "/idea" || pathname.startsWith("/idea/") || pathname === "/ideanator" || pathname.startsWith("/ideanator/") || pathname === "/saved-ideas" || pathname === "/ideanator-login" || pathname === "/beta-terms"; const helpHref = isIdeanator ? "/idea/help" : "/help";

  if (pathname === "/help" || pathname === "/idea/help") return null;

  return (
    <Link
      href={helpHref}
      className="hovel-help-link"
      aria-label="Open help"
    >
      Help
    </Link>
  );
}


