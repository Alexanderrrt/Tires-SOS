"use client";
import { useEffect, useMemo, useRef, useState } from "react";

function initials(name) { return String(name || "WA").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function messageTime(value) { return new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }

export default function WhatsAppInbox({ initialConversations = [], configured }) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState(initialConversations[0]?.id || "");
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef(null);
  const messageList = useRef(null);
  const selected = conversations.find((c) => c.id === selectedId);
  const filtered = useMemo(() => conversations.filter((c) => `${c.customerName || ""} ${c.waId}`.toLowerCase().includes(query.toLowerCase())), [conversations, query]);
  useEffect(() => {
    const list = messageList.current;
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [selectedId, selected?.messages.length]);

  async function refresh() { const res = await fetch("/api/admin/whatsapp", { cache: "no-store" }); const data = await res.json(); if (res.ok) setConversations(data.conversations || []); }
  async function send() {
    if (!selected || !draft.trim()) return; setBusy(true);
    const res = await fetch("/api/admin/whatsapp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: selected.id, body: draft }) });
    if (res.ok) { setDraft(""); await refresh(); } else alert((await res.json()).error || "Send failed."); setBusy(false);
  }
  async function toggleBot() {
    if (!selected) return; setBusy(true);
    const res = await fetch("/api/admin/whatsapp", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: selected.id, botEnabled: !selected.botEnabled }) });
    if (res.ok) await refresh(); else alert((await res.json()).error || "Bot update failed."); setBusy(false);
  }
  async function toggleContext() {
    if (!selected) return; setBusy(true);
    const res = await fetch("/api/admin/whatsapp", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "context", conversationId: selected.id, contextEnabled: !selected.contextEnabled }) });
    if (res.ok) await refresh(); else alert((await res.json()).error || "Memory update failed."); setBusy(false);
  }
  async function sendAttachment() {
    if (!selected || !attachment) return; setBusy(true);
    const form = new FormData(); form.set("conversationId", selected.id); form.set("file", attachment); form.set("caption", draft.trim());
    const res = await fetch("/api/admin/whatsapp", { method: "POST", body: form });
    if (res.ok) { setDraft(""); setAttachment(null); if (fileInput.current) fileInput.current.value = ""; await refresh(); } else alert((await res.json()).error || "File send failed."); setBusy(false);
  }
  async function resetCustomer() {
    if (!selected || !window.confirm("Permanently delete this WhatsApp history, lead, and related appointment? The next message will be treated as a new customer.")) return;
    setBusy(true); const res = await fetch("/api/admin/whatsapp", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: selected.id }) });
    if (res.ok) { setSelectedId(""); await refresh(); } else alert((await res.json()).error || "Reset failed."); setBusy(false);
  }
  if (!configured) return <p className="editor__warn">WhatsApp environment variables are not configured.</p>;

  return <section className="whatsapp-inbox">
    <aside className="whatsapp-inbox__sidebar">
      <div className="whatsapp-inbox__sidebar-head"><div><span className="whatsapp-inbox__eyebrow">Customer conversations</span><strong>Inbox</strong></div><button className="whatsapp-icon-btn" onClick={refresh} aria-label="Refresh conversations">↻</button></div>
      <label className="whatsapp-search"><span>⌕</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or number" /></label>
      <div className="whatsapp-inbox__contacts">
        {filtered.map((c) => { const last = c.messages.at(-1); return <button key={c.id} className={`whatsapp-inbox__contact ${c.id === selectedId ? "is-active" : ""}`} onClick={() => setSelectedId(c.id)}>
          <span className="whatsapp-avatar">{initials(c.customerName)}</span><span className="whatsapp-contact__copy"><span className="whatsapp-contact__top"><strong>{c.customerName || c.waId}</strong><time>{last ? messageTime(last.createdAt) : ""}</time></span><span className="whatsapp-contact__preview">{last?.direction === "outbound" ? "✓ " : ""}{last?.body || "No messages"}</span></span>{c.botEnabled && <i className="whatsapp-bot-dot" title="Bot enabled" />}
        </button>; })}
        {!filtered.length && <div className="whatsapp-empty whatsapp-empty--small"><span>💬</span><strong>No conversations</strong><p>{query ? "Try another search." : "New WhatsApp messages will appear here."}</p></div>}
      </div>
    </aside>
    <div className="whatsapp-inbox__thread">
      {selected ? <><header className="whatsapp-thread__head"><div className="whatsapp-thread__identity"><span className="whatsapp-avatar whatsapp-avatar--large">{initials(selected.customerName)}</span><div><strong>{selected.customerName || "WhatsApp customer"}</strong><small>+{selected.waId} · WhatsApp</small></div></div>
        <div className="whatsapp-thread__controls"><button className={`whatsapp-memory-toggle ${selected.contextEnabled ? "is-on" : ""}`} onClick={toggleContext} disabled={busy}>Memory: {selected.contextEnabled ? "Full chat" : "Latest message"}</button><button className="whatsapp-reset" onClick={resetCustomer} disabled={busy}>Reset customer</button><button className={`whatsapp-bot-toggle ${selected.botEnabled ? "is-on" : ""}`} onClick={toggleBot} disabled={busy}><span className="whatsapp-bot-toggle__dot"/><span><strong>AI Bot {selected.botEnabled ? "On" : "Off"}</strong><small>{selected.botEnabled ? "Auto-replying" : "Manual replies"}</small></span></button></div></header>
        <div ref={messageList} className="whatsapp-inbox__messages"><div className="whatsapp-day-pill">Conversation history</div>{selected.messages.map((m) => <div key={m.id} className={`whatsapp-message whatsapp-message--${m.direction}`}><p>{m.body}</p><span>{messageTime(m.createdAt)} {m.direction === "outbound" && "✓✓"}</span></div>)}</div>
        <div className="whatsapp-inbox__composer">{attachment && <div className="whatsapp-attachment-chip"><span>📎 {attachment.name}</span><button onClick={() => setAttachment(null)}>×</button></div>}<input ref={fileInput} className="whatsapp-file-input" type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.txt" onChange={(e) => setAttachment(e.target.files?.[0] || null)}/><button className="whatsapp-attach" onClick={() => fileInput.current?.click()} aria-label="Attach file">📎</button><textarea value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !attachment) { e.preventDefault(); send(); } }} placeholder={attachment ? "Add an optional caption…" : "Type a reply…"} rows={2}/><button className="whatsapp-send" onClick={attachment ? sendAttachment : send} disabled={busy || (!attachment && !draft.trim())}><span>{attachment ? "Send file" : "Send"}</span>➤</button><small>Files up to 16 MB · Enter to send text</small></div></> : <div className="whatsapp-empty"><span>💬</span><strong>Your WhatsApp inbox</strong><p>Select a conversation to view messages and control the AI bot.</p></div>}
    </div>
  </section>;
}
