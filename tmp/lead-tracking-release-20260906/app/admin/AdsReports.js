"use client";

import { useState } from "react";
import AdsDataState from "./AdsDataState";
import AdsPlatformWarnings from "./AdsPlatformWarnings";
import { useAdsMetrics } from "./useAdsData";

const PLATFORM_META = {
  google_ads: { label: "Google Ads", icon: "🔍" },
  meta_ads: { label: "Meta Ads", icon: "📘" },
  yelp: { label: "Yelp Ads", icon: "⭐" },
};

const COPY = {
  platform: { en: "Platform", es: "Plataforma" },
  date: { en: "Date", es: "Fecha" },
  spend: { en: "Spend", es: "Gasto" },
  conversions: { en: "Conversions", es: "Conversiones" },
  clicks: { en: "Clicks", es: "Clics" },
  roas: { en: "ROAS", es: "ROAS" },
  byPlatform: { en: "By platform", es: "Por plataforma" },
  daily: { en: "Daily breakdown", es: "Desglose diario" },
  loading: { en: "Loading report…", es: "Cargando reporte…" },
  noDaily: { en: "No daily data yet — fills in after the first sync.", es: "Aún no hay datos diarios — se llenará después de la primera sincronización." },
  days: { en: "days", es: "días" },
};

export default function AdsReports({ t }) {
  const [reportDays, setReportDays] = useState(7);
  const reportState = useAdsMetrics(reportDays);
  const reportData = reportState.data;

  return (
    <>
      <AdsDataState t={t} error={reportState.error} onRetry={reportState.retry} />
      <AdsPlatformWarnings metrics={reportData} />
      <div className="editor__group" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div className="ads-range-btns" style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              type="button"
              className={`btn btn--small ${reportDays === d ? "btn--primary" : "btn--ghost"}`}
              onClick={() => setReportDays(d)}
            >
              {d} {t(COPY.days)}
            </button>
          ))}
        </div>
      </div>

      {reportState.loading ? (
        <div className="editor__group" style={{ marginTop: 14, textAlign: "center", color: "var(--admin-muted)" }}>{t(COPY.loading)}</div>
      ) : reportData ? (
        <>
          <div className="ads-stats" style={{ marginTop: 14 }}>
            <div className="ads-stat"><div className="ads-stat-label">{t(COPY.spend)}</div><div className="ads-stat-value">${reportData.totalSpend.toFixed(0)}</div><div className="ads-stat-sub">last {reportDays} {t(COPY.days)}</div></div>
            <div className="ads-stat"><div className="ads-stat-label">{t(COPY.conversions)}</div><div className="ads-stat-value">{reportData.totalConversions}</div><div className="ads-stat-sub">CTR {reportData.avgCTR}%</div></div>
            <div className="ads-stat"><div className="ads-stat-label">{t(COPY.roas)}</div><div className="ads-stat-value">{reportData.avgROAS}x</div><div className="ads-stat-sub">{reportData.trend}</div></div>
            <div className="ads-stat"><div className="ads-stat-label">{t(COPY.clicks)}</div><div className="ads-stat-value">{reportData.totalClicks.toLocaleString()}</div><div className="ads-stat-sub">${reportData.avgCPC} avg CPC</div></div>
          </div>

          <section className="editor__group" style={{ marginTop: 14 }}>
            <h2>{t(COPY.byPlatform)}</h2>
            <table className="ads-table" style={{ marginTop: 10 }}>
              <thead><tr><th>{t(COPY.platform)}</th><th className="num">{t(COPY.spend)}</th><th className="num">{t(COPY.clicks)}</th><th className="num">{t(COPY.conversions)}</th><th className="num">{t(COPY.roas)}</th></tr></thead>
              <tbody>
                {Object.entries(reportData.byPlatform).map(([key, d]) => (
                  <tr key={key}>
                    <td>{PLATFORM_META[key]?.icon} {PLATFORM_META[key]?.label || key}</td>
                    <td className="num">${d.spend.toFixed(0)}</td>
                    <td className="num">{d.clicks.toLocaleString()}</td>
                    <td className="num">{d.conversions}</td>
                    <td className="num">{d.roas}x</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="editor__group" style={{ marginTop: 14 }}>
            <h2>{t(COPY.daily)}</h2>
            {reportData.daily.length === 0 ? (
              <p className="editor__hint">{t(COPY.noDaily)}</p>
            ) : (
              <table className="ads-table" style={{ marginTop: 10 }}>
                <thead><tr><th>{t(COPY.date)}</th><th className="num">{t(COPY.spend)}</th><th className="num">{t(COPY.clicks)}</th><th className="num">{t(COPY.conversions)}</th></tr></thead>
                <tbody>
                  {reportData.daily.map((d) => (
                    <tr key={d.date}>
                      <td>{d.date}</td>
                      <td className="num">${d.spend.toFixed(2)}</td>
                      <td className="num">{d.clicks.toLocaleString()}</td>
                      <td className="num">{d.conversions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      ) : null}
    </>
  );
}
