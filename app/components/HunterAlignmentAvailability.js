"use client";

import Link from "next/link";
import { useT } from "../i18n/LanguageContext";

const COPY = {
  available: {
    en: "Hunter alignment machine available at our Hayward store",
    es: "Máquina de alineación Hunter disponible en nuestra tienda de Hayward",
  },
  body: {
    en: "Get precise wheel alignment service at 905 W A Street with our Hunter alignment machine.",
    es: "Obtén un servicio preciso de alineación en 905 W A Street con nuestra máquina de alineación Hunter.",
  },
  link: {
    en: "Learn about wheel alignment",
    es: "Conoce la alineación de ruedas",
  },
};

export default function HunterAlignmentAvailability() {
  const t = useT();
  return (
    <section className="location-equipment location-equipment--home" aria-label={t(COPY.available)}>
      <div className="location-equipment__mark"><img src="/logo-mark.png" alt="Tires SOS Rescue" /></div>
      <div>
        <p className="location-equipment__eyebrow">{t(COPY.available)}</p>
        <h2>Hunter alignment machine</h2>
        <p>{t(COPY.body)}</p>
        <Link className="seo-text-link" href="/services/wheel-alignment">{t(COPY.link)} →</Link>
      </div>
    </section>
  );
}
