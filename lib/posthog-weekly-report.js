const EXPECTED_EVENTS = [
  "$pageview",
  "contact_click",
  "chat_opened",
  "chat_message_sent",
  "quote_sent_whatsapp",
  "appointment_requested",
];

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function isValidDateString(value) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime());
}

function reportWindow({ periodStart, periodEnd } = {}) {
  if (isValidDateString(periodStart) && isValidDateString(periodEnd)) {
    const start = new Date(`${periodStart}T00:00:00Z`);
    const endInclusive = new Date(`${periodEnd}T00:00:00Z`);
    if (endInclusive.getTime() < start.getTime()) throw new Error("periodEnd must be on or after periodStart.");
    const endExclusive = new Date(endInclusive.getTime() + 86400000);
    const lengthMs = endExclusive.getTime() - start.getTime();
    const priorStart = new Date(start.getTime() - lengthMs);
    return {
      priorStart: isoDate(priorStart),
      currentStart: isoDate(start),
      endExclusive: isoDate(endExclusive),
      periodStart: isoDate(start),
      periodEnd: isoDate(endInclusive),
      periodDays: Math.round(lengthMs / 86400000),
    };
  }

  const now = new Date();
  const endExclusive = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const currentStart = new Date(endExclusive.getTime() - 7 * 86400000);
  const priorStart = new Date(endExclusive.getTime() - 14 * 86400000);
  const defaultPeriodEnd = new Date(endExclusive.getTime() - 86400000);
  return {
    priorStart: isoDate(priorStart),
    currentStart: isoDate(currentStart),
    endExclusive: isoDate(endExclusive),
    periodStart: isoDate(currentStart),
    periodEnd: isoDate(defaultPeriodEnd),
    periodDays: 7,
  };
}

async function queryPostHog(query) {
  const key = process.env.POSTHOG_PERSONAL_API_KEY?.trim();
  const projectId = process.env.POSTHOG_PROJECT_ID?.trim() || "513826";
  const host = (process.env.POSTHOG_APP_HOST || "https://us.posthog.com").replace(/\/$/, "");
  if (!key) throw new Error("POSTHOG_PERSONAL_API_KEY is not configured.");

  const response = await fetch(`${host}/api/projects/${projectId}/query/`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
    cache: "no-store",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`PostHog query failed (${response.status}): ${data.detail || data.error || "unknown error"}`);
  return data;
}

function rowsFrom(result) {
  const columns = result.columns || [];
  return (result.results || []).map((values) => Object.fromEntries(columns.map((column, index) => [column, values[index]])));
}

function number(value) {
  return Number(value) || 0;
}

