import type { Metadata } from "next";
import type { ReactNode } from "react";
import HelpLink from "./components/HelpLink";
import FeedbackLink from "./components/FeedbackLink";
import HovelManifestoFloat from "./start/HovelManifestoFloat";
import "./globals.css";

export const metadata: Metadata = {
  title: "5 CORE",
  description: "Five editorial minds. One blunt verdict. No bullshit.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <HovelManifestoFloat />

        <a
          href="/sphinx"
          className="hovel-sphinx-link"
          aria-label="Open Sphinx"
        >
          SPHINX
        </a>

        {children}

        <HelpLink />
        <FeedbackLink />

        <style>{`
          .hovel-sphinx-link {
            position: fixed;
            top: 18px;
            right: 18px;
            z-index: 10000;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 1px solid rgba(255,255,255,0.35);
            background: #facc15;
            color: #000000;
            border-radius: 999px;
            padding: 12px 18px;
            font-family: monospace;
            font-size: 13px;
            font-weight: 900;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            text-decoration: none;
            box-shadow: 0 20px 40px rgba(0,0,0,0.65);
          }

          .hovel-sphinx-link:hover {
            filter: brightness(1.08);
          }

          .hovel-feedback-link {
            position: fixed;
            right: 22px;
            bottom: 22px;
            z-index: 9999;
            border: 1px solid #4b3a1f;
            background: #c8935a;
            color: #0e0d0b;
            border-radius: 999px;
            padding: 12px 16px;
            font-family: monospace;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            text-decoration: none;
            box-shadow: 0 18px 55px rgba(0,0,0,0.35);
          }

          .hovel-feedback-link:hover {
            filter: brightness(1.08);
          }

          .hovel-help-link {
            position: fixed;
            left: 22px;
            bottom: 84px;
            z-index: 9999;
            border: 1px solid #c8935a;
            background: #c8935a;
            color: #0e0d0b;
            border-radius: 999px;
            padding: 14px 22px;
            font-family: monospace;
            font-size: 12px;
            font-weight: 900;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            text-decoration: none;
            box-shadow: 0 18px 55px rgba(0,0,0,0.45);
          }

          .hovel-help-link:hover {
            filter: brightness(1.08);
          }

          @media (max-width: 640px) {
            .hovel-sphinx-link {
              top: 12px;
              right: 12px;
              padding: 10px 14px;
              font-size: 11px;
              letter-spacing: 0.12em;
            }

            .hovel-feedback-link {
              right: 14px;
              bottom: 14px;
              padding: 10px 13px;
              font-size: 10px;
            }

            .hovel-help-link {
              left: 14px;
              bottom: 74px;
              padding: 10px 15px;
              font-size: 10px;
              letter-spacing: 0.12em;
            }
          }
        `}</style>
      </body>
    </html>
  );
}
