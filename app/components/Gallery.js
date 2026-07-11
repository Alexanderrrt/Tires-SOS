"use client";

import { useEffect, useRef, useState } from "react";
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
const FALLBACK_POSTERS = ["/storefront.jpg", "/owners-m3.jpg", "/owner.jpg", "/services/new-tires.jpg"];

// Resolves the first candidate URL that actually loads. Runs entirely
// client-side via a plain Image() probe — deliberately never rendered as a
// real <img> until we know it works, so there's no SSR/hydration race where
// a 404 fires its "error" event before React's onError listener is attached.
function resolveFirstWorkingImage(candidates, onResolved) {
  let cancelled = false;
  (async () => {
    for (const candidate of candidates) {
      // eslint-disable-next-line no-await-in-loop
      const ok = await new Promise((resolve) => {
        const probe = new window.Image();
        probe.onload = () => resolve(true);
        probe.onerror = () => resolve(false);
        probe.src = candidate;
      });
      if (cancelled) return;
      if (ok) {
        onResolved(candidate);
        return;
      }
    }
    if (!cancelled) onResolved(null);
  })();
  return () => {
    cancelled = true;
  };
}

const EMBED_SCRIPT_SRC = "https://www.instagram.com/embed.js";

// Loads Instagram's official embed script once, on first use, instead of on
// every page load — we only need it when someone actually opens a reel.
function loadEmbedScript() {
  return new Promise((resolve, reject) => {
    if (window.instgrm) {
      resolve();
      return;
    }
    const existing = document.querySelector(`script[src="${EMBED_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("embed script failed")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = EMBED_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("embed script failed"));
    document.body.appendChild(script);
  });
}

function ReelModal({ permalink, onClose }) {
  const [status, setStatus] = useState("loading"); // "loading" | "ready" | "error"

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKeyDown = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);

    let cancelled = false;
    loadEmbedScript()
      .then(() => {
        if (cancelled) return;
        // The blockquote must already be in the DOM before Embeds.process()
        // runs, so wait a tick for React's render to commit it.
        requestAnimationFrame(() => {
          if (cancelled) return;
          try {
            window.instgrm.Embeds.process();
            setStatus("ready");
          } catch {
            setStatus("error");
          }
        });
      })
      .catch(() => !cancelled && setStatus("error"));

    return () => {
      cancelled = true;
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [permalink, onClose]);

  return (
    <div className="reel-modal" onClick={onClose}>
      <div className="reel-modal__panel" onClick={(e) => e.stopPropagation()}>
        <button className="reel-modal__close" onClick={onClose} aria-label="Close">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        {status !== "error" ? (
          <>
            {status === "loading" && (
              <div className="reel-modal__loading">
                <span className="reel-modal__spinner" />
              </div>
            )}
            <blockquote
              className="instagram-media"
              data-instgrm-permalink={permalink}
              data-instgrm-version="14"
              style={{ margin: 0 }}
            />
          </>
        ) : (
          <div className="reel-modal__fallback">
            <p>We couldn&apos;t load this reel here.</p>
            <a href={permalink} target="_blank" rel="noopener noreferrer" className="btn btn--primary">
              <Icon name="instagram" /> Open on Instagram
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function ReelCard({ permalink, index, onPlay }) {
  const [src, setSrc] = useState(undefined); // undefined = still probing, null = nothing worked

  useEffect(() => {
    const candidates = [`/reels/reel-${index + 1}.jpg`, FALLBACK_POSTERS[index % FALLBACK_POSTERS.length]];
    return resolveFirstWorkingImage(candidates, setSrc);
  }, [index]);

  return (
    <button
      type="button"
      className="reel-card reveal-item"
      style={{ "--d": `${index * 80}ms` }}
      onClick={() => onPlay(permalink)}
    >
      {src ? (
        <img className="reel-card__thumb" src={src} alt="Tires SOS Rescue Instagram reel" decoding="async" />
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
    </button>
  );
}

export default function Gallery() {
  const t = useT();
  const trackRef = useRef(null);
  const [playing, setPlaying] = useState(null);

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
              <ReelCard key={permalink} permalink={permalink} index={i} onPlay={setPlaying} />
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

      {playing && <ReelModal permalink={playing} onClose={() => setPlaying(null)} />}
    </section>
  );
}
