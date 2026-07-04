"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "../i18n/LanguageContext";

const BRANDS = [
  {
    name: "Bridgestone",
    logo: "/brands/bridgestone.svg",
    tagline: {
      en: "Bridgestone tires in stock — engineered for performance & safety",
      es: "Llantas Bridgestone en stock — diseñadas para rendimiento y seguridad",
    },
  },
  {
    name: "Goodyear",
    logo: "/brands/goodyear.svg",
    tagline: {
      en: "Goodyear tires available — trusted for over 125 years",
      es: "Llantas Goodyear disponibles — confianza por más de 125 años",
    },
  },
  {
    name: "Continental",
    logo: "/brands/continental.svg",
    tagline: {
      en: "Continental tires — German engineering, Bay Area prices",
      es: "Llantas Continental — ingeniería alemana, precios del Bay Area",
    },
  },
  {
    name: "Pirelli",
    logo: "/brands/pirelli.svg",
    tagline: {
      en: "Pirelli tires — premium Italian performance for your ride",
      es: "Llantas Pirelli — rendimiento premium italiano para tu carro",
    },
  },
  {
    name: "Hankook",
    logo: "/brands/hankook.svg",
    tagline: {
      en: "Hankook tires — quality & value you can count on",
      es: "Llantas Hankook — calidad y valor en los que puedes confiar",
    },
  },
  {
    name: "BFGoodrich",
    logo: "/brands/bfgoodrich.svg",
    tagline: {
      en: "BFGoodrich tires — built tough for every road",
      es: "Llantas BFGoodrich — hechas para cualquier camino",
    },
  },
  {
    name: "Yokohama",
    logo: "/brands/yokohama.svg",
    tagline: {
      en: "Yokohama tires — innovation meets the road",
      es: "Llantas Yokohama — innovación en cada kilómetro",
    },
  },
  {
    name: "Toyo",
    logo: "/brands/toyo.svg",
    tagline: {
      en: "Toyo tires in stock — designed to perform",
      es: "Llantas Toyo en stock — diseñadas para rendir",
    },
  },
  {
    name: "Cooper",
    logo: "/brands/cooper.svg",
    tagline: {
      en: "Cooper tires — American-made quality at great prices",
      es: "Llantas Cooper — calidad americana a precios increíbles",
    },
  },
  {
    name: "Falken",
    logo: "/brands/falken.svg",
    tagline: {
      en: "Falken tires — high performance, great value",
      es: "Llantas Falken — alto rendimiento, gran valor",
    },
  },
  {
    name: "Firestone",
    logo: "/brands/firestone.svg",
    tagline: {
      en: "Firestone tires available — dependable since 1900",
      es: "Llantas Firestone disponibles — confiables desde 1900",
    },
  },
  {
    name: "Nexen",
    logo: "/brands/nexen.svg",
    tagline: {
      en: "Nexen tires — affordable quality for every driver",
      es: "Llantas Nexen — calidad accesible para cada conductor",
    },
  },
];

const CTA = {
  en: "Ask about this brand",
  es: "Pregunta por esta marca",
};

const CLOSE_LABEL = {
  en: "Close",
  es: "Cerrar",
};

const WE_CARRY = {
  en: "We carry top brands",
  es: "Manejamos las mejores marcas",
};

const AFTERPAY_LINE = {
  en: "Afterpay & Snap Finance accepted",
  es: "Aceptamos Afterpay y Snap Finance",
};

export default function BrandPopups({ phoneHref }) {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [brandIndex, setBrandIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const idx = Math.floor(Math.random() * BRANDS.length);
    setBrandIndex(idx);
    const timer = setTimeout(() => setVisible(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  const nextBrand = useCallback(() => {
    setBrandIndex((prev) => (prev + 1) % BRANDS.length);
  }, []);

  const prevBrand = useCallback(() => {
    setBrandIndex((prev) => (prev - 1 + BRANDS.length) % BRANDS.length);
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

  if (!visible || dismissed) return null;

  const brand = BRANDS[brandIndex];

  return (
    <div className="brand-popup" role="dialog" aria-label={t(WE_CARRY)}>
      <div className="brand-popup__inner">
        <button
          type="button"
          className="brand-popup__close"
          onClick={dismiss}
          aria-label={t(CLOSE_LABEL)}
        >
          &times;
        </button>

        <p className="brand-popup__kicker">{t(WE_CARRY)}</p>
        <div className="brand-popup__logo" key={brand.name}>
          <button
            type="button"
            className="brand-popup__arrow brand-popup__arrow--prev"
            onClick={() => { prevBrand(); resetRotation(); }}
            aria-label="Previous brand"
          >
            ‹
          </button>
          <img src={brand.logo} alt={`${brand.name} logo`} />
          <button
            type="button"
            className="brand-popup__arrow brand-popup__arrow--next"
            onClick={() => { nextBrand(); resetRotation(); }}
            aria-label="Next brand"
          >
            ›
          </button>
        </div>
        <p className="brand-popup__tagline">{t(brand.tagline)}</p>

        <div className="brand-popup__afterpay">
          <span className="afterpay-chip afterpay-chip--mint">Afterpay</span>
          <span className="afterpay-chip">Snap Finance</span>
          <span className="brand-popup__afterpay-text">{t(AFTERPAY_LINE)}</span>
        </div>

        <a href={phoneHref} className="btn btn--primary btn--small brand-popup__cta">
          {t(CTA)}
        </a>

        <div className="brand-popup__dots">
          {BRANDS.map((b, i) => (
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
