"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
          color: "#ef4444",
        }}
      >
        System malfunction
      </span>
      <h1 style={{ fontSize: "clamp(1.5rem, 4vw, 2.2rem)", fontWeight: 700, color: "#eee" }}>
        Something went wrong
      </h1>
      <p style={{ color: "#888", maxWidth: "380px", fontSize: "0.9rem" }}>
        An unexpected error occurred. Try again, or head back to base if it keeps happening.
      </p>
      <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
        <button
          onClick={reset}
          style={{
            background: "#f5a623",
            color: "#0a0a0a",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontSize: "0.8rem",
            padding: "0.7rem 1.5rem",
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
        <a
          href="/"
          style={{
            border: "1px solid #f5a623",
            color: "#f5a623",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            fontSize: "0.8rem",
            padding: "0.7rem 1.5rem",
            textDecoration: "none",
          }}
        >
          Return to base
        </a>
      </div>
    </main>
  );
}
