"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FeedbackLink() {
  const pathname = usePathname();
  const isIdeanator =
    pathname === "/the-ideanator" ||
    pathname === "/idea" ||
    pathname.startsWith("/idea/") ||
    pathname === "/ideanator" ||
    pathname.startsWith("/ideanator/") ||
    pathname === "/saved-ideas" ||
    pathname === "/ideanator-login";

  const from = encodeURIComponent(pathname || "/");
  const feedbackHref = isIdeanator
    ? `/feedback?product=ideanator&from=${from}`
    : `/feedback?from=${from}`;
  if (pathname === "/feedback") return null;

  return (
    <Link
      href={feedbackHref}
      className="hovel-feedback-link"
      aria-label="Send beta feedback"
    >
      Feedback
    </Link>
  );
}
