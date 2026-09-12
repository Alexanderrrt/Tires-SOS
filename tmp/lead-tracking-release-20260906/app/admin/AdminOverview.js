"use client";
import { adminSourceLabel } from "./admin-display";

const COPY = {
  noDate: { en: "No date", es: "Sin fecha" },
  unknown: { en: "Unknown", es: "Desconocido" },
  newCustomer: { en: "New customer", es: "Cliente nuevo" },
  leadCapture: { en: "Lead capture", es: "Captura de cliente" },
  customerAppointment: { en: "Customer appointment", es: "Cita del cliente" },
  schedulingRequired: { en: "Scheduling required", es: "Falta agendar" },
  yelpInquiry: { en: "Yelp inquiry", es: "Consulta de Yelp" },
  automaticResponseSent: { en: "Automatic response sent", es: "Respuesta automática enviada" },
  responsePending: { en: "Response pending", es: "Respuesta pendiente" },
  whatsappCustomer: { en: "WhatsApp customer", es: "Cliente de WhatsApp" },
  messages: { en: "messages", es: "mensajes" },
  lead: { en: "Lead", es: "Cliente" },
  appointment: { en: "Appointment", es: "Cita" },
  businessSummary: { en: "Business summary", es: "Resumen del negocio" },
  totalLeads: { en: "Total leads", es: "Total de clientes" },
  needAttention: { en: "need attention", es: "requieren atención" },
  appointments: { en: "Appointments", es: "Citas" },
  confirmed: { en: "confirmed", es: "confirmadas" },
  whatsappChats: { en: "WhatsApp chats", es: "Chats de WhatsApp" },
  customerConversations: { en: "Customer conversations", es: "Conversaciones con clientes" },
  yelpLeads: { en: "Yelp leads", es: "Clientes de Yelp" },
  replied: { en: "replied", es: "respondidos" },
  leadConversion: { en: "Lead conversion", es: "Conversión de clientes" },
  bookedCompleted: { en: "booked or completed", es: "agendados o completados" },
  operations: { en: "Operations", es: "Operaciones" },
  recentActivity: { en: "Recent activity", es: "Actividad reciente" },
  viewLeads: { en: "View leads", es: "Ver clientes" },
  noActivity: { en: "Activity will appear as customers contact the business.", es: "La actividad aparecerá cuando los clientes contacten al negocio." },
  infrastructure: { en: "Infrastructure", es: "Infraestructura" },
  systemStatus: { en: "System status", es: "Estado del sistema" },
  apiDetails: { en: "API details", es: "Detalles de API" },
  businessRecords: { en: "Business records", es: "Registros del negocio" },
  pricingStorage: { en: "Pricing storage", es: "Almacenamiento de precios" },
  websiteChat: { en: "Website chat", es: "Chat del sitio web" },
  whatsappApi: { en: "WhatsApp Cloud API", es: "API de WhatsApp Cloud" },
  yelpResponder: { en: "Yelp responder", es: "Respondedor de Yelp" },
  connected: { en: "Connected", es: "Conectado" },
  sessionOnly: { en: "Session only", es: "Solo esta sesión" },
  configured: { en: "Configured", es: "Configurado" },
  needsConfiguration: { en: "Needs configuration", es: "Requiere configuración" },
  shortcuts: { en: "Shortcuts", es: "Accesos directos" },
  quickActions: { en: "Quick actions", es: "Acciones rápidas" },
  manageCalendar: { en: "Manage calendar", es: "Administrar calendario" },
  manageCalendarHint: { en: "Schedule, block, or update appointments", es: "Agenda, bloquea o actualiza citas" },
  openWhatsapp: { en: "Open WhatsApp inbox", es: "Abrir bandeja de WhatsApp" },
  openWhatsappHint: { en: "Reply and control automation", es: "Responde y controla la automatización" },
  updatePricing: { en: "Update pricing", es: "Actualizar precios" },
  updatePricingHint: { en: "Services, labor, brands, and estimates", es: "Servicios, mano de obra, marcas y estimados" },
  configureChat: { en: "Configure website chat", es: "Configurar chat del sitio" },
  configureChatHint: { en: "Prompts, behavior, and public text", es: "Preguntas, comportamiento y texto público" },
  acquisition: { en: "Acquisition", es: "Adquisición" },
  leadSources: { en: "Lead sources", es: "Origen de clientes" },
  noSources: { en: "Lead-source reporting will populate automatically.", es: "El reporte de origen de clientes se llenará automáticamente." },
};

