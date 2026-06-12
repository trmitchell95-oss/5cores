"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SphinxFloatingButton() {
  const pathname = usePathname();

  if (pathname === "/sphinx") {
    return null;
  }

  return (
    <Link
      href="/sphinx"
      className="fixed right-6 top-24 z-[9998] rounded-full border border-yellow-300 bg-yellow-400 px-6 py-3 text-sm font-black tracking-[0.2em] text-black shadow-2xl shadow-black/70 hover:bg-yellow-300 max-sm:bottom-24 max-sm:right-4 max-sm:top-auto max-sm:px-4 max-sm:py-3 max-sm:text-[10px] max-sm:tracking-[0.14em]"
      title="Open Clean Words"
    >Clean Words</Link>
  );
}
