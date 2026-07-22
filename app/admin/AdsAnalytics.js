"use client";

import { useState } from "react";
import AdsDataState from "./AdsDataState";
import AdsPlatformWarnings from "./AdsPlatformWarnings";
import { useAdsMetrics } from "./useAdsData";
import { downloadAdsDashboardPdf } from "./ads-dashboard-pdf";

const PLATFORM = { google_ads: "Google Ads", meta_ads: "Meta Ads", yelp: "Yelp Ads" };

export default function AdsAnalytics({ lang = "es" }) {
  const [days, setDays] = useState(30);
  const [exporting, setExporting] = useState(false);
  const state = useAdsMetrics(days);
  const data = state.data;
  const es = lang === "es";

  async function download() {
    if (!data) return;
    setExporting(true);
    try { await downloadAdsDashboardPdf(data, days); }
    finally { setExporting(false); }
  }

  return (
    <div className="ads-analytics">
      <AdsDataState t={(value) => value?.[lang] || value?.en || ""} error={state.error} onRetry={state.retry} />
      <AdsPlatformWarnings metrics={data} />
      <section className="editor__group ads-analytics__hero">
        <div>
          <span className="ads-analytics__eyebrow">TIRES SOS RESCUE</span>
          <h2>{es ? "Ads Analytics" : "Ads Analytics"}</h2>
          <p className="editor__hint">{es ? "Rendimiento en vivo y reportes PDF de Google, Meta y Yelp." : "Live performance and PDF reports for Google, Meta, and Yelp."}</p>
        </div>
        <div className="ads-analytics__actions">
          <div className="ads-range-btns">
            {[7, 14, 30].map((value) => <button key={value} type="button" className={`btn btn--small ${days === value ? "btn--primary" : "btn--ghost"}`} onClick={() => setDays(value)}>{value} {es ? "días" : "days"}</button>)}
          </div>
          <button type="button" className="btn btn--primary btn--small" onClick={download} disabled={!data || exporting}>{exporting ? (es ? "Generando PDF…" : "Generating PDF…") : (es ? "Descargar reporte PDF" : "Download PDF report")}</button>
        </div>
      </section>

      {state.loading ? <section className="editor__group ads-analytics__loading">{es ? "Cargando métricas…" : "Loading metrics…"}</section> : data ? <>
        <div className="ads-stats ads-analytics__stats">
          <div className="ads-stat"><div className="ads-stat-label">{es ? "Gasto" : "Spend"}</div><div className="ads-stat-value">${data.totalSpend.toFixed(2)}</div><div className="ads-stat-sub">{days} {es ? "días" : "days"}</div></div>
          <div className="ads-stat"><div className="ads-stat-label">{es ? "Impresiones" : "Impressions"}</div><div className="ads-stat-value">{data.totalImpressions.toLocaleString()}</div><div className="ads-stat-sub">CTR {data.avgCTR}%</div></div>
          <div className="ads-stat"><div className="ads-stat-label">{es ? "Clics" : "Clicks"}</div><div className="ads-stat-value">{data.totalClicks.toLocaleString()}</div><div className="ads-stat-sub">CPC ${data.avgCPC}</div></div>
          <div className="ads-stat"><div className="ads-stat-label">{es ? "Conversiones" : "Conversions"}</div><div className="ads-stat-value">{data.totalConversions}</div><div className="ads-stat-sub">ROAS {data.avgROAS}x</div></div>
        </div>
        <section className="editor__group ads-analytics__platforms">
          <h2>{es ? "Rendimiento por plataforma" : "Performance by platform"}</h2>
          <table className="ads-table"><thead><tr><th>{es ? "Plataforma" : "Platform"}</th><th className="num">{es ? "Gasto" : "Spend"}</th><th className="num">{es ? "Impresiones" : "Impressions"}</th><th className="num">{es ? "Clics" : "Clicks"}</th><th className="num">CTR</th><th className="num">{es ? "Conversiones" : "Conversions"}</th></tr></thead><tbody>{Object.entries(data.byPlatform).map(([key, value]) => <tr key={key}><td><strong>{PLATFORM[key] || key}</strong><small className={`ads-analytics__source ${value.connected ? "is-live" : ""}`}>{value.connected ? (es ? "Conectado" : "Connected") : (es ? "Sin conexión" : "Disconnected")}</small></td><td className="num">${value.spend.toFixed(2)}</td><td className="num">{value.impressions.toLocaleString()}</td><td className="num">{value.clicks.toLocaleString()}</td><td className="num">{value.ctr}%</td><td className="num">{value.conversions}</td></tr>)}</tbody></table>
        </section>
      </> : null}
    </div>
  );
}