function dateValue(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

function formatActivityDate(value, lang, t) {
  if (!value) return t(COPY.noDate);
  return new Date(value).toLocaleString(lang === "es" ? "es-US" : "en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function percent(value, total) {
  return total ? `${Math.round((value / total) * 100)}%` : "0%";
}

export default function AdminOverview({ records, yelpLeads, whatsappConversations, integrations, onNavigate, t, lang }) {
  const leads = records?.leads || [];
  const appointments = records?.appointments || [];
  const bookedLeads = leads.filter((lead) => ["booked", "done"].includes(lead.status)).length;
  const activeLeads = leads.filter((lead) => ["new", "contacted"].includes(lead.status)).length;
  const confirmedAppointments = appointments.filter((item) => ["confirmed", "booked"].includes(item.status)).length;
  const repliedYelp = yelpLeads.filter((lead) => lead.status === "replied").length;
  const sourceCounts = leads.reduce((counts, lead) => { const source = adminSourceLabel(lead.source, lang) || t(COPY.unknown); counts[source] = (counts[source] || 0) + 1; return counts; }, {});
  const activity = [
    ...leads.map((lead) => ({ id: `lead-${lead.id}`, type: t(COPY.lead), title: lead.customerName || lead.phone || t(COPY.newCustomer), detail: lead.source ? adminSourceLabel(lead.source, lang) : t(COPY.leadCapture), date: lead.updatedAt || lead.createdAt, tab: "leads" })),
    ...appointments.map((item) => ({ id: `appointment-${item.id}`, type: t(COPY.appointment), title: item.customerName || t(COPY.customerAppointment), detail: item.scheduledDate && item.scheduledTime ? `${item.scheduledDate} · ${item.scheduledTime}` : t(COPY.schedulingRequired), date: item.updatedAt || item.createdAt, tab: "appointments" })),
    ...yelpLeads.map((lead) => ({ id: `yelp-${lead.id}`, type: "Yelp", title: lead.customerName || t(COPY.yelpInquiry), detail: lead.status === "replied" ? t(COPY.automaticResponseSent) : t(COPY.responsePending), date: lead.repliedAt || lead.createdAt, tab: "yelp" })),
    ...whatsappConversations.map((item) => ({ id: `whatsapp-${item.id}`, type: "WhatsApp", title: item.customerName || item.waId || t(COPY.whatsappCustomer), detail: `${item.messages?.length || 0} ${t(COPY.messages)}`, date: item.lastMessageAt, tab: "whatsapp" })),
  ].sort((a, b) => dateValue(b.date) - dateValue(a.date)).slice(0, 8);
  const health = [
    { label: COPY.businessRecords, ok: integrations.records, connected: COPY.connected, missing: COPY.sessionOnly },
    { label: COPY.pricingStorage, ok: integrations.pricing, connected: COPY.connected, missing: COPY.sessionOnly },
    { label: COPY.websiteChat, ok: integrations.chat, connected: COPY.connected, missing: COPY.sessionOnly },
    { label: COPY.whatsappApi, ok: integrations.whatsapp, connected: COPY.configured, missing: COPY.needsConfiguration },
    { label: COPY.yelpResponder, ok: integrations.yelp, connected: COPY.configured, missing: COPY.needsConfiguration },
  ];

  return <div className="ops-overview">
    <section className="ops-metrics" aria-label={t(COPY.businessSummary)}>
      <button type="button" className="ops-metric" onClick={() => onNavigate("leads")}><span>{t(COPY.totalLeads)}</span><strong>{leads.length}</strong><small>{activeLeads} {t(COPY.needAttention)}</small></button>
      <button type="button" className="ops-metric" onClick={() => onNavigate("appointments")}><span>{t(COPY.appointments)}</span><strong>{appointments.length}</strong><small>{confirmedAppointments} {t(COPY.confirmed)}</small></button>
      <button type="button" className="ops-metric" onClick={() => onNavigate("whatsapp")}><span>{t(COPY.whatsappChats)}</span><strong>{whatsappConversations.length}</strong><small>{t(COPY.customerConversations)}</small></button>
      <button type="button" className="ops-metric" onClick={() => onNavigate("yelp")}><span>{t(COPY.yelpLeads)}</span><strong>{yelpLeads.length}</strong><small>{repliedYelp} {t(COPY.replied)}</small></button>
      <div className="ops-metric"><span>{t(COPY.leadConversion)}</span><strong>{percent(bookedLeads, leads.length)}</strong><small>{bookedLeads} {t(COPY.bookedCompleted)}</small></div>
    </section>
    <div className="ops-overview__grid">
      <section className="ops-panel ops-panel--activity"><div className="ops-panel__head"><div><span>{t(COPY.operations)}</span><h2>{t(COPY.recentActivity)}</h2></div><button type="button" onClick={() => onNavigate("leads")}>{t(COPY.viewLeads)}</button></div>{activity.length ? <div className="ops-activity-list">{activity.map((item) => <button key={item.id} type="button" className="ops-activity" onClick={() => onNavigate(item.tab)}><span className="ops-activity__type">{item.type}</span><span><strong>{item.title}</strong><small>{item.detail}</small></span><time>{formatActivityDate(item.date, lang, t)}</time></button>)}</div> : <div className="ops-panel__empty">{t(COPY.noActivity)}</div>}</section>
      <section className="ops-panel"><div className="ops-panel__head"><div><span>{t(COPY.infrastructure)}</span><h2>{t(COPY.systemStatus)}</h2></div><button type="button" onClick={() => onNavigate("api")}>{t(COPY.apiDetails)}</button></div><div className="ops-health-list">{health.map((item) => <div className="ops-health" key={item.label.en}><i className={item.ok ? "is-ok" : "is-warn"} /><span><strong>{t(item.label)}</strong><small>{t(item.ok ? item.connected : item.missing)}</small></span></div>)}</div></section>
      <section className="ops-panel"><div className="ops-panel__head"><div><span>{t(COPY.shortcuts)}</span><h2>{t(COPY.quickActions)}</h2></div></div><div className="ops-quick-actions"><button type="button" onClick={() => onNavigate("appointments")}><strong>{t(COPY.manageCalendar)}</strong><small>{t(COPY.manageCalendarHint)}</small></button><button type="button" onClick={() => onNavigate("whatsapp")}><strong>{t(COPY.openWhatsapp)}</strong><small>{t(COPY.openWhatsappHint)}</small></button><button type="button" onClick={() => onNavigate("pricing")}><strong>{t(COPY.updatePricing)}</strong><small>{t(COPY.updatePricingHint)}</small></button><button type="button" onClick={() => onNavigate("chat")}><strong>{t(COPY.configureChat)}</strong><small>{t(COPY.configureChatHint)}</small></button></div></section>
      <section className="ops-panel"><div className="ops-panel__head"><div><span>{t(COPY.acquisition)}</span><h2>{t(COPY.leadSources)}</h2></div></div>{Object.keys(sourceCounts).length ? <div className="ops-source-list">{Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).map(([source, count]) => <div key={source}><span>{source}</span><strong>{count}</strong><i style={{ width: `${Math.max(8, (count / leads.length) * 100)}%` }} /></div>)}</div> : <div className="ops-panel__empty">{t(COPY.noSources)}</div>}</section>
    </div>
  </div>;
}
