"use client";

import { useRef } from "react";
import { useT } from "../i18n/LanguageContext";
import { COPY, REELS, SITE } from "../site.config";
import Icon from "./Icons";
import Reveal from "./Reveal";
import PirelliBadge from "./PirelliBadge";

// Instagram blocks both direct browser hotlinks (ERR_BLOCKED_BY_ORB) and
// server-side scraping of its thumbnail/og:image (bot-walled shell page) for
// unauthenticated requests, so a live-fetched screenshot isn't reliable here.
// To drop in a REAL screenshot for a reel, save it as /public/reels/reel-N.jpg
// (N = 1-indexed position in REELS below) — it's tried first automatically.
// Until then, real shop photography is used as an on-brand poster.
const FALLBACK_POSTERS = ["/storefront-3-locations.png", "/owners-m3.jpg", "/owner.jpg", "/service-media/new-tires.jpg"];
const POSTER_FOCAL_POINTS = ["center", "52% center", "28% center", "center"];
const REEL_POSTERS = ["/reels/reel-1.png", ...FALLBACK_POSTERS.slice(1)];

function ReelCard({ permalink, index }) {
  const src = REEL_POSTERS[index] || FALLBACK_POSTERS[index % FALLBACK_POSTERS.length];

  return (
    <a
      href={permalink}
      target="_blank"
      rel="noopener noreferrer"
      className={`reel-card reveal-item${index === 0 ? " reel-card--driver-promo" : ""}`}
      style={{
        "--d": `${index * 80}ms`,
        "--reel-poster-position": POSTER_FOCAL_POINTS[index % POSTER_FOCAL_POINTS.length],
      }}
    >
      <img className="reel-card__thumb" src={src} alt="Tires SOS Rescue Instagram reel" decoding="async" />
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
          <PirelliBadge compact className="section__pirelli" />
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
