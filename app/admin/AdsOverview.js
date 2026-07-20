"use client";

import { useEffect, useMemo, useState } from "react";

const PLATFORM_META = {
  google_ads: { label: "Google Ads", icon: "🔍" },
  meta_ads: { label: "Meta Ads", icon: "📘" },
  yelp: { label: "Yelp Ads", icon: "⭐" },
};

const COPY = {
  spend: { en: "Total Spend", es: "Gasto total" },
  spendSub: { en: "last 7 days", es: "últimos 7 días" },
  conversions: { en: "Conversions", es: "Conversiones" },
  conversionsSub: { en: "calls, bookings, leads", es: "llamadas, citas, clientes" },
  roas: { en: "ROAS", es: "ROAS" },
  cpc: { en: "Avg CPC", es: "CPC prom." },
  clicks: { en: "clicks", es: "clics" },
  noClicks: { en: "no clicks yet", es: "sin clics todavía" },
  platforms: { en: "Platforms", es: "Plataformas" },
  connected: { en: "● Connected", es: "● Conectado" },
  notConnected: { en: "○ Not connected", es: "○ No conectado" },
  connectHint: { en: "Connect this account to start pulling live metrics and let the AI optimize it.", es: "Conecta esta cuenta para obtener métricas en vivo y dejar que la IA la optimice." },
  connect: { en: "Connect →", es: "Conectar →" },
};

export default function AdsOverview({ t, onNavigate }) {
  const [metrics, setMetrics] = useState(null);
  const [connections, setConnections] = useState(null);

  useEffect(() => {
    fetch("/api/admin/ads-metrics?days=7")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data && typeof data.totalSpend === "number") setMetrics(data); })
      .catch(() => {});
    fetch("/api/admin/ads-connections")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.platforms) setConnections(data.platforms); })
      .catch(() => {});
  }, []);

  const connectedCount = useMemo(
    () => (connections ? Object.values(connections).filter((p) => p.connected).length : 0),
    [connections]
  );

  return (
    <>
      <div className="ads-stats">
        <div className="ads-stat">
          <div className="ads-stat-label">{t(COPY.spend)}</div>
          <div className="ads-stat-value">${metrics ? metrics.totalSpend.toFixed(0) : "0"}</div>
          <div className="ads-stat-sub">{t(COPY.spendSub)}</div>
        </div>
        <div className="ads-stat">
          <div className="ads-stat-label">{t(COPY.conversions)}</div>
          <div className="ads-stat-value">{metrics ? metrics.totalConversions : "0"}</div>
          <div className="ads-stat-sub">{t(COPY.conversionsSub)}</div>
        </div>
        <div className="ads-stat">
          <div className="ads-stat-label">{t(COPY.roas)}</div>
          <div className="ads-stat-value">{metrics ? metrics.avgROAS : "0"}x</div>
          <div className="ads-stat-sub">
            {metrics?.trend === "improving" ? "📈" : metrics?.trend === "declining" ? "📉" : "➡️"} {metrics?.trend || "stable"}
          </div>
        </div>
        <div className="ads-stat">
          <div className="ads-stat-label">{t(COPY.cpc)}</div>
          <div className="ads-stat-value">${metrics ? metrics.avgCPC : "0"}</div>
          <div className="ads-stat-sub">{metrics ? `${metrics.totalClicks.toLocaleString()} ${t(COPY.clicks)}` : t(COPY.noClicks)}</div>
        </div>
      </div>

      <section className="editor__group" style={{ marginTop: 16 }}>
        <h2>{t(COPY.platforms)}</h2>
        <div className="ads-platforms" style={{ marginTop: 12 }}>
          {Object.entries(PLATFORM_META).map(([key, meta]) => {
            const conn = connections?.[key];
            const data = metrics?.byPlatform?.[key];
            return (
              <div key={key} className="ads-platform">
                <div className="ads-platform-head">
                  <span>{meta.icon}</span>
                  <span className="ads-platform-name">{meta.label}</span>
                  <span className={`ads-status-pill ${conn?.connected ? "connected" : "disconnected"}`}>
                    {conn?.connected ? t(COPY.connected) : t(COPY.notConnected)}
                  </span>
                </div>
                {conn?.connected ? (
                  <div>
                    <div className="ads-row"><span>Spend</span><strong>${data ? data.spend.toFixed(0) : 0}</strong></div>
                    <div className="ads-row"><span>{t(COPY.conversions)}</span><strong>{data ? data.conversions : 0}</strong></div>
                    <div className="ads-row"><span>{t(COPY.roas)}</span><strong>{data ? data.roas : 0}x</strong></div>
                  </div>
                ) : (
                  <>
                    <p className="editor__hint" style={{ margin: "4px 0 10px" }}>{t(COPY.connectHint)}</p>
                    <button type="button" className="btn btn--primary btn--small" onClick={() => onNavigate("ads-settings")}>
                      {t(COPY.connect)}
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
        {connectedCount === 0 && !connections && <p className="editor__hint" style={{ marginTop: 10 }}>Loading connections…</p>}
      </section>
    </>
  );
}
