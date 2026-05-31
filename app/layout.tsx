import HelpLink from "./components/HelpLink";
import FeedbackLink from "./components/FeedbackLink";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "5 CORE",
  description: "Five editorial minds. One blunt verdict. No bullshit.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <a
          href="/sphinx"
          style={{
            position: "fixed",
            top: "18px",
            right: "18px",
            zIndex: 2147483647,
            background: "#facc15",
            color: "#000000",
            padding: "12px 18px",
            borderRadius: "999px",
            fontWeight: 900,
            letterSpacing: "0.16em",
            fontSize: "13px",
            textDecoration: "none",
            boxShadow: "0 20px 40px rgba(0,0,0,0.65)",
            border: "1px solid rgba(255,255,255,0.35)"
          }}
        >
          SPHINX
        </a>{children}          <FeedbackLink />
          <style>{`
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

            @media (max-width: 640px) {
              .hovel-feedback-link {
                right: 14px;
                bottom: 14px;
                padding: 10px 13px;
                font-size: 10px;
              }
            }
          `}</style>
                  <style>{`
            /* mobile-kill-floating-sphinx */
            @media (max-width: 760px) {
              body > a[href="/sphinx"],
              body > div > a[href="/sphinx"],
              body > .sphinx-button,
              body > .sphinx-pill,
              body > .floating-sphinx,
              body > .sphinx-floating,
              body > .sphinx-float,
              a[aria-label="Sphinx"][style*="fixed"],
              a[href="/sphinx"][style*="fixed"] {
                display: none !important;
                pointer-events: none !important;
                visibility: hidden !important;
              }
            }
          `}</style>
                  <HelpLink />
          <style>{`
            .hovel-help-link {
              position: fixed;
              left: 22px;
              bottom: 22px;
              z-index: 9998;
              border: 1px solid #302a24;
              background: #11100e;
              color: #c8935a;
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

            .hovel-help-link:hover {
              border-color: #c8935a;
            }

            @media (max-width: 640px) {
              .hovel-help-link {
                left: 14px;
                bottom: 14px;
                padding: 10px 13px;
                font-size: 10px;
              }
            }
          `}</style>
                  <style>{`
            /* help-button-big-yellow-final */
            .hovel-help-link {
              position: fixed !important;
              left: 22px !important;
              bottom: 84px !important;
              z-index: 10000 !important;
              border: 1px solid #c8935a !important;
              background: #c8935a !important;
              color: #0e0d0b !important;
              border-radius: 999px !important;
              padding: 14px 22px !important;
              font-family: monospace !important;
              font-size: 12px !important;
              font-weight: 900 !important;
              letter-spacing: 0.16em !important;
              text-transform: uppercase !important;
              text-decoration: none !important;
              box-shadow: 0 18px 55px rgba(0,0,0,0.45) !important;
            }

            .hovel-help-link:hover {
              filter: brightness(1.08) !important;
            }

            @media (max-width: 640px) {
              .hovel-help-link {
                left: 14px !important;
                bottom: 82px !important;
                padding: 12px 18px !important;
                font-size: 11px !important;
              }
            }
          `}</style>
        </body>
    </html>
  );
}










