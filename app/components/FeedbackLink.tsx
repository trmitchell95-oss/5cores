"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FeedbackLink() {
  const pathname = usePathname();

  if (pathname === "/feedback") return null;

  return (
    <Link
      href={`/feedback?from=${encodeURIComponent(pathname || "/")}`}
      className="hovel-feedback-link"
      aria-label="Send beta feedback"
    >
      Feedback
    </Link>
  );
}
