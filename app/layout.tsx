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
      <body>{children}</body>
    </html>
  );
}