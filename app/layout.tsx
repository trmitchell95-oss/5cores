import type { Metadata } from "next";
import type { ReactNode } from "react";
import ProductNav from "./components/ProductNav";
import HelpLink from "./components/HelpLink";
import FeedbackLink from "./components/FeedbackLink";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Hovel Ideanator",
    template: "%s | Hovel Ideanator",
  },
  description:
    "A single Hovel Ideas workshop for turning rough ideas, drafts, reusable rigs, reports, and revision work into something usable.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ProductNav />

        {children}

        <div className="hovel-support-dock" aria-label="Support links">
          <HelpLink />
          <FeedbackLink />
          <a href="/beta-terms" className="hovel-beta-terms-link">
            Beta Terms
          </a>
        </div>
      </body>
    </html>
  );
}
