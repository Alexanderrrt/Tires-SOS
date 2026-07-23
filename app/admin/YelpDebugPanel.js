"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const COPY = {
  title: { en: "Yelp Debug & Manual Reply", es: "Depuración y respuesta manual de Yelp" },
  subtitle: {
    en: "Live Gmail inspection outside the automatic responder. AI drafts only when you request one; nothing sends until you confirm.",
    es: "Inspección de Gmail fuera del respondedor automático. La IA redacta solo cuando se solicita; nada se envía hasta confirmar.",
  },
  refresh: { en: "Refresh inbox", es: "Actualizar bandeja" },
  refreshing: { en: "Checking Gmail...", es: "Revisando Gmail..." },
  live: { en: "Live refresh", es: "Actualización en vivo" },
  search: { en: "Search name, subject, or message", es: "Buscar nombre, asunto o mensaje" },
  all: { en: "All", es: "Todos" },
  attention: { en: "Needs attention", es: "Necesita atención" },
  ready: { en: "Can reply", es: "Se puede responder" },
  replied: { en: "Already replied", es: "Ya respondido" },
  blocked: { en: "Yelp-only / blocked", es: "Solo Yelp / bloqueado" },
  unread: { en: "Unread", es: "No leído" },
  checked: { en: "Last Gmail check", es: "Última revisión de Gmail" },
  checkpoint: { en: "Auto-responder checkpoint", es: "Punto de control automático" },
  select: { en: "Select a message to inspect and respond.", es: "Selecciona un mensaje para inspeccionarlo y responder." },
  customerMessage: { en: "Customer message", es: "Mensaje del cliente" },
  replyEditor: { en: "Manual reply editor", es: "Editor de respuesta manual" },
  draftAi: { en: "Generate AI draft", es: "Generar borrador con IA" },
  drafting: { en: "Generating...", es: "Generando..." },
  send: { en: "Send manual reply", es: "Enviar respuesta manual" },
  sending: { en: "Sending...", es: "Enviando..." },
  clear: { en: "Clear draft", es: "Borrar borrador" },
  openGmail: { en: "Open in Gmail", es: "Abrir en Gmail" },
  openYelp: { en: "Open Yelp for Business", es: "Abrir Yelp para Negocios" },
  diagnostics: { en: "Automation diagnostics", es: "Diagnóstico de automatización" },
  safeSender: { en: "Verified Yelp sender", es: "Remitente de Yelp verificado" },
  safeRelay: { en: "Safe Yelp reply relay", es: "Relay de respuesta seguro" },
  subjectMatch: { en: "Subject recognized by auto-responder", es: "Asunto reconocido por el respondedor" },
  afterCheckpoint: { en: "After auto-responder checkpoint", es: "Posterior al punto de control" },
  threadClear: { en: "No existing sent reply in thread", es: "No existe una respuesta enviada en el hilo" },
  gmailUnread: { en: "Unread in Gmail", es: "No leído en Gmail" },
  database: { en: "Database status", es: "Estado en base de datos" },
  notRecorded: { en: "Not recorded", es: "No registrado" },
  noMessages: { en: "No Yelp emails found for this period.", es: "No se encontraron correos de Yelp en este período." },
  sendSuccess: { en: "Manual Yelp reply sent.", es: "Respuesta manual de Yelp enviada." },
  loadFailed: { en: "Could not inspect the Yelp inbox.", es: "No se pudo inspeccionar la bandeja de Yelp." },
  chars: { en: "characters", es: "caracteres" },
  whatHappened: { en: "What happened", es: "Qué ocurrió" },
  advanced: { en: "Advanced technical details", es: "Detalles técnicos avanzados" },
};

