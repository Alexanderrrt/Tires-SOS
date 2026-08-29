"use client";

import { useEffect, useState } from "react";

export default function PageTransition() {
  const [active, setActive] = useState(false);

  useEffect(() => {
    const handleClick = (event) => {
      const link = event.target.closest("a[href]");
      if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const destination = new URL(link.href, window.location.href);
      const samePage = destination.pathname === window.location.pathname && destination.search === window.location.search;
      if (destination.origin !== window.location.origin || link.target === "_blank" || link.hasAttribute("download") || (samePage && destination.hash)) return;

      event.preventDefault();
      setActive(true);
      window.setTimeout(() => { window.location.href = destination.href; }, 430);
    };

    const reset = () => setActive(false);
    document.addEventListener("click", handleClick);
    window.addEventListener("pageshow", reset);
    return () => {
      document.removeEventListener("click", handleClick);
      window.removeEventListener("pageshow", reset);
    };
  }, []);

  return (
    <div className={`page-transition ${active ? "page-transition--active" : ""}`} aria-hidden="true">
      <div className="page-transition__brand">
        <img src="/logo-mark.png" alt="" />
        <span>TIRES <strong>SOS</strong></span>
      </div>
      <i />
    </div>
  );
}
