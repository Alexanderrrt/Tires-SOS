"use client";

import { useState } from "react";
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
    <svg className="alignment-spotlight__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="5.5" />
      <path d="M12 2v3.5M12 18.5V22" />
      <path d="M4 7l2.4 1.6M19.9 7l-2.4 1.6M4 17l2.4-1.6M19.9 17l-2.4-1.6" />
    </svg>
  );
}

export default function Hero() {
  const t = useT();
  const alignment = COPY.hero.alignment;
  const [open, setOpen] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  return (
    <>
      <section className={`alignment-spotlight ${open ? "" : "alignment-spotlight--out"}`} aria-label={t(alignment.title)}>
        <button
          className="alignment-spotlight__toggle"
          onClick={() => setOpen(false)}
          aria-label="Collapse"
        >
          −
        </button>
        <div className="alignment-spotlight__inner">
          <div className="alignment-spotlight__media">
            <img
              src="/services/alignment.jpg"
              alt="Car up on the computerized alignment rack at Tires SOS Rescue"
            />
            <span className="alignment-spotlight__scan" aria-hidden="true" />
            <span className="alignment-spotlight__badge">{t(alignment.badge)}</span>
          </div>

          <div className="alignment-spotlight__copy">
            <p className="alignment-spotlight__kicker">
              <AlignmentIcon /> {t(alignment.kicker)}
            </p>
            <p className="alignment-spotlight__title">{t(alignment.title)}</p>
            <p className="alignment-spotlight__body">{t(alignment.body)}</p>
            <ul className="alignment-spotlight__points">
              {t(alignment.points).map((point) => (
                <li key={point}>✓ {point}</li>
              ))}
            </ul>
            <div className="alignment-spotlight__actions">
              <a href="/quote?topic=alignment" className="btn btn--primary">
                <Icon name="chat" /> {t(alignment.cta)}
              </a>
              <a href="/#services" className="btn btn--ghost">
                {t(alignment.ctaSecondary)} <Icon name="arrow" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {!dismissed && !open && (
        <div className="alignment-popup" role="dialog" aria-label="Precision Alignment">
          <div className="alignment-popup__inner">
            <button
              type="button"
              className="alignment-popup__close"
              onClick={() => setDismissed(true)}
              aria-label="Close"
            >
              &times;
            </button>
            <div className="alignment-popup__img">
              <img src="/services/alignment.jpg" alt="Alignment rack" />
            </div>
            <p className="alignment-popup__kicker">{t(alignment.kicker)}</p>
            <p className="alignment-popup__title">{t(alignment.title)}</p>
            <p className="alignment-popup__stamp">BY HUNTER</p>
            <a href="/quote" className="btn btn--primary btn--small alignment-popup__cta">
              <Icon name="chat" /> {t(alignment.cta)}
            </a>
          </div>
        </div>
      )}

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
              <a href={SITE.whatsappHref || SITE.phoneHref} target="_blank" rel="noreferrer" className="btn btn--ghost">
                <Icon name="chat" /> {t(COPY.hero.callNow)}
              </a>
              <a href={SITE.locations[0].mapsHref} target="_blank" rel="noopener noreferrer" className="btn btn--ghost">
                <Icon name="pin" /> {t(COPY.hero.directions)}
              </a>
            </div>

            <p className="hero__afterpay hero__enter" style={{ "--d": "380ms" }}>
              <span className="afterpay-chip">Snap Finance</span>
              <span className="afterpay-chip afterpay-chip--mint">Afterpay</span>
              {t(COPY.hero.afterpay)}
            </p>

            <a
              href={SITE.whatsappHref || SITE.phoneHref}
              target="_blank"
              rel="noreferrer"
              className="hero__flyer hero__enter"
              style={{ "--d": "420ms" }}
              aria-label="Ask about the four-tire $340 promotion on WhatsApp"
            >
              <img
                src="/sos-340-flyer.png"
                alt="Four new tires from $340 with installation, balancing, alignment, and 40,000-mile warranty"
              />
              <span className="hero__flyer-cta"><Icon name="chat" /> Ask on WhatsApp</span>
            </a>

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
