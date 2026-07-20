"use client";

import { useCallback, useEffect, useState } from "react";

const COPY = {
  heading: { en: "PostHog weekly website analytics", es: "Analítica semanal del sitio (PostHog)" },
  hint: { en: "Seven-day traffic, contacts, quotes, appointments, and chat funnel compared with the prior week.", es: "Tráfico, contactos, cotizaciones, citas y embudo de chat de los últimos 7 días comparados con la semana anterior." },
  runNow: { en: "Run report now", es: "Generar reporte ahora" },
  generating: { en: "Generating…", es: "Generando…" },
  loading: { en: "Loading weekly reports…", es: "Cargando reportes semanales…" },
  none: { en: "No weekly report has been published yet", es: "Aún no se ha publicado ningún reporte semanal" },
  noneSub: { en: "The scheduled report will appear here after its first successful Monday run.", es: "El reporte programado aparecerá aquí después de su primera ejecución exitosa del lunes." },
  published: { en: "Website analytics report published", es: "Reporte de analítica del sitio publicado" },
  failed: { en: "Could not generate the report.", es: "No se pudo generar el reporte." },
  loadFailed: { en: "Could not load weekly reports.", es: "No se pudieron cargar los reportes semanales." },
};

export default function SiteAnalytics({ t }) {
  const [reports, setReports] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const loadReports = useCallback(() => {
    setReports(null);
    return fetch("/api/admin/analytics-reports", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || t(COPY.loadFailed));
        return data.reports || [];
      })
      .then((list) => {
        setReports(list);
        setSelectedId((current) => current || list[0]?.id || "");
      })
      .catch((err) => {
        setReports([]);
        setError(err.message);
      });
  }, [t]);

  useEffect(() => { loadReports(); }, [loadReports]);

  async function runReport() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/run-weekly-analytics", { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok !== true) throw new Error(data.error || t(COPY.failed));
      setSelectedId(data.reportId || "");
      await loadReports();
    } catch (err) {
      setError(err.message || t(COPY.failed));
    } finally {
      setBusy(false);
    }
  }

  const selected = reports?.find((r) => r.id === selectedId) || reports?.[0];

  return (
    <>
      <div className="editor__group" style={{ padding: "18px 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ marginBottom: 5 }}>{t(COPY.heading)}</h2>
            <p className="editor__hint" style={{ margin: 0 }}>{t(COPY.hint)}</p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {reports?.length > 0 && (
              <select value={selected?.id || ""} onChange={(e) => setSelectedId(e.target.value)} aria-label="Select weekly analytics report">
                {reports.map((report) => <option key={report.id} value={report.id}>{report.period_label}</option>)}
              </select>
            )}
            <button type="button" className="btn btn--primary btn--small" onClick={runReport} disabled={busy}>
              {busy ? t(COPY.generating) : t(COPY.runNow)}
            </button>
          </div>
        </div>
        {error && <p className="editor__err" style={{ marginTop: 10 }}>{error}</p>}
      </div>

      {reports === null ? (
        <div className="editor__group" style={{ marginTop: 14, textAlign: "center", color: "var(--admin-muted)" }}>{t(COPY.loading)}</div>
      ) : reports.length === 0 ? (
        <div className="editor__group" style={{ marginTop: 14, textAlign: "center" }}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>📭</div>
          <p style={{ fontWeight: 700, color: "var(--admin-muted)", margin: "0 0 5px" }}>{t(COPY.none)}</p>
          <p className="editor__hint" style={{ margin: 0 }}>{t(COPY.noneSub)}</p>
        </div>
      ) : (
        <div className="editor__group" style={{ marginTop: 14, padding: 0, overflow: "hidden" }}>
          <iframe
            title={selected.title}
            srcDoc={selected.html}
            sandbox=""
            style={{ width: "100%", minHeight: 1120, border: 0, display: "block", background: "#120f0c" }}
          />
        </div>
      )}
    </>
  );
}
