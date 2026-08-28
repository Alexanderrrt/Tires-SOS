"use client";

import Link from "next/link";
import { useT } from "../i18n/LanguageContext";
import Reveal from "./Reveal";

const COPY = {
  kicker: { en: "Commercial van service", es: "Servicio para vans comerciales" },
  title: {
    en: "Tires & alignments for the vans that keep your business moving.",
    es: "Llantas y alineación para las vans que mantienen tu negocio en marcha.",
  },
  body: {
    en: "We service work vans including Mercedes-Benz Sprinter, Ford Transit, Ram ProMaster, and similar commercial vehicles. Get the right tires and a precise alignment for safer, more even wear.",
    es: "Atendemos vans de trabajo como Mercedes-Benz Sprinter, Ford Transit, Ram ProMaster y vehículos comerciales similares. Instala las llantas correctas y recibe una alineación precisa para mayor seguridad y desgaste uniforme.",
  },
  tireLabel: { en: "Commercial van tires", es: "Llantas para vans comerciales" },
  alignmentLabel: { en: "Precision alignment", es: "Alineación de precisión" },
  cta: { en: "Get a van quote", es: "Cotiza tu van" },
  mediaLabel: { en: "Built for the workday", es: "Listas para el trabajo" },
};

export default function CommercialVans() {
  const t = useT();

  return (
    <section className="commercial-vans" aria-labelledby="commercial-vans-title">
      <Reveal className="commercial-vans__inner">
        <div className="commercial-vans__media" aria-label={t(COPY.mediaLabel)}>
          <span className="commercial-vans__track" aria-hidden="true" />
          <div className="commercial-vans__media-copy">
            <span>{t(COPY.mediaLabel)}</span>
            <strong>SPRINTER <i>•</i> TRANSIT <i>•</i> PROMASTER</strong>
          </div>
        </div>

        <div className="commercial-vans__copy">
          <p className="commercial-vans__kicker">{t(COPY.kicker)}</p>
          <h2 id="commercial-vans-title">{t(COPY.title)}</h2>
          <p className="commercial-vans__body">{t(COPY.body)}</p>
          <div className="commercial-vans__services" aria-label={t(COPY.kicker)}>
            <span>{t(COPY.tireLabel)}</span>
            <span>{t(COPY.alignmentLabel)}</span>
          </div>
          <Link className="btn btn--primary commercial-vans__cta" href="/quote">
            {t(COPY.cta)}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
