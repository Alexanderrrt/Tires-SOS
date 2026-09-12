"use client";

import { useT } from "../i18n/LanguageContext";
import Image from "next/image";
import Icon from "./Icons";
import Reveal from "./Reveal";

const COPY = {
  kicker: { en: "Inside Tires SOS", es: "Dentro de Tires SOS" },
  title: { en: "Real work. Real shop. Real care.", es: "Trabajo real. Taller real. Atención real." },
  intro: {
    en: "See where your car comes in, who works on it, and the equipment behind every tire and auto service visit.",
    es: "Mira dónde entra tu carro, quién lo atiende y el equipo detrás de cada servicio de llantas y auto.",
  },
  watch: { en: "Watch the shop film", es: "Ver el video del taller" },
  visit: { en: "Come see us", es: "Visítanos" },
  view: { en: "View service", es: "Ver servicio" },
  exterior: { en: "Find your way in", es: "Encuentra la entrada" },
  exteriorBody: { en: "Three convenient shops, easy parking, and a team ready to help.", es: "Tres talleres convenientes, estacionamiento fácil y un equipo listo para ayudarte." },
  service: { en: "Service in motion", es: "Servicio en acción" },
};

const PHOTOS = [
  { src: "/Media/Photo Sep 11 2026, 3 33 20 PM.jpg", alt: "Tires SOS Rescue entrance and storefront" },
  { src: "/Media/Photo Sep 11 2026, 3 33 45 PM.jpg", alt: "Tires SOS Rescue storefront from the side" },
  { src: "/Media/Photo Sep 11 2026, 3 34 10 PM.jpg", alt: "Tires SOS Rescue parking area and entrance" },
  { src: "/Media/Photo Sep 11 2026, 3 34 25 PM.jpg", alt: "Tires SOS Rescue shop exterior" },
];

const SERVICE_CLIPS = [
  { file: "tire-mounting.mp4", title: { en: "Tire mounting", es: "Montaje de llantas" }, body: { en: "Professional installation from the first lug to the final check.", es: "Instalación profesional desde el primer tornillo hasta la revisión final." }, href: "/services/new-tires", poster: "/Media/web/tire-mounting.jpg" },
  { file: "wheel-display.mp4", title: { en: "Wheels that fit", es: "Rines que quedan bien" }, body: { en: "See the styles we help match to your vehicle and budget.", es: "Mira los estilos que ayudamos a combinar con tu carro y presupuesto." }, href: "/services/rims", poster: "/Media/web/wheel-display.jpg" },
  { file: "brake-service.mp4", title: { en: "More than tires", es: "Más que llantas" }, body: { en: "Brakes, alignment, and everyday maintenance in the same shop.", es: "Frenos, alineación y mantenimiento diario en el mismo taller." }, href: "/services/brakes", poster: "/Media/web/brake-service.jpg" },
];

export default function ShopMediaShowcase() {
  const t = useT();

  return (
    <section id="shop-media" className="shop-media" aria-labelledby="shop-media-title">
      <div className="shop-media__inner">
        <Reveal className="shop-media__intro">
          <p className="shop-media__kicker">{t(COPY.kicker)}</p>
          <h2 id="shop-media-title">{t(COPY.title)}</h2>
          <p>{t(COPY.intro)}</p>
          <div className="shop-media__actions">
            <a href="#shop-film" className="btn btn--primary"><span className="shop-media__play-glyph" aria-hidden="true">▶</span> {t(COPY.watch)}</a>
            <a href="#locations" className="btn btn--ghost"><Icon name="pin" /> {t(COPY.visit)}</a>
          </div>
        </Reveal>

        <div id="shop-film">
          <Reveal className="shop-media__film">
            <div className="shop-media__film-frame">
              <video
                className="shop-media__film-video"
                src="/Media/web/shop-film.mp4"
                poster={PHOTOS[3].src}
                muted
                autoPlay
                loop
                playsInline
                preload="metadata"
                aria-label="Tires SOS Rescue shop and service bays"
              />
              <span className="shop-media__film-label"><i /> {t(COPY.service)}</span>
              <span className="shop-media__film-time">TIRES SOS · 01</span>
            </div>
          </Reveal>
        </div>

        <Reveal className="shop-media__cards">
          {SERVICE_CLIPS.map((clip, index) => (
            <article className="shop-media__card" key={clip.file} style={{ "--d": `${index * 90}ms` }}>
              <div className="shop-media__card-media">
                <video src={`/Media/web/${clip.file}`} poster={clip.poster} muted loop playsInline controls preload="metadata" aria-label={t(clip.title)} />
                <span className="shop-media__card-number">0{index + 1}</span>
              </div>
              <div className="shop-media__card-body">
                <h3>{t(clip.title)}</h3>
                <p>{t(clip.body)}</p>
                <a href={clip.href}>{t(COPY.view)} <Icon name="arrow" /></a>
              </div>
            </article>
          ))}
        </Reveal>

        <Reveal className="shop-media__exterior">
          <div className="shop-media__exterior-copy">
            <p className="shop-media__kicker">{t(COPY.exterior)}</p>
            <h3>{t(COPY.exteriorBody)}</h3>
          </div>
          <div className="shop-media__photo-grid">
            {PHOTOS.map((photo, index) => <Image key={photo.src} src={photo.src} alt={photo.alt} width={4032} height={3024} loading="lazy" style={{ "--photo-d": `${index * 70}ms` }} />)}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
