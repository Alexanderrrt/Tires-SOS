"use client";

import { useLanguage } from "../i18n/LanguageContext";

export default function QuoteIntro() {
  const { lang } = useLanguage();
  const copy =
    lang === "es"
      ? {
          heading: "Cotiza con Tires SOS",
          sub: "Escribe lo que necesitas y el equipo del taller recibe los detalles para ayudarte con precio, horario y proximos pasos.",
        }
      : {
          heading: "Quote With Tires SOS",
          sub: "Tell us what you need and the shop team receives the details to help with price, timing, and next steps.",
        };

  return (
    <>
      <h1 className="section__heading">{copy.heading}</h1>
      <p className="section__sub">{copy.sub}</p>
    </>
  );
}
