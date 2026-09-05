import "@/app/animations.css";

export default function Loading() {
  return (
    <div
      className="cz-tank-loader-wrap"
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.25rem",
        padding: "2rem",
      }}
    >
      <svg
        className="cz-tank-body"
        width="90"
        height="50"
        viewBox="0 0 90 50"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Treads (track base) */}
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

        {/* Hull */}
        <rect x="18" y="18" width="46" height="16" rx="3" fill="#f5a623" />

        {/* Turret */}
        <rect x="30" y="8" width="22" height="14" rx="2" fill="#d4891a" />

        {/* Barrel */}
        <rect x="50" y="12" width="26" height="5" rx="2" fill="#d4891a" />

        {/* Hatch dot */}
        <circle cx="41" cy="14" r="2.5" fill="#1a1a1a" />
      </svg>

      <p
        style={{
          fontSize: "0.75rem",
          textTransform: "uppercase",
          letterSpacing: "0.15em",
          color: "#888",
        }}
      >
        Advancing...
      </p>
    </div>
  );
}
