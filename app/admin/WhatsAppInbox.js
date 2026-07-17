"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const COPY = {
  syncFailed: { en: "Live synchronization failed.", es: "Falló la sincronización en vivo." },
  sendFailed: { en: "The message could not be sent.", es: "No se pudo enviar el mensaje." },
  botFailed: { en: "The bot setting could not be updated.", es: "No se pudo actualizar la configuración del bot." },
  globalBotFailed: { en: "The master bot setting could not be updated.", es: "No se pudo actualizar la configuración general del bot." },
  memoryFailed: { en: "The memory setting could not be updated.", es: "No se pudo actualizar la configuración de memoria." },
  fileFailed: { en: "The file could not be sent.", es: "No se pudo enviar el archivo." },
  resetFailed: { en: "The customer could not be reset.", es: "No se pudo reiniciar el cliente." },
  resetConfirm: { en: "Permanently delete this WhatsApp history, lead, and related appointment? The next message will be treated as a new customer.", es: "¿Eliminar permanentemente este historial de WhatsApp, el cliente y la cita relacionada? El próximo mensaje se tratará como un cliente nuevo." },
  notConfigured: { en: "WhatsApp environment variables are not configured.", es: "Las variables de entorno de WhatsApp no están configuradas." },
  customerConversations: { en: "Customer conversations", es: "Conversaciones con clientes" },
  inbox: { en: "Inbox", es: "Bandeja" },
  live: { en: "Live", es: "En vivo" },
  reconnecting: { en: "Reconnecting", es: "Reconectando" },
  connecting: { en: "Connecting", es: "Conectando" },
  refresh: { en: "Refresh conversations", es: "Actualizar conversaciones" },
  automaticReplies: { en: "Automatic replies", es: "Respuestas automáticas" },
  on: { en: "on", es: "activadas" },
  off: { en: "off", es: "desactivadas" },
  masterActive: { en: "Master bot is active", es: "El bot general está activo" },
  allPaused: { en: "All bot replies are paused", es: "Todas las respuestas del bot están pausadas" },
  search: { en: "Search name or number", es: "Buscar nombre o número" },
  noMessages: { en: "No messages", es: "Sin mensajes" },
  botEnabled: { en: "Bot enabled", es: "Bot activado" },
  noConversations: { en: "No conversations", es: "Sin conversaciones" },
  trySearch: { en: "Try another search.", es: "Prueba otra búsqueda." },
  newMessages: { en: "New WhatsApp messages will appear here.", es: "Los nuevos mensajes de WhatsApp aparecerán aquí." },
  whatsappCustomer: { en: "WhatsApp customer", es: "Cliente de WhatsApp" },
  memory: { en: "Memory", es: "Memoria" },
  fullChat: { en: "Full chat", es: "Chat completo" },
  latestMessage: { en: "Latest message", es: "Último mensaje" },
  resetCustomer: { en: "Reset customer", es: "Reiniciar cliente" },
  chatBot: { en: "Chat bot", es: "Bot del chat" },
  onTitle: { en: "On", es: "Activado" },
  offTitle: { en: "Off", es: "Desactivado" },
  pausedByMaster: { en: "Paused by master", es: "Pausado por control general" },
  autoReplying: { en: "Auto-replying", es: "Respondiendo automáticamente" },
  manualReplies: { en: "Manual replies", es: "Respuestas manuales" },
  history: { en: "Conversation history", es: "Historial de conversación" },
  attach: { en: "Attach file", es: "Adjuntar archivo" },
  caption: { en: "Add an optional caption…", es: "Agrega un texto opcional…" },
  reply: { en: "Type a reply…", es: "Escribe una respuesta…" },
  sendFile: { en: "Send file", es: "Enviar archivo" },
  send: { en: "Send", es: "Enviar" },
  fileHint: { en: "Files up to 16 MB · Enter to send text", es: "Archivos de hasta 16 MB · Enter para enviar texto" },
  yourInbox: { en: "Your WhatsApp inbox", es: "Tu bandeja de WhatsApp" },
  selectConversation: { en: "Select a conversation to view messages and control the AI bot.", es: "Selecciona una conversación para ver mensajes y controlar el bot de IA." },
};

