export default function Loading() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background:
          "radial-gradient(circle at 14% 0%, rgba(181, 90, 28, 0.25), transparent 32rem), radial-gradient(circle at 88% 8%, rgba(91, 117, 55, 0.16), transparent 28rem), linear-gradient(135deg, #28180d 0%, #11100c 48%, #2b1a0f 100%)",
        color: "#f8ecd2",
        fontFamily: "Georgia, serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 520,
          border: "1px solid rgba(222, 176, 96, 0.42)",
          background: "linear-gradient(180deg, rgba(51, 33, 21, 0.97), rgba(24, 19, 14, 0.97))",
          borderRadius: 28,
          padding: 34,
          boxShadow: "0 24px 70px rgba(0,0,0,0.4)",
        }}
      >
        <div
          style={{
            color: "#d88a1f",
            fontFamily: "monospace",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            fontWeight: 900,
            fontSize: 12,
            marginBottom: 12,
          }}
        >
          Hovel Ideanator
        </div>
        <h1 style={{ margin: 0, fontSize: 44, lineHeight: 1, color: "#fff1cf" }}>
          Loading
        </h1>
        <p style={{ color: "#f5dfb4", fontSize: 18, lineHeight: 1.5 }}>
          Getting the workshop ready.
        </p>
      </section>
    </main>
  );
}
