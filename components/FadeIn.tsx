"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

/**
 * Wraps any content and fades + slides it up into view once it scrolls
 * into the viewport. Purely visual — falls back gracefully to always-visible
 * if IntersectionObserver isn't available for some reason.
 *
 * Usage:
 *   <FadeIn><YourContent /></FadeIn>
 *   <FadeIn delay={150}><YourContent /></FadeIn>
 */
export default function FadeIn({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
