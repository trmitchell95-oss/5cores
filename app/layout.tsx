import type { Metadata } from "next";
import type { ReactNode } from "react";
import HelpLink from "./components/HelpLink";
import FeedbackLink from "./components/FeedbackLink";
import "./globals.css";

export const metadata: Metadata = {
  title: "HOVEL EDITOR",
  description:
    "A rough-edged writing diagnostics workshop for The Council, SPHINX, Projects, and Re-Read reports.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
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

        {children}

        <a href="/beta-terms" className="hovel-beta-terms-link">
          Beta Terms
        </a>

        <HelpLink />
        <FeedbackLink />

        <style>{`
          body {
            padding-top: 92px;
          }
          .hovel-global-nav {
            position: fixed;
            top: 14px;
            right: 18px;
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 7px;
            padding: 7px;
            border: 1px solid rgba(255, 255, 255, 0.16);
            border-radius: 999px;
            background: rgba(14, 13, 11, 0.88);
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.55);
            backdrop-filter: blur(14px);
          }

          .hovel-global-nav-mark {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 14px;
            background: #c8935a;
            color: #0e0d0b;
            font-family: monospace;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 0.02em;
            text-decoration: none;
            box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.18);
            flex: 0 0 auto;
          }

          .hovel-global-nav-mark:hover {
            filter: brightness(1.08);
          }

          .hovel-global-nav-link {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 36px;
            border: 1px solid rgba(200, 147, 90, 0.38);
            background: #17120d;
            color: #f0ece4;
            border-radius: 999px;
            padding: 0 13px;
            font-family: monospace;
            font-size: 11px;
            font-weight: 900;
            letter-spacing: 0.13em;
            text-transform: uppercase;
            text-decoration: none;
            white-space: nowrap;
            transition:
              filter 140ms ease,
              border-color 140ms ease,
              color 140ms ease,
              background 140ms ease;
          }

          .hovel-global-nav-link:hover {
            filter: brightness(1.08);
            border-color: #facc15;
            color: #facc15;
          }

          .hovel-global-nav-primary {
            background: #facc15;
            color: #000000;
            border-color: rgba(255, 255, 255, 0.35);
          }

          .hovel-global-nav-primary:hover {
            color: #000000;
            border-color: #f0ece4;
          }

          .hovel-beta-terms-link {
            position: fixed;
            left: 50%;
            bottom: 28px;
            transform: translateX(-50%);
            z-index: 9998;
            color: rgba(240, 236, 228, 0.52);
            font-family: monospace;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            text-decoration: none;
          }

          .hovel-beta-terms-link:hover {
            color: #c8935a;
            text-decoration: underline;
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
            box-shadow: 0 18px 55px rgba(0, 0, 0, 0.35);
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
            box-shadow: 0 18px 55px rgba(0, 0, 0, 0.45);
          }

          .hovel-help-link:hover {
            filter: brightness(1.08);
          }

          @media (max-width: 860px) {
            body {
              padding-top: 86px;
            }
            .hovel-global-nav {
              top: 10px;
              right: 10px;
              left: 10px;
              justify-content: center;
              gap: 6px;
              padding: 7px;
              border-radius: 22px;
            }

            .hovel-global-nav-mark {
              width: 34px;
              height: 34px;
              border-radius: 12px;
              font-size: 10px;
            }

            .hovel-global-nav-link {
              min-height: 34px;
              padding: 0 9px;
              font-size: 9px;
              letter-spacing: 0.06em;
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

            .hovel-beta-terms-link {
              bottom: 18px;
              font-size: 9px;
            }
          }

          @media (max-width: 460px) {
            .hovel-global-nav-link {
              padding: 0 7px;
              font-size: 8px;
              letter-spacing: 0.04em;
            }
          }
        `}</style>
      </body>
    </html>
  );
}



