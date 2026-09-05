import "@/app/animations.css";

/**
 * Compact tank loading indicator for inline use inside client components
 * (e.g. "if (loading) return <TankSpinner />"). For full-page route
 * transitions, Next.js automatically uses app/loading.tsx instead.
 */
export default function TankSpinner({ label = "Loading..." }: { label?: string }) {
  return (
    <div
      className="cz-tank-loader-wrap"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "1rem 0",
      }}
    >
      <svg
        className="cz-tank-body"
        width="48"
        height="27"
        viewBox="0 0 90 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="6" y="30" width="78" height="12" rx="6" fill="#333" />
        <line
          className="cz-tank-tread-marks"
          x1="8"
          y1="36"
          x2="82"
          y2="36"
          stroke="#555"
          strokeWidth="2"
          strokeDasharray="4 4"
        />
        <rect x="18" y="18" width="46" height="16" rx="3" fill="#f5a623" />
        <rect x="30" y="8" width="22" height="14" rx="2" fill="#d4891a" />
        <rect x="50" y="12" width="26" height="5" rx="2" fill="#d4891a" />
        <circle cx="41" cy="14" r="2.5" fill="#1a1a1a" />
      </svg>
      <span
        style={{
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "#888",
        }}
      >
        {label}
      </span>
    </div>
  );
}
