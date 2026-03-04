export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        gap: "1rem",
      }}
    >
      <h1 style={{ fontSize: "2.5rem", fontWeight: 700 }}>Archion Build</h1>
      <p style={{ color: "var(--text-muted)", fontSize: "1.125rem" }}>
        AI-powered architectural floor plan generator
      </p>
    </main>
  );
}