const DIAGNOSIS = {
  ready_manual_reply: {
    label: { en: "Ready to reply", es: "Listo para responder" },
    detail: { en: "This is a valid Yelp lead with no reply sent yet.", es: "Este es un cliente válido de Yelp y todavía no se ha enviado respuesta." },
  },
  automation_eligible: {
    label: { en: "Ready to reply", es: "Listo para responder" },
    detail: { en: "The automatic responder could still process this lead, or you can answer it here.", es: "El respondedor automático todavía podría procesarlo, o puedes responder aquí." },
  },
  already_read: {
    label: { en: "Missed because it was read", es: "Se omitió porque ya estaba leído" },
    detail: { en: "Gmail marked this message as read before the automatic responder saw it. It is safe to answer manually.", es: "Gmail marcó este mensaje como leído antes de que el respondedor automático lo viera. Se puede responder manualmente." },
  },
  before_watermark: {
    label: { en: "Missed by the checkpoint", es: "Se omitió por el punto de control" },
    detail: { en: "The responder checkpoint moved past this message. It will not be picked up automatically now.", es: "El punto de control avanzó más allá de este mensaje. Ya no será recogido automáticamente." },
  },
  subject_not_matched: {
    label: { en: "New Yelp email format", es: "Nuevo formato de correo de Yelp" },
    detail: { en: "Yelp used a subject format the current automatic responder does not recognize. You can still answer it here.", es: "Yelp usó un formato de asunto que el respondedor actual no reconoce. Todavía puedes contestar aquí." },
  },
  previous_send_failed: {
    label: { en: "Automatic reply failed", es: "Falló la respuesta automática" },
    detail: { en: "The previous send failed. Review the draft and send it manually.", es: "El envío anterior falló. Revisa el borrador y envíalo manualmente." },
  },
  pending_record: {
    label: { en: "Reply pending", es: "Respuesta pendiente" },
    detail: { en: "This lead was recorded but has not been answered yet.", es: "Este cliente fue registrado, pero todavía no se ha respondido." },
  },
  already_replied: {
    label: { en: "Already answered", es: "Ya respondido" },
    detail: { en: "A sent reply already exists in this Gmail conversation, so another email is blocked.", es: "Ya existe una respuesta enviada en esta conversación de Gmail, por lo que se bloquea otro correo." },
  },
  follow_up_yelp_only: {
    label: { en: "Answer inside Yelp", es: "Responder dentro de Yelp" },
    detail: { en: "This is a customer follow-up. Yelp requires follow-ups to be answered in Yelp for Business.", es: "Este es un seguimiento del cliente. Yelp exige responderlo en Yelp para Negocios." },
  },
  no_yelp_relay: {
    label: { en: "No safe email reply address", es: "No hay dirección segura para responder" },
    detail: { en: "Yelp did not provide a valid reply relay. Open Yelp for Business to answer safely.", es: "Yelp no proporcionó un relay válido. Abre Yelp para Negocios para responder con seguridad." },
  },
  untrusted_sender: {
    label: { en: "Not a customer lead", es: "No es un cliente" },
    detail: { en: "This email did not come from Yelp's customer messaging system.", es: "Este correo no vino del sistema de mensajes de clientes de Yelp." },
  },
};

function diagnosisCopy(diagnosis, lang) {
  const copy = DIAGNOSIS[diagnosis?.code];
  return {
    label: copy?.label?.[lang] || copy?.label?.en || diagnosis?.label || "Unknown",
    detail: copy?.detail?.[lang] || copy?.detail?.en || diagnosis?.label || "",
  };
}

const FILTERS = [
  ["all", COPY.all],
  ["attention", COPY.attention],
  ["ready", COPY.ready],
  ["replied", COPY.replied],
  ["blocked", COPY.blocked],
];

function formatDate(value, lang) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(lang === "es" ? "es-US" : "en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function diagnosticClass(value) {
  return value ? "is-ok" : "is-off";
}

function messageMatchesFilter(message, filter) {
  if (filter === "attention") return message.needsAttention;
  if (filter === "ready") return message.canSend;
  if (filter === "replied") return message.alreadyReplied;
  if (filter === "blocked") return !message.canSend && !message.alreadyReplied;
  return true;
}

