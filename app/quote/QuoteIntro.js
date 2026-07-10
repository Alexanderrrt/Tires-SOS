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
    <h1
      style={{
        position: "absolute",
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: "hidden",
        clip: "rect(0, 0, 0, 0)",
        whiteSpace: "nowrap",
        border: 0,
      }}
    >
      {copy.heading}
    </h1>
  );
}