function percentChange(current, prior) {
  if (!prior) return current ? 100 : 0;
  return ((current - prior) / prior) * 100;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${value}T12:00:00Z`));
}

function comparison(current, prior) {
  const change = percentChange(current, prior);
  return `${change >= 0 ? "+" : ""}${change.toFixed(1)}% vs prior period`;
}

function barRows(rows, labelKey, valueKey = "current") {
  const max = Math.max(...rows.map((row) => number(row[valueKey])), 1);
  if (!rows.length) return '<p class="empty">No activity recorded for this period.</p>';
  return rows.map((row) => {
    const value = number(row[valueKey]);
    return `<div class="bar-row"><div class="bar-label"><span>${escapeHtml(row[labelKey] || "Unknown")}</span><strong>${value.toLocaleString()}</strong></div><div class="bar-track"><span style="width:${Math.max((value / max) * 100, value ? 3 : 0).toFixed(1)}%"></span></div><small>${comparison(value, number(row.prior))}</small></div>`;
  }).join("");
}

function buildHtml(data) {
  const { periodStart, periodEnd, periodDays, summary, prior, topPages, contactLocations, quoteClasses, appointments, funnel, highlights, observedEvents } = data;
  const cards = [
    ["Pageviews", summary.pageviews, prior.pageviews],
    ["Unique visitors", summary.uniqueVisitors, prior.uniqueVisitors],
    ["Contact clicks", summary.contactClicks, prior.contactClicks],
    ["Quotes sent", summary.quotesSent, prior.quotesSent],
    ["Appointments", summary.appointments, prior.appointments],
  ];
  const maxFunnel = Math.max(funnel.opened, 1);
  const funnelRows = [
    ["Chat opened", funnel.opened],
    ["Message sent", funnel.messaged],
    ["Quote or appointment", funnel.converted],
  ];
  const appointmentRows = [
    { label: "Persisted", current: appointments.persisted, prior: appointments.priorPersisted },
    { label: "Not persisted", current: appointments.notPersisted, prior: appointments.priorNotPersisted },
  ];

  return `<style>
    :root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#120f0c;color:#f7f2e9;font-family:Arial,sans-serif}.report{padding:28px;max-width:1180px;margin:auto}.hero{padding:28px;border:1px solid #3b3028;border-radius:18px;background:linear-gradient(135deg,#211a15,#16120f);position:relative;overflow:hidden}.hero:after{content:"";position:absolute;right:-60px;top:-80px;width:260px;height:260px;border-radius:50%;background:#f86000;filter:blur(90px);opacity:.18}.eyebrow{color:#ff7a24;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase}.hero h1{font-size:32px;margin:8px 0}.muted{color:#b8aa9b}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin:18px 0}.tile,.panel{background:#211a15;border:1px solid #3b3028;border-radius:14px}.tile{padding:18px}.tile span{display:block;color:#b8aa9b;font-size:12px;text-transform:uppercase}.tile strong{display:block;font-size:27px;margin:7px 0}.tile small,.bar-row small{color:#8f8174}.sections{display:grid;grid-template-columns:1fr 1fr;gap:16px}.panel{padding:20px;margin-bottom:16px}.panel h2{font-size:17px;margin:0 0 18px}.bar-row{margin:14px 0}.bar-label{display:flex;justify-content:space-between;gap:14px;font-size:13px}.bar-track{height:8px;background:#342a23;border-radius:10px;overflow:hidden;margin:6px 0}.bar-track span{display:block;height:100%;background:linear-gradient(90deg,#f86000,#ff9b57);border-radius:10px}.funnel-step{margin:12px 0}.funnel-step div{background:#f86000;color:white;padding:12px;border-radius:8px;min-width:150px}.funnel-step strong{float:right}.highlight{padding:12px 14px;border-left:3px solid #f86000;background:#2a211a;margin:9px 0;border-radius:0 8px 8px 0}.empty{color:#8f8174;font-style:italic}.schema{font-size:11px;color:#8f8174;margin-top:18px}.schema b{color:#b8aa9b}@media(max-width:850px){.grid{grid-template-columns:repeat(2,1fr)}.sections{grid-template-columns:1fr}}@media(max-width:520px){.report{padding:14px}.grid{grid-template-columns:1fr}.hero h1{font-size:25px}}
  </style><main class="report"><section class="hero"><div class="eyebrow">Tires SOS Rescue · Weekly analytics</div><h1>${escapeHtml(formatDate(periodStart))} – ${escapeHtml(formatDate(periodEnd))}</h1><p class="muted">PostHog project Tires SOS · Current ${periodDays} day${periodDays === 1 ? "" : "s"} compared with the previous ${periodDays} day${periodDays === 1 ? "" : "s"}.</p></section><section class="grid">${cards.map(([label, current, old]) => `<article class="tile"><span>${label}</span><strong>${number(current).toLocaleString()}</strong><small>${comparison(number(current), number(old))}</small></article>`).join("")}</section><div class="sections"><div><section class="panel"><h2>Top pages</h2>${barRows(topPages, "label")}</section><section class="panel"><h2>Contact clicks by location</h2>${barRows(contactLocations, "label")}</section><section class="panel"><h2>Quotes by vehicle class</h2>${barRows(quoteClasses, "label")}</section></div><div><section class="panel"><h2>Chat conversion funnel</h2>${funnelRows.map(([label, value]) => `<div class="funnel-step"><div style="width:${Math.max((value / maxFunnel) * 100, value ? 20 : 0).toFixed(1)}%"><span>${label}</span><strong>${number(value).toLocaleString()}</strong></div></div>`).join("")}<p class="muted">Final conversion: ${funnel.opened ? ((funnel.converted / funnel.opened) * 100).toFixed(1) : "0.0"}% of visitors who opened chat.</p></section><section class="panel"><h2>Appointment persistence</h2>${barRows(appointmentRows, "label")}</section><section class="panel"><h2>Notable changes over 30%</h2>${highlights.length ? highlights.map((item) => `<div class="highlight">${escapeHtml(item)}</div>`).join("") : '<p class="empty">No week-over-week changes exceeded 30%.</p>'}</section></div></div><p class="schema"><b>Observed expected events:</b> ${escapeHtml(observedEvents.join(", ") || "None in the 14-day query window")}</p></main>`;
}

function aggregateRows(rows, event, period, dimension, value = "event_count") {
  const map = new Map();
  rows.filter((row) => row.event === event && row.period === period).forEach((row) => {
    const key = row[dimension] || "Unknown";
    map.set(key, (map.get(key) || 0) + number(row[value]));
  });
  return map;
}

function combine(current, prior, limit = 10) {
  return [...new Set([...current.keys(), ...prior.keys()])]
    .map((label) => ({ label, current: current.get(label) || 0, prior: prior.get(label) || 0 }))
    .sort((a, b) => b.current - a.current)
    .slice(0, limit);
}

export async function generateWeeklyAnalyticsReport(range = {}) {
  const window = reportWindow(range);
  const quotedEvents = EXPECTED_EVENTS.map((event) => `'${event}'`).join(",");
  const dimensions = await queryPostHog(`
    select
      if(timestamp >= toDateTime('${window.currentStart} 00:00:00'), 'current', 'prior') as period,
      event,
      coalesce(nullIf(toString(properties.location), ''), 'Unknown') as location,
      coalesce(nullIf(toString(properties.vehicle_class), ''), 'Unknown') as vehicle_class,
      coalesce(nullIf(toString(properties.persisted), ''), 'unknown') as persisted,
      coalesce(nullIf(toString(properties.$pathname), ''), '/') as page_path,
      count() as event_count,
      uniqExact(distinct_id) as unique_users
    from events
    where timestamp >= toDateTime('${window.priorStart} 00:00:00')
      and timestamp < toDateTime('${window.endExclusive} 00:00:00')
      and event in (${quotedEvents})
    group by period, event, location, vehicle_class, persisted, page_path
    order by period, event, event_count desc
  `);
  const funnelResult = await queryPostHog(`
    select
      if(timestamp >= toDateTime('${window.currentStart} 00:00:00'), 'current', 'prior') as period,
      count(distinct case when event = 'chat_opened' then distinct_id else null end) as opened,
      count(distinct case when event = 'chat_message_sent' then distinct_id else null end) as messaged,
      count(distinct case when event in ('quote_sent_whatsapp', 'appointment_requested') then distinct_id else null end) as converted,
      sum(if(event = '$pageview', 1, 0)) as pageviews,
      count(distinct case when event = '$pageview' then distinct_id else null end) as unique_visitors
    from events
    where timestamp >= toDateTime('${window.priorStart} 00:00:00')
      and timestamp < toDateTime('${window.endExclusive} 00:00:00')
      and event in (${quotedEvents})
    group by period
  `);

  const rows = rowsFrom(dimensions);
  const funnelRows = rowsFrom(funnelResult);
  const total = (event, period, field = "event_count") => rows.filter((row) => row.event === event && row.period === period).reduce((sum, row) => sum + number(row[field]), 0);
  const currentFunnel = funnelRows.find((row) => row.period === "current") || {};
  const priorFunnel = funnelRows.find((row) => row.period === "prior") || {};
  const summary = {
    pageviews: number(currentFunnel.pageviews),
    uniqueVisitors: number(currentFunnel.unique_visitors),
    contactClicks: total("contact_click", "current"),
    quotesSent: total("quote_sent_whatsapp", "current"),
    appointments: total("appointment_requested", "current"),
  };
  const prior = {
    pageviews: number(priorFunnel.pageviews),
    uniqueVisitors: number(priorFunnel.unique_visitors),
    contactClicks: total("contact_click", "prior"),
    quotesSent: total("quote_sent_whatsapp", "prior"),
    appointments: total("appointment_requested", "prior"),
  };
  const persisted = (period, expected) => rows.filter((row) => row.event === "appointment_requested" && row.period === period && String(row.persisted) === expected).reduce((sum, row) => sum + number(row.event_count), 0);
  const metrics = [
    ["Pageviews", summary.pageviews, prior.pageviews],
    ["Unique visitors", summary.uniqueVisitors, prior.uniqueVisitors],
    ["Contact clicks", summary.contactClicks, prior.contactClicks],
    ["Quotes sent", summary.quotesSent, prior.quotesSent],
    ["Appointments", summary.appointments, prior.appointments],
  ];
  const highlights = metrics.filter(([, current, old]) => Math.abs(percentChange(current, old)) > 30).map(([label, current, old]) => `${label}: ${comparison(current, old)} (${old.toLocaleString()} → ${current.toLocaleString()}).`);
  const data = {
    ...window,
    summary,
    prior,
    topPages: combine(aggregateRows(rows, "$pageview", "current", "page_path"), aggregateRows(rows, "$pageview", "prior", "page_path")),
    contactLocations: combine(aggregateRows(rows, "contact_click", "current", "location"), aggregateRows(rows, "contact_click", "prior", "location")),
    quoteClasses: combine(aggregateRows(rows, "quote_sent_whatsapp", "current", "vehicle_class"), aggregateRows(rows, "quote_sent_whatsapp", "prior", "vehicle_class")),
    appointments: {
      persisted: persisted("current", "true"), notPersisted: persisted("current", "false"),
      priorPersisted: persisted("prior", "true"), priorNotPersisted: persisted("prior", "false"),
    },
    funnel: { opened: number(currentFunnel.opened), messaged: number(currentFunnel.messaged), converted: number(currentFunnel.converted) },
    priorFunnel,
    highlights,
    observedEvents: [...new Set(rows.map((row) => row.event))],
  };
  const title = `Tires SOS Rescue Analytics Report — ${formatDate(window.periodStart)} to ${formatDate(window.periodEnd)}`;
  return {
    title,
    periodLabel: `${formatDate(window.periodStart)} – ${formatDate(window.periodEnd)}`,
    periodStart: window.periodStart,
    periodEnd: window.periodEnd,
    summary,
    html: buildHtml(data),
  };
}
