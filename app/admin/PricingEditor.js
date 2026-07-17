"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage, useT } from "../i18n/LanguageContext";
import { COPY } from "../site.config";
import AdminLoader from "./AdminLoader";
import AppointmentCalendar from "./AppointmentCalendar";
import ApiStatus from "./ApiStatus";
import AdminOverview from "./AdminOverview";
import YelpLeads from "./YelpLeads";
import WhatsAppInbox from "./WhatsAppInbox";

const E = COPY.admin.editor;

const CHAT_ADMIN = {
  adminTitle: { en: "Admin", es: "Admin" },
  overviewTitle: { en: "Operations Overview", es: "Resumen de operaciones" },
  overviewTab: { en: "Overview", es: "Resumen" },
  leadsTab: { en: "Leads", es: "Clientes" },
  appointmentsTab: { en: "Appointments", es: "Citas" },
  yelpTab: { en: "Yelp", es: "Yelp" },
  chatTab: { en: "Chat", es: "Chat" },
  pricingTab: { en: "Pricing", es: "Precios" },
  apiTab: { en: "API", es: "API" },
  leadsTitle: { en: "Chat Leads", es: "Clientes del chat" },
  appointmentsTitle: { en: "Appointments", es: "Citas" },
  yelpTitle: { en: "Yelp Leads", es: "Clientes de Yelp" },
  chatTitle: { en: "Chat Settings", es: "Configuracion del chat" },
  recordsStorageWarn: {
    en: "Lead storage is not connected - records only apply for this session.",
    es: "El almacenamiento de clientes no esta conectado - los registros solo aplican en esta sesion.",
  },
  chatStorageWarn: {
    en: "Chat storage is not connected - changes apply for this session only.",
    es: "El almacenamiento del chat no esta conectado - los cambios solo aplican en esta sesion.",
  },
  publicText: { en: "Public chat text", es: "Texto publico del chat" },
  publicHint: {
    en: "These fields control the quote chat page customers see.",
    es: "Estos campos controlan la pagina de chat de cotizacion que ven los clientes.",
  },
  title: { en: "Title", es: "Titulo" },
  subtitle: { en: "Subtitle", es: "Subtitulo" },
  intro: { en: "First message", es: "Primer mensaje" },
  placeholder: { en: "Input placeholder", es: "Texto del campo" },
  prompts: { en: "Starter prompts", es: "Preguntas rapidas" },
  promptsHint: {
    en: "Keep these short. They should start a quote quickly.",
    es: "Mantenlas cortas. Deben iniciar una cotizacion rapido.",
  },
  prompt: { en: "Prompt", es: "Pregunta" },
  behavior: { en: "Response guidance", es: "Guia de respuesta" },
  behaviorHint: {
    en: "Private guidance for the chat responses. Customers do not see this text.",
    es: "Guia privada para las respuestas del chat. Los clientes no ven este texto.",
  },
  disableEstimates: { en: "Disable price estimates", es: "Desactivar estimados de precio" },
  disableEstimatesHint: {
    en: "When on, the chatbot will never give a price or price range. It still collects the service, vehicle, name, phone, and appointment as usual.",
    es: "Si esta activado, el chatbot nunca dara un precio ni un rango. Sigue recolectando el servicio, vehiculo, nombre, telefono y cita como siempre.",
  },
  saved: { en: "Chat saved.", es: "Chat guardado." },
  savedSession: {
    en: "Chat saved for this session - connect Supabase to make it permanent.",
    es: "Chat guardado para esta sesion - conecta Supabase para hacerlo permanente.",
  },
  saveFailed: { en: "Chat save failed.", es: "No se pudo guardar el chat." },
  refresh: { en: "Refresh", es: "Actualizar" },
  refreshed: { en: "Records refreshed.", es: "Registros actualizados." },
  updateFailed: { en: "Status update failed.", es: "No se pudo actualizar el estado." },
  deleted: { en: "Record deleted.", es: "Registro eliminado." },
  deleteFailed: { en: "Delete failed.", es: "No se pudo eliminar." },
  english: { en: "English", es: "Ingles" },
  spanish: { en: "Spanish", es: "Espanol" },
};

const RECORD_COPY = {
  noLeads: {
    en: "No chat leads yet. New quote or service conversations will appear here.",
    es: "Todavia no hay clientes del chat. Las conversaciones de cotizacion o servicio apareceran aqui.",
  },
  noAppointments: {
    en: "No appointment requests yet. When someone asks to schedule, it will show here.",
    es: "Todavia no hay solicitudes de cita. Cuando alguien pida agendar, aparecera aqui.",
  },
  status: { en: "Status", es: "Estado" },
  source: { en: "Source", es: "Origen" },
  name: { en: "Name", es: "Nombre" },
  phone: { en: "Phone", es: "Telefono" },
  vehicle: { en: "Vehicle", es: "Vehiculo" },
  service: { en: "Service", es: "Servicio" },
  summary: { en: "Summary", es: "Resumen" },
  notes: { en: "Notes", es: "Notas" },
  conversation: { en: "Conversation", es: "Conversacion" },
  missing: { en: "Not captured yet", es: "No capturado todavia" },
  created: { en: "Created", es: "Creado" },
  updated: { en: "Updated", es: "Actualizado" },
  requested: { en: "Appointment requested", es: "Cita solicitada" },
  delete: { en: "Delete", es: "Eliminar" },
  deleteLeadConfirm: {
    en: "Delete this lead? Any appointment created from it will also be removed.",
    es: "Eliminar este cliente? Tambien se eliminara cualquier cita creada desde este registro.",
  },
  deleteAppointmentConfirm: {
    en: "Delete this appointment request?",
    es: "Eliminar esta solicitud de cita?",
  },
};

