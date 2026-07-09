"use client";

import ChatBot from "../components/ChatBot";
import { useLanguage } from "../i18n/LanguageContext";

export default function QuoteLeadStarter({ turnstileSiteKey = "" }) {
  const { lang } = useLanguage();
  const copy =
    lang === "es"
      ? {
          kicker: "Mostrador de cotizacion con IA",
          title: "Cuentanos lo que necesitas y comienza tu cotizacion",
          body:
            "Pregunta por detalles del servicio, tiempos o rangos de precio. El asistente inicia la cotizacion y envia el lead al equipo del taller.",
        }
      : {
          kicker: "AI-assisted quote desk",
          title: "Tell us what you need and start a quote",
          body:
            "Ask about service details, timing, or price ranges. The assistant starts the quote flow and sends the lead to the shop team.",
        };

  return (
    <section className="quote__lead-page">
      <aside className="quote__assistant quote__assistant--page">
        <p className="quote__assistant-kicker">{copy.kicker}</p>
        <h2 className="quote__assistant-title">{copy.title}</h2>
        <p className="quote__assistant-copy">{copy.body}</p>
        <ChatBot
          embedded
          showComposer
          mode="quote"
          className="quote__assistant-chat"
          turnstileSiteKey={turnstileSiteKey}
        />
      </aside>
    </section>
  );
}
