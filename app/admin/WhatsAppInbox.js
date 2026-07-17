"use client";
import { useMemo, useState } from "react";

function initials(name) { return String(name || "WA").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function messageTime(value) { return new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }); }

export default function WhatsAppInbox({ initialConversations = [], configured }) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState(initialConversations[0]?.id || "");
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const selected = conversations.find((c) => c.id === selectedId);
  const filtered = useMemo(() => conversations.filter((c) => `${c.customerName || ""} ${c.waId}`.toLowerCase().includes(query.toLowerCase())), [conversations, query]);

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
        <button className={`whatsapp-bot-toggle ${selected.botEnabled ? "is-on" : ""}`} onClick={toggleBot} disabled={busy}><span className="whatsapp-bot-toggle__dot"/><span><strong>AI Bot {selected.botEnabled ? "On" : "Off"}</strong><small>{selected.botEnabled ? "Auto-replying" : "Manual replies"}</small></span></button></header>
        <div className="whatsapp-inbox__messages"><div className="whatsapp-day-pill">Conversation history</div>{selected.messages.map((m) => <div key={m.id} className={`whatsapp-message whatsapp-message--${m.direction}`}><p>{m.body}</p><span>{messageTime(m.createdAt)} {m.direction === "outbound" && "✓✓"}</span></div>)}</div>
        <div className="whatsapp-inbox__composer"><textarea value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="Type a reply…" rows={2}/><button className="whatsapp-send" onClick={send} disabled={busy || !draft.trim()}><span>Send</span>➤</button><small>Enter to send · Shift+Enter for a new line</small></div></> : <div className="whatsapp-empty"><span>💬</span><strong>Your WhatsApp inbox</strong><p>Select a conversation to view messages and control the AI bot.</p></div>}
    </div>
  </section>;
}