const LEAD_STATUSES = [
  { value: "new", label: { en: "New", es: "Nuevo" } },
  { value: "contacted", label: { en: "Contacted", es: "Contactado" } },
  { value: "booked", label: { en: "Booked", es: "Agendado" } },
  { value: "done", label: { en: "Done", es: "Listo" } },
  { value: "lost", label: { en: "Lost", es: "Perdido" } },
];

const APPOINTMENT_STATUSES = [
  { value: "requested", label: { en: "Requested", es: "Solicitada" } },
  { value: "confirmed", label: { en: "Confirmed", es: "Confirmada" } },
  { value: "completed", label: { en: "Completed", es: "Completada" } },
  { value: "no-show", label: { en: "No-show", es: "No llego" } },
  { value: "canceled", label: { en: "Canceled", es: "Cancelada" } },
];

function BilingualField({ label, value, onChange, multiline = false, languageLabels }) {
  const Control = multiline ? "textarea" : "input";
  return (
    <div className="editor__bi-field">
      <p className="editor__field-title">{label}</p>
      <label>
        <span>{languageLabels.en}</span>
        <Control value={value?.en || ""} onChange={(e) => onChange("en", e.target.value)} />
      </label>
      <label>
        <span>{languageLabels.es}</span>
        <Control value={value?.es || ""} onChange={(e) => onChange("es", e.target.value)} />
      </label>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function downloadCsv(filename, rows) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [headers.map(csvCell).join(","), ...rows.map((row) => headers.map((key) => csvCell(row[key])).join(","))].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function RecordField({ label, value, fallback }) {
  return (
    <div className="record-card__field">
      <span>{label}</span>
      <strong>{value || fallback}</strong>
    </div>
  );
}

function StatusSelect({ value, options, onChange, disabled, label }) {
  return (
    <label className="record-card__status">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label.en} / {option.label.es}
          </option>
        ))}
      </select>
    </label>
  );
}

function Transcript({ record, t }) {
  const transcript = Array.isArray(record.transcript) ? record.transcript.slice(-8) : [];
  if (!transcript.length) return null;
  return (
    <details className="record-card__transcript">
      <summary>{t(RECORD_COPY.conversation)}</summary>
      <div>
        {transcript.map((message, index) => (
          <p key={`${message.role}-${index}`}>
            <span>{message.role === "assistant" ? "Tires SOS" : "Customer"}:</span> {message.content}
          </p>
        ))}
      </div>
    </details>
  );
}

function EmptyRecords({ children }) {
  return <div className="record-empty">{children}</div>;
}

function LeadCard({ lead, t, disabled, onStatus, onDelete }) {
  const fallback = t(RECORD_COPY.missing);
  return (
    <article className="record-card">
      <div className="record-card__head">
        <div>
          <p className="record-card__eyebrow">{lead.source || t(RECORD_COPY.source)}</p>
          <h2>{lead.service || t(CHAT_ADMIN.leadsTitle)}</h2>
        </div>
        <StatusSelect
          label={t(RECORD_COPY.status)}
          value={lead.status || "new"}
          options={LEAD_STATUSES}
          onChange={(status) => onStatus("lead", lead.id, status)}
          disabled={disabled}
        />
      </div>

      <div className="record-card__actions">
        <button
          type="button"
          className="record-card__delete"
          onClick={() => onDelete("lead", lead.id, lead)}
          disabled={disabled}
        >
          {t(RECORD_COPY.delete)}
        </button>
      </div>

      <div className="record-card__meta">
        <span>{t(RECORD_COPY.created)}: {formatDate(lead.createdAt) || fallback}</span>
        <span>{t(RECORD_COPY.updated)}: {formatDate(lead.updatedAt) || fallback}</span>
        {lead.appointmentRequested && <span className="record-card__flag">{t(RECORD_COPY.requested)}</span>}
      </div>

      <div className="record-card__grid">
        <RecordField label={t(RECORD_COPY.name)} value={lead.customerName} fallback={fallback} />
        <RecordField label={t(RECORD_COPY.phone)} value={lead.phone} fallback={fallback} />
        <RecordField label={t(RECORD_COPY.vehicle)} value={lead.vehicle} fallback={fallback} />
        <RecordField label={t(RECORD_COPY.source)} value={lead.source} fallback={fallback} />
      </div>

      <div className="record-card__summary">
        <span>{t(RECORD_COPY.summary)}</span>
        <p>{lead.summary || lead.lastMessage || fallback}</p>
      </div>

      <Transcript record={lead} t={t} />
    </article>
  );
}

