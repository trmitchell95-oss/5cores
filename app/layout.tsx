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
    <html lang="en">
      <body>
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
        </body>
    </html>
  );
}




