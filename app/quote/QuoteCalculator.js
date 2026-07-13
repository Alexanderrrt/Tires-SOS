"use client";

import { useCallback, useMemo, useState } from "react";
import { useT } from "../i18n/LanguageContext";
import { useLanguage } from "../i18n/LanguageContext";
import { COPY, SITE } from "../site.config";
import Icon from "../components/Icons";
import { estimateTotal, formatMoney, buildWhatsAppMessage, clampQty } from "../../lib/quote";
import { VEHICLE_BRANDS, getVehicleImagePath } from "../../lib/vehicles";

export default function QuoteCalculator({ pricing }) {
  const t = useT();
  const { lang } = useLanguage();

  const [vehicleClass, setVehicleClass] = useState(pricing.vehicleClasses[1]?.id || pricing.vehicleClasses[0].id);
  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [year, setYear] = useState("");
  const [imgError, setImgError] = useState(false);
  const [selections, setSelections] = useState({});

  const selectedBrand = VEHICLE_BRANDS.find((b) => b.id === brandId);
  const selectedModel = selectedBrand?.models.find((m) => m.id === modelId);

  const vehicleText = [
    year,
    selectedBrand?.name,
    selectedModel?.name,
  ].filter(Boolean).join(" ");

  const vehicleImagePath = brandId && modelId && year
    ? getVehicleImagePath(brandId, modelId, year)
    : null;

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

          <div className="quote__vehicle-selects">
            <label className="quote__field">
              <span className="quote__label">{t(COPY.quote.vehicleBrandLabel)}</span>
              <select
                value={brandId}
                onChange={(e) => {
                  setBrandId(e.target.value);
                  setModelId("");
                  setYear("");
                  setImgError(false);
                }}
              >
                <option value="">{t(COPY.quote.vehicleBrandPlaceholder)}</option>
                {VEHICLE_BRANDS.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </label>

            <label className="quote__field">
              <span className="quote__label">{t(COPY.quote.vehicleModelLabel)}</span>
              <select
                value={modelId}
                disabled={!selectedBrand}
                onChange={(e) => {
                  setModelId(e.target.value);
                  setYear("");
                  setImgError(false);
                }}
              >
                <option value="">{t(COPY.quote.vehicleModelPlaceholder)}</option>
                {selectedBrand?.models.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>

            <label className="quote__field">
              <span className="quote__label">{t(COPY.quote.vehicleYearLabel)}</span>
              <select
                value={year}
                disabled={!selectedModel}
                onChange={(e) => {
                  setYear(e.target.value);
                  setImgError(false);
                }}
              >
                <option value="">{t(COPY.quote.vehicleYearPlaceholder)}</option>
                {selectedModel?.years.slice().reverse().map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
          </div>

          {vehicleImagePath && !imgError && (
            <div className="quote__vehicle-img">
              <img
                src={vehicleImagePath}
                alt={vehicleText}
                onError={() => setImgError(true)}
              />
            </div>
          )}
        </fieldset>

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
                      {on ? "âœ•" : "+"}
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

      <aside className="quote__result">
        <div className="quote__result-inner">
          <span className="quote__result-label">{t(COPY.quote.estimateLabel)}</span>

          {result.hasSelection ? (
            <>
              <p className="quote__range">
                {formatMoney(result.low, cur)} <span>â€“</span> {formatMoney(result.high, cur)}
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
