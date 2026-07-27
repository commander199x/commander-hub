"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { C } from "@/lib/theme";

export default function MapSearch({ defaultValue }: { defaultValue: string }) {
  const [value, setValue] = useState(defaultValue);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Debounce so we're not pushing a new URL on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }
      params.delete("page"); // any new search starts back at page 1
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative mt-8 max-w-sm">
      <Search size={14} style={{ color: C.muted }} className="absolute left-3 top-1/2 -translate-y-1/2" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search maps by name..."
        aria-label="Search maps"
        className="w-full pl-9 pr-3 py-2.5 text-xs uppercase tracking-widest outline-none"
        style={{ background: C.panel, border: `1px solid ${C.line}`, color: C.paper }}
      />
    </div>
  );
}