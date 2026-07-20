"use client";

import { useEffect, useState } from "react";

const COPY = {
  hint: { en: "🔔 Checks run against the last 7 days of metrics: budget usage, declining ROAS, wasted spend, ad fatigue, and the AI engine's anomaly detection.", es: "🔔 Las revisiones usan los últimos 7 días: uso de presupuesto, ROAS en baja, gasto desperdiciado, fatiga de anuncios y detección de anomalías con IA." },
  checking: { en: "Checking for issues…", es: "Buscando problemas…" },
  allClear: { en: "All clear", es: "Todo en orden" },
  allClearSub: { en: "No budget, performance, or anomaly issues detected right now.", es: "No se detectaron problemas de presupuesto, rendimiento o anomalías por ahora." },
};

export default function AdsAlerts({ t }) {
  const [metrics, setMetrics] = useState(null);
  const [alerts, setAlerts] = useState(null);

  useEffect(() => {
    fetch("/api/admin/ads-metrics?days=7")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data && typeof data.totalSpend === "number") setMetrics(data); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!metrics) return;
    setAlerts(null);
    fetch("/api/admin/ads-alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metrics, adBudget: 500 }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setAlerts(data?.alerts || []))
      .catch(() => setAlerts([]));
  }, [metrics]);

  return (
    <>
      <div className="editor__group">
        <p className="editor__hint" style={{ margin: 0 }}>{t(COPY.hint)}</p>
      </div>
      {alerts === null ? (
        <div className="editor__group" style={{ marginTop: 14, textAlign: "center", color: "var(--admin-muted)" }}>{t(COPY.checking)}</div>
      ) : alerts.length === 0 ? (
        <div className="editor__group" style={{ marginTop: 14, textAlign: "center" }}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>✅</div>
          <p style={{ fontWeight: 700, color: "var(--admin-good)", margin: "0 0 4px" }}>{t(COPY.allClear)}</p>
          <p className="editor__hint" style={{ margin: 0 }}>{t(COPY.allClearSub)}</p>
        </div>
      ) : (
        <div style={{ marginTop: 14 }}>
          {alerts.map((a, i) => (
            <div key={i} className={`ads-alert ${a.severity}`}>
              <span style={{ fontSize: 18 }}>{a.icon}</span>
              <div>
                <p style={{ fontWeight: 800, fontSize: 13.5, margin: "0 0 3px" }}>{a.title}</p>
                <p className="editor__hint" style={{ margin: 0 }}>{a.detail}</p>
              </div>
              <span className={`ads-alert-sev ${a.severity}`}>{a.severity}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
