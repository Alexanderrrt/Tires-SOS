"use client";

import { useLanguage } from "../i18n/LanguageContext";

function anchorId(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export default function LegalPage({ page }) {
  const { lang } = useLanguage();
  const title = page.title[lang] || page.title.en;
  const intro = page.intro[lang] || page.intro.en;

  return (
    <main className="legal">
      <div className="legal__inner">
        <header className="legal__header">
          <p className="legal__eyebrow">Tires SOS Rescue</p>
          <h1 className="legal__title">{title}</h1>
          <p className="legal__intro">{intro}</p>
        </header>

        <div className="legal__toc">
          {page.sections.map((section) => {
            const id = anchorId(section.heading.en);
            return (
              <a key={id} href={`#${id}`}>
                {section.heading[lang] || section.heading.en}
              </a>
            );
          })}
        </div>

        <div className="legal__sections">
          {page.sections.map((section) => {
            const id = anchorId(section.heading.en);
            const items = section.items[lang] || section.items.en;
            return (
              <section className="legal__section" key={id} id={id}>
                <h2>{section.heading[lang] || section.heading.en}</h2>
                <ul>
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}
