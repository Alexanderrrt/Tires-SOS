"use client";
import { useState } from "react";

export default function WhatsAppInbox({ initialConversations = [], configured }) {
  const [conversations, setConversations] = useState(initialConversations);
  const [selectedId, setSelectedId] = useState(initialConversations[0]?.id || "");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const selected = conversations.find((c) => c.id === selectedId);

  async function refresh() {
    const res = await fetch("/api/admin/whatsapp", { cache: "no-store" });
    const data = await res.json();
    if (res.ok) setConversations(data.conversations || []);
  }
  async function send() {
    if (!selected || !draft.trim()) return;
    setBusy(true);
    const res = await fetch("/api/admin/whatsapp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: selected.id, body: draft }) });
    if (res.ok) { setDraft(""); await refresh(); } else alert((await res.json()).error || "Send failed.");
    setBusy(false);
  }
  async function toggleBot() {
    if (!selected) return;
    setBusy(true);
    await fetch("/api/admin/whatsapp", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ conversationId: selected.id, botEnabled: !selected.botEnabled }) });
    await refresh(); setBusy(false);
  }

  if (!configured) return <p className="editor__warn">WhatsApp environment variables are not configured.</p>;
  return <section className="whatsapp-inbox">
    <aside className="whatsapp-inbox__list">
      <button className="btn btn--ghost btn--small" onClick={refresh}>Refresh</button>
      {conversations.map((c) => <button key={c.id} className={`whatsapp-inbox__contact ${c.id === selectedId ? "is-active" : ""}`} onClick={() => setSelectedId(c.id)}>
        <strong>{c.customerName || c.waId}</strong><span>{c.messages.at(-1)?.body || ""}</span>
      </button>)}
      {!conversations.length && <p className="editor__hint">No WhatsApp messages yet.</p>}
    </aside>
    <div className="whatsapp-inbox__thread">
      {selected ? <><header><div><strong>{selected.customerName || "WhatsApp customer"}</strong><small>{selected.waId}</small></div>
        <button className="btn btn--ghost btn--small" onClick={toggleBot} disabled={busy}>Bot: {selected.botEnabled ? "ON" : "OFF"}</button></header>
        <div className="whatsapp-inbox__messages">{selected.messages.map((m) => <p key={m.id} className={`whatsapp-message whatsapp-message--${m.direction}`}>{m.body}<small>{new Date(m.createdAt).toLocaleString()}</small></p>)}</div>
        <div className="whatsapp-inbox__composer"><textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Reply to customer" rows={3}/><button className="btn btn--primary" onClick={send} disabled={busy || !draft.trim()}>Send</button></div></> : <p className="editor__hint">Select a conversation.</p>}
    </div>
  </section>;
}
