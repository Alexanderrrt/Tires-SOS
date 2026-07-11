"use client";

import { useState } from "react";
import { useT } from "../i18n/LanguageContext";
import { COPY, SITE } from "../site.config";
import Reveal from "./Reveal";
import PirelliBadge from "./PirelliBadge";
import Icon from "./Icons";

export default function Promos() {
  const t = useT();
  const [driverOpen, setDriverOpen] = useState(true);
  const [driverDismissed, setDriverDismissed] = useState(false);

  function waMsg(text) {
    return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
  }

  const driverWa = waMsg(
    t({
      en: "Hi, I'm interested in the Driver Program — 4 tires for $340!",
      es: "Hola, me interesa el Programa del Conductor — 4 llantas por $340!",
    })
  );
  const financeWa = waMsg(
    t({
      en: "Hi, I'd like to know more about Snap Finance and Afterpay!",
      es: "Hola, me gustaría saber más sobre Snap Finance y Afterpay!",
    })
  );
  const loyaltyWa = waMsg(
    t({
      en: "Hi, I'd like a loyalty card!",
      es: "Hola, quiero una tarjeta de fidelidad!",
    })
  );

  const includes = t(COPY.promos.driverIncludes);

  return (
    <section id="promos" className="section section--tread">
      <div className="section__inner">
        <Reveal>
          <h2 className="section__heading">{t(COPY.promos.heading)}</h2>
          <p className="section__sub">{t(COPY.promos.sub)}</p>
        </Reveal>

        {/* Driver Program — hero-style featured banner */}
        <Reveal className="promo-collab">
          <div className="promo-collab__inner">
            <div className="promo-collab__visual" aria-hidden="true">
              <img src="/services/new-tires.jpg" alt="" />
              <span className="promo-collab__number">01</span>
            </div>
            <div className="promo-collab__content">
              <div className="promo-collab__logos" aria-label="Pirelli">
                <PirelliBadge />
              </div>
              <p className="promo-collab__kicker">{t(COPY.promos.collabTitle)}</p>
              <p className="promo-collab__body">{t(COPY.promos.collabBody)}</p>
              <div className="promo-collab__rule" aria-hidden="true" />
              <a href={SITE.whatsappHref || SITE.phoneHref} target="_blank" rel="noopener noreferrer" className="btn btn--small promo-collab__cta">
                <Icon name="chat" /> {t(COPY.promos.collabCta)}
              </a>
            </div>
          </div>
        </Reveal>

        <Reveal className="driver-banner-wrapper">
          {driverOpen ? (
            <div className="driver-banner">
              <button
                className="driver-banner__toggle"
                onClick={() => setDriverOpen(false)}
                aria-label="Collapse"
              >
                −
              </button>
              <div className="driver-banner__flag" aria-hidden="true" />
              <div className="driver-banner__content">
                <p className="driver-banner__kicker">
                  {t(COPY.promos.driverTitle)}
                </p>
                <div className="driver-banner__price">
                  {COPY.promos.driverPrice}
                </div>
                <p className="driver-banner__desc">{t(COPY.promos.driverSub)}</p>
                <ul className="driver-banner__list">
                  {includes.map((item) => (
                    <li key={item}>✓ {item}</li>
                  ))}
                </ul>
                <a
                  href={driverWa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn--primary"
                >
                  {t(COPY.promos.driverCta)}
                </a>
              </div>
            </div>
          ) : driverDismissed ? null : (
            <div className="driver-popup" role="dialog" aria-label="Driver Program">
              <div className="driver-popup__inner">
                <button
                  type="button"
                  className="driver-popup__close"
                  onClick={() => setDriverDismissed(true)}
                  aria-label="Close"
                >
                  &times;
                </button>
                <div className="driver-popup__flag" />
                <p className="driver-popup__kicker">{t(COPY.promos.driverTitle)}</p>
                <div className="driver-popup__price">{COPY.promos.driverPrice}</div>
                <a href={driverWa} target="_blank" rel="noopener noreferrer" className="btn btn--primary btn--small driver-popup__cta">
                  {t(COPY.promos.driverCta)}
                </a>
              </div>
            </div>
          )}
        </Reveal>

        <Reveal className="promos-grid">
          <div className="promo-card reveal-item" style={{ "--d": "0ms" }}>
            <div className="promo-card__media">
              <img
                src="/snap-finance.jpg"
                alt="Snap Finance — buy now pay later at Tires SOS Rescue"
                loading="lazy"
              />
            </div>
            <div className="promo-card__body">
              <h3>{t(COPY.promos.financeTitle)}</h3>
              <p>{t(COPY.promos.financeSub)}</p>
              <a href={financeWa} target="_blank" rel="noopener noreferrer" className="btn btn--primary btn--small">
                {t(COPY.promos.financeCta)}
              </a>
            </div>
          </div>

          <div className="promo-card reveal-item" style={{ "--d": "120ms" }}>
            <div className="promo-card__media">
              <img
                src="/loyalty-card.jpg"
                alt="Loyalty card — free oil change after 4 visits"
                loading="lazy"
              />
            </div>
            <div className="promo-card__body">
              <h3>{t(COPY.promos.loyaltyTitle)}</h3>
              <p>{t(COPY.promos.loyaltySub)}</p>
              <a href={loyaltyWa} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--small">
                {t(COPY.promos.loyaltyCta)}
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
