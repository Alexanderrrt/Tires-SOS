"use client";

import { useMemo } from "react";
import AdsDataState from "./AdsDataState";
import { useAdsConnections, useAdsMetrics } from "./useAdsData";

const PLATFORM_META = {
  google_ads: { label: "Google Ads", icon: "🔍" },
  meta_ads: { label: "Meta Ads", icon: "📘" },
  yelp: { label: "Yelp Ads", icon: "⭐" },
};

const COPY = {
  spend: { en: "Total Spend", es: "Gasto total" },
  spendLabel: { en: "Spend", es: "Gasto" },
  spendSub: { en: "last 7 days", es: "últimos 7 días" },
  conversions: { en: "Conversions", es: "Conversiones" },
  conversionsSub: { en: "calls, bookings, leads", es: "llamadas, citas, clientes" },
  roas: { en: "ROAS", es: "ROAS" },
  cpc: { en: "Avg CPC", es: "CPC prom." },
  clicks: { en: "clicks", es: "clics" },
  noClicks: { en: "no clicks yet", es: "sin clics todavía" },
  platforms: { en: "Platforms", es: "Plataformas" },
  connected: { en: "● Configured", es: "● Configurado" },
  notConnected: { en: "○ Not connected", es: "○ No conectado" },
  connectHint: { en: "Connect this account to pull live metrics and include it in AI recommendations.", es: "Conecta esta cuenta para obtener métricas en vivo e incluirla en las recomendaciones de IA." },
  connect: { en: "Connect →", es: "Conectar →" },
  liveUnavailable: { en: "Live metrics unavailable", es: "Métricas en vivo no disponibles" },
  loading: { en: "Loading live ad data…", es: "Cargando datos de anuncios en vivo…" },
};

export default function AdsOverview({ t, onNavigate }) {
  const metricsState = useAdsMetrics(7);
  const connectionsState = useAdsConnections();
  const metrics = metricsState.data;
  const connections = connectionsState.data;
  const connectedCount = useMemo(
    () => (connections ? Object.values(connections).filter((platform) => platform.connected).length : 0),
    [connections]
  );

  return (
    <>
      <AdsDataState t={t} error={metricsState.error || connectionsState.error} onRetry={() => { metricsState.retry(); connectionsState.retry(); }} />
      {(metricsState.loading || connectionsState.loading) && <p className="editor__hint">{t(COPY.loading)}</p>}
      <div className="ads-stats">
        <div className="ads-stat"><div className="ads-stat-label">{t(COPY.spend)}</div><div className="ads-stat-value">${metrics ? metrics.totalSpend.toFixed(0) : "—"}</div><div className="ads-stat-sub">{t(COPY.spendSub)}</div></div>
        <div className="ads-stat"><div className="ads-stat-label">{t(COPY.conversions)}</div><div className="ads-stat-value">{metrics ? metrics.totalConversions : "—"}</div><div className="ads-stat-sub">{t(COPY.conversionsSub)}</div></div>
        <div className="ads-stat"><div className="ads-stat-label">{t(COPY.roas)}</div><div className="ads-stat-value">{metrics ? metrics.avgROAS : "—"}x</div><div className="ads-stat-sub">{metrics?.trend === "improving" ? "📈" : metrics?.trend === "declining" ? "📉" : "➡️"} {metrics?.trend || "stable"}</div></div>
        <div className="ads-stat"><div className="ads-stat-label">{t(COPY.cpc)}</div><div className="ads-stat-value">${metrics ? metrics.avgCPC : "—"}</div><div className="ads-stat-sub">{metrics ? `${metrics.totalClicks.toLocaleString()} ${t(COPY.clicks)}` : t(COPY.noClicks)}</div></div>
      </div>

      <section className="editor__group" style={{ marginTop: 16 }}>
        <h2>{t(COPY.platforms)}</h2>
        <div className="ads-platforms" style={{ marginTop: 12 }}>
          {Object.entries(PLATFORM_META).map(([key, meta]) => {
            const connection = connections?.[key];
            const data = metrics?.byPlatform?.[key];
            return (
              <div key={key} className="ads-platform">
                <div className="ads-platform-head">
                  <span>{meta.icon}</span><span className="ads-platform-name">{meta.label}</span>
                  <span className={`ads-status-pill ${connection?.connected ? "connected" : "disconnected"}`}>{connection?.connected ? t(COPY.connected) : t(COPY.notConnected)}</span>
                </div>
                {connection?.connected ? (
                  <div>
                    <div className="ads-row"><span>{t(COPY.spendLabel)}</span><strong>${data ? data.spend.toFixed(0) : 0}</strong></div>
                    <div className="ads-row"><span>{t(COPY.conversions)}</span><strong>{data ? data.conversions : 0}</strong></div>
                    <div className="ads-row"><span>{t(COPY.roas)}</span><strong>{data ? data.roas : 0}x</strong></div>
                    {data?.error && <p className="editor__err" style={{ marginTop: 9 }}>{t(COPY.liveUnavailable)}: {data.error}</p>}
                    {!data?.error && data?.note && <p className="editor__hint" style={{ marginTop: 9 }}>{data.note}</p>}
                  </div>
                ) : (
                  <><p className="editor__hint" style={{ margin: "4px 0 10px" }}>{t(COPY.connectHint)}</p><button type="button" className="btn btn--primary btn--small" onClick={() => onNavigate("ads-settings")}>{t(COPY.connect)}</button></>
                )}
              </div>
            );
          })}
        </div>
        {connectedCount === 0 && connectionsState.loading && <p className="editor__hint" style={{ marginTop: 10 }}>{t(COPY.loading)}</p>}
      </section>
    </>
  );
}
