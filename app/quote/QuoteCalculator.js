"use client";

import { useMemo, useState } from "react";
import { useT } from "../i18n/LanguageContext";
import { useLanguage } from "../i18n/LanguageContext";
import { COPY, SITE } from "../site.config";
import Icon from "../components/Icons";
import { estimateTotal, formatMoney, buildWhatsAppMessage, clampQty } from "../../lib/quote";

export default function QuoteCalculator({ pricing }) {
  const t = useT();
  const { lang } = useLanguage();

  const [vehicleClass, setVehicleClass] = useState(pricing.vehicleClasses[1]?.id || pricing.vehicleClasses[0].id);
  const [vehicleText, setVehicleText] = useState("");
  const [selections, setSelections] = useState({});

  const toggle = (svc) =>
    setSelections((prev) => {
      const cur = prev[svc.id];
      if (cur?.selected) return { ...prev, [svc.id]: { ...cur, selected: false } };
      return {
        ...prev,
        [svc.id]: {
          selected: true,
          qty: svc.qty?.default ?? 1,
          optionId: svc.options?.[0]?.id,
        },
      };
    });

  const setQty = (svc, qty) =>
    setSelections((prev) => ({ ...prev, [svc.id]: { ...prev[svc.id], qty: clampQty(svc, qty) } }));

  const setOption = (svc, optionId) =>
    setSelections((prev) => ({ ...prev, [svc.id]: { ...prev[svc.id], optionId } }));

  const result = useMemo(
    () => estimateTotal(pricing, vehicleClass, selections),
    [pricing, vehicleClass, selections]
  );

  const waHref = useMemo(() => {
    if (!result.hasSelection) return null;
    const msg = buildWhatsAppMessage({ pricing, lang, vehicleClass, vehicleText, result });
    return `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(msg)}`;
  }, [pricing, lang, vehicleClass, vehicleText, result]);

  const cur = pricing.currency;

  return (
    <div className="quote">
      <div className="quote__form">
        {/* Step 1 — vehicle */}
        <fieldset className="quote__step">
          <legend>{t(COPY.quote.vehicleStep)}</legend>

          <span className="quote__label">{t(COPY.quote.vehicleClassLabel)}</span>
          <div className="quote__chips" role="radiogroup" aria-label={t(COPY.quote.vehicleClassLabel)}>
            {pricing.vehicleClasses.map((vc) => (
              <button
                key={vc.id}
                type="button"
                role="radio"
                aria-checked={vehicleClass === vc.id}
                className={`quote__chip ${vehicleClass === vc.id ? "quote__chip--on" : ""}`}
                onClick={() => setVehicleClass(vc.id)}
              >
                {t(vc.label)}
              </button>
            ))}
          </div>

          <label className="quote__field">
            <span className="quote__label">{t(COPY.quote.vehicleTextLabel)}</span>
            <input
              type="text"
              value={vehicleText}
              onChange={(e) => setVehicleText(e.target.value)}
              placeholder={t(COPY.quote.vehicleTextPlaceholder)}
            />
          </label>
        </fieldset>

        {/* Step 2 — services */}
        <fieldset className="quote__step">
          <legend>{t(COPY.quote.servicesStep)}</legend>
          <div className="quote__services">
            {pricing.services.map((svc) => {
              const sel = selections[svc.id];
              const on = Boolean(sel?.selected);
              return (
                <div key={svc.id} className={`quote__service ${on ? "quote__service--on" : ""}`}>
                  <button
                    type="button"
                    className="quote__service-head"
                    aria-pressed={on}
                    onClick={() => toggle(svc)}
                  >
                    <span className="quote__service-icon">
                      <Icon name={svc.icon} />
                    </span>
                    <span className="quote__service-name">{t(svc.label)}</span>
                    <span className={`quote__check ${on ? "quote__check--on" : ""}`} aria-hidden="true">
                      {on ? "✕" : "+"}
                    </span>
                  </button>

                  {on && svc.model === "perUnit" && (
                    <label className="quote__inline">
                      <span>{t(COPY.quote.qtyLabel)}</span>
                      <input
                        type="number"
                        min={svc.qty?.min ?? 1}
                        max={svc.qty?.max ?? 4}
                        value={sel.qty}
                        onChange={(e) => setQty(svc, Number(e.target.value))}
                      />
                    </label>
                  )}

                  {on && svc.model === "options" && (
                    <div className="quote__options">
                      {svc.options.map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          className={`quote__opt ${sel.optionId === o.id ? "quote__opt--on" : ""}`}
                          onClick={() => setOption(svc, o.id)}
                        >
                          {t(o.label)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </fieldset>
      </div>

      {/* Result rail */}
      <aside className="quote__result">
        <div className="quote__result-inner">
          <span className="quote__result-label">{t(COPY.quote.estimateLabel)}</span>

          {result.hasSelection ? (
            <>
              <p className="quote__range">
                {formatMoney(result.low, cur)} <span>–</span> {formatMoney(result.high, cur)}
              </p>
              <ul className="quote__lines">
                {result.lines.map((l) => (
                  <li key={l.id}>
                    <span>{t(l.label)}</span>
                    <span>{formatMoney(l.amount, cur)}</span>
                  </li>
                ))}
              </ul>
              <a className="btn btn--primary quote__send" href={waHref} target="_blank" rel="noopener noreferrer">
                <Icon name="phone" /> {t(COPY.quote.send)}
              </a>
            </>
          ) : (
            <p className="quote__empty">{t(COPY.quote.emptyState)}</p>
          )}

          <p className="quote__disclaimer">{t(pricing.disclaimer)}</p>
        </div>
      </aside>
    </div>
  );
}