export default function YelpDebugPanel({ t, lang, gmailConfigured }) {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(7);
  const [filter, setFilter] = useState("attention");
  const [query, setQuery] = useState("");
  const [live, setLive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [replyText, setReplyText] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState(null);
  const initialLoad = useRef(false);
  const requestInFlight = useRef(false);

  const loadInbox = useCallback(async ({ quiet = false } = {}) => {
    if (!gmailConfigured || requestInFlight.current) return;
    requestInFlight.current = true;
    if (!quiet) setLoading(true);
    try {
      const response = await fetch(`/api/admin/yelp-debug?days=${days}`, { cache: "no-store" });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || t(COPY.loadFailed));
      setData(body);
      setNotice(null);
      initialLoad.current = true;
    } catch (error) {
      setNotice({ ok: false, text: error.message || t(COPY.loadFailed) });
    } finally {
      requestInFlight.current = false;
      if (!quiet) setLoading(false);
    }
  }, [days, gmailConfigured, t]);

  useEffect(() => {
    loadInbox();
  }, [loadInbox]);

  useEffect(() => {
    if (!live || !gmailConfigured) return undefined;
    const timer = setInterval(() => loadInbox({ quiet: true }), 30_000);
    return () => clearInterval(timer);
  }, [gmailConfigured, live, loadInbox]);

  const messages = useMemo(() => data?.messages || [], [data]);
  const selected = messages.find((message) => message.gmailMessageId === selectedId) || null;
  const visibleMessages = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return messages.filter((message) => {
      if (!messageMatchesFilter(message, filter)) return false;
      if (!needle) return true;
      return [
        message.customerName,
        message.customerMessage,
        message.subject,
        message.fromAddress,
        diagnosisCopy(message.diagnosis, lang).label,
      ].some((value) => String(value || "").toLowerCase().includes(needle));
    });
  }, [filter, lang, messages, query]);

  function selectMessage(message) {
    setSelectedId(message.gmailMessageId);
    setReplyText(message.storedLead?.status === "failed" ? message.storedLead.aiReply || "" : "");
    setNotice(null);
  }

  async function generateDraft() {
    if (!selected) return;
    setDrafting(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/yelp-debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "draft", gmailMessageId: selected.gmailMessageId }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "AI draft failed.");
      setReplyText(body.draft || "");
    } catch (error) {
      setNotice({ ok: false, text: error.message || "AI draft failed." });
    } finally {
      setDrafting(false);
    }
  }

  async function sendReply() {
    if (!selected || !replyText.trim()) return;
    const confirmed = window.confirm(
      lang === "es"
        ? `¿Enviar esta respuesta a ${selected.customerName || "este cliente"} por el relay de Yelp? Esta acción no se puede deshacer.`
        : `Send this reply to ${selected.customerName || "this customer"} through Yelp's relay? This cannot be undone.`,
    );
    if (!confirmed) return;
    setSending(true);
    setNotice(null);
    try {
      const response = await fetch("/api/admin/yelp-debug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "send",
          gmailMessageId: selected.gmailMessageId,
          replyText,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Manual reply failed.");
      const warning = body.warnings?.length ? ` ${body.warnings.join(" ")}` : "";
      setNotice({ ok: true, text: `${t(COPY.sendSuccess)}${warning}` });
      setReplyText("");
      await loadInbox({ quiet: true });
    } catch (error) {
      setNotice({ ok: false, text: error.message || "Manual reply failed." });
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="yelp-debug" aria-label={t(COPY.title)}>
      <div className="yelp-debug__header">
        <div>
          <span className="yelp-debug__eyebrow">Gmail + Yelp</span>
          <h2>{t(COPY.title)}</h2>
          <p>{t(COPY.subtitle)}</p>
        </div>
        <div className="yelp-debug__header-actions">
          <label className="yelp-debug__live">
            <input type="checkbox" checked={live} onChange={(event) => setLive(event.target.checked)} />
            <i />
            <span>{t(COPY.live)} · 30s</span>
          </label>
          <button type="button" className="btn btn--primary btn--small" onClick={() => loadInbox()} disabled={loading || !gmailConfigured}>
            {loading ? t(COPY.refreshing) : t(COPY.refresh)}
          </button>
        </div>
      </div>

      {notice && <div className={`yelp-debug__notice ${notice.ok ? "is-ok" : "is-error"}`}>{notice.text}</div>}

      <div className="yelp-debug__summary">
        {[
          [COPY.all, data?.summary?.total || 0],
          [COPY.attention, data?.summary?.needsAttention || 0],
          [COPY.ready, data?.summary?.readyToReply || 0],
          [COPY.replied, data?.summary?.alreadyReplied || 0],
          [COPY.blocked, data?.summary?.blocked || 0],
          [COPY.unread, data?.summary?.unread || 0],
        ].map(([label, value]) => (
          <div key={label.en}><span>{t(label)}</span><strong>{value}</strong></div>
        ))}
      </div>

      <div className="yelp-debug__commandbar">
        <label className="yelp-debug__search">
          <span>{t(COPY.search)}</span>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t(COPY.search)} />
        </label>
        <label>
          <span>{lang === "es" ? "Período" : "Period"}</span>
          <select value={days} onChange={(event) => setDays(Number(event.target.value))}>
            {[1, 3, 7, 14, 30].map((value) => <option key={value} value={value}>{value} {lang === "es" ? "días" : "days"}</option>)}
          </select>
        </label>
        <div className="yelp-debug__filters">
          {FILTERS.map(([value, label]) => (
            <button type="button" key={value} className={filter === value ? "is-active" : ""} onClick={() => setFilter(value)}>
              {t(label)}
            </button>
          ))}
        </div>
        <div className="yelp-debug__timestamps">
          <span>{t(COPY.checked)}: <strong>{formatDate(data?.checkedAt, lang)}</strong></span>
          <span>{t(COPY.checkpoint)}: <strong>{formatDate(data?.watermarkAt, lang)}</strong></span>
        </div>
      </div>

      <div className="yelp-debug__workspace">
        <div className="yelp-debug__messages">
          {loading && !initialLoad.current ? (
            <div className="yelp-debug__empty">{t(COPY.refreshing)}</div>
          ) : visibleMessages.length ? (
            visibleMessages.map((message) => (
              <button
                type="button"
                key={message.gmailMessageId}
                className={`yelp-debug__message ${selectedId === message.gmailMessageId ? "is-active" : ""}`}
                onClick={() => selectMessage(message)}
              >
                <div>
                  <strong>{message.customerName || "Yelp customer"}</strong>
                  <time>{formatDate(message.receivedAt, lang)}</time>
                </div>
                <span className={`yelp-debug__status is-${message.diagnosis?.code || "unknown"}`}>{diagnosisCopy(message.diagnosis, lang).label}</span>
                <b>{message.subject}</b>
                <p>{message.customerMessage || (lang === "es" ? "Sin texto de mensaje." : "No message text.")}</p>
                <small>{message.unread ? t(COPY.unread) : (lang === "es" ? "Leído" : "Read")} · {message.fromAddress}</small>
              </button>
            ))
          ) : (
            <div className="yelp-debug__empty">{t(COPY.noMessages)}</div>
          )}
        </div>

        <div className="yelp-debug__detail">
          {selected ? (
            <>
              <div className="yelp-debug__detail-head">
                <div><span>Yelp lead</span><h3>{selected.customerName || "Yelp customer"}</h3><p>{selected.subject}</p></div>
                <span className={`yelp-debug__status is-${selected.diagnosis?.code || "unknown"}`}>{diagnosisCopy(selected.diagnosis, lang).label}</span>
              </div>

              <div className="yelp-debug__links">
                <a href={`https://mail.google.com/mail/u/0/#all/${selected.gmailMessageId}`} target="_blank" rel="noreferrer">{t(COPY.openGmail)}</a>
                <a href="https://biz.yelp.com/" target="_blank" rel="noreferrer">{t(COPY.openYelp)}</a>
              </div>

              <div className="yelp-debug__explanation">
                <strong>{t(COPY.whatHappened)}</strong>
                <p>{diagnosisCopy(selected.diagnosis, lang).detail}</p>
              </div>

              <div className="yelp-debug__customer-message">
                <span>{t(COPY.customerMessage)}</span>
                <p>{selected.customerMessage || "—"}</p>
              </div>

              <details className="yelp-debug__diagnostics">
                <summary>{t(COPY.advanced)}</summary>
                {[
                  [COPY.safeSender, selected.trustedSender],
                  [COPY.safeRelay, selected.replyableAddress],
                  [COPY.subjectMatch, selected.matchesAutomationQuery],
                  [COPY.gmailUnread, selected.unread],
                  [COPY.afterCheckpoint, selected.afterWatermark],
                  [COPY.threadClear, !selected.thread?.hasSentReply],
                ].map(([label, value]) => (
                  <div className={diagnosticClass(value)} key={label.en}><i>{value ? "✓" : "!"}</i><span>{t(label)}</span><strong>{value ? "Yes" : "No"}</strong></div>
                ))}
                <div><i>DB</i><span>{t(COPY.database)}</span><strong>{selected.storedLead?.status || t(COPY.notRecorded)}</strong></div>
                <div><i>LB</i><span>Gmail label</span><strong>{selected.manualLabel ? "Manual-Replied" : selected.processedLabel ? "AI-Replied" : "None"}</strong></div>
                <div><i>ID</i><span>Gmail message ID</span><strong>{selected.gmailMessageId}</strong></div>
                <div><i>TH</i><span>Gmail thread</span><strong>{selected.thread?.messageCount ?? "?"} messages / {selected.thread?.sentReplyCount ?? "?"} sent</strong></div>
              </details>

              <div className="yelp-debug__composer">
                <div><span>{t(COPY.replyEditor)}</span><small>{replyText.length.toLocaleString()} / 5,000 {t(COPY.chars)}</small></div>
                <textarea
                  value={replyText}
                  onChange={(event) => setReplyText(event.target.value.slice(0, 5000))}
                  disabled={!selected.canSend || sending}
                  placeholder={selected.canSend ? (lang === "es" ? "Escribe una respuesta o genera un borrador..." : "Write a reply or generate an AI draft...") : diagnosisCopy(selected.diagnosis, lang).label}
                  rows={8}
                />
                <div className="yelp-debug__composer-actions">
                  <button type="button" className="btn btn--ghost btn--small" onClick={generateDraft} disabled={!selected.canDraft || drafting || sending}>
                    {drafting ? t(COPY.drafting) : t(COPY.draftAi)}
                  </button>
                  <button type="button" className="btn btn--ghost btn--small" onClick={() => setReplyText("")} disabled={!replyText || sending}>{t(COPY.clear)}</button>
                  <button type="button" className="btn btn--primary btn--small" onClick={sendReply} disabled={!selected.canSend || !replyText.trim() || drafting || sending}>
                    {sending ? t(COPY.sending) : t(COPY.send)}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="yelp-debug__empty">{t(COPY.select)}</div>
          )}
        </div>
      </div>
    </section>
  );
}
