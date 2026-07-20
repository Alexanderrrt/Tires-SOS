"use client";

import { useEffect, useState } from "react";

const AI_FEATURES = [
  { icon: "🚨", title: { en: "Anomaly Detection", es: "Detección de anomalías" }, desc: { en: "Watches for CPC spikes and CTR drops overnight.", es: "Vigila picos de CPC y caídas de CTR durante la noche." } },
  { icon: "🔮", title: { en: "ROAS Forecasting", es: "Pronóstico de ROAS" }, desc: { en: "Predicts the next 7 days of return on ad spend.", es: "Predice el ROAS de los próximos 7 días." } },
  { icon: "⏰", title: { en: "Smart Bidding", es: "Pujas inteligentes" }, desc: { en: "Adjusts bids by time of day, device, and audience.", es: "Ajusta pujas por hora, dispositivo y audiencia." } },
  { icon: "🔑", title: { en: "Keyword Discovery", es: "Descubrimiento de palabras clave" }, desc: { en: "Finds high-intent, low-competition keywords.", es: "Encuentra palabras clave de alta intención y baja competencia." } },
  { icon: "🔁", title: { en: "Cross-Platform Learning", es: "Aprendizaje entre plataformas" }, desc: { en: "Applies what works on Google to Meta, and back.", es: "Aplica lo que funciona en Google a Meta, y viceversa." } },
  { icon: "✍️", title: { en: "Ad Copy Generation", es: "Generación de anuncios" }, desc: { en: "Writes 5 bilingual ad variations to test daily.", es: "Escribe 5 variaciones bilingües de anuncios para probar cada día." } },
];

const COPY = {
  heading: { en: "🤖 AI Optimization Engine", es: "🤖 Motor de optimización IA" },
  desc: { en: "Runs automatically every day at 9:00 AM. It analyzes all connected platforms, rebalances the monthly budget toward whatever is converting best, and emails you a report with recommended actions.", es: "Se ejecuta automáticamente todos los días a las 9:00 AM. Analiza todas las plataformas conectadas, reequilibra el presupuesto mensual hacia lo que mejor convierte y envía un reporte por correo con acciones recomendadas." },
  connectFirst: { en: " Connect at least one platform in Settings to activate it.", es: " Conecta al menos una plataforma en Conexiones para activarlo." },
  run: { en: "▶ Run Optimization Now", es: "▶ Ejecutar optimización ahora" },
  running: { en: "⏳ Running…", es: "⏳ Ejecutando…" },
  connectFirstBtn: { en: "Connect a platform first", es: "Conecta una plataforma primero" },
  connectBtn: { en: "Connect a platform", es: "Conectar una plataforma" },
  complete: { en: "Optimization run complete — report emailed ✓", es: "Optimización completa — reporte enviado ✓" },
  failed: { en: "Optimization run failed.", es: "La optimización falló." },
  networkError: { en: "Network error — try again.", es: "Error de red — intenta de nuevo." },
};

export default function AdsInsights({ t, onNavigate }) {
  const [connections, setConnections] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    fetch("/api/admin/ads-connections")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data?.platforms) setConnections(data.platforms); })
      .catch(() => {});
  }, []);

  const connectedCount = connections ? Object.values(connections).filter((p) => p.connected).length : 0;

  async function runOptimization() {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/run-optimization", { method: "POST" });
      const data = await res.json();
      setStatus(res.ok && data.success ? { ok: true, msg: t(COPY.complete) } : { ok: false, msg: data.error || t(COPY.failed) });
    } catch {
      setStatus({ ok: false, msg: t(COPY.networkError) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="editor__group">
        <h2>{t(COPY.heading)}</h2>
        <p className="editor__hint">{t(COPY.desc)}{connectedCount === 0 && t(COPY.connectFirst)}</p>
        {status && <p className={status.ok ? "editor__ok" : "editor__err"}>{status.msg}</p>}
        <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
          <button
            type="button"
            className="btn btn--primary"
            disabled={connectedCount === 0 || busy}
            title={connectedCount === 0 ? t(COPY.connectFirstBtn) : undefined}
            onClick={runOptimization}
          >
            {busy ? t(COPY.running) : t(COPY.run)}
          </button>
          {connectedCount === 0 && (
            <button type="button" className="btn btn--ghost" onClick={() => onNavigate("ads-settings")}>{t(COPY.connectBtn)}</button>
          )}
        </div>
      </section>
      <div className="ads-insights-grid">
        {AI_FEATURES.map((f) => (
          <div key={f.title.en} className="ads-insight">
            <div style={{ fontSize: 24, marginBottom: 8 }}>{f.icon}</div>
            <h4 style={{ margin: "0 0 6px" }}>{t(f.title)}</h4>
            <p className="editor__hint" style={{ margin: 0 }}>{t(f.desc)}</p>
          </div>
        ))}
      </div>
    </>
  );
}
