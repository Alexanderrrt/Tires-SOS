"use client";

import { useT } from "../i18n/LanguageContext";
import { COPY, SITE } from "../site.config";

export default function Hero() {
  const t = useT();

  return (
    <section id="top" className="hero">
      <div className="hero__inner">
        <p className="hero__kicker">{t(COPY.hero.kicker)}</p>
        <h1 className="hero__title">{SITE.name}</h1>
        <p className="hero__tagline">{t(SITE.tagline)}</p>

        <div className="hero__actions">
          <a href={SITE.phoneHref} className="btn btn--primary">
            {t(COPY.hero.callNow)}
          </a>
          <a href={SITE.mapsHref} target="_blank" rel="noopener noreferrer" className="btn btn--secondary">
            {t(COPY.hero.directions)}
          </a>
        </div>

        <p className="hero__note">{t(COPY.hero.note)}</p>
      </div>
    </section>
  );
}
