"use client";

import { useEffect, useState } from "react";
import { useT } from "../i18n/LanguageContext";
import { COPY, SITE } from "../site.config";
import Reveal from "./Reveal";
import PirelliBadge from "./PirelliBadge";
import Icon from "./Icons";

const DRIVER_REEL = "https://www.instagram.com/reel/DbmVbtWSK-k/";
const INSTAGRAM_EMBED_SCRIPT = "https://www.instagram.com/embed.js";

export default function Promos() {
  const t = useT();
  const [reelStatus, setReelStatus] = useState("loading");

  useEffect(() => {
    let cancelled = false;
    const processEmbed = () => {
      if (cancelled) return;
      try {
        window.instgrm?.Embeds?.process();
        setReelStatus(window.instgrm ? "ready" : "error");
      } catch {
        setReelStatus("error");
      }
    };

    if (window.instgrm) {
      requestAnimationFrame(processEmbed);
      return () => { cancelled = true; };
    }

    let script = document.querySelector(`script[src="${INSTAGRAM_EMBED_SCRIPT}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = INSTAGRAM_EMBED_SCRIPT;
      script.async = true;
      document.body.appendChild(script);
    }
    script.addEventListener("load", processEmbed, { once: true });
    script.addEventListener("error", () => !cancelled && setReelStatus("error"), { once: true });
    return () => { cancelled = true; };
  }, []);

  function waMsg(text) {
    return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;
  }

  const pirelliWa = waMsg("Hola, me interesa la oferta Pirelli de 4 llantas por $499.");
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
  const driverPatchWa = waMsg(
    t({
      en: "Hi, I'd like to learn about the Driver Program and the free tire patch benefit.",
      es: "Hola, quiero conocer el Programa del Conductor y el beneficio de parche gratis.",
    })
  );

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
          <a
            href={pirelliWa}
            target="_blank"
            rel="noopener noreferrer"
            className="promo-flyer"
            aria-label="Ask about the Pirelli four-tire $499 promotion on WhatsApp"
          >
            <img
              src="/pirelli-499-flyer.png"
              alt="Pirelli P4 Persist AS Plus special: four 195/65R15 tires for $499 with installation, balancing, alignment, and 85,000-mile warranty"
            />
            <span className="promo-flyer__cta"><Icon name="chat" /> Ask on WhatsApp</span>
          </a>
        </Reveal>

        <Reveal className="driver-benefit-feature">
          <div className="driver-benefit-feature__reel">
            {reelStatus === "loading" && <span className="driver-benefit-feature__loading">Loading reel…</span>}
            {reelStatus !== "error" ? (
              <blockquote
                className="instagram-media"
                data-instgrm-permalink={DRIVER_REEL}
                data-instgrm-version="14"
                style={{ margin: 0 }}
              />
            ) : (
              <a href={DRIVER_REEL} target="_blank" rel="noopener noreferrer" className="btn btn--ghost btn--small">
                <Icon name="instagram" /> Open reel on Instagram
              </a>
            )}
          </div>
          <div className="driver-benefit-feature__content">
            <p className="driver-benefit-feature__eyebrow">{t(COPY.promos.driverTitle)}</p>
            <h3>{t(COPY.promos.patchTitle)}</h3>
            <p>{t(COPY.promos.patchSub)}</p>
            <div className="promo-card__actions">
              <a href={driverPatchWa} target="_blank" rel="noopener noreferrer" className="btn btn--primary btn--small">
                <Icon name="chat" /> {t(COPY.promos.patchCta)}
              </a>
            </div>
          </div>
        </Reveal>

        <Reveal className="promos-grid">
          <div className="promo-card promo-card--landscape reveal-item" style={{ "--d": "0ms" }}>
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

          <div className="promo-card promo-card--landscape reveal-item" style={{ "--d": "120ms" }}>
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
