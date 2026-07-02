"use client";

import { useState } from "react";
import { useT } from "../i18n/LanguageContext";
import { COPY, SERVICES } from "../site.config";

export default function Services() {
  const t = useT();
  const [activeId, setActiveId] = useState(null);

  return (
    <section id="services" className="section">
      <div className="section__inner">
        <h2 className="section__heading">{t(COPY.services.heading)}</h2>
        <p className="section__sub">{t(COPY.services.sub)}</p>

        <div className="services-grid">
          {SERVICES.map((service) => {
            const isActive = activeId === service.id;
            return (
              <button
                key={service.id}
                type="button"
                className={`service-card ${isActive ? "service-card--active" : ""}`}
                onClick={() => setActiveId(isActive ? null : service.id)}
                aria-expanded={isActive}
              >
                <span className="service-card__icon">{service.icon}</span>
                <span className="service-card__title">{t(service.title)}</span>
                <span
                  className={`service-card__desc ${isActive ? "service-card__desc--open" : ""}`}
                >
                  {t(service.desc)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
