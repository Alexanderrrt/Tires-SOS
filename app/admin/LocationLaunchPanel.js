"use client";

import { useState } from "react";

export default function LocationLaunchPanel({ initialRevealed, persistent }) {
  const [revealed, setRevealed] = useState(initialRevealed);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function toggle() {
    setSaving(true); setMessage("");
    try {
      const response = await fetch("/api/admin/location-launch", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ revealed: !revealed }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Save failed.");
      setRevealed(data.revealed); setMessage(data.persisted ? "Saved." : "Saved for this session only.");
    } catch (error) { setMessage(error.message); }
    finally { setSaving(false); }
  }

  return <section className="ops-panel" style={{ marginBottom: 18 }}><div className="ops-panel__head"><div><span>Launch controls</span><h2>Hayward store</h2></div><span>{revealed ? "REVEALED" : "MYSTERY"}</span></div><p>{revealed ? "The Hayward address and directions are public." : "Only Hayward, CA and teaser copy are public."}</p><button type="button" className="btn btn--primary btn--small" onClick={toggle} disabled={saving}>{saving ? "Saving…" : revealed ? "Hide location" : "Reveal location"}</button>{message && <small style={{ display: "block", marginTop: 8 }}>{message}</small>}{!persistent && <small style={{ display: "block", marginTop: 8 }}>Supabase is not connected; changes last for this server session.</small>}</section>;
}
