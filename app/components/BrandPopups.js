"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BRAND_SHOWCASE, SITE } from "../site.config";
import { useT } from "../i18n/LanguageContext";

const CTA = {
  en: "Ask about this brand",
  es: "Pregunta por esta marca",
};

const CLOSE_LABEL = {
  en: "Close",
  es: "Cerrar",
};

const WE_CARRY = {
  en: "We carry actual brands",
  es: "Manejamos marcas reales",
};

const AFTERPAY_LINE = {
  en: "Afterpay & Snap Finance accepted",
  es: "Aceptamos Afterpay y Snap Finance",
};

const COMMERCIAL_VAN_PROMO = {
  name: "Commercial vans",
  kind: "commercial-vans",
  kicker: { en: "Commercial van specialists", es: "Especialistas en vans comerciales" },
  tagline: {
    en: "Tires and precision alignments for Sprinter, Transit, ProMaster, and other work vans.",
    es: "Llantas y alineación de precisión para Sprinter, Transit, ProMaster y otras vans de trabajo.",
  },
  cta: { en: "Get a van quote", es: "Cotiza tu van" },
};

const POPUP_ITEMS = [COMMERCIAL_VAN_PROMO, ...BRAND_SHOWCASE];

function BrandLogo({ brand }) {
  if (brand.kind === "commercial-vans") {
    return (
      <div className="brand-popup__van-art" aria-hidden="true">
        <span className="brand-popup__van-shape" />
        <strong>SPRINTER <i>•</i> TRANSIT <i>•</i> PROMASTER</strong>
      </div>
    );
  }

  if (Array.isArray(brand.logos)) {
    return (
      <div className="brand-popup__logo brand-popup__logo--collab">
        {brand.logos.map((logo) => (
          <img key={logo.alt} src={logo.src} alt={logo.alt} />
        ))}
      </div>
    );
  }

  return (
    <div className="brand-popup__logo">
      <img src={brand.logo} alt={`${brand.name} logo`} />
    </div>
  );
}

export default function BrandPopups() {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [brandIndex, setBrandIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [launchInView, setLaunchInView] = useState(false);

  useEffect(() => {
    const idx = Math.floor(Math.random() * POPUP_ITEMS.length);
    setBrandIndex(idx);
    const timer = setTimeout(() => setVisible(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    let observer;
    let retryTimer;
    let active = true;
    const observeLaunch = () => {
      if (!active) return;
      const launch = document.getElementById("hayward-launch");
      if (!launch) {
        retryTimer = window.setTimeout(observeLaunch, 250);
        return;
      }
      observer = new IntersectionObserver(
        ([entry]) => setLaunchInView(entry.isIntersecting),
        { threshold: 0.18 },
      );
      observer.observe(launch);
    };
    observeLaunch();
    return () => {
      active = false;
      window.clearTimeout(retryTimer);
      observer?.disconnect();
    };
  }, []);

  const nextBrand = useCallback(() => {
    setBrandIndex((prev) => (prev + 1) % POPUP_ITEMS.length);
  }, []);

  const prevBrand = useCallback(() => {
    setBrandIndex((prev) => (prev - 1 + POPUP_ITEMS.length) % POPUP_ITEMS.length);
  }, []);

  const intervalRef = useRef(null);

  const resetRotation = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (visible && !dismissed) {
      intervalRef.current = setInterval(nextBrand, 6000);
    }
  }, [nextBrand, visible, dismissed]);

  useEffect(() => {
    if (!visible || dismissed) return;
    intervalRef.current = setInterval(nextBrand, 6000);
    return () => clearInterval(intervalRef.current);
  }, [visible, dismissed, nextBrand]);

  const dismiss = () => {
    setDismissed(true);
    setVisible(false);
  };

  if (!visible || dismissed || launchInView) return null;

  const brand = POPUP_ITEMS[brandIndex];
  const isVanPromo = brand.kind === "commercial-vans";

  return (
    <div className="brand-popup" role="dialog" aria-label={isVanPromo ? t(brand.kicker) : t(WE_CARRY)}>
      <div className="brand-popup__inner">
        <button type="button" className="brand-popup__close" onClick={dismiss} aria-label={t(CLOSE_LABEL)}>
          &times;
        </button>

        <p className="brand-popup__kicker">{isVanPromo ? t(brand.kicker) : t(WE_CARRY)}</p>
        <BrandLogo brand={brand} />
        <p className={`brand-popup__tagline ${brand.featured ? "brand-popup__tagline--featured" : ""}`}>
          {t(brand.tagline)}
        </p>

        {isVanPromo ? (
          <div className="brand-popup__van-services">
            <span>{t({ en: "Commercial tires", es: "Llantas comerciales" })}</span>
            <span>{t({ en: "Wheel alignment", es: "Alineación" })}</span>
          </div>
        ) : (
          <div className="brand-popup__afterpay">
            <span className="afterpay-chip afterpay-chip--mint">Afterpay</span>
            <span className="afterpay-chip">Snap Finance</span>
            <span className="brand-popup__afterpay-text">{t(AFTERPAY_LINE)}</span>
          </div>
        )}

        <div className="brand-popup__nav" aria-label="Brand navigation">
          <button
            type="button"
            className="brand-popup__arrow brand-popup__arrow--prev"
            onClick={() => {
              prevBrand();
              resetRotation();
            }}
            aria-label="Previous brand"
          >
            {"<"}
          </button>
          <button
            type="button"
            className="brand-popup__arrow brand-popup__arrow--next"
            onClick={() => {
              nextBrand();
              resetRotation();
            }}
            aria-label="Next brand"
          >
            {">"}
          </button>
        </div>

        <a href={isVanPromo ? "/quote" : SITE.whatsappHref} target={isVanPromo ? undefined : "_blank"} rel={isVanPromo ? undefined : "noreferrer"} className="btn btn--primary btn--small brand-popup__cta">
          {isVanPromo ? t(brand.cta) : t(CTA)}
        </a>

        <div className="brand-popup__dots">
          {POPUP_ITEMS.map((b, i) => (
            <button
              key={b.name}
              type="button"
              className={`brand-popup__dot ${i === brandIndex ? "brand-popup__dot--on" : ""}`}
              onClick={() => setBrandIndex(i)}
              aria-label={b.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
