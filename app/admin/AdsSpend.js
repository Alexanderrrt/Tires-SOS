"use client";

import { useEffect, useState } from "react";

const PLATFORM_META = {
  google_ads: { label: "Google Ads", icon: "🔍", color: "#4285F4" },
  meta_ads: { label: "Meta Ads", icon: "📘", color: "#0866FF" },
  yelp: { label: "Yelp Ads", icon: "⭐", color: "#D32323" },
};

const COPY = {
  totalSpend: { en: "Total Ad Spend", es: "Gasto total en anuncios" },
  days: { en: "days", es: "días" },
  byPlatform: { en: "Spend by platform", es: "Gasto por plataforma" },
  ofTotal: { en: "of total spend", es: "del gasto total" },
  loading: { en: "Loading spend data…", es: "Cargando datos de gasto…" },
  clicks: { en: "clicks", es: "clics" },
  conversions: { en: "conversions", es: "conversiones" },
  roas: { en: "ROAS", es: "ROAS" },
  noSpend: { en: "No spend recorded for this platform in this period.", es: "Sin gasto registrado para esta plataforma en este periodo." },
};

export default function AdsSpend({ t }) {
  const [days, setDays] = useState(7);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    setMetrics(null);
    fetch(`/api/admin/ads-metrics?days=${days}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data && typeof data.totalSpend === "number") setMetrics(data); })
      .catch(() => {});
  }, [days]);

  const totalSpend = metrics?.totalSpend || 0;

  return (
    <>
      <div className="editor__group" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              type="button"
              className={`btn btn--small ${days === d ? "btn--primary" : "btn--ghost"}`}
              onClick={() => setDays(d)}
            >
              {d} {t(COPY.days)}
            </button>
          ))}
        </div>
      </div>

      {!metrics ? (
        <div className="editor__group" style={{ marginTop: 14, textAlign: "center", color: "var(--admin-muted)" }}>{t(COPY.loading)}</div>
      ) : (
        <>
          <div className="ads-stat" style={{ marginTop: 14 }}>
            <div className="ads-stat-label">{t(COPY.totalSpend)}</div>
            <div className="ads-stat-value">${totalSpend.toFixed(0)}</div>
            <div className="ads-stat-sub">last {days} {t(COPY.days)}</div>
          </div>

          <section className="editor__group" style={{ marginTop: 14 }}>
            <h2>{t(COPY.byPlatform)}</h2>
            <div style={{ display: "grid", gap: 14, marginTop: 14 }}>
              {Object.entries(PLATFORM_META).map(([key, meta]) => {
                const data = metrics.byPlatform?.[key] || { spend: 0, conversions: 0, clicks: 0, roas: 0 };
                const pct = totalSpend > 0 ? (Number(data.spend) / totalSpend) * 100 : 0;
                return (
                  <div key={key}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
                      <span>{meta.icon}</span>
                      <strong style={{ fontSize: ".85rem" }}>{meta.label}</strong>
                      <span style={{ marginLeft: "auto", fontWeight: 700 }}>${Number(data.spend).toFixed(0)}</span>
                      <span style={{ color: "var(--admin-muted)", fontSize: ".7rem", minWidth: 40, textAlign: "right" }}>{pct.toFixed(0)}%</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 999, background: "var(--admin-panel-subtle)", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${Math.max(pct, data.spend > 0 ? 2 : 0)}%`, background: meta.color, borderRadius: 999 }} />
                    </div>
                    <div style={{ display: "flex", gap: 16, marginTop: 6, color: "var(--admin-muted)", fontSize: ".7rem" }}>
                      <span>{data.clicks?.toLocaleString?.() ?? data.clicks} {t(COPY.clicks)}</span>
                      <span>{data.conversions} {t(COPY.conversions)}</span>
                      <span>{data.roas}x {t(COPY.roas)}</span>
                    </div>
                    {Number(data.spend) === 0 && (
                      <p className="editor__hint" style={{ marginTop: 6 }}>{t(COPY.noSpend)}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </>
  );
}
