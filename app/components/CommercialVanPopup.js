"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useT } from "../i18n/LanguageContext";

const COPY = {
  close: { en: "Close commercial van offer", es: "Cerrar oferta para vans comerciales" },
  kicker: { en: "Commercial van specialists", es: "Especialistas en vans comerciales" },
  title: { en: "Keep your work van road-ready", es: "Mantén tu van lista para trabajar" },
  body: {
    en: "Commercial tires and precision alignments for Sprinter, Transit, ProMaster, and more.",
    es: "Llantas comerciales y alineación de precisión para Sprinter, Transit, ProMaster y más.",
  },
  tires: { en: "Commercial tires", es: "Llantas comerciales" },
  alignment: { en: "Precision alignment", es: "Alineación precisa" },
  cta: { en: "Get a van quote", es: "Cotiza tu van" },
};

// Version the campaign key so visitors who dismissed the older, oversized
// creative still receive the redesigned compact popup once.
const DISMISSED_KEY = "tsr-commercial-van-popup-v2-dismissed";
const VISIBILITY_EVENT = "commercial-van-popup:visibility";
const POPUP_IMAGES = [
  "/commercial-vans/commercial-van-01.jpeg",
  "/commercial-vans/commercial-van-02.jpeg",
  "/commercial-vans/commercial-van-03.jpeg",
  "/commercial-vans/commercial-van-04.jpeg",
];

export default function CommercialVanPopup() {
  const t = useT();
  const [visible, setVisible] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  useEffect(() => {
    if (window.sessionStorage.getItem(DISMISSED_KEY) === "1") return undefined;
    const timer = window.setTimeout(() => setVisible(true), 3500);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent(VISIBILITY_EVENT, { detail: { visible } }));
    return () => window.dispatchEvent(new CustomEvent(VISIBILITY_EVENT, { detail: { visible: false } }));
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setVisible(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => {
      setImageIndex((current) => (current + 1) % POPUP_IMAGES.length);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [visible]);

  const dismiss = () => {
    window.sessionStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside className="van-popup" role="dialog" aria-modal="false" aria-labelledby="van-popup-title">
      <div className="van-popup__inner">
        <button type="button" className="van-popup__close" onClick={dismiss} aria-label={t(COPY.close)}>
          &times;
        </button>
        <div className="van-popup__media">
          <Image
            key={POPUP_IMAGES[imageIndex]}
            className="van-popup__image"
            src={POPUP_IMAGES[imageIndex]}
            alt={t({
              en: "Commercial work van receiving wheel alignment service at Tires SOS Rescue",
              es: "Van comercial recibiendo servicio de alineación en Tires SOS Rescue",
            })}
            fill
            sizes="(max-width: 640px) calc(100vw - 1.3rem), 300px"
            unoptimized
          />
          <span className="van-popup__media-label">SPRINTER • TRANSIT • PROMASTER</span>
          <div className="van-popup__dots" role="group" aria-label="Commercial van photo navigation">
            {POPUP_IMAGES.map((image, index) => (
              <button
                key={image}
                type="button"
                className={`van-popup__dot ${index === imageIndex ? "van-popup__dot--active" : ""}`}
                onClick={() => setImageIndex(index)}
                aria-label={`Show commercial van photo ${index + 1}`}
                aria-current={index === imageIndex ? "true" : undefined}
              />
            ))}
          </div>
        </div>
        <div className="van-popup__content">
          <p className="van-popup__kicker">{t(COPY.kicker)}</p>
          <h2 id="van-popup-title">{t(COPY.title)}</h2>
          <p className="van-popup__body">{t(COPY.body)}</p>
          <div className="van-popup__benefits">
            <span>{t(COPY.tires)}</span>
            <span>{t(COPY.alignment)}</span>
          </div>
          <a className="btn btn--primary van-popup__cta" href="/quote">{t(COPY.cta)}</a>
        </div>
      </div>
    </aside>
  );
}
