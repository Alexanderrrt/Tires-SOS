"use client";

function dateValue(value) {
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) ? time : 0;
}

function formatActivityDate(value) {
  if (!value) return "No date";
  return new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function percent(value, total) {
  return total ? `${Math.round((value / total) * 100)}%` : "0%";
}

export default function AdminOverview({
  records,
  yelpLeads,
  whatsappConversations,
  integrations,
  onNavigate,
}) {
  const leads = records?.leads || [];
  const appointments = records?.appointments || [];
  const bookedLeads = leads.filter((lead) => ["booked", "done"].includes(lead.status)).length;
  const activeLeads = leads.filter((lead) => ["new", "contacted"].includes(lead.status)).length;
  const confirmedAppointments = appointments.filter((item) => ["confirmed", "booked"].includes(item.status)).length;
  const repliedYelp = yelpLeads.filter((lead) => lead.status === "replied").length;

  const sourceCounts = leads.reduce((counts, lead) => {
    const source = lead.source || "Unknown";
    counts[source] = (counts[source] || 0) + 1;
    return counts;
  }, {});

  const activity = [
    ...leads.map((lead) => ({ id: `lead-${lead.id}`, type: "Lead", title: lead.customerName || lead.phone || "New customer", detail: lead.source || "Lead capture", date: lead.updatedAt || lead.createdAt, tab: "leads" })),
    ...appointments.map((item) => ({ id: `appointment-${item.id}`, type: "Appointment", title: item.customerName || "Customer appointment", detail: item.scheduledDate && item.scheduledTime ? `${item.scheduledDate} at ${item.scheduledTime}` : "Scheduling required", date: item.updatedAt || item.createdAt, tab: "appointments" })),
    ...yelpLeads.map((lead) => ({ id: `yelp-${lead.id}`, type: "Yelp", title: lead.customerName || "Yelp inquiry", detail: lead.status === "replied" ? "Automatic response sent" : "Response pending", date: lead.repliedAt || lead.createdAt, tab: "yelp" })),
    ...whatsappConversations.map((item) => ({ id: `whatsapp-${item.id}`, type: "WhatsApp", title: item.customerName || item.waId || "WhatsApp customer", detail: `${item.messages?.length || 0} messages`, date: item.lastMessageAt, tab: "whatsapp" })),
  ].sort((a, b) => dateValue(b.date) - dateValue(a.date)).slice(0, 8);

  const health = [
    { label: "Business records", ok: integrations.records, detail: integrations.records ? "Connected" : "Session only" },
    { label: "Pricing storage", ok: integrations.pricing, detail: integrations.pricing ? "Connected" : "Session only" },
    { label: "Website chat", ok: integrations.chat, detail: integrations.chat ? "Connected" : "Session only" },
    { label: "WhatsApp Cloud API", ok: integrations.whatsapp, detail: integrations.whatsapp ? "Configured" : "Needs configuration" },
    { label: "Yelp responder", ok: integrations.yelp, detail: integrations.yelp ? "Configured" : "Needs configuration" },
  ];

  return (
    <div className="ops-overview">
      <section className="ops-metrics" aria-label="Business summary">
        <button type="button" className="ops-metric" onClick={() => onNavigate("leads")}>
          <span>Total leads</span><strong>{leads.length}</strong><small>{activeLeads} need attention</small>
        </button>
        <button type="button" className="ops-metric" onClick={() => onNavigate("appointments")}>
          <span>Appointments</span><strong>{appointments.length}</strong><small>{confirmedAppointments} confirmed</small>
        </button>
        <button type="button" className="ops-metric" onClick={() => onNavigate("whatsapp")}>
          <span>WhatsApp chats</span><strong>{whatsappConversations.length}</strong><small>Customer conversations</small>
        </button>
        <button type="button" className="ops-metric" onClick={() => onNavigate("yelp")}>
          <span>Yelp leads</span><strong>{yelpLeads.length}</strong><small>{repliedYelp} replied</small>
        </button>
        <div className="ops-metric">
          <span>Lead conversion</span><strong>{percent(bookedLeads, leads.length)}</strong><small>{bookedLeads} booked or completed</small>
        </div>
      </section>

      <div className="ops-overview__grid">
        <section className="ops-panel ops-panel--activity">
          <div className="ops-panel__head"><div><span>Operations</span><h2>Recent activity</h2></div><button type="button" onClick={() => onNavigate("leads")}>View leads</button></div>
          {activity.length ? <div className="ops-activity-list">{activity.map((item) => (
            <button key={item.id} type="button" className="ops-activity" onClick={() => onNavigate(item.tab)}>
              <span className="ops-activity__type">{item.type}</span><span><strong>{item.title}</strong><small>{item.detail}</small></span><time>{formatActivityDate(item.date)}</time>
            </button>
          ))}</div> : <div className="ops-panel__empty">Activity will appear as customers contact the business.</div>}
        </section>

        <section className="ops-panel">
          <div className="ops-panel__head"><div><span>Infrastructure</span><h2>System status</h2></div><button type="button" onClick={() => onNavigate("api")}>API details</button></div>
          <div className="ops-health-list">{health.map((item) => (
            <div className="ops-health" key={item.label}><i className={item.ok ? "is-ok" : "is-warn"} /><span><strong>{item.label}</strong><small>{item.detail}</small></span></div>
          ))}</div>
        </section>

        <section className="ops-panel">
          <div className="ops-panel__head"><div><span>Shortcuts</span><h2>Quick actions</h2></div></div>
          <div className="ops-quick-actions">
            <button type="button" onClick={() => onNavigate("appointments")}><strong>Manage calendar</strong><small>Schedule, block, or update appointments</small></button>
            <button type="button" onClick={() => onNavigate("whatsapp")}><strong>Open WhatsApp inbox</strong><small>Reply and control automation</small></button>
            <button type="button" onClick={() => onNavigate("pricing")}><strong>Update pricing</strong><small>Services, labor, brands, and estimates</small></button>
            <button type="button" onClick={() => onNavigate("chat")}><strong>Configure website chat</strong><small>Prompts, behavior, and public text</small></button>
          </div>
        </section>

        <section className="ops-panel">
          <div className="ops-panel__head"><div><span>Acquisition</span><h2>Lead sources</h2></div></div>
          {Object.keys(sourceCounts).length ? <div className="ops-source-list">{Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).map(([source, count]) => (
            <div key={source}><span>{source}</span><strong>{count}</strong><i style={{ width: `${Math.max(8, (count / leads.length) * 100)}%` }} /></div>
          ))}</div> : <div className="ops-panel__empty">Lead-source reporting will populate automatically.</div>}
        </section>
      </div>
    </div>
  );
}
