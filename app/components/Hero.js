"use client";

import { useT } from "../i18n/LanguageContext";
import { COPY, SITE } from "../site.config";
import Icon from "./Icons";

function TreadRing() {
  return (
    <svg className="hero__ring" viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 9" />
      <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray="14 12" />
      <circle cx="100" cy="100" r="62" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function AlignmentIcon() {
  return (
    <svg className="alignment-banner__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5.5" />
      <path d="M12 2v3.5M12 18.5V22" />
      <path d="M4 7l2.4 1.6M19.9 7l-2.4 1.6M4 17l2.4-1.6M19.9 17l-2.4-1.6" />
    </svg>
  );
}

export default function Hero() {
  const t = useT();

  return (
    <>
      <div className="alignment-banner">
        <div className="alignment-banner__inner">
          <AlignmentIcon />
          <p className="alignment-banner__text">
            <strong>{t(COPY.hero.alignmentHighlight)}</strong>
            <span className="alignment-banner__sep">—</span>
            <span>{t(COPY.hero.alignmentSub)}</span>
          </p>
          <a href="/#services" className="alignment-banner__link">
            {t(COPY.hero.alignmentCta)} <Icon name="arrow" />
          </a>
        </div>
      </div>

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
              <span className="afterpay-chip">Snap Finance</span>
              <span className="afterpay-chip afterpay-chip--mint">Afterpay</span>
              {t(COPY.hero.afterpay)}
            </p>

            <p className="hero__note hero__enter" style={{ "--d": "460ms" }}>
              {t(COPY.hero.note)}
            </p>
          </div>

          <div className="hero__visual hero__enter" style={{ "--d": "240ms" }}>
            <TreadRing />
            <img
              className="hero__portrait"
              src="/owner.jpg"
              alt="Owner of Tires SOS Rescue in branded uniform"
            />
          </div>
        </div>
      </section>
    </>
  );
}
