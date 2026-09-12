"use client";

import { useEffect, useState } from "react";
import AdsDataState from "./AdsDataState";
import { useAdsMetrics } from "./useAdsData";

const COPY = {
  hint: { en: "🔔 Only the three highest-priority, actionable issues from the last 7 days are shown.", es: "🔔 Solo se muestran los tres problemas accionables de mayor prioridad de los últimos 7 días." },
  checking: { en: "Checking for issues…", es: "Buscando problemas…" },
  allClear: { en: "All clear", es: "Todo en orden" },
  allClearSub: { en: "No actionable ad issues detected right now.", es: "No se detectaron problemas accionables en los anuncios." },
  dismiss: { en: "Dismiss", es: "Descartar" },
};

export default function AdsAlerts({ t }) {
  const metricsState = useAdsMetrics(7);
  const [alerts, setAlerts] = useState(null);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [dismissed, setDismissed] = useState([]);

  useEffect(() => {
    try {
      setDismissed(JSON.parse(window.localStorage.getItem("tires-sos-dismissed-ad-alerts") || "[]"));
    } catch {
      setDismissed([]);
    }
  }, []);

  useEffect(() => {
    if (!metricsState.data) return;
    const controller = new AbortController();
    setAlerts(null);
    setError("");
    fetch("/api/admin/ads-alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ metrics: metricsState.data, adBudget: 500 }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.error || `Request failed (${response.status}).`);
        setAlerts(body.alerts || []);
      })
      .catch((requestError) => {
        if (requestError?.name !== "AbortError") setError(requestError?.message || "Alert check failed.");
      });
    return () => controller.abort();
  }, [metricsState.data, retryKey]);

  const retry = () => {
    if (metricsState.error) metricsState.retry();
    else setRetryKey((value) => value + 1);
  };

  const dismiss = (id) => {
    const next = [...new Set([...dismissed, id])].slice(-50);
    setDismissed(next);
    window.localStorage.setItem("tires-sos-dismissed-ad-alerts", JSON.stringify(next));
  };

  const visibleAlerts = alerts?.filter((alert) => !dismissed.includes(alert.id)) || [];

  return (
    <>
      <div className="editor__group"><p className="editor__hint" style={{ margin: 0 }}>{t(COPY.hint)}</p></div>
      <AdsDataState t={t} error={metricsState.error || error} onRetry={retry} />
      {!metricsState.error && !error && alerts === null ? (
        <div className="editor__group" style={{ marginTop: 14, textAlign: "center", color: "var(--admin-muted)" }}>{t(COPY.checking)}</div>
      ) : visibleAlerts.length === 0 ? (
        <div className="editor__group" style={{ marginTop: 14, textAlign: "center" }}><div style={{ fontSize: 30, marginBottom: 8 }}>✅</div><p style={{ fontWeight: 700, color: "var(--admin-good)", margin: "0 0 4px" }}>{t(COPY.allClear)}</p><p className="editor__hint" style={{ margin: 0 }}>{t(COPY.allClearSub)}</p></div>
      ) : (
        <div style={{ marginTop: 14 }}>{visibleAlerts.map((alert) => (
          <div key={alert.id} className={`ads-alert ${alert.severity}`}>
            <span style={{ fontSize: 18 }}>{alert.icon}</span>
            <div style={{ flex: 1 }}><p style={{ fontWeight: 800, fontSize: 13.5, margin: "0 0 3px" }}>{alert.title}</p><p className="editor__hint" style={{ margin: 0 }}>{alert.detail}</p></div>
            <span className={`ads-alert-sev ${alert.severity}`}>{alert.severity}</span>
            <button type="button" className="editor__small-button" onClick={() => dismiss(alert.id)} aria-label={`${t(COPY.dismiss)}: ${alert.title}`}>{t(COPY.dismiss)}</button>
          </div>
        ))}</div>
      )}
    </>
  );
}
