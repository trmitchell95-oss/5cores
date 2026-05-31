"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";

export default function OldViewRedirectPage() {
  const params = useParams();

  useEffect(() => {
    const rawId = params?.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;

    if (id) {
      window.location.replace(`/reports/${id}`);
    } else {
      window.location.replace("/dashboard");
    }
  }, [params]);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#0e0d0b",
        color: "#f0ece4",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Georgia, serif",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div>
        <div
          style={{
            color: "#c8935a",
            fontFamily: "monospace",
            fontSize: "12px",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            marginBottom: "12px",
          }}
        >
          5 CORE
        </div>

        <h1 style={{ fontSize: "42px", margin: 0 }}>
          Opening the clean report viewer...
        </h1>

        <p style={{ color: "#9a9186", marginTop: "12px" }}>
          If this page does not move automatically, go back to your dashboard and open the report from there.
        </p>
      </div>
    </main>
  );
}
