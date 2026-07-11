"use client";

import { useT } from "../i18n/LanguageContext";
import { COPY, SITE } from "../site.config";
import Reveal from "./Reveal";
import PirelliBadge from "./PirelliBadge";

export default function Footer() {
  const t = useT();
  const year = new Date().getFullYear();
  const legalLinks = [
    { href: "/privacy", label: { en: "Privacy Policy", es: "Política de Privacidad" } },
    { href: "/terms", label: { en: "Terms of Use", es: "Términos de Uso" } },
    { href: "/disclaimer", label: { en: "Disclaimer", es: "Aviso Legal" } },
  ];

  return (
    <footer className="footer">
      <Reveal className="footer__inner">
        <div>
          <div className="footer__brand">
            <img className="footer__logo" src="/logo-mark.png" alt={SITE.name} />
            <div className="footer__brand-copy">
              <span className="footer__brand-name">{SITE.nameShort}</span>
              <span className="footer__brand-flag" aria-hidden="true">
                <span className="footer__brand-tire footer__brand-tire--yellow" />
                <span className="footer__brand-tire footer__brand-tire--blue" />
                <span className="footer__brand-tire footer__brand-tire--red" />
              </span>
            </div>
          </div>
          <PirelliBadge compact className="footer__pirelli" />
          {SITE.locations.map((loc) => (
            <p key={loc.id}>{loc.full}</p>
          ))}
          <a href={SITE.whatsappHref || SITE.phoneHref} target="_blank" rel="noreferrer">
            WhatsApp
          </a>
          <p className="footer__payments">
            <span className="afterpay-chip">Snap Finance</span>
            <span className="afterpay-chip afterpay-chip--mint">Afterpay</span>
            · Visa · Mastercard · Cash
          </p>
        </div>

        <div>
          <p className="footer__label">{t(COPY.footer.followUs)}</p>
          <div className="footer__social">
            <a href={SITE.social.instagram} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
            <a href={SITE.social.tiktok} target="_blank" rel="noopener noreferrer">
              TikTok
            </a>
            <a href={SITE.social.facebook} target="_blank" rel="noopener noreferrer">
              Facebook
            </a>
          </div>
          <p className="footer__label footer__label--legal">Legal</p>
          <div className="footer__legal">
            {legalLinks.map((link) => (
              <a key={link.href} href={link.href}>
                {t(link.label)}
              </a>
            ))}
          </div>
        </div>
      </Reveal>

      <p className="footer__copyright">
        © {year} {SITE.name}. {t(COPY.footer.rights)}
      </p>
    </footer>
  );
}