function AppointmentCard({ appointment, t, disabled, onStatus, onDelete }) {
  const fallback = t(RECORD_COPY.missing);
  return (
    <article className="record-card record-card--appointment">
      <div className="record-card__head">
        <div>
          <p className="record-card__eyebrow">{t(CHAT_ADMIN.appointmentsTitle)}</p>
          <h2>{appointment.service || t(RECORD_COPY.requested)}</h2>
        </div>
        <StatusSelect
          label={t(RECORD_COPY.status)}
          value={appointment.status || "requested"}
          options={APPOINTMENT_STATUSES}
          onChange={(status) => onStatus("appointment", appointment.id, status)}
          disabled={disabled}
        />
      </div>

      <div className="record-card__actions">
        <button
          type="button"
          className="record-card__delete"
          onClick={() => onDelete("appointment", appointment.id, appointment)}
          disabled={disabled}
        >
          {t(RECORD_COPY.delete)}
        </button>
      </div>

      <div className="record-card__meta">
        <span>{t(RECORD_COPY.created)}: {formatDate(appointment.createdAt) || fallback}</span>
        <span>{t(RECORD_COPY.updated)}: {formatDate(appointment.updatedAt) || fallback}</span>
      </div>

      <div className="record-card__grid">
        <RecordField label={t(RECORD_COPY.name)} value={appointment.customerName} fallback={fallback} />
        <RecordField label={t(RECORD_COPY.phone)} value={appointment.phone} fallback={fallback} />
        <RecordField label={t(RECORD_COPY.vehicle)} value={appointment.vehicle} fallback={fallback} />
        <RecordField label={t(RECORD_COPY.service)} value={appointment.service} fallback={fallback} />
      </div>

      <div className="record-card__summary">
        <span>{t(RECORD_COPY.notes)}</span>
        <p>{appointment.notes || fallback}</p>
      </div>
    </article>
  );
}

