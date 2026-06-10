import type { Metadata } from "next";
import type { ReactNode } from "react";
import ProductNav from "./components/ProductNav";
import HelpLink from "./components/HelpLink";
import FeedbackLink from "./components/FeedbackLink";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "The Ideanator",
    template: "%s | The Ideanator",
  },
  description:
    "Test raw ideas. The Ideanator gives you an honest read on what you have, what is strong, what needs work, and what to do next.",
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
