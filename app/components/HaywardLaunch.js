"use client";

import { useEffect, useState } from "react";
import { useT } from "../i18n/LanguageContext";
import { COPY, SITE } from "../site.config";
import Icon from "./Icons";

export default function HaywardLaunch() {
  const t = useT();
  const [location, setLocation] = useState(null);

  useEffect(() => {
    let active = true;
    fetch("/api/locations", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!active) return;
        const hayward = data?.locations?.find(
          (item) => item.id === "hayward" && item.status === "revealed",
        );
        if (hayward) setLocation(hayward);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  if (!location) return null;

  const contactHref = location.whatsappHref || SITE.whatsappHref || SITE.phoneHref;

  return (
    <aside className="hayward-launch" aria-labelledby="hayward-launch-title">
      <div className="hayward-launch__route" aria-hidden="true">
        <span>01</span><i /><span>02</span><i /><strong>03</strong>
      </div>
      <div className="hayward-launch__content">
        <p className="hayward-launch__eyebrow">
          <span className="hayward-launch__pulse" /> {t(COPY.launch.eyebrow)}
        </p>
        <h2 id="hayward-launch-title">
          {t(COPY.launch.title)} <span>{t(COPY.launch.titleAccent)}</span>
        </h2>
        <p className="hayward-launch__body">{t(COPY.launch.body)}</p>
        <p className="hayward-launch__address">
          <Icon name="pin" />
          <span><strong>{location.line1}</strong>{location.line2}</span>
        </p>
        <div className="hayward-launch__actions">
          <a className="btn btn--primary" href={location.mapsHref} target="_blank" rel="noopener noreferrer">
            <Icon name="pin" /> {t(COPY.launch.directions)}
          </a>
          <a className="btn btn--ghost" href={contactHref} target="_blank" rel="noopener noreferrer">
            <Icon name="chat" /> {t(COPY.launch.contact)}
          </a>
        </div>
      </div>
      <div className="hayward-launch__stamp" aria-hidden="true">
        <small>{t(COPY.launch.storeLabel)}</small>
        <strong>03</strong>
        <span>HAYWARD</span>
      </div>
    </aside>
  );
}
