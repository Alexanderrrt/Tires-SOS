"use client";

import { useState } from "react";
import { useT } from "../i18n/LanguageContext";
import { COPY, SERVICES } from "../site.config";
import Icon from "./Icons";
import Reveal from "./Reveal";

export default function Services() {
  const t = useT();
  const [activeId, setActiveId] = useState(null);

  return (
    <section id="services" className="section section--tread">
      <div className="section__inner">
        <Reveal>
          <h2 className="section__heading">{t(COPY.services.heading)}</h2>
          <p className="section__sub">{t(COPY.services.sub)}</p>
        </Reveal>

        <Reveal className="services-grid">
          {SERVICES.map((service, i) => {
            const isActive = activeId === service.id;
            return (
              <button
                key={service.id}
                type="button"
                className={`service-card reveal-item ${isActive ? "service-card--active" : ""}`}
                style={{ "--d": `${i * 70}ms` }}
                onClick={() => setActiveId(isActive ? null : service.id)}
                aria-expanded={isActive}
              >
                <span className="service-card__icon">
                  {service.image ? (
                    <img src={service.image} alt={t(service.title)} loading="lazy" />
                  ) : (
                    <Icon name={service.icon} />
                  )}
                </span>
                <span className="service-card__title">{t(service.title)}</span>
                <span className="service-card__sub">{t(service.sub)}</span>
                <span className={`service-card__reveal ${isActive ? "service-card__reveal--open" : ""}`}>
                  <span className="service-card__desc">{t(service.desc)}</span>
                </span>
              </button>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
