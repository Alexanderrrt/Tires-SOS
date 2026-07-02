"use client";

import { useLanguage, useT } from "../i18n/LanguageContext";
import { useOpenStatus } from "../hooks/useOpenStatus";
import { COPY, SITE } from "../site.config";

export default function Header() {
  const { lang, toggleLang } = useLanguage();
  const t = useT();
  const isOpen = useOpenStatus();

  return (
    <header className="header">
      <div className="header__inner">
        <a href="#top" className="header__brand">
          🛞 {SITE.name}
        </a>

        <nav className="header__nav">
          <a href="#services">{t(COPY.nav.services)}</a>
          <a href="#gallery">{t(COPY.nav.gallery)}</a>
          <a href="#location">{t(COPY.nav.location)}</a>
          <a href="#reviews">{t(COPY.nav.reviews)}</a>
        </nav>

        <div className="header__actions">
          {isOpen !== null && (
            <span className={`status-badge ${isOpen ? "status-badge--open" : "status-badge--closed"}`}>
              <span className="status-badge__dot" />
              {isOpen ? t(COPY.status.open) : t(COPY.status.closed)}
            </span>
          )}

          <button
            type="button"
            className="lang-toggle"
            onClick={toggleLang}
            aria-label="Toggle language"
          >
            {lang === "en" ? "ES" : "EN"}
          </button>

          <a href={SITE.phoneHref} className="btn btn--primary btn--small">
            {t(COPY.nav.callNow)}
          </a>
        </div>
      </div>
    </header>
  );
}
