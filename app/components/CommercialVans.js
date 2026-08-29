"use client";

import Link from "next/link";
import Image from "next/image";
import { useT } from "../i18n/LanguageContext";
import { SITE } from "../site.config";
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
  division: { en: "Commercial division", es: "División comercial" },
  specOne: { en: "High-roof vans", es: "Vans de techo alto" },
  specOneSub: { en: "Sprinter-class fitment", es: "Servicio tipo Sprinter" },
  specTwo: { en: "Load-rated tires", es: "Llantas de carga" },
  specTwoSub: { en: "Matched to your work van", es: "Correctas para tu van" },
  specThree: { en: "Alignment-ready", es: "Alineación especializada" },
  specThreeSub: { en: "Commercial geometry", es: "Geometría comercial" },
  whatsapp: { en: "Talk to the shop", es: "Habla con el taller" },
};

export default function CommercialVans({ placement = "desktop" }) {
  const t = useT();
  const titleId = `commercial-vans-title-${placement}`;

  return (
    <section className={`commercial-vans commercial-vans--${placement}`} aria-labelledby={titleId}>
      <Reveal className="commercial-vans__inner">
        <div className="commercial-vans__media" aria-label={t(COPY.mediaLabel)}>
          <Image
            className="commercial-vans__image"
            src="/commercial-vans/commercial-van-alignment-hero.webp"
            alt={t({
              en: "Commercial cargo van receiving a precision wheel alignment at Tires SOS Rescue",
              es: "Van comercial recibiendo una alineación de precisión en Tires SOS Rescue",
            })}
            fill
            sizes="(max-width: 820px) calc(100vw - 2.5rem), 55vw"
            unoptimized
          />
          <div className="commercial-vans__division">
            <span aria-hidden="true" />
            {t(COPY.division)}
          </div>
          <div className="commercial-vans__media-copy">
            <span>{t(COPY.mediaLabel)}</span>
            <strong>SPRINTER <i>•</i> TRANSIT <i>•</i> PROMASTER</strong>
          </div>
        </div>

        <div className="commercial-vans__copy">
          <div className="commercial-vans__topline">
            <span>TIRES SOS</span>
            <i aria-hidden="true" />
            <span>FLEET CARE</span>
          </div>
          <p className="commercial-vans__kicker">{t(COPY.kicker)}</p>
          <h2 id={titleId}>{t(COPY.title)}</h2>
          <p className="commercial-vans__body">{t(COPY.body)}</p>
          <div className="commercial-vans__services" aria-label={t(COPY.kicker)}>
            <span>{t(COPY.tireLabel)}</span>
            <span>{t(COPY.alignmentLabel)}</span>
          </div>
          <div className="commercial-vans__specs">
            <div><strong>01</strong><span><b>{t(COPY.specOne)}</b><small>{t(COPY.specOneSub)}</small></span></div>
            <div><strong>02</strong><span><b>{t(COPY.specTwo)}</b><small>{t(COPY.specTwoSub)}</small></span></div>
            <div><strong>03</strong><span><b>{t(COPY.specThree)}</b><small>{t(COPY.specThreeSub)}</small></span></div>
          </div>
          <div className="commercial-vans__actions">
            <Link className="btn btn--primary commercial-vans__cta" href="/quote">
              {t(COPY.cta)} <span aria-hidden="true">→</span>
            </Link>
            <a className="commercial-vans__contact" href={SITE.whatsappHref} target="_blank" rel="noreferrer">
              {t(COPY.whatsapp)}
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
