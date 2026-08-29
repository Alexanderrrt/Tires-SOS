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
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
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
          <a href="/quote">{t(COPY.nav.quote)}</a>
        </nav>

        <div className="header__actions">
          <span className="header__hours"><Icon name="clock" /> MON–FRI 9AM–6PM · SAT 9AM–5PM</span>

          <div className="site-menu">
            <button type="button" className="site-menu__toggle" onClick={() => setDesktopMenuOpen((open) => !open)} aria-expanded={desktopMenuOpen}>
              {lang === "es" ? "Menú" : "Menu"} <span aria-hidden="true">⌄</span>
            </button>
            <div className={`site-menu__panel ${desktopMenuOpen ? "site-menu__panel--open" : ""}`}>
              <a href="/">{lang === "es" ? "Inicio" : "Home"}</a>
              <a href="/services">{lang === "es" ? "Todos los servicios" : "All services"}</a>
              <a href="/locations">{lang === "es" ? "Todas las ubicaciones" : "All locations"}</a>
              <a href="/services/new-tires">{lang === "es" ? "Llantas nuevas" : "New tires"}</a>
              <a href="/services/flat-tire-repair">{lang === "es" ? "Ponchaduras" : "Flat repair"}</a>
              <a href="/services/wheel-alignment">{lang === "es" ? "Alineación" : "Alignment"}</a>
              <a href="/services/brake-service">{lang === "es" ? "Frenos" : "Brakes"}</a>
              <a href="/services/oil-change">{lang === "es" ? "Cambio de aceite" : "Oil change"}</a>
              <a href="/services/car-batteries">{lang === "es" ? "Baterías" : "Batteries"}</a>
              <a href="/services/custom-wheels">{lang === "es" ? "Rines" : "Rims"}</a>
              <a href="/#gallery">{t(COPY.nav.gallery)}</a>
              <a href="/#location">{t(COPY.nav.location)}</a>
              <a href="/#reviews">{t(COPY.nav.reviews)}</a>
              <a href="/privacy">{lang === "es" ? "Privacidad" : "Privacy"}</a>
              <a href="/terms">{lang === "es" ? "Términos" : "Terms"}</a>
              <a href="/disclaimer">{lang === "es" ? "Aviso legal" : "Disclaimer"}</a>
            </div>
          </div>

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
        <a href="/" onClick={closeMobileMenu}>{lang === "es" ? "Inicio" : "Home"}</a>
        <a href="/quote" onClick={closeMobileMenu}>{t(COPY.nav.quote)}</a>
        <a href="/services" onClick={closeMobileMenu}>{lang === "es" ? "Todos los servicios" : "All services"}</a>
        <a href="/locations" onClick={closeMobileMenu}>{lang === "es" ? "Todas las ubicaciones" : "All locations"}</a>
        <a href="/services/new-tires" onClick={closeMobileMenu}>{lang === "es" ? "Llantas nuevas" : "New tires"}</a>
        <a href="/services/flat-tire-repair" onClick={closeMobileMenu}>{lang === "es" ? "Ponchaduras" : "Flat repair"}</a>
        <a href="/services/wheel-alignment" onClick={closeMobileMenu}>{lang === "es" ? "Alineación" : "Alignment"}</a>
        <a href="/services/brake-service" onClick={closeMobileMenu}>{lang === "es" ? "Frenos" : "Brakes"}</a>
        <a href="/services/oil-change" onClick={closeMobileMenu}>{lang === "es" ? "Cambio de aceite" : "Oil change"}</a>
        <a href="/services/car-batteries" onClick={closeMobileMenu}>{lang === "es" ? "Baterías" : "Batteries"}</a>
        <a href="/services/custom-wheels" onClick={closeMobileMenu}>{lang === "es" ? "Rines" : "Rims"}</a>
        <a href="/#gallery" onClick={closeMobileMenu}>{t(COPY.nav.gallery)}</a>
        <a href="/#location" onClick={closeMobileMenu}>{t(COPY.nav.location)}</a>
        <a href="/#reviews" onClick={closeMobileMenu}>{t(COPY.nav.reviews)}</a>
        <a href="/privacy" onClick={closeMobileMenu}>{lang === "es" ? "Privacidad" : "Privacy"}</a>
        <a href="/terms" onClick={closeMobileMenu}>{lang === "es" ? "Términos" : "Terms"}</a>
        <a href="/disclaimer" onClick={closeMobileMenu}>{lang === "es" ? "Aviso legal" : "Disclaimer"}</a>
        <a href={SITE.whatsappHref || SITE.phoneHref} target="_blank" rel="noreferrer" className="btn btn--primary mobile-menu__cta" onClick={closeMobileMenu}>
          <Icon name="chat" /> {t(COPY.nav.callNow)}
        </a>
      </nav>
    </header>
  );
}
