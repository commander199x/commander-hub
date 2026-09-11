import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "2rem",
        gap: "0.75rem",
      }}
    >
      <span
        style={{
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          color: "#888",
        }}
      >
        Sector not found
      </span>
      <h1
        style={{
          fontSize: "clamp(3rem, 8vw, 5rem)",
          fontWeight: 700,
          color: "#f5a623",
          lineHeight: 1,
        }}
      >
        404
      </h1>
      <p style={{ color: "#888", maxWidth: "380px", fontSize: "0.9rem" }}>
        This position doesn't exist on the map. The page you're looking for may have been moved or never existed.
      </p>
      <Link
        href="/"
        style={{
          marginTop: "1rem",
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "#f5a623",
          color: "#0a0a0a",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          fontSize: "0.8rem",
          padding: "0.7rem 1.5rem",
        }}
      >
        Return to base
      </Link>
    </main>
  );
}
