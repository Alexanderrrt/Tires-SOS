"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const COPY = {
  heading: { en: "PostHog website analytics", es: "Analítica del sitio (PostHog)" },
  hint: { en: "Traffic, contacts, quotes, appointments, and chat funnel for the selected period, compared with an equal-length prior period.", es: "Tráfico, contactos, cotizaciones, citas y embudo de chat del periodo seleccionado, comparado con un periodo anterior de igual duración." },
  runNow: { en: "Run 7-day report now", es: "Generar reporte de 7 días" },
  generating: { en: "Generating…", es: "Generando…" },
  loading: { en: "Loading reports…", es: "Cargando reportes…" },
  none: { en: "No report has been published yet", es: "Aún no se ha publicado ningún reporte" },
  noneSub: { en: "Run the default weekly report, or generate one for a custom date range below.", es: "Genera el reporte semanal predeterminado, o crea uno con un rango de fechas personalizado abajo." },
  failed: { en: "Could not generate the report.", es: "No se pudo generar el reporte." },
  loadFailed: { en: "Could not load reports.", es: "No se pudieron cargar los reportes." },
  customHeading: { en: "Custom date range", es: "Rango de fechas personalizado" },
  customHint: { en: "Generate a one-off report for any start and end date. It's compared against an equal-length period immediately before it.", es: "Genera un reporte único para cualquier fecha de inicio y fin. Se compara con un periodo anterior de la misma duración." },
  from: { en: "From", es: "Desde" },
  to: { en: "To", es: "Hasta" },
  generateCustom: { en: "Generate custom report", es: "Generar reporte personalizado" },
  delete: { en: "Delete report", es: "Eliminar reporte" },
  deleting: { en: "Deleting…", es: "Eliminando…" },
  deleteConfirm: { en: "Delete this report? This cannot be undone.", es: "¿Eliminar este reporte? Esta acción no se puede deshacer." },
  deleteFailed: { en: "Could not delete the report.", es: "No se pudo eliminar el reporte." },
  invalidRange: { en: "Enter a valid start and end date (end must be on or after start).", es: "Ingresa una fecha de inicio y fin válidas (el fin debe ser igual o posterior al inicio)." },
  selectReport: { en: "Select analytics report", es: "Seleccionar reporte de analítica" },
  downloadPdf: { en: "Download PDF", es: "Descargar PDF" },
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function SiteAnalytics({ t }) {
  const [reports, setReports] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState(todayIso());
  const iframeRef = useRef(null);

  function downloadPdf() {
    iframeRef.current?.contentWindow?.print();
  }

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
        setSelectedId((current) => (list.some((r) => r.id === current) ? current : list[0]?.id || ""));
      })
      .catch((err) => {
        setReports([]);
        setError(err.message);
      });
  }, [t]);

  useEffect(() => { loadReports(); }, [loadReports]);

  async function runReport(range) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/run-weekly-analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(range || {}),
      });
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

  function generateCustomReport() {
    if (!customFrom || !customTo || customTo < customFrom) {
      setError(t(COPY.invalidRange));
      return;
    }
    runReport({ periodStart: customFrom, periodEnd: customTo });
  }

  async function deleteSelected() {
    if (!selected) return;
    if (!window.confirm(t(COPY.deleteConfirm))) return;
    setDeleting(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/analytics-reports", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.ok !== true) throw new Error(data.error || t(COPY.deleteFailed));
      setSelectedId("");
      await loadReports();
    } catch (err) {
      setError(err.message || t(COPY.deleteFailed));
    } finally {
      setDeleting(false);
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
              <select value={selected?.id || ""} onChange={(e) => setSelectedId(e.target.value)} aria-label={t(COPY.selectReport)}>
                {reports.map((report) => <option key={report.id} value={report.id}>{report.period_label}</option>)}
              </select>
            )}
            {selected && (
              <button type="button" className="btn btn--ghost btn--small" onClick={downloadPdf}>
                {t(COPY.downloadPdf)}
              </button>
            )}
            {selected && (
              <button type="button" className="btn btn--danger btn--small" onClick={deleteSelected} disabled={deleting || busy}>
                {deleting ? t(COPY.deleting) : t(COPY.delete)}
              </button>
            )}
            <button type="button" className="btn btn--primary btn--small" onClick={() => runReport()} disabled={busy || deleting}>
              {busy ? t(COPY.generating) : t(COPY.runNow)}
            </button>
          </div>
        </div>
        {error && <p className="editor__err" style={{ marginTop: 10 }}>{error}</p>}
      </div>

      <div className="editor__group" style={{ marginTop: 14 }}>
        <h2>{t(COPY.customHeading)}</h2>
        <p className="editor__hint">{t(COPY.customHint)}</p>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap", marginTop: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: ".68rem", fontWeight: 650, color: "var(--admin-muted)" }}>
            {t(COPY.from)}
            <input type="date" value={customFrom} max={customTo || undefined} onChange={(e) => setCustomFrom(e.target.value)} />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 5, fontSize: ".68rem", fontWeight: 650, color: "var(--admin-muted)" }}>
            {t(COPY.to)}
            <input type="date" value={customTo} min={customFrom || undefined} onChange={(e) => setCustomTo(e.target.value)} />
          </label>
          <button type="button" className="btn btn--primary btn--small" onClick={generateCustomReport} disabled={busy || deleting}>
            {busy ? t(COPY.generating) : t(COPY.generateCustom)}
          </button>
        </div>
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
            ref={iframeRef}
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
