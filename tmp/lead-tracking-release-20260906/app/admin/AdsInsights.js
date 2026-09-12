"use client";

import { useState } from "react";
import AdsDataState from "./AdsDataState";
import { useAdsConnections } from "./useAdsData";

const AI_FEATURES = [
  { icon: "🚨", title: { en: "Anomaly Detection", es: "Detección de anomalías" }, desc: { en: "Checks CPC spikes, CTR drops, and conversion changes.", es: "Revisa picos de CPC, caídas de CTR y cambios de conversión." } },
  { icon: "🔮", title: { en: "ROAS Recommendations", es: "Recomendaciones de ROAS" }, desc: { en: "Uses conversion value and spend to recommend the next move.", es: "Usa el valor de conversión y el gasto para recomendar el siguiente paso." } },
  { icon: "⏰", title: { en: "Bid Analysis", es: "Análisis de pujas" }, desc: { en: "Reviews performance by time and device when data is available.", es: "Revisa el rendimiento por hora y dispositivo cuando hay datos." } },
  { icon: "🔑", title: { en: "Keyword Discovery", es: "Descubrimiento de palabras clave" }, desc: { en: "Finds high-intent opportunities from connected Google Ads data.", es: "Encuentra oportunidades de alta intención con datos conectados de Google Ads." } },
  { icon: "🔁", title: { en: "Cross-Platform Learning", es: "Aprendizaje entre plataformas" }, desc: { en: "Compares connected platforms without inventing missing metrics.", es: "Compara plataformas conectadas sin inventar métricas faltantes." } },
  { icon: "✍️", title: { en: "Ad Copy Generation", es: "Generación de anuncios" }, desc: { en: "Creates five bilingual draft variations for review.", es: "Crea cinco borradores bilingües para revisión." } },
];

const COPY = {
  heading: { en: "🤖 AI Optimization Analysis", es: "🤖 Análisis de optimización con IA" },
  desc: { en: "The scheduled workflow reads live performance, generates recommendations and draft ads, saves the analysis, and emails a report. It never changes bids or budgets automatically.", es: "El flujo programado lee el rendimiento en vivo, genera recomendaciones y borradores, guarda el análisis y envía un reporte. Nunca cambia pujas ni presupuestos automáticamente." },
  connectFirst: { en: " Connect at least one platform in Connections to activate it.", es: " Conecta al menos una plataforma en Conexiones para activarlo." },
  run: { en: "▶ Run AI Analysis Now", es: "▶ Ejecutar análisis de IA" },
  running: { en: "⏳ Analyzing…", es: "⏳ Analizando…" },
  connectFirstBtn: { en: "Connect a platform first", es: "Conecta una plataforma primero" },
  connectBtn: { en: "Connect a platform", es: "Conectar una plataforma" },
  complete: { en: "Analysis complete — no budgets changed and no email sent.", es: "Análisis completo — no se cambiaron presupuestos ni se envió correo." },
  failed: { en: "AI analysis failed.", es: "Falló el análisis de IA." },
  networkError: { en: "Network error — try again.", es: "Error de red — intenta de nuevo." },
  drafts: { en: "draft ads generated", es: "borradores generados" },
};

export default function AdsInsights({ t, onNavigate }) {
  const connectionsState = useAdsConnections();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);
  const connections = connectionsState.data;
  const connectedCount = connections ? Object.values(connections).filter((platform) => platform.connected).length : 0;

  async function runOptimization() {
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch("/api/admin/run-optimization", { method: "POST" });
      const data = await response.json().catch(() => ({}));
      setStatus(response.ok && data.success
        ? { ok: true, msg: t(COPY.complete), drafts: data.data?.adVariationsGenerated || 0 }
        : { ok: false, msg: data.error || t(COPY.failed) });
    } catch {
      setStatus({ ok: false, msg: t(COPY.networkError) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <AdsDataState t={t} error={connectionsState.error} onRetry={connectionsState.retry} />
      <section className="editor__group">
        <h2>{t(COPY.heading)}</h2>
        <p className="editor__hint">{t(COPY.desc)}{connectedCount === 0 && t(COPY.connectFirst)}</p>
        {status && <p className={status.ok ? "editor__ok" : "editor__err"}>{status.msg}{status.ok ? ` ${status.drafts} ${t(COPY.drafts)}.` : ""}</p>}
        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button type="button" className="btn btn--primary" disabled={connectionsState.loading || connectedCount === 0 || busy} title={connectedCount === 0 ? t(COPY.connectFirstBtn) : undefined} onClick={runOptimization}>{busy ? t(COPY.running) : t(COPY.run)}</button>
          {connectedCount === 0 && <button type="button" className="btn btn--ghost" onClick={() => onNavigate("ads-settings")}>{t(COPY.connectBtn)}</button>}
        </div>
      </section>
      <div className="ads-insights-grid">
        {AI_FEATURES.map((feature) => <div key={feature.title.en} className="ads-insight"><div style={{ fontSize: 24, marginBottom: 8 }}>{feature.icon}</div><h4 style={{ margin: "0 0 6px" }}>{t(feature.title)}</h4><p className="editor__hint" style={{ margin: 0 }}>{t(feature.desc)}</p></div>)}
      </div>
    </>
  );
}
