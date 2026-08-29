"use client";

import { useEffect, useState } from "react";
import { useLanguage, useT } from "../i18n/LanguageContext";
import { useSecretAdminTap } from "../hooks/useSecretAdminTap";
import { COPY, SITE } from "../site.config";
import Icon from "./Icons";
import PirelliBadge from "./PirelliBadge";

export default function Header() {
  const { lang, toggleLang } = useLanguage();
  const t = useT();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const onSecretAdminTap = useSecretAdminTap();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className={`header ${scrolled ? "header--scrolled" : ""}`}>
      <div className="header__inner">
        <a href="/" className="header__brand">
          <span className="header__logo-hit" role="presentation" onClick={onSecretAdminTap}>
            <img className="header__logo" src="/logo-mark.png" alt="" draggable={false} />
          </span>
          <span className="header__wordmark" aria-label="Tires SOS">
            <span>TIRES</span> <strong>SOS</strong>
          </span>
        </a>

        <PirelliBadge compact className="header__pirelli" />

        <nav className="header__nav">
          <a href="/#services">{t(COPY.nav.services)}</a>
          <a href="/quote">{t(COPY.nav.quote)}</a>
          <a href="/#gallery">{t(COPY.nav.gallery)}</a>
          <a href="/#location">{t(COPY.nav.location)}</a>
          <a href="/#reviews">{t(COPY.nav.reviews)}</a>
        </nav>

        <div className="header__actions">
          <span className="header__hours"><Icon name="clock" /> MON–FRI 9AM–6PM · SAT 9AM–5PM</span>

          <button
            type="button"
            className="lang-toggle"
            onClick={toggleLang}
            aria-label="Toggle language"
          >
            {lang === "en" ? "ES" : "EN"}
          </button>

          <button
            type="button"
            className={`mobile-menu-toggle ${mobileMenuOpen ? "mobile-menu-toggle--open" : ""}`}
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileMenuOpen ? (lang === "es" ? "Cerrar menú" : "Close menu") : (lang === "es" ? "Abrir menú" : "Open menu")}
          >
            <span />
            <span />
            <span />
          </button>

          <a href={SITE.whatsappHref || SITE.phoneHref} target="_blank" rel="noreferrer" className="btn btn--primary btn--small">
            <Icon name="chat" /> {t(COPY.nav.callNow)}
          </a>
        </div>
      </div>

      <button
        type="button"
        className={`mobile-menu-backdrop ${mobileMenuOpen ? "mobile-menu-backdrop--open" : ""}`}
        onClick={closeMobileMenu}
        aria-label={lang === "es" ? "Cerrar menú" : "Close menu"}
        tabIndex={mobileMenuOpen ? 0 : -1}
      />
      <nav id="mobile-navigation" className={`mobile-menu ${mobileMenuOpen ? "mobile-menu--open" : ""}`} aria-hidden={!mobileMenuOpen}>
        <div className="mobile-menu__topline"><span>TIRES SOS</span><i />{lang === "es" ? "MENÚ" : "MENU"}</div>
        <a href="/#services" onClick={closeMobileMenu}>{t(COPY.nav.services)}</a>
        <a href="/quote" onClick={closeMobileMenu}>{t(COPY.nav.quote)}</a>
        <a href="/#gallery" onClick={closeMobileMenu}>{t(COPY.nav.gallery)}</a>
        <a href="/#location" onClick={closeMobileMenu}>{t(COPY.nav.location)}</a>
        <a href="/#reviews" onClick={closeMobileMenu}>{t(COPY.nav.reviews)}</a>
        <a href={SITE.whatsappHref || SITE.phoneHref} target="_blank" rel="noreferrer" className="btn btn--primary mobile-menu__cta" onClick={closeMobileMenu}>
          <Icon name="chat" /> {t(COPY.nav.callNow)}
        </a>
      </nav>
    </header>
  );
}
