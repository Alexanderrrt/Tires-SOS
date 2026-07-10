"use client";

import { useRef, useState } from "react";
import { useT } from "../i18n/LanguageContext";
import { COPY, REELS, SITE } from "../site.config";
import Icon from "./Icons";
import Reveal from "./Reveal";

// Instagram's public per-post thumbnail — works for any public permalink
// without needing API credentials. Falls back to a branded placeholder (no
// broken-image icon) if it 404s or Instagram blocks the request.
function thumbnailUrl(permalink) {
  const base = permalink.endsWith("/") ? permalink : `${permalink}/`;
  return `${base}media/?size=l`;
}

function ReelCard({ permalink, index }) {
  const [failed, setFailed] = useState(false);

  return (
    <a
      href={permalink}
      target="_blank"
      rel="noopener noreferrer"
      className="reel-card reveal-item"
      style={{ "--d": `${index * 80}ms` }}
    >
      {!failed ? (
        <img
          className="reel-card__thumb"
          src={thumbnailUrl(permalink)}
          alt="Tires SOS Rescue Instagram reel"
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="reel-card__fallback">
          <Icon name="instagram" />
        </div>
      )}
      <span className="reel-card__scrim" />
      <span className="reel-card__play" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5.5v13l11-6.5-11-6.5z" />
        </svg>
      </span>
      <span className="reel-card__badge">
        <Icon name="instagram" />
        Watch on Instagram
      </span>
    </a>
  );
}

export default function Gallery() {
  const t = useT();
  const trackRef = useRef(null);

  const scroll = (dir) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector(".reel-card");
    const w = card ? card.offsetWidth + 16 : 280;
    track.scrollBy({ left: dir * w, behavior: "smooth" });
  };

  return (
    <section id="gallery" className="section section--muted">
      <div className="section__inner">
        <Reveal>
          <h2 className="section__heading">{t(COPY.gallery.heading)}</h2>
          <p className="section__sub">{t(COPY.gallery.sub)}</p>
        </Reveal>

        <Reveal className="reels-wrapper">
          <button className="reels-arrow reels-arrow--left" onClick={() => scroll(-1)} aria-label="Previous reel">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div className="reels-track" ref={trackRef}>
            {REELS.map((permalink, i) => (
              <ReelCard key={permalink} permalink={permalink} index={i} />
            ))}
          </div>
          <button className="reels-arrow reels-arrow--right" onClick={() => scroll(1)} aria-label="Next reel">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
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
