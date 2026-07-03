"use client";

import { useT } from "../i18n/LanguageContext";
import { COPY } from "../site.config";

export default function QuoteIntro() {
  const t = useT();
  return (
    <>
      <h1 className="section__heading">{t(COPY.quote.heading)}</h1>
      <p className="section__sub">{t(COPY.quote.sub)}</p>
    </>
  );
}