export default function PricingEditor({
  initialPricing,
  initialChatSettings,
  initialRecords,
  initialYelpLeads,
  yelpConfigured,
  initialWhatsAppConversations,
  initialWhatsAppGlobalBotEnabled,
  whatsappConfigured,
  persistent,
  chatPersistent,
  recordsPersistent,
  authReady,
}) {
  const router = useRouter();
  const { lang, toggleLang } = useLanguage();
  const t = useT();
  const [activeTab, setActiveTab] = useState("overview");
  const [recordQuery, setRecordQuery] = useState("");
  const [recordStatus, setRecordStatus] = useState("all");
  const [pricing, setPricing] = useState(initialPricing);
  const [chatSettings, setChatSettings] = useState(initialChatSettings);
  const [records, setRecords] = useState({
    leads: initialRecords?.leads || [],
    appointments: initialRecords?.appointments || [],
    blockedSlots: initialRecords?.blockedSlots || [],
  });
  const [yelpLeads, setYelpLeads] = useState(initialYelpLeads || []);
  const [runningYelp, setRunningYelp] = useState(false);
  const [lastYelpResult, setLastYelpResult] = useState(null);
  const [status, setStatus] = useState(null); // {ok, msg: {en, es}}
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const edit = (mutator) =>
    setPricing((p) => {
      const next = structuredClone(p);
      mutator(next);
      return next;
    });

  const editChat = (mutator) =>
    setChatSettings((settings) => {
      const next = structuredClone(settings);
      mutator(next);
      return next;
    });

  const numHandler = (mutator) => (e) => {
    const v = e.target.value === "" ? 0 : Number(e.target.value);
    if (Number.isFinite(v)) edit((n) => mutator(n, Math.max(0, v)));
  };

  async function savePricing() {
    setSaving(true);
    setStatus(null);
    const res = await fetch("/api/admin/pricing", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pricing),
    });
    setSaving(false);
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      setStatus({ ok: true, msg: body.persisted ? E.saved : E.savedSession });
      router.refresh();
    } else {
      const detail = body.error ? ` (${body.error})` : "";
      setStatus({ ok: false, msg: { en: E.saveFailed.en + detail, es: E.saveFailed.es + detail } });
    }
  }

  async function saveChat() {
    setSaving(true);
    setStatus(null);
    const res = await fetch("/api/admin/chat", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(chatSettings),
    });
    setSaving(false);
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      setStatus({ ok: true, msg: body.persisted ? CHAT_ADMIN.saved : CHAT_ADMIN.savedSession });
      router.refresh();
    } else {
      const detail = body.error ? ` (${body.error})` : "";
      setStatus({
        ok: false,
        msg: { en: CHAT_ADMIN.saveFailed.en + detail, es: CHAT_ADMIN.saveFailed.es + detail },
      });
    }
  }

  async function save() {
    if (activeTab === "chat") return saveChat();
    if (activeTab === "pricing") return savePricing();
  }

  async function refreshRecords() {
    setSaving(true);
    setStatus(null);
    const res = await fetch("/api/admin/records");
    setSaving(false);
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      setRecords({
        leads: body.leads || [],
        appointments: body.appointments || [],
        blockedSlots: body.blockedSlots || [],
      });
      setStatus({ ok: true, msg: CHAT_ADMIN.refreshed });
      router.refresh();
    } else {
      const detail = body.error ? ` (${body.error})` : "";
      setStatus({
        ok: false,
        msg: { en: CHAT_ADMIN.updateFailed.en + detail, es: CHAT_ADMIN.updateFailed.es + detail },
      });
    }
  }

  async function runYelpNow() {
    setRunningYelp(true);
    setLastYelpResult(null);
    const runRes = await fetch("/api/admin/yelp-leads", { method: "POST" });
    const runBody = await runRes.json().catch(() => ({}));
    if (runRes.ok) {
      setLastYelpResult({ checked: runBody.checked ?? 0 });
    }
    const listRes = await fetch("/api/admin/yelp-leads");
    const listBody = await listRes.json().catch(() => ({}));
    if (listRes.ok) setYelpLeads(listBody.leads || []);
    setRunningYelp(false);
    if (!runRes.ok) {
      const detail = runBody.error ? ` (${runBody.error})` : "";
      setStatus({
        ok: false,
        msg: { en: CHAT_ADMIN.updateFailed.en + detail, es: CHAT_ADMIN.updateFailed.es + detail },
      });
    }
  }

  async function updateRecordStatus(type, id, nextStatus) {
    setUpdatingId(id);
    setStatus(null);
    const res = await fetch("/api/admin/records", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id, status: nextStatus }),
    });
    setUpdatingId("");
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      setRecords((current) => {
        const key = type === "appointment" ? "appointments" : "leads";
        return {
          ...current,
          [key]: current[key].map((record) =>
            record.id === id ? { ...record, status: nextStatus, updatedAt: new Date().toISOString() } : record,
          ),
        };
      });
      setStatus({ ok: true, msg: { en: "Status updated.", es: "Estado actualizado." } });
    } else {
      const detail = body.error ? ` (${body.error})` : "";
      setStatus({
        ok: false,
        msg: { en: CHAT_ADMIN.updateFailed.en + detail, es: CHAT_ADMIN.updateFailed.es + detail },
      });
    }
  }

  async function deleteRecord(type, id, record) {
    const confirmMessage =
      type === "appointment" ? t(RECORD_COPY.deleteAppointmentConfirm) : t(RECORD_COPY.deleteLeadConfirm);
    if (!window.confirm(confirmMessage)) return;

    setUpdatingId(id);
    setStatus(null);
    const res = await fetch("/api/admin/records", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id }),
    });
    setUpdatingId("");
    const body = await res.json().catch(() => ({}));

    if (res.ok) {
      setRecords((current) => {
        const deletedAppointmentIds = new Set(body.deleted?.appointmentIds || []);
        const deletedLeadIds = new Set(body.deleted?.leadIds || []);
        const nextLeads = current.leads.filter((lead) => !deletedLeadIds.has(lead.id));
        const nextAppointments = current.appointments.filter(
          (appointment) => !deletedAppointmentIds.has(appointment.id),
        );

        if (type === "appointment") {
          return {
            ...current,
            appointments: nextAppointments,
          };
        }

        return {
          ...current,
          leads: nextLeads,
          appointments: nextAppointments.filter(
            (appointment) => appointment.leadId !== id && appointment.sessionId !== record?.sessionId,
          ),
        };
      });
      setStatus({ ok: true, msg: CHAT_ADMIN.deleted });
      router.refresh();
    } else {
      const detail = body.error ? ` (${body.error})` : "";
      setStatus({
        ok: false,
        msg: { en: CHAT_ADMIN.deleteFailed.en + detail, es: CHAT_ADMIN.deleteFailed.es + detail },
      });
    }
  }

  async function scheduleAppointment(appointmentId, scheduledDate, scheduledTime) {
    setUpdatingId(appointmentId);
    setStatus(null);
    const res = await fetch("/api/admin/records", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "schedule", id: appointmentId, scheduledDate, scheduledTime }),
    });
    setUpdatingId("");
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      setRecords((current) => ({
        ...current,
        appointments: current.appointments.map((a) =>
          a.id === appointmentId ? { ...a, ...body.appointment, scheduledDate, scheduledTime, status: "confirmed", updatedAt: new Date().toISOString() } : a,
        ),
      }));
      setStatus({ ok: true, msg: { en: "Appointment scheduled.", es: "Cita agendada." } });
    } else {
      setStatus({ ok: false, msg: { en: body.error || "Schedule failed.", es: body.error || "No se pudo agendar." } });
    }
  }

  async function unscheduleAppointment(appointmentId) {
    setUpdatingId(appointmentId);
    setStatus(null);
    const res = await fetch("/api/admin/records", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unschedule", id: appointmentId }),
    });
    setUpdatingId("");
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      setRecords((current) => ({
        ...current,
        appointments: current.appointments.map((a) =>
          a.id === appointmentId ? { ...a, scheduledDate: "", scheduledTime: "", status: "requested", updatedAt: new Date().toISOString() } : a,
        ),
      }));
      setStatus({ ok: true, msg: { en: "Appointment unscheduled.", es: "Cita desagendada." } });
    } else {
      setStatus({ ok: false, msg: { en: body.error || "Unschedule failed.", es: body.error || "No se pudo desagendar." } });
    }
  }

  async function createAppointment(fields) {
    setSaving(true);
    setStatus(null);
    const res = await fetch("/api/admin/records", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", ...fields }),
    });
    setSaving(false);
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      setRecords((current) => ({
        ...current,
        leads: body.lead ? [body.lead, ...current.leads] : current.leads,
        appointments: body.appointment ? [body.appointment, ...current.appointments] : current.appointments,
      }));
      setStatus({ ok: true, msg: { en: "Appointment created.", es: "Cita creada." } });
    } else {
      setStatus({ ok: false, msg: { en: body.error || "Create failed.", es: body.error || "No se pudo crear." } });
    }
  }

  async function handleBlock(date, time) {
    setStatus(null);
    const res = await fetch("/api/admin/records", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "block", date, time }),
    });
    if (res.ok) {
      setRecords((current) => ({
        ...current,
        blockedSlots: [...(current.blockedSlots || []), { date, time, createdAt: new Date().toISOString() }],
      }));
    } else {
      const body = await res.json().catch(() => ({}));
      setStatus({ ok: false, msg: { en: body.error || "Block failed.", es: body.error || "No se pudo bloquear." } });
    }
  }

  async function handleUnblock(date, time) {
    setStatus(null);
    const res = await fetch("/api/admin/records", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unblock", date, time }),
    });
    if (res.ok) {
      setRecords((current) => ({
        ...current,
        blockedSlots: (current.blockedSlots || []).filter((s) => !(s.date === date && s.time === time)),
      }));
    } else {
      const body = await res.json().catch(() => ({}));
      setStatus({ ok: false, msg: { en: body.error || "Unblock failed.", es: body.error || "No se pudo desbloquear." } });
    }
  }

  async function testNotification() {
    setSaving(true);
    setStatus(null);
    const res = await fetch("/api/admin/test-notify", { method: "POST" });
    setSaving(false);
    const body = await res.json().catch(() => ({}));
    if (res.ok) {
      setStatus({ ok: true, msg: { en: "Test notification sent! Check the inbox.", es: "Notificacion de prueba enviada! Revisa la bandeja de entrada." } });
    } else {
      setStatus({ ok: false, msg: { en: body.error || "Notification test failed.", es: body.error || "Fallo la prueba de notificacion." } });
    }
  }

  async function logout() {
    setLoggingOut(true);
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  function navigate(nextTab) {
    setActiveTab(nextTab);
    setRecordQuery("");
    setRecordStatus("all");
    setStatus(null);
  }

  const title =
    activeTab === "overview"
      ? CHAT_ADMIN.overviewTitle
      : activeTab === "leads"
      ? CHAT_ADMIN.leadsTitle
      : activeTab === "appointments"
        ? CHAT_ADMIN.appointmentsTitle
        : activeTab === "yelp"
          ? CHAT_ADMIN.yelpTitle
          : activeTab === "chat"
            ? CHAT_ADMIN.chatTitle
            : activeTab === "whatsapp" ? { en: "WhatsApp Inbox", es: "Bandeja de WhatsApp" }
            : activeTab === "api" ? { en: "API & System Health", es: "API y estado del sistema" }
            : E.title;
  const showSave = activeTab === "chat" || activeTab === "pricing";
  const recordsTab = activeTab === "leads" || activeTab === "appointments";
  const query = recordQuery.trim().toLowerCase();
  const recordMatches = (record) => !query || [record.customerName, record.phone, record.vehicle, record.service, record.source, record.summary, record.status]
    .some((value) => String(value || "").toLowerCase().includes(query));
  const filteredLeads = records.leads.filter((lead) => recordMatches(lead) && (recordStatus === "all" || lead.status === recordStatus));
  const filteredAppointments = records.appointments.filter((item) => recordMatches(item) && (recordStatus === "all" || item.status === recordStatus));
  const statusOptions = activeTab === "appointments" ? APPOINTMENT_STATUSES : LEAD_STATUSES;
  const navGroups = [
    { label: "Workspace", items: [
      { id: "overview", label: t(CHAT_ADMIN.overviewTab), mark: "OV" },
      { id: "leads", label: t(CHAT_ADMIN.leadsTab), mark: "LD", count: records.leads.length },
      { id: "appointments", label: t(CHAT_ADMIN.appointmentsTab), mark: "AP", count: records.appointments.length },
    ] },
    { label: "Channels", items: [
      { id: "whatsapp", label: "WhatsApp", mark: "WA", count: initialWhatsAppConversations.length },
      { id: "yelp", label: t(CHAT_ADMIN.yelpTab), mark: "YP", count: yelpLeads.length },
    ] },
    { label: "Configuration", items: [
      { id: "chat", label: t(CHAT_ADMIN.chatTab), mark: "CH" },
      { id: "pricing", label: t(CHAT_ADMIN.pricingTab), mark: "PR" },
      { id: "api", label: t(CHAT_ADMIN.apiTab), mark: "API" },
    ] },
  ];

  function exportCurrentRecords() {
    const source = activeTab === "appointments" ? filteredAppointments : filteredLeads;
    const rows = source.map((record) => activeTab === "appointments" ? {
      Name: record.customerName, Phone: record.phone, Service: record.service, Vehicle: record.vehicle,
      Status: record.status, Date: record.scheduledDate || record.preferredDate, Time: record.scheduledTime || record.preferredTime,
    } : {
      Name: record.customerName, Phone: record.phone, Source: record.source, Service: record.service,
      Vehicle: record.vehicle, Status: record.status, Updated: record.updatedAt,
    });
    downloadCsv(`${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`, rows);
  }

  return (
    <>
      {loggingOut && <AdminLoader message={t(E.loggingOut)} />}
      <div className="editor admin-console">
        <aside className="admin-navigation">
          <div className="admin-navigation__brand"><strong>Tires SOS</strong><span>Operations</span></div>
          <nav aria-label={t(CHAT_ADMIN.adminTitle)}>
            {navGroups.map((group) => <div className="admin-navigation__group" key={group.label}>
              <span>{group.label}</span>
              {group.items.map((item) => <button type="button" key={item.id} className={activeTab === item.id ? "is-active" : ""} onClick={() => navigate(item.id)}>
                <i>{item.mark}</i><strong>{item.label}</strong>{Number.isFinite(item.count) && <b>{item.count}</b>}
              </button>)}
            </div>)}
          </nav>
          <div className="admin-navigation__footer">
            <span className={recordsPersistent ? "is-online" : "is-offline"} />
            <div><strong>{recordsPersistent ? "Systems connected" : "Limited storage"}</strong><small>Admin workspace</small></div>
          </div>
        </aside>

        <section className="admin-workspace">
          <header className="editor__bar">
            <div className="admin-page-heading">
              <span>Admin / {activeTab}</span>
              <h1>{t(title)}</h1>
            {activeTab === "pricing" && !persistent && <p className="editor__warn">{t(E.storageWarn)}</p>}
            {activeTab === "chat" && !chatPersistent && <p className="editor__warn">{t(CHAT_ADMIN.chatStorageWarn)}</p>}
            {recordsTab && !recordsPersistent && <p className="editor__warn">{t(CHAT_ADMIN.recordsStorageWarn)}</p>}
          </div>
          <div className="editor__actions">
            {status && <span className={status.ok ? "editor__ok" : "editor__err"}>{t(status.msg)}</span>}
            <button type="button" className="lang-toggle" onClick={toggleLang} aria-label="Toggle language">
              {lang === "en" ? "ES" : "EN"}
            </button>
            <Link className="btn btn--ghost btn--small" href="/">
              Home
            </Link>
            <button className="btn btn--ghost btn--small" onClick={logout} disabled={loggingOut || saving}>
              {loggingOut ? t(E.loggingOut) : t(E.logOut)}
            </button>
            {recordsTab && (
              <>
                <button className="btn btn--ghost btn--small" onClick={refreshRecords} disabled={saving}>
                  {saving ? t(E.saving) : t(CHAT_ADMIN.refresh)}
                </button>
                <button className="btn btn--ghost btn--small editor__test-notify" onClick={testNotification} disabled={saving}>
                  {t({ en: "Test notification", es: "Probar notificacion" })}
                </button>
              </>
            )}
            {showSave && (
              <button className="btn btn--primary btn--small" onClick={save} disabled={saving}>
                {saving ? t(E.saving) : t(E.save)}
              </button>
            )}
          </div>
          </header>

          {recordsTab && <div className="admin-commandbar">
            <label><span>Search</span><input type="search" value={recordQuery} onChange={(event) => setRecordQuery(event.target.value)} placeholder={activeTab === "leads" ? "Name, phone, vehicle, source..." : "Name, service, vehicle..."} /></label>
            <label><span>Status</span><select value={recordStatus} onChange={(event) => setRecordStatus(event.target.value)}><option value="all">All statuses</option>{statusOptions.map((option) => <option value={option.value} key={option.value}>{t(option.label)}</option>)}</select></label>
            <span className="admin-commandbar__count">{activeTab === "leads" ? filteredLeads.length : filteredAppointments.length} results</span>
            <button type="button" onClick={exportCurrentRecords} disabled={!(activeTab === "leads" ? filteredLeads.length : filteredAppointments.length)}>Export CSV</button>
          </div>}

          <main className="admin-content">

        {activeTab === "overview" ? (
          <AdminOverview
            records={records}
            yelpLeads={yelpLeads}
            whatsappConversations={initialWhatsAppConversations}
            integrations={{ pricing: persistent, chat: chatPersistent, records: recordsPersistent, whatsapp: whatsappConfigured, yelp: yelpConfigured }}
            onNavigate={navigate}
          />
        ) : activeTab === "leads" ? (
          <section className="record-list" aria-label={t(CHAT_ADMIN.leadsTitle)}>
            {filteredLeads.length ? (
              filteredLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  t={t}
                  disabled={updatingId === lead.id}
                  onStatus={updateRecordStatus}
                  onDelete={deleteRecord}
                />
              ))
            ) : (
              <EmptyRecords>{t(RECORD_COPY.noLeads)}</EmptyRecords>
            )}
          </section>
        ) : activeTab === "appointments" ? (
          <AppointmentCalendar
            appointments={filteredAppointments}
            blockedSlots={records.blockedSlots || []}
            t={t}
            onSchedule={scheduleAppointment}
            onUnschedule={unscheduleAppointment}
            onStatus={updateRecordStatus}
            onDelete={deleteRecord}
            onBlock={handleBlock}
            onUnblock={handleUnblock}
            onCreate={createAppointment}
            disabled={saving}
            updatingId={updatingId}
          />
        ) : activeTab === "yelp" ? (
          <YelpLeads
            leads={yelpLeads}
            t={t}
            gmailConfigured={yelpConfigured}
            running={runningYelp}
            onRunNow={runYelpNow}
            lastRunResult={lastYelpResult}
          />
        ) : activeTab === "whatsapp" ? (
          <WhatsAppInbox initialConversations={initialWhatsAppConversations} initialGlobalBotEnabled={initialWhatsAppGlobalBotEnabled} configured={whatsappConfigured} />
        ) : activeTab === "chat" ? (
          <>
            <section className="editor__group">
              <h2>{t(CHAT_ADMIN.publicText)}</h2>
              <p className="editor__hint">{t(CHAT_ADMIN.publicHint)}</p>
              <div className="editor__bi-grid">
                <BilingualField
                  label={t(CHAT_ADMIN.title)}
                  value={chatSettings.title}
                  languageLabels={{ en: t(CHAT_ADMIN.english), es: t(CHAT_ADMIN.spanish) }}
                  onChange={(key, value) => editChat((n) => (n.title[key] = value))}
                />
                <BilingualField
                  label={t(CHAT_ADMIN.subtitle)}
                  value={chatSettings.subtitle}
                  languageLabels={{ en: t(CHAT_ADMIN.english), es: t(CHAT_ADMIN.spanish) }}
                  onChange={(key, value) => editChat((n) => (n.subtitle[key] = value))}
                  multiline
                />
                <BilingualField
                  label={t(CHAT_ADMIN.intro)}
                  value={chatSettings.intro}
                  languageLabels={{ en: t(CHAT_ADMIN.english), es: t(CHAT_ADMIN.spanish) }}
                  onChange={(key, value) => editChat((n) => (n.intro[key] = value))}
                  multiline
                />
                <BilingualField
                  label={t(CHAT_ADMIN.placeholder)}
                  value={chatSettings.placeholder}
                  languageLabels={{ en: t(CHAT_ADMIN.english), es: t(CHAT_ADMIN.spanish) }}
                  onChange={(key, value) => editChat((n) => (n.placeholder[key] = value))}
                />
              </div>
            </section>

            <section className="editor__group">
              <h2>{t(CHAT_ADMIN.prompts)}</h2>
              <p className="editor__hint">{t(CHAT_ADMIN.promptsHint)}</p>
              <div className="editor__prompt-grid">
                {chatSettings.quickPrompts.map((prompt, index) => (
                  <div key={index} className="editor__prompt-card">
                    <p className="editor__field-title">
                      {t(CHAT_ADMIN.prompt)} {index + 1}
                    </p>
                    <label>
                      <span>{t(CHAT_ADMIN.english)}</span>
                      <input
                        value={prompt.en}
                        onChange={(e) =>
                          editChat((n) => {
                            n.quickPrompts[index].en = e.target.value;
                          })
                        }
                      />
                    </label>
                    <label>
                      <span>{t(CHAT_ADMIN.spanish)}</span>
                      <input
                        value={prompt.es}
                        onChange={(e) =>
                          editChat((n) => {
                            n.quickPrompts[index].es = e.target.value;
                          })
                        }
                      />
                    </label>
                  </div>
                ))}
              </div>
            </section>

            <section className="editor__group">
              <h2>{t(CHAT_ADMIN.behavior)}</h2>
              <p className="editor__hint">{t(CHAT_ADMIN.behaviorHint)}</p>
              <textarea
                className="editor__textarea"
                value={chatSettings.systemInstructions}
                onChange={(e) => editChat((n) => (n.systemInstructions = e.target.value))}
                rows={6}
              />
              <label className="editor__checkbox">
                <input
                  type="checkbox"
                  checked={chatSettings.disableEstimates === true}
                  onChange={(e) => editChat((n) => (n.disableEstimates = e.target.checked))}
                />
                <span>{t(CHAT_ADMIN.disableEstimates)}</span>
              </label>
              <p className="editor__hint">{t(CHAT_ADMIN.disableEstimatesHint)}</p>
            </section>
          </>
        ) : activeTab === "pricing" ? (
          <>
            <section className="editor__group">
              <h2>{t(E.globalHeading)}</h2>
              <div className="editor__row">
                <label>
                  <span>{t(E.laborRate)}</span>
                  <input
                    type="number"
                    min="0"
                    value={pricing.laborRate}
                    onChange={numHandler((n, v) => (n.laborRate = v))}
                  />
                </label>
                <label>
                  <span>{t(E.spread)}</span>
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={Math.round(pricing.rangePct * 100)}
                    onChange={numHandler((n, v) => (n.rangePct = Math.min(0.9, v / 100)))}
                  />
                </label>
                <label>
                  <span>{t(E.currency)}</span>
                  <input value={pricing.currency} onChange={(e) => edit((n) => (n.currency = e.target.value))} />
                </label>
              </div>
            </section>

            <section className="editor__group">
              <h2>{t(E.vehicleHeading)}</h2>
              <p className="editor__hint">{t(E.vehicleHint)}</p>
              <div className="editor__grid">
                {pricing.vehicleClasses.map((vc, i) => (
                  <label key={vc.id} className="editor__cell">
                    <span>{t(vc.label)}</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={vc.factor}
                      onChange={numHandler((n, v) => (n.vehicleClasses[i].factor = v))}
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="editor__group">
              <h2>{t(E.brandHeading)}</h2>
              <p className="editor__hint">{t(E.brandHint)}</p>
              <div className="editor__grid">
                {(pricing.brandTiers || []).map((bt, i) => (
                  <label key={bt.id} className="editor__cell">
                    <span>{t(bt.label)}</span>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={bt.factor}
                      onChange={numHandler((n, v) => (n.brandTiers[i].factor = v))}
                    />
                  </label>
                ))}
              </div>
            </section>

            <section className="editor__group">
              <h2>{t(E.tireBrandsHeading)}</h2>
              <p className="editor__hint">{t(E.tireBrandsHint)}</p>
              <div className="editor__prompt-grid">
                {(pricing.tireBrands || []).map((brand, i) => (
                  <div key={brand.id} className="editor__prompt-card">
                    <label>
                      <span>{t(E.brandName)}</span>
                      <input
                        value={brand.name}
                        onChange={(e) => edit((n) => (n.tireBrands[i].name = e.target.value))}
                      />
                    </label>
                    <label>
                      <span>{t(E.brandTierLabel)}</span>
                      <select
                        value={brand.tier}
                        onChange={(e) => edit((n) => (n.tireBrands[i].tier = e.target.value))}
                      >
                        {pricing.brandTiers.map((bt) => (
                          <option key={bt.id} value={bt.id}>
                            {t(bt.label)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="btn btn--ghost btn--small"
                      onClick={() => edit((n) => (n.tireBrands = n.tireBrands.filter((b) => b.id !== brand.id)))}
                    >
                      {t(E.removeBrand)}
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="btn btn--ghost btn--small"
                onClick={() =>
                  edit((n) => {
                    if (!Array.isArray(n.tireBrands)) n.tireBrands = [];
                    n.tireBrands.push({
                      id: `brand-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                      name: "",
                      tier: n.brandTiers[1]?.id || n.brandTiers[0]?.id || "standard",
                    });
                  })
                }
              >
                {t(E.addBrand)}
              </button>
            </section>

            <section className="editor__group">
              <h2>{t(E.servicesHeading)}</h2>
              {pricing.services.map((svc, i) => (
                <div key={svc.id} className="editor__svc">
                  <div className="editor__svc-head">
                    <strong>{t(svc.label)}</strong>
                    <span className="editor__tag">{svc.model}</span>
                    <label className="editor__inline-check">
                      <input
                        type="checkbox"
                        checked={svc.appliesVehicleFactor}
                        onChange={(e) => edit((n) => (n.services[i].appliesVehicleFactor = e.target.checked))}
                      />
                      {t(E.appliesFactor)}
                    </label>
                    <label className="editor__inline-check">
                      <input
                        type="checkbox"
                        checked={svc.appliesBrandTier === true}
                        onChange={(e) => edit((n) => (n.services[i].appliesBrandTier = e.target.checked))}
                      />
                      {t(E.appliesBrandTier)}
                    </label>
                    <label className="editor__inline-check">
                      <input
                        type="checkbox"
                        checked={svc.chatQuotable === false}
                        onChange={(e) => edit((n) => (n.services[i].chatQuotable = !e.target.checked))}
                      />
                      {t(E.chatQuotableOff)}
                    </label>
                  </div>
                  <p className="editor__hint">{t(E.modelHelp[svc.model])}</p>

                  <div className="editor__row">
                    {svc.model === "perUnit" && (
                      <>
                        <label>
                          <span>{t(E.basePrice)}</span>
                          <input
                            type="number"
                            min="0"
                            value={svc.basePrice}
                            onChange={numHandler((n, v) => (n.services[i].basePrice = v))}
                          />
                        </label>
                        {svc.fees?.map((f, fi) => (
                          <label key={fi}>
                            <span>
                              {t(f.label)} ({t(f.per === "unit" ? E.perUnit : E.perJob)})
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={f.amount}
                              onChange={numHandler((n, v) => (n.services[i].fees[fi].amount = v))}
                            />
                          </label>
                        ))}
                      </>
                    )}

                    {svc.model === "labor" && (
                      <>
                        <label>
                          <span>{t(E.partsBase)}</span>
                          <input
                            type="number"
                            min="0"
                            value={svc.partsBase}
                            onChange={numHandler((n, v) => (n.services[i].partsBase = v))}
                          />
                        </label>
                        <label>
                          <span>{t(E.laborHours)}</span>
                          <input
                            type="number"
                            min="0"
                            step="0.25"
                            value={svc.laborHours}
                            onChange={numHandler((n, v) => (n.services[i].laborHours = v))}
                          />
                        </label>
                      </>
                    )}

                    {svc.model === "options" &&
                      svc.options.map((o, oi) => (
                        <label key={o.id}>
                          <span>{t(o.label)}</span>
                          <input
                            type="number"
                            min="0"
                            value={o.price}
                            onChange={numHandler((n, v) => (n.services[i].options[oi].price = v))}
                          />
                        </label>
                      ))}

                    {svc.model === "flat" && (
                      <label>
                        <span>{t(E.flatPrice)}</span>
                        <input
                          type="number"
                          min="0"
                          value={svc.flatPrice}
                          onChange={numHandler((n, v) => (n.services[i].flatPrice = v))}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </section>
          </>
        ) : (
          <ApiStatus t={t} lang={lang} />
        )}
          </main>
        </section>
      </div>
    </>
  );
}
