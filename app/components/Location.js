"use client";

import { useEffect, useState } from "react";
import { useT } from "../i18n/LanguageContext";
import { COPY, SITE } from "../site.config";
import { getShopDateTime } from "../../lib/shop-time";
import Icon from "./Icons";
import Reveal from "./Reveal";
import PirelliBadge from "./PirelliBadge";

function LocationCard({ loc, t }) {
  if (loc.status === "mystery") return <div className="location-card location-card--mystery"><div className="location-card__map location-card__map--mystery" aria-hidden="true"><span>TIRES SOS</span><i /></div><div className="location-card__details"><span className="location-card__eyebrow">{t({ en: "New location", es: "Nueva ubicación" })}</span><h3>{t(loc.teaser)}</h3><p>{t(loc.teaserSub)}</p></div></div>;
  const isNewStore = loc.id === "hayward" && loc.status === "revealed";
  return (
    <div className={`location-card${isNewStore ? " location-card--new" : ""}`}>
      <div className="location-card__map">
        <iframe
          title={`Tires SOS Rescue — ${loc.line1}`}
          src={loc.mapsEmbedSrc}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="location-card__details">
        {isNewStore && <span className="location-card__eyebrow">{t({ en: "Now open — Store 03", es: "Ya abrimos — Tienda 03" })}</span>}
        <h3>{SITE.name}</h3>
        <p>{loc.line1}</p>
        <p>{loc.line2}</p>
        {loc.phone && <a className="location-card__phone" href={loc.whatsappHref || SITE.whatsappHref || SITE.phoneHref} target="_blank" rel="noreferrer">{loc.phone}</a>}
        <a href={loc.whatsappHref || SITE.whatsappHref || SITE.phoneHref} target="_blank" rel="noreferrer" className="btn btn--ghost btn--small location-whatsapp">
          <Icon name="chat" /> WhatsApp
        </a>
        <a
          href={loc.mapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn--ghost btn--small location-directions"
        >
          <Icon name="pin" /> {t(COPY.hero.directions)}
        </a>
      </div>
    </div>
  );
}

export default function Location() {
  const t = useT();
  const [today, setToday] = useState(null);
  const [locations, setLocations] = useState(SITE.locations.filter((loc) => loc.id !== "hayward"));

  useEffect(() => {
    const update = () => setToday(getShopDateTime().dayOfWeek);
    update();
    const timer = setInterval(update, 60 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => { fetch("/api/locations", { cache: "no-store" }).then((r) => r.ok ? r.json() : null).then((data) => data?.locations && setLocations(data.locations)).catch(() => {}); }, []);

  return (
    <section id="location" className="section section--tread">
      <div className="section__inner">
        <Reveal>
          <h2 className="section__heading">{t(COPY.location.heading)}</h2>
          <PirelliBadge compact className="section__pirelli" />
        </Reveal>

        <Reveal className="location-storefront">
          <img
            className="location-storefront__img"
            src="/storefront.jpg"
            alt="Tires SOS Rescue storefront at 623 E Taylor St, San Jose, CA"
            loading="lazy"
          />
        </Reveal>

        <Reveal className="location-grid">
          {locations.map((loc) => (
            <LocationCard key={loc.id} loc={loc} t={t} />
          ))}
        </Reveal>

        <Reveal>
          <div className="location-block location-block--hours">
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
        </Reveal>
      </div>
    </section>
  );
}