function initials(name) { return String(name || "WA").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function messageTime(value, lang) { return new Date(value).toLocaleString(lang === "es" ? "es-US" : "en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }

export default function WhatsAppInbox({ initialConversations = [], initialGlobalBotEnabled = false, configured, t, lang }) {
  const [conversations, setConversations] = useState(initialConversations);
  const [globalBotEnabled, setGlobalBotEnabled] = useState(initialGlobalBotEnabled);
  const [selectedId, setSelectedId] = useState(initialConversations[0]?.id || "");
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [busy, setBusy] = useState(false);
  const [liveState, setLiveState] = useState("connecting");
  const fileInput = useRef(null);
  const messageList = useRef(null);
  const refreshInFlight = useRef(false);
  const mounted = useRef(true);
  const selected = conversations.find((conversation) => conversation.id === selectedId);
  const filtered = useMemo(() => conversations.filter((conversation) => `${conversation.customerName || ""} ${conversation.waId}`.toLowerCase().includes(query.toLowerCase())), [conversations, query]);
  const liveLabel = liveState === "live" ? COPY.live : liveState === "reconnecting" ? COPY.reconnecting : COPY.connecting;

  useEffect(() => {
    const requestedConversation = new URLSearchParams(window.location.search).get("conversation");
    if (requestedConversation && initialConversations.some((conversation) => conversation.id === requestedConversation)) setSelectedId(requestedConversation);
  }, [initialConversations]);
  useEffect(() => { const list = messageList.current; if (list) list.scrollTo({ top: list.scrollHeight, behavior: "smooth" }); }, [selectedId, selected?.messages.length]);

  const refresh = useCallback(async () => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    try {
      const res = await fetch("/api/admin/whatsapp", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error("sync_failed");
      if (!mounted.current) return;
      const nextConversations = data.conversations || [];
      setConversations(nextConversations);
      setGlobalBotEnabled(Boolean(data.globalBotEnabled));
      setSelectedId((current) => current && nextConversations.some((conversation) => conversation.id === current) ? current : nextConversations[0]?.id || "");
      setLiveState("live");
    } catch {
      if (mounted.current) setLiveState("reconnecting");
    } finally { refreshInFlight.current = false; }
  }, []);

  useEffect(() => {
    mounted.current = true;
    if (!configured) return () => { mounted.current = false; };
    const sync = () => { if (!document.hidden) void refresh(); };
    void refresh();
    const interval = window.setInterval(sync, 1000);
    const resume = () => { if (!document.hidden) void refresh(); };
    window.addEventListener("focus", resume);
    document.addEventListener("visibilitychange", resume);
    return () => { mounted.current = false; window.clearInterval(interval); window.removeEventListener("focus", resume); document.removeEventListener("visibilitychange", resume); };
  }, [configured, refresh]);

  async function send() { if (!selected || !draft.trim()) return; setBusy(true); const res = await fetch("/api/admin/whatsapp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: selected.id, body: draft }) }); if (res.ok) { setDraft(""); await refresh(); } else alert(t(COPY.sendFailed)); setBusy(false); }
  async function toggleBot() { if (!selected) return; setBusy(true); const res = await fetch("/api/admin/whatsapp", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: selected.id, botEnabled: !selected.botEnabled }) }); if (res.ok) await refresh(); else alert(t(COPY.botFailed)); setBusy(false); }
  async function toggleGlobalBot() { setBusy(true); const res = await fetch("/api/admin/whatsapp", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "global-bot", botEnabled: !globalBotEnabled }) }); const data = await res.json(); if (res.ok) setGlobalBotEnabled(Boolean(data.globalBotEnabled)); else alert(t(COPY.globalBotFailed)); setBusy(false); }
  async function toggleContext() { if (!selected) return; setBusy(true); const res = await fetch("/api/admin/whatsapp", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "context", conversationId: selected.id, contextEnabled: !selected.contextEnabled }) }); if (res.ok) await refresh(); else alert(t(COPY.memoryFailed)); setBusy(false); }
  async function sendAttachment() { if (!selected || !attachment) return; setBusy(true); const form = new FormData(); form.set("conversationId", selected.id); form.set("file", attachment); form.set("caption", draft.trim()); const res = await fetch("/api/admin/whatsapp", { method: "POST", body: form }); if (res.ok) { setDraft(""); setAttachment(null); if (fileInput.current) fileInput.current.value = ""; await refresh(); } else alert(t(COPY.fileFailed)); setBusy(false); }
  async function resetCustomer() { if (!selected || !window.confirm(t(COPY.resetConfirm))) return; setBusy(true); const res = await fetch("/api/admin/whatsapp", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: selected.id }) }); if (res.ok) { setSelectedId(""); await refresh(); } else alert(t(COPY.resetFailed)); setBusy(false); }

  if (!configured) return <p className="editor__warn">{t(COPY.notConfigured)}</p>;
  return <section className="whatsapp-inbox">
    <aside className="whatsapp-inbox__sidebar">
      <div className="whatsapp-inbox__sidebar-head"><div><span className="whatsapp-inbox__eyebrow">{t(COPY.customerConversations)}</span><strong>{t(COPY.inbox)}</strong></div><span className={`whatsapp-live-status whatsapp-live-status--${liveState}`} role="status"><i />{t(liveLabel)}</span><button className="whatsapp-icon-btn" onClick={refresh} aria-label={t(COPY.refresh)}>↻</button></div>
      <button type="button" className={`whatsapp-global-bot ${globalBotEnabled ? "is-on" : ""}`} onClick={toggleGlobalBot} disabled={busy} aria-pressed={globalBotEnabled}><span className="whatsapp-global-bot__icon">AI</span><span><strong>{t(COPY.automaticReplies)} {t(globalBotEnabled ? COPY.on : COPY.off)}</strong><small>{t(globalBotEnabled ? COPY.masterActive : COPY.allPaused)}</small></span><i /></button>
      <label className="whatsapp-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t(COPY.search)} /></label>
      <div className="whatsapp-inbox__contacts">{filtered.map((conversation) => { const last = conversation.messages.at(-1); return <button key={conversation.id} className={`whatsapp-inbox__contact ${conversation.id === selectedId ? "is-active" : ""}`} onClick={() => setSelectedId(conversation.id)}><span className="whatsapp-avatar">{initials(conversation.customerName)}</span><span className="whatsapp-contact__copy"><span className="whatsapp-contact__top"><strong>{conversation.customerName || conversation.waId}</strong><time>{last ? messageTime(last.createdAt, lang) : ""}</time></span><span className="whatsapp-contact__preview">{last?.direction === "outbound" ? "✓ " : ""}{last?.body || t(COPY.noMessages)}</span></span>{conversation.botEnabled && <i className="whatsapp-bot-dot" title={t(COPY.botEnabled)} />}</button>; })}{!filtered.length && <div className="whatsapp-empty whatsapp-empty--small"><span>💬</span><strong>{t(COPY.noConversations)}</strong><p>{t(query ? COPY.trySearch : COPY.newMessages)}</p></div>}</div>
    </aside>
    <div className="whatsapp-inbox__thread">{selected ? <><header className="whatsapp-thread__head"><div className="whatsapp-thread__identity"><span className="whatsapp-avatar whatsapp-avatar--large">{initials(selected.customerName)}</span><div><strong>{selected.customerName || t(COPY.whatsappCustomer)}</strong><small>+{selected.waId} · WhatsApp</small></div></div><div className="whatsapp-thread__controls"><button className={`whatsapp-memory-toggle ${selected.contextEnabled ? "is-on" : ""}`} onClick={toggleContext} disabled={busy}>{t(COPY.memory)}: {t(selected.contextEnabled ? COPY.fullChat : COPY.latestMessage)}</button><button className="whatsapp-reset" onClick={resetCustomer} disabled={busy}>{t(COPY.resetCustomer)}</button><button className={`whatsapp-bot-toggle ${selected.botEnabled ? "is-on" : ""} ${!globalBotEnabled ? "is-paused" : ""}`} onClick={toggleBot} disabled={busy}><span className="whatsapp-bot-toggle__dot"/><span><strong>{t(COPY.chatBot)} {t(selected.botEnabled ? COPY.onTitle : COPY.offTitle)}</strong><small>{t(!globalBotEnabled && selected.botEnabled ? COPY.pausedByMaster : selected.botEnabled ? COPY.autoReplying : COPY.manualReplies)}</small></span></button></div></header><div ref={messageList} className="whatsapp-inbox__messages"><div className="whatsapp-day-pill">{t(COPY.history)}</div>{selected.messages.map((message) => <div key={message.id} className={`whatsapp-message whatsapp-message--${message.direction}`}><p>{message.body}</p><span>{messageTime(message.createdAt, lang)} {message.direction === "outbound" && "✓✓"}</span></div>)}</div><div className="whatsapp-inbox__composer">{attachment && <div className="whatsapp-attachment-chip"><span>📎 {attachment.name}</span><button onClick={() => setAttachment(null)}>×</button></div>}<input ref={fileInput} className="whatsapp-file-input" type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={(event) => setAttachment(event.target.files?.[0] || null)}/><button className="whatsapp-attach" onClick={() => fileInput.current?.click()} aria-label={t(COPY.attach)}>📎</button><textarea value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey && !attachment) { event.preventDefault(); send(); } }} placeholder={t(attachment ? COPY.caption : COPY.reply)} rows={2}/><button className="whatsapp-send" onClick={attachment ? sendAttachment : send} disabled={busy || (!attachment && !draft.trim())}><span>{t(attachment ? COPY.sendFile : COPY.send)}</span>➤</button><small>{t(COPY.fileHint)}</small></div></> : <div className="whatsapp-empty"><span>💬</span><strong>{t(COPY.yourInbox)}</strong><p>{t(COPY.selectConversation)}</p></div>}</div>
  </section>;
}
