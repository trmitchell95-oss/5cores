import type { Metadata } from "next";
import type { ReactNode } from "react";
import ProductNav from "./components/ProductNav";
import HelpLink from "./components/HelpLink";
import FeedbackLink from "./components/FeedbackLink";
import "./globals.css";

export const metadata: Metadata = {
  title: "HOVEL IDEAS",
  description:
    "A rough-edged creative workshop for HOVEL Editor, The Ideanator, SPHINX, Projects, and Re-Read reports.",
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

          .hovel-global-nav-ideanator {
            border-color: rgba(240, 179, 95, 0.28);
            background: rgba(12, 12, 12, 0.9);
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

          .hovel-global-nav-ideanator .hovel-global-nav-mark {
            background: #f0b35f;
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

          .hovel-global-nav-ideanator .hovel-global-nav-link {
            border-color: rgba(255, 215, 135, 0.28);
            background:
              radial-gradient(circle at 13px 50%, rgba(255, 231, 167, 0.72) 0 2px, transparent 3px),
              #17120d;
            padding-left: 20px;
            box-shadow: 0 0 16px rgba(240, 179, 95, 0.08);
          }

          .hovel-global-nav-ideanator .hovel-global-nav-link:hover {
            box-shadow: 0 0 24px rgba(240, 179, 95, 0.18);
          }

          .hovel-global-nav-ideanator .hovel-global-nav-primary {
            background:
              radial-gradient(circle at 13px 50%, #fff3c4 0 3px, transparent 4px),
              linear-gradient(180deg, #ffd27a 0%, #f0b35f 56%, #c98438 100%);
            color: #18100a;
            border-color: rgba(255, 241, 190, 0.62);
            box-shadow:
              0 0 24px rgba(240, 179, 95, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.38);
          }

          /* IDEANATOR LIGHT BULB NAV PASS */

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
          @media (max-width: 520px) {
            body {
              padding-top: 96px;
              padding-bottom: 84px;
            }

            .hovel-global-nav {
              top: 8px;
              left: 8px;
              right: 8px;
              display: flex;
              align-items: center;
              justify-content: flex-start;
              gap: 6px;
              overflow-x: auto;
              overflow-y: hidden;
              padding: 6px;
              border-radius: 18px;
              scrollbar-width: none;
              -webkit-overflow-scrolling: touch;
            }

            .hovel-global-nav::-webkit-scrollbar {
              display: none;
            }

            .hovel-global-nav-mark {
              width: 38px;
              height: 38px;
              min-width: 38px;
              flex: 0 0 auto;
              border-radius: 12px;
              font-size: 10px;
            }

            .hovel-global-nav-link {
              width: auto;
              min-width: max-content;
              min-height: 38px;
              flex: 0 0 auto;
              padding: 0 10px;
              font-size: 9px;
              letter-spacing: 0.04em;
              border-radius: 13px;
            }

            .hovel-beta-terms-link {
              display: none;
            }

            .hovel-help-link {
              left: 12px;
              bottom: 12px;
              padding: 10px 13px;
              font-size: 9px;
              letter-spacing: 0.08em;
            }

            .hovel-feedback-link {
              right: 12px;
              bottom: 12px;
              padding: 10px 13px;
              font-size: 9px;
              letter-spacing: 0.08em;
            }

            .home-shell .page-wrap,
            .dashboard-shell .page-wrap,
            .submit-shell .app-wrap,
            .projects-shell,
            .reread-shell,
            .report-shell .page-wrap,
            .help-shell,
            .terms-shell .wrap,
            .sphinx-shell,
            .compare-shell .wrap,
            .ideanator-page {
              padding-left: 12px !important;
              padding-right: 12px !important;
              padding-bottom: 110px !important;
            }
          }
          @media (max-width: 370px) {
            body {
              padding-top: 128px;
            }

            .hovel-global-nav-link {
              font-size: 8px;
              letter-spacing: 0.02em;
              padding: 0 4px;
            }

            .hovel-global-nav-mark {
              font-size: 9px;
            }
          }
        `}</style>
      </body>
    </html>
  );
}



