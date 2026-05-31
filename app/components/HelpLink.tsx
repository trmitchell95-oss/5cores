"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function HelpLink() {
  const pathname = usePathname();

  if (pathname === "/help") return null;

  return (
    <Link
      href="/help"
      className="hovel-help-link"
      aria-label="Open help"
    >
      Help
    </Link>
  );
}
