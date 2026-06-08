import type { Metadata } from "next";
import type { ReactNode } from "react";
import ProductNav from "./components/ProductNav";
import HelpLink from "./components/HelpLink";
import FeedbackLink from "./components/FeedbackLink";
import "./globals.css";
import "./globals-cela-additions.css";

export const metadata: Metadata = {
  title: "Hovel Editor",
  description:
    "A manuscript diagnostic engine for independent writers. The Council reads your work through five distinct editorial lenses and gives you clear, practical feedback.",
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

