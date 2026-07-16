"use client";

const YELP_COPY = {
  empty: {
    en: "No Yelp leads yet. New \"Request a Quote\" messages will appear here automatically.",
    es: "Todavia no hay clientes de Yelp. Los nuevos mensajes de \"Solicitar cotizacion\" apareceran aqui automaticamente.",
  },
  notConfigured: {
    en: "Gmail is not connected yet - the auto-responder is inactive until GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN are set.",
    es: "Gmail todavia no esta conectado - el respondedor automatico esta inactivo hasta que se configuren GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN.",
  },
  runNow: { en: "Check Yelp now", es: "Revisar Yelp ahora" },
  running: { en: "Checking...", es: "Revisando..." },
  runHint: {
    en: "Runs automatically every 5 minutes. Use this to check immediately instead of waiting.",
    es: "Se ejecuta automaticamente cada 5 minutos. Usa esto para revisar de inmediato en vez de esperar.",
  },
  status: { en: "Status", es: "Estado" },
  statusPending: { en: "Pending", es: "Pendiente" },
  statusReplied: { en: "Replied", es: "Respondido" },
  statusFailed: { en: "Failed - reply not sent", es: "Fallo - no se envio la respuesta" },
  customerMessage: { en: "Customer message", es: "Mensaje del cliente" },
  aiReply: { en: "AI reply sent", es: "Respuesta de IA enviada" },
  received: { en: "Received", es: "Recibido" },
  repliedAt: { en: "Replied", es: "Respondido" },
  name: { en: "Name", es: "Nombre" },
  missing: { en: "Not provided", es: "No proporcionado" },
  checked: { en: "leads found this run", es: "clientes encontrados en esta revision" },
  noneFound: { en: "No new Yelp leads right now.", es: "No hay clientes nuevos de Yelp por ahora." },
};

const STATUS_LABEL = {
  pending: YELP_COPY.statusPending,
  replied: YELP_COPY.statusReplied,
  failed: YELP_COPY.statusFailed,
};

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function YelpLeadCard({ lead, t }) {
  const fallback = t(YELP_COPY.missing);
  const statusLabel = STATUS_LABEL[lead.status] || YELP_COPY.statusPending;
  return (
    <article className="record-card">
      <div className="record-card__head">
        <div>
          <p className="record-card__eyebrow">Yelp</p>
          <h2>{lead.customerName || fallback}</h2>
        </div>
        <span className={`record-card__flag record-card__flag--${lead.status || "pending"}`}>{t(statusLabel)}</span>
      </div>

      <div className="record-card__meta">
        <span>{t(YELP_COPY.received)}: {formatDate(lead.createdAt) || fallback}</span>
        {lead.repliedAt && <span>{t(YELP_COPY.repliedAt)}: {formatDate(lead.repliedAt)}</span>}
      </div>

      <div className="record-card__summary">
        <span>{t(YELP_COPY.customerMessage)}</span>
        <p>{lead.customerMessage || fallback}</p>
      </div>

      {lead.aiReply && (
        <div className="record-card__summary">
          <span>{t(YELP_COPY.aiReply)}</span>
          <p>{lead.aiReply}</p>
        </div>
      )}
    </article>
  );
}

export default function YelpLeads({ leads, t, gmailConfigured, running, onRunNow, lastRunResult }) {
  return (
    <section className="record-list" aria-label="Yelp">
      {!gmailConfigured && <p className="editor__warn">{t(YELP_COPY.notConfigured)}</p>}

      <div className="yelp-toolbar">
        <button type="button" className="btn btn--primary btn--small" onClick={onRunNow} disabled={running || !gmailConfigured}>
          {running ? t(YELP_COPY.running) : t(YELP_COPY.runNow)}
        </button>
        <span className="editor__hint">{t(YELP_COPY.runHint)}</span>
      </div>

      {lastRunResult && (
        <p className="editor__ok">
          {lastRunResult.checked} {t(YELP_COPY.checked)}
        </p>
      )}

      {leads.length ? (
        leads.map((lead) => <YelpLeadCard key={lead.id} lead={lead} t={t} />)
      ) : (
        <div className="record-empty">{t(YELP_COPY.empty)}</div>
      )}
    </section>
  );
}
