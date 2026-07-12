"use client";

import { useT } from "../i18n/LanguageContext";

// `message` accepts a plain string or a bilingual { en, es } object so both
// client components (which translate up-front) and server loading.js files
// (which can't) can use it.
export default function AdminLoader({ message = { en: "Loading…", es: "Cargando…" } }) {
  const t = useT();
  const text = typeof message === "string" ? message : t(message);

  return (
    <div className="admin-loader" role="status" aria-live="polite" aria-busy="true">
      <div className="admin-loader__backdrop" aria-hidden="true" />

      <div className="admin-loader__content">
        <div className="admin-loader__visual" aria-hidden="true">
          <svg className="admin-loader__ring admin-loader__ring--outer" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 9" />
            <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray="14 12" />
          </svg>
          <svg className="admin-loader__ring admin-loader__ring--inner" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="62" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="100" cy="100" r="48" fill="none" stroke="currentColor" strokeWidth="6" strokeDasharray="8 10" />
          </svg>
          <span className="admin-loader__mark">SOS</span>
        </div>

        <p className="admin-loader__brand">Tires SOS Rescue</p>
        <p className="admin-loader__message">{text}</p>

        <div className="admin-loader__track" aria-hidden="true">
          <span className="admin-loader__track-fill" />
        </div>
      </div>
    </div>
  );
}
