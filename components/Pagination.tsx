import Link from "next/link";
import { C } from "@/lib/theme";

function getPageRange(current: number, total: number): (number | "...")[] {
  const delta = 1;
  const range: (number | "...")[] = [];
  for (let i = 1; i <= total; i++) {
    if (i === 1 || i === total || (i >= current - delta && i <= current + delta)) {
      range.push(i);
    } else if (range[range.length - 1] !== "...") {
      range.push("...");
    }
  }
  return range;
}

export default function Pagination({
  currentPage,
  totalPages,
  query,
}: {
  currentPage: number;
  totalPages: number;
  query: string;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (page: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `/downloads?${qs}` : "/downloads";
  };

  const pages = getPageRange(currentPage, totalPages);

  return (
    <nav aria-label="Map pagination" className="flex flex-wrap items-center gap-2 mt-10 text-xs uppercase tracking-widest">
      <Link
        href={hrefFor(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage === 1}
        className="px-3 py-2"
        style={{
          border: `1px solid ${C.line}`,
          color: currentPage === 1 ? C.lineStrong : C.paper,
          pointerEvents: currentPage === 1 ? "none" : "auto",
        }}
      >
        Prev
      </Link>

      {pages.map((p, idx) =>
        p === "..." ? (
          <span key={`dots-${idx}`} style={{ color: C.muted }}>
            &hellip;
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(p)}
            className="px-3 py-2"
            style={{
              border: `1px solid ${p === currentPage ? C.amber : C.line}`,
              background: p === currentPage ? C.amber : "transparent",
              color: p === currentPage ? C.void : C.paper,
              fontWeight: p === currentPage ? 600 : 400,
            }}
          >
            {p}
          </Link>
        )
      )}

      <Link
        href={hrefFor(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage === totalPages}
        className="px-3 py-2"
        style={{
          border: `1px solid ${C.line}`,
          color: currentPage === totalPages ? C.lineStrong : C.paper,
          pointerEvents: currentPage === totalPages ? "none" : "auto",
        }}
      >
        Next
      </Link>
    </nav>
  );
}