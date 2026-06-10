export default function Loading() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      background: "#07111f",
      color: "#eef4ff",
      fontFamily: "Arial, sans-serif",
      padding: 24
    }}>
      <section style={{
        width: "100%",
        maxWidth: 560,
        border: "1px solid rgba(147, 197, 253, 0.35)",
        background: "rgba(15, 23, 42, 0.96)",
        borderRadius: 28,
        padding: 36,
        boxShadow: "0 24px 70px rgba(0,0,0,0.35)"
      }}>
        <div style={{
          color: "#93c5fd",
          fontFamily: "monospace",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          fontSize: 12,
          fontWeight: 900,
          marginBottom: 12
        }}>
          Loading
        </div>

        <h1 style={{ margin: 0, fontSize: 42, lineHeight: 1 }}>
          Opening the workshop...
        </h1>

        <p style={{ color: "#cbd5e1", lineHeight: 1.6, marginTop: 16, fontSize: 18 }}>
          Give us one second. The workshop is getting ready.
        </p>
      </section>
    </main>
  );
}
