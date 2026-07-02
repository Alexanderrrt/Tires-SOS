"use client";

import { useT } from "../i18n/LanguageContext";
import { COPY, SITE } from "../site.config";

export default function Location() {
  const t = useT();
  const today = new Date().getDay();

  return (
    <section id="location" className="section">
      <div className="section__inner">
        <h2 className="section__heading">{t(COPY.location.heading)}</h2>

        <div className="location-grid">
          <div className="location-map">
            <iframe
              title="Tires SOS Rescue location"
              src={SITE.mapsEmbedSrc}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="location-details">
            <div className="location-block">
              <h3>{SITE.name}</h3>
              <p>{SITE.address.line1}</p>
              <p>{SITE.address.line2}</p>
              <a href={SITE.phoneHref}>{SITE.phone}</a>
              <a
                href={SITE.mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--secondary btn--small location-directions"
              >
                {t(COPY.hero.directions)}
              </a>
            </div>

            <div className="location-block">
              <h3>{t(COPY.location.hoursTitle)}</h3>
              <table className="hours-table">
                <tbody>
                  {SITE.hours.map((h) => (
                    <tr key={h.day} className={h.day === today ? "hours-table__today" : ""}>
                      <td>{t(h.label)}</td>
                      <td>
                        {h.open && h.close
                          ? `${h.open} – ${h.close}`
                          : t(COPY.location.closedLabel)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
