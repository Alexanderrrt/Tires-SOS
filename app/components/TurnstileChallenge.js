"use client";

import { useEffect, useRef } from "react";

const SCRIPT_ID = "cloudflare-turnstile-script";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadTurnstile() {
  if (typeof window === "undefined") return Promise.reject(new Error("Browser unavailable."));
  if (window.turnstile) return Promise.resolve(window.turnstile);

  return new Promise((resolve, reject) => {
    let script = document.getElementById(SCRIPT_ID);
    const onLoad = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("Turnstile unavailable.")));
    const onError = () => reject(new Error("Turnstile failed to load."));

    if (!script) {
      script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    script.addEventListener("load", onLoad, { once: true });
    script.addEventListener("error", onError, { once: true });
  });
}

export default function TurnstileChallenge({ siteKey, onToken, onError, resetKey = 0, language = "auto" }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!siteKey || !containerRef.current) return undefined;
    let disposed = false;
    let widgetId = null;

    loadTurnstile()
      .then((turnstile) => {
        if (disposed || !containerRef.current) return;
        widgetId = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          language,
          theme: "dark",
          callback: (token) => onToken?.(token),
          "expired-callback": () => onToken?.(""),
          "error-callback": () => onError?.(),
        });
      })
      .catch(() => onError?.());

    return () => {
      disposed = true;
      if (widgetId !== null && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [language, onError, onToken, resetKey, siteKey]);

  if (!siteKey) return null;
  return <div className="chat-turnstile" ref={containerRef} />;
}
