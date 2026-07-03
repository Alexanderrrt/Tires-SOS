"use client";

import { useT } from "../i18n/LanguageContext";
import { COPY, SITE } from "../site.config";
import Icon from "./Icons";

// Concentric tread arcs sitting behind the logo — a static graphic anchor,
// no glow. Slowly rotates (disabled under reduced motion via CSS).
function TreadRing() {
  return (
    <svg className="hero__ring" viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 9" />
      <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray="14 12" />
      <circle cx="100" cy="100" r="62" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function Hero() {
  const t = useT();

  return (
    <section id="top" className="hero">
      <div className="hero__inner">
        <div className="hero__text">
          <p className="hero__kicker hero__enter" style={{ "--d": "0ms" }}>
            {t(COPY.hero.kicker)}
          </p>
          <h1 className="hero__title hero__enter" style={{ "--d": "100ms" }}>
            Tires <span className="hero__title-accent">SOS</span> Rescue
          </h1>
          <p className="hero__tagline hero__enter" style={{ "--d": "200ms" }}>
            {t(SITE.tagline)}
          </p>

          <div className="hero__actions hero__enter" style={{ "--d": "300ms" }}>
            <a href="/quote" className="btn btn--primary">
              {t(COPY.quote.ctaFromHome)} <Icon name="arrow" />
            </a>
            <a href={SITE.phoneHref} className="btn btn--ghost">
              <Icon name="phone" /> {t(COPY.hero.callNow)}
            </a>
            <a href={SITE.mapsHref} target="_blank" rel="noopener noreferrer" className="btn btn--ghost">
              <Icon name="pin" /> {t(COPY.hero.directions)}
            </a>
          </div>

          <p className="hero__afterpay hero__enter" style={{ "--d": "380ms" }}>
            <span className="afterpay-chip">Afterpay</span>
            {t(COPY.hero.afterpay)}
          </p>

          <p className="hero__note hero__enter" style={{ "--d": "460ms" }}>
            {t(COPY.hero.note)}
          </p>
        </div>

        <div className="hero__visual hero__enter" style={{ "--d": "240ms" }} aria-hidden="true">
          <TreadRing />
          <img className="hero__logo" src="/logo-mark.png" alt="" />
        </div>
      </div>
    </section>
  );
}
