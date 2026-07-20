"use client";

import { useEffect, useState } from "react";

const COPY = {
  maintenance: { en: "Maintenance", es: "Mantenimiento" },
  maintenanceSub: { en: "website + API usage", es: "sitio web + uso de API" },
  adManagement: { en: "Ad Management", es: "Gestión de anuncios" },
  adManagementSub: { en: "your service fee", es: "tu tarifa de servicio" },
  adSpend: { en: "Ad Spend", es: "Gasto en anuncios" },
  adSpendSub: { en: "reimbursed budget", es: "presupuesto reembolsado" },
  invoices: { en: "Invoices", es: "Facturas" },
  loading: { en: "Loading invoices…", es: "Cargando facturas…" },
  month: { en: "Month", es: "Mes" },
  items: { en: "Items", es: "Conceptos" },
  total: { en: "Total", es: "Total" },
  status: { en: "Status", es: "Estado" },
  autoDraftNote: { en: "Auto-draft is generated from the standard fee structure — run the database schema and insert real invoices to replace it.", es: "El borrador automático se genera a partir de la estructura de tarifas estándar; agrega facturas reales para reemplazarlo." },
};

export default function AdsBilling({ t }) {
  const [invoices, setInvoices] = useState(null);

  useEffect(() => {
    fetch("/api/admin/invoices")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setInvoices(data?.invoices || []))
      .catch(() => setInvoices([]));
  }, []);

  return (
    <>
      <div className="ads-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="ads-stat"><div className="ads-stat-label">{t(COPY.maintenance)}</div><div className="ads-stat-value">$150<span style={{ fontSize: 14, color: "var(--admin-muted)" }}>/mo</span></div><div className="ads-stat-sub">{t(COPY.maintenanceSub)}</div></div>
        <div className="ads-stat"><div className="ads-stat-label">{t(COPY.adManagement)}</div><div className="ads-stat-value">$300<span style={{ fontSize: 14, color: "var(--admin-muted)" }}>/mo</span></div><div className="ads-stat-sub">{t(COPY.adManagementSub)}</div></div>
        <div className="ads-stat"><div className="ads-stat-label">{t(COPY.adSpend)}</div><div className="ads-stat-value">$500<span style={{ fontSize: 14, color: "var(--admin-muted)" }}>/mo</span></div><div className="ads-stat-sub">{t(COPY.adSpendSub)}</div></div>
      </div>

      <section className="editor__group" style={{ marginTop: 14 }}>
        <h2>{t(COPY.invoices)}</h2>
        {invoices === null ? (
          <p className="editor__hint">{t(COPY.loading)}</p>
        ) : (
          <table className="ads-table" style={{ marginTop: 10 }}>
            <thead><tr><th>{t(COPY.month)}</th><th>{t(COPY.items)}</th><th className="num">{t(COPY.total)}</th><th>{t(COPY.status)}</th></tr></thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td style={{ fontWeight: 700 }}>{inv.month}</td>
                  <td style={{ color: "var(--admin-muted)", fontSize: 12.5 }}>
                    {inv.items.map((it) => `${it.label} ($${it.amount})`).join(" · ")}
                  </td>
                  <td className="num">${inv.total}</td>
                  <td>
                    <span className={`ads-status-pill ${inv.status === "paid" ? "connected" : "disconnected"}`} style={{ marginLeft: 0 }}>
                      {inv.generated ? "auto-draft" : inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {invoices?.some((i) => i.generated) && (
          <p className="editor__hint" style={{ marginTop: 12 }}>{t(COPY.autoDraftNote)}</p>
        )}
      </section>
    </>
  );
}
