"use client";

import { useT } from "../i18n/LanguageContext";
import { COPY, SITE } from "../site.config";
import Icon from "./Icons";

const TRUST_ITEMS = [
  ["speed", "SERVICIO RÁPIDO", "Atención inmediata y sin largas esperas."],
  ["shield", "MARCAS REALES", "Trabajamos con las mejores marcas del mercado."],
  ["badge", "PRECIOS JUSTOS", "Calidad premium al mejor precio."],
  ["people", "ATENCIÓN PERSONAL", "Te asesoramos y te ayudamos a elegir lo mejor para ti."],
  ["pin", "EN SAN JOSÉ, CA", "Local y comprometidos con nuestra comunidad."],
];

function TrustIcon({ type }) {
  const paths = {
    speed: <><path d="M4 16a8 8 0 1 1 16 0" /><path d="M12 12l4-4M7 18h10" /></>,
    shield: <><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
    badge: <><circle cx="12" cy="12" r="7" /><path d="m12 7 1.5 3 3.3.5-2.4 2.3.6 3.2-3-1.5-3 1.5.6-3.2-2.4-2.3 3.3-.5L12 7z" /></>,
    people: <><circle cx="9" cy="9" r="3" /><circle cx="17" cy="10" r="2.2" /><path d="M3.5 20c.4-3.2 2.2-5 5.5-5s5.1 1.8 5.5 5M14 15.2c2.8-.8 5.3.7 6 3.8" /></>,
    pin: <><path d="M12 21s-6-5.2-6-10a6 6 0 0 1 12 0c0 4.8-6 10-6 10z" /><circle cx="12" cy="11" r="2.2" /></>,
  };
  return <svg className="trust-bar__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[type]}</svg>;
}

export default function Hero() {
  const t = useT();
  const openChat = () => window.dispatchEvent(new CustomEvent("tires-sos:open-chat"));
  return (
    <section id="top" className="hero">
      <div className="hero__inner">
        <div className="hero__text">
          <p className="hero__kicker"><Icon name="pin" /> {t(COPY.hero.kicker)}</p>
          <h1 className="hero__title">
            TIRES <span>SOS</span><br />
            RESCUE
            <small>Tire Shop in San José, CA</small>
          </h1>
          <p className="hero__tagline">{t(SITE.tagline)}</p>
          <div className="hero__actions">
            <a href="/quote" className="btn btn--primary"><Icon name="chat" /> {t(COPY.quote.ctaFromHome)} <Icon name="arrow" /></a>
            <a href={SITE.whatsappHref} target="_blank" rel="noreferrer" className="btn btn--ghost"><Icon name="chat" /> WhatsApp</a>
            <a href={SITE.locations[0].mapsHref} target="_blank" rel="noopener noreferrer" className="btn btn--ghost"><Icon name="pin" /> {t(COPY.hero.directions)}</a>
          </div>
          <p className="hero__afterpay"><span className="afterpay-label">ACEPTAMOS:</span><span className="afterpay-chip">SNAP FINANCE</span><span className="afterpay-chip afterpay-chip--mint">AFTERPAY</span> Pagos flexibles a tu manera</p>
          <a href={SITE.whatsappHref} target="_blank" rel="noreferrer" className="hero__flyer" aria-label="Ask about the four-tire $340 promotion on WhatsApp">
            <img src="/sos-340-flyer.png" alt="Four tires from $340 promotion" />
            <span className="hero__flyer-cta"><Icon name="chat" /> Preguntar por WhatsApp</span>
          </a>
        </div>

        <div className="hero__visual">
          <div className="hero__portrait-card">
            <img className="hero__portrait" src="/owner.jpg" alt="Owner of Tires SOS Rescue" />
            <div className="hero__portrait-caption"><strong>TIRES SOS</strong><span>RESCUE</span><small>TIRE SHOP · SAN JOSÉ, CA</small></div>
          </div>
          <button type="button" className="hero__live-chat" onClick={openChat}><Icon name="chat" /><span><strong>CHAT EN VIVO</strong><small>Pregunta al taller</small></span><i /></button>
        </div>
      </div>
      <div className="trust-bar">
        {TRUST_ITEMS.map(([icon, title, body]) => <div className="trust-bar__item" key={title}><TrustIcon type={icon} /><span><strong>{title}</strong><small>{body}</small></span></div>)}
      </div>
    </section>
  );
}
