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
        </a>{children}</body>
    </html>
  );
}
