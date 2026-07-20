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

function bi(en, es) {
  return `${en} <span class="es">· ${es}</span>`;
}

function comparison(current, prior) {
  const change = percentChange(current, prior);
  const pct = `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
  return `${pct} ${bi("vs prior period", "vs periodo anterior")}`;
}

function barRows(rows, labelKey, valueKey = "current") {
  const max = Math.max(...rows.map((row) => number(row[valueKey])), 1);
  if (!rows.length) return `<p class="empty">${bi("No activity recorded for this period.", "Sin actividad registrada en este periodo.")}</p>`;
  return rows.map((row) => {
    const value = number(row[valueKey]);
    return `<div class="bar-row"><div class="bar-label"><span>${escapeHtml(row[labelKey] || "Unknown")}</span><strong>${value.toLocaleString()}</strong></div><div class="bar-track"><span style="width:${Math.max((value / max) * 100, value ? 3 : 0).toFixed(1)}%"></span></div><small>${comparison(value, number(row.prior))}</small></div>`;
  }).join("");
}

function buildHtml(data) {
  const { periodStart, periodEnd, periodDays, summary, prior, trafficSources, campaigns, topPages, contactLocations, quoteClasses, appointments, funnel, highlights, observedEvents } = data;
  const cards = [
    [bi("Pageviews", "Vistas de página"), summary.pageviews, prior.pageviews],
    [bi("Unique visitors", "Visitantes únicos"), summary.uniqueVisitors, prior.uniqueVisitors],
    [bi("Contact clicks", "Clics de contacto"), summary.contactClicks, prior.contactClicks],
    [bi("Quotes sent", "Cotizaciones enviadas"), summary.quotesSent, prior.quotesSent],
    [bi("Appointments", "Citas"), summary.appointments, prior.appointments],
  ];
  const maxFunnel = Math.max(funnel.opened, 1);
  const funnelRows = [
    [bi("Chat opened", "Chat abierto"), funnel.opened],
    [bi("Message sent", "Mensaje enviado"), funnel.messaged],
    [bi("Quote or appointment", "Cotización o cita"), funnel.converted],
  ];
  const appointmentRows = [
    { label: bi("Persisted", "Guardada"), current: appointments.persisted, prior: appointments.priorPersisted },
    { label: bi("Not persisted", "No guardada"), current: appointments.notPersisted, prior: appointments.priorNotPersisted },
  ];

  return `<style>
    :root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#120f0c;color:#f7f2e9;font-family:Arial,sans-serif}.report{padding:28px;max-width:1180px;margin:auto}.hero{padding:28px;border:1px solid #3b3028;border-radius:18px;background:linear-gradient(135deg,#211a15,#16120f);position:relative;overflow:hidden}.hero:after{content:"";position:absolute;right:-60px;top:-80px;width:260px;height:260px;border-radius:50%;background:#f86000;filter:blur(90px);opacity:.18}.eyebrow{color:#ff7a24;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase}.hero h1{font-size:32px;margin:8px 0}.muted{color:#b8aa9b}.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin:18px 0}.tile,.panel{background:#211a15;border:1px solid #3b3028;border-radius:14px}.tile{padding:18px}.tile span{display:block;color:#b8aa9b;font-size:12px;text-transform:uppercase}.tile strong{display:block;font-size:27px;margin:7px 0}.tile small,.bar-row small{color:#8f8174}.sections{display:grid;grid-template-columns:1fr 1fr;gap:16px}.panel{padding:20px;margin-bottom:16px}.panel h2{font-size:17px;margin:0 0 18px}.bar-row{margin:14px 0}.bar-label{display:flex;justify-content:space-between;gap:14px;font-size:13px}.bar-track{height:8px;background:#342a23;border-radius:10px;overflow:hidden;margin:6px 0}.bar-track span{display:block;height:100%;background:linear-gradient(90deg,#f86000,#ff9b57);border-radius:10px}.funnel-step{margin:12px 0}.funnel-step div{background:#f86000;color:white;padding:12px;border-radius:8px;min-width:150px}.funnel-step strong{float:right}.highlight{padding:12px 14px;border-left:3px solid #f86000;background:#2a211a;margin:9px 0;border-radius:0 8px 8px 0}.empty{color:#8f8174;font-style:italic}.schema{font-size:11px;color:#8f8174;margin-top:18px}.schema b{color:#b8aa9b}.es{color:#8f8174;font-weight:400;font-style:italic;text-transform:none}.panel--highlight{border-color:#f86000}@media(max-width:850px){.grid{grid-template-columns:repeat(2,1fr)}.sections{grid-template-columns:1fr}}@media(max-width:520px){.report{padding:14px}.grid{grid-template-columns:1fr}.hero h1{font-size:25px}}
  </style><main class="report"><section class="hero"><div class="eyebrow">${bi("Tires SOS Rescue · Weekly analytics", "Tires SOS Rescue · Analítica semanal")}</div><h1>${escapeHtml(formatDate(periodStart))} – ${escapeHtml(formatDate(periodEnd))}</h1><p class="muted">${bi(`PostHog project Tires SOS · Current ${periodDays} day${periodDays === 1 ? "" : "s"} compared with the previous ${periodDays} day${periodDays === 1 ? "" : "s"}.`, `Proyecto PostHog Tires SOS · ${periodDays} día${periodDays === 1 ? "" : "s"} actuales comparados con los ${periodDays} día${periodDays === 1 ? "" : "s"} anteriores.`)}</p></section><section class="grid">${cards.map(([label, current, old]) => `<article class="tile"><span>${label}</span><strong>${number(current).toLocaleString()}</strong><small>${comparison(number(current), number(old))}</small></article>`).join("")}</section><div class="sections"><div><section class="panel panel--highlight"><h2>${bi("Where pageviews come from", "De dónde vienen las vistas")}</h2>${barRows(trafficSources, "label")}</section><section class="panel"><h2>${bi("Marketing campaigns (UTM)", "Campañas de marketing (UTM)")}</h2>${campaigns.length ? barRows(campaigns, "label") : `<p class="empty">${bi("No UTM-tagged traffic this period — add ?utm_source=&utm_campaign= to your ad links to track them here.", "Sin tráfico con etiquetas UTM este periodo — agrega ?utm_source= y utm_campaign= a tus enlaces de anuncios para verlos aquí.")}</p>`}</section><section class="panel"><h2>${bi("Top pages", "Páginas principales")}</h2>${barRows(topPages, "label")}</section><section class="panel"><h2>${bi("Contact clicks by location", "Clics de contacto por ubicación")}</h2>${barRows(contactLocations, "label")}</section></div><div><section class="panel"><h2>${bi("Quotes by vehicle class", "Cotizaciones por tipo de vehículo")}</h2>${barRows(quoteClasses, "label")}</section><section class="panel"><h2>${bi("Chat conversion funnel", "Embudo de conversión del chat")}</h2>${funnelRows.map(([label, value]) => `<div class="funnel-step"><div style="width:${Math.max((value / maxFunnel) * 100, value ? 20 : 0).toFixed(1)}%"><span>${label}</span><strong>${number(value).toLocaleString()}</strong></div></div>`).join("")}<p class="muted">${bi(`Final conversion: ${funnel.opened ? ((funnel.converted / funnel.opened) * 100).toFixed(1) : "0.0"}% of visitors who opened chat.`, `Conversión final: ${funnel.opened ? ((funnel.converted / funnel.opened) * 100).toFixed(1) : "0.0"}% de los visitantes que abrieron el chat.`)}</p></section><section class="panel"><h2>${bi("Appointment persistence", "Persistencia de citas")}</h2>${barRows(appointmentRows, "label")}</section><section class="panel"><h2>${bi("Notable changes over 30%", "Cambios notables mayores al 30%")}</h2>${highlights.length ? highlights.map((item) => `<div class="highlight">${escapeHtml(item)}</div>`).join("") : `<p class="empty">${bi("No week-over-week changes exceeded 30%.", "Ningún cambio semanal superó el 30%.")}</p>`}</section></div></div><p class="schema"><b>${bi("Observed expected events:", "Eventos esperados observados:")}</b> ${escapeHtml(observedEvents.join(", ")) || bi("None in the 14-day query window", "Ninguno en la ventana de 14 días")}</p></main>`;
}

function aggregateRows(rows, event, period, dimension, value = "event_count") {
  const map = new Map();
  rows.filter((row) => row.event === event && row.period === period).forEach((row) => {
    const key = row[dimension] || "Unknown";
    map.set(key, (map.get(key) || 0) + number(row[value]));
  });
  return map;
}

function aggregateCampaigns(rows, period) {
  const map = new Map();
  rows.filter((row) => row.event === "$pageview" && row.period === period && row.utm_source).forEach((row) => {
    const key = row.utm_campaign ? `${row.utm_source} / ${row.utm_campaign}` : row.utm_source;
    map.set(key, (map.get(key) || 0) + number(row.event_count));
  });
  return map;
}

function remapKeys(map, fn) {
  const out = new Map();
  for (const [key, value] of map) {
    const newKey = fn(key);
    out.set(newKey, (out.get(newKey) || 0) + value);
  }
  return out;
}

function channelLabel(domain) {
  if (!domain || domain === "Direct") return "Direct";
  const d = domain.toLowerCase();
  if (d.includes("google")) return "Google";
  if (d.includes("facebook") || d.includes("instagram") || d === "fb.com" || d === "l.facebook.com") return "Meta (Facebook/Instagram)";
  if (d.includes("yelp")) return "Yelp";
  if (d.includes("bing")) return "Bing";
  if (d.includes("yahoo")) return "Yahoo";
  return domain;
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
      coalesce(nullIf(toString(properties.$referring_domain), ''), 'Direct') as referring_domain,
      coalesce(nullIf(toString(properties.utm_source), ''), '') as utm_source,
      coalesce(nullIf(toString(properties.utm_campaign), ''), '') as utm_campaign,
      count() as event_count,
      uniqExact(distinct_id) as unique_users
    from events
    where timestamp >= toDateTime('${window.priorStart} 00:00:00')
      and timestamp < toDateTime('${window.endExclusive} 00:00:00')
      and event in (${quotedEvents})
    group by period, event, location, vehicle_class, persisted, page_path, referring_domain, utm_source, utm_campaign
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
    trafficSources: combine(
      remapKeys(aggregateRows(rows, "$pageview", "current", "referring_domain"), channelLabel),
      remapKeys(aggregateRows(rows, "$pageview", "prior", "referring_domain"), channelLabel)
    ),
    campaigns: combine(aggregateCampaigns(rows, "current"), aggregateCampaigns(rows, "prior")),
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
