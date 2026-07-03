"use client";

import { useT } from "../i18n/LanguageContext";
import { COPY, REELS, SITE } from "../site.config";
import Icon from "./Icons";
import Reveal from "./Reveal";

// Featured Instagram reels, embedded via Instagram's iframe endpoint
// (no external script needed). Permalinks live in site.config.js.
export default function Gallery() {
  const t = useT();

  return (
    <section id="gallery" className="section section--muted">
      <div className="section__inner">
        <Reveal>
          <h2 className="section__heading">{t(COPY.gallery.heading)}</h2>
          <p className="section__sub">{t(COPY.gallery.sub)}</p>
        </Reveal>

        <Reveal className="reels-grid">
          {REELS.map((permalink, i) => (
            <div className="reel-card reveal-item" style={{ "--d": `${i * 80}ms` }} key={permalink}>
              <iframe
                src={`${permalink}embed/`}
                title={`Tires SOS Rescue Instagram reel ${i + 1}`}
                loading="lazy"
                allowFullScreen
                scrolling="no"
              />
            </div>
          ))}
        </Reveal>

        <Reveal>
          <a
            href={SITE.social.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--primary gallery-cta"
          >
            <Icon name="instagram" /> Follow @tiressosrescue
          </a>
        </Reveal>
      </div>
    </section>
  );
}
