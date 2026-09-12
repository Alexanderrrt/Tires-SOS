"use client";

import { useEffect, useRef } from "react";

/**
 * Wraps content in a scroll-triggered reveal. Adds `is-visible` when the
 * element enters the viewport; globals.css animates `.reveal` and any
 * `.reveal-item` children (stagger via the `--d` custom property).
 * Respects prefers-reduced-motion by revealing immediately.
 */
export default function Reveal({ children, className = "" }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-visible");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`reveal ${className}`}>
      {children}
    </div>
  );
}
