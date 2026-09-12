"use client";

import { useRef, useState } from "react";
import { useT } from "../i18n/LanguageContext";
import { BRAND_SHOWCASE, SITE } from "../site.config";
import Icon from "./Icons";

const COPY = {
  kicker: { en: "Tire brands", es: "Marcas de llantas" },
  title: { en: "The brands we carry.", es: "Las marcas que manejamos." },
  cta: { en: "Ask about tires", es: "Pregunta por llantas" },
  play: { en: "Play film", es: "Reproducir video" },
  pause: { en: "Pause film", es: "Pausar video" },
  soundOn: { en: "Turn sound on", es: "Activar sonido" },
  soundOff: { en: "Mute sound", es: "Silenciar" },
};

const SOLD_BRANDS = BRAND_SHOWCASE.filter((brand) => brand.name !== "Pirelli");

function PlayGlyph({ paused }) {
  return paused ? (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM14 5h4v14h-4z" fill="currentColor" /></svg>
  );
}

function SoundGlyph({ muted }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 10v4h4l5 4V6L8 10H4z" fill="currentColor" />
      {muted ? (
        <path d="m16 9 5 6m0-6-5 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      ) : (
        <path d="M16 9.2a4 4 0 0 1 0 5.6M18.5 7a7 7 0 0 1 0 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      )}
    </svg>
  );
}

export default function CinematicVideo() {
  const t = useT();
  const videoRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const [muted, setMuted] = useState(true);

  function togglePlayback() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setPaused(false);
    } else {
      video.pause();
      setPaused(true);
    }
  }

  function toggleSound() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
  }

  return (
    <section className="cinema" aria-labelledby="cinema-title">
      <div className="cinema__ambient" aria-hidden="true" />
      <div className="cinema__grain" aria-hidden="true" />

      <div className="cinema__inner">
        <div className="cinema__brands">
          <p className="cinema__kicker">{t(COPY.kicker)}</p>
          <h2 id="cinema-title">{t(COPY.title)}</h2>
          <div className="cinema__brand-grid">
            {SOLD_BRANDS.map((brand) => (
              <div className="cinema__brand" key={brand.name}>
                <img src={brand.logo} alt={`${brand.name} logo`} />
              </div>
            ))}
          </div>
          <a href={SITE.whatsappHref} target="_blank" rel="noreferrer" className="btn btn--small cinema__brand-cta">
            <Icon name="chat" /> {t(COPY.cta)}
          </a>
        </div>

        <div className="cinema__frame">
          <span className="cinema__sprockets cinema__sprockets--left" aria-hidden="true" />
          <span className="cinema__sprockets cinema__sprockets--right" aria-hidden="true" />
          <video
            ref={videoRef}
            className="cinema__video"
            src="/sobre-ruedas-web.mp4"
            poster="/sobre-ruedas-poster.jpg"
            muted
            autoPlay
            loop
            playsInline
            preload="auto"
            onPlay={() => setPaused(false)}
            onPause={() => setPaused(true)}
          />
          <div className="cinema__controls">
            <button type="button" onClick={togglePlayback} aria-label={t(paused ? COPY.play : COPY.pause)}>
              <PlayGlyph paused={paused} />
            </button>
            <button type="button" onClick={toggleSound} aria-label={t(muted ? COPY.soundOn : COPY.soundOff)}>
              <SoundGlyph muted={muted} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
