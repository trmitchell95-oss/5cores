"use client";

import { useEffect } from "react";

export default function IdeanatorLoginRedirectPage() {
  useEffect(() => {
    const query = window.location.search || "";
    window.location.replace(`/login${query}`);
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0e0d0b",
        color: "#f0ece4",
        padding: 24,
        fontFamily: "Georgia, serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 520,
          border: "1px solid #2a2520",
          background: "#161410",
          borderRadius: 28,
          padding: 34,
          boxShadow: "0 24px 70px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            color: "#c8935a",
            fontFamily: "monospace",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontSize: 12,
            fontWeight: 900,
            marginBottom: 12,
          }}
        >
          The Ideanator
        </div>

        <h1 style={{ margin: 0, fontSize: 44, lineHeight: 1 }}>
          Opening sign-in...
        </h1>

        <p style={{ color: "#aaa096", lineHeight: 1.6, marginTop: 16 }}>
          Sending you to the new magic-link login.
        </p>
      </section>
    </main>
  );
}
