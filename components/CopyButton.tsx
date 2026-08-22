"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { C } from "@/lib/theme";

export default function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can fail on non-HTTPS/localhost edge cases — fail silently
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest px-2 py-1 transition-colors"
      style={{ border: `1px solid ${C.lineStrong}`, color: copied ? C.radar : C.amber }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
