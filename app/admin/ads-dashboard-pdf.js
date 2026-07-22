const BRAND = { ink: [20, 16, 12], orange: [248, 96, 0], cream: [243, 237, 227], steel: [125, 136, 148], green: [76, 175, 109], white: [255, 255, 255], muted: [119, 106, 93] };
const PLATFORM = {
  google_ads: { name: "Google Ads", short: "GOOGLE" },
  meta_ads: { name: "Meta Ads", short: "META" },
  yelp: { name: "Yelp Ads", short: "YELP" },
};

function number(value, digits = 0) { return Number(value || 0).toLocaleString("en-US", { maximumFractionDigits: digits }); }
function money(value) { return `$${Number(value || 0).toFixed(2)}`; }

async function imageData(url) {
  const blob = await fetch(url).then((response) => response.blob());
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob); });
}

function fill(doc, color) { doc.setFillColor(...color); }
function stroke(doc, color) { doc.setDrawColor(...color); }
function label(doc, value, x, y, size = 8, color = BRAND.ink, style = "normal", align = "left") {
  doc.setFont("helvetica", style); doc.setFontSize(size); doc.setTextColor(...color); doc.text(String(value), x, y, { align });
}
function box(doc, x, y, w, h, color = BRAND.white) { fill(doc, color); stroke(doc, [213, 200, 184]); doc.roundedRect(x, y, w, h, 1.2, 1.2, "FD"); }

function header(doc, title, tag, logo, page, subtitle) {
  fill(doc, BRAND.cream); doc.rect(0, 0, 297, 210, "F");
  box(doc, 43, 8, 207, 18); label(doc, title, 146.5, 20, 17, BRAND.ink, "bold", "center");
  fill(doc, BRAND.ink); doc.rect(7, 6, 32, 22, "F"); doc.addImage(logo, "JPEG", 8, 7, 30, 20, `tires-sos-logo-${page}`, "FAST");
  fill(doc, BRAND.orange); doc.rect(254, 8, 36, 18, "F"); label(doc, tag, 272, 17, 8, BRAND.ink, "bold", "center"); label(doc, "ADS", 272, 22, 6, BRAND.ink, "bold", "center");
  label(doc, subtitle, 7, 205, 6.5, BRAND.muted); label(doc, `Página ${page} de 4`, 290, 205, 6.5, BRAND.muted, "normal", "right");
}

function kpi(doc, x, y, w, value, name, accent = BRAND.orange, note = "") {
  box(doc, x, y, w, 30); fill(doc, accent); doc.rect(x, y + 28.3, w, 1.7, "F");
  label(doc, value, x + w / 2, y + 13, 15, BRAND.ink, "bold", "center"); label(doc, name.toUpperCase(), x + w / 2, y + 23, 6.5, BRAND.muted, "bold", "center");
  if (note) label(doc, note, x + w / 2, y + 27, 5.2, BRAND.muted, "normal", "center");
}

function panel(doc, x, y, w, h, title) { box(doc, x, y, w, h); label(doc, title, x + 5, y + 9, 10, BRAND.ink, "bold"); stroke(doc, [213, 200, 184]); doc.line(x + 5, y + 12, x + w - 5, y + 12); }

function bars(doc, x, y, w, h, rows, valueKey, color = BRAND.orange) {
  const max = Math.max(...rows.map((row) => Number(row[valueKey] || 0)), 1); const barX = x + 38; const barW = w - 48; const usable = h - 24;
  rows.slice(-7).forEach((row, index, list) => { const yy = y + 18 + index * (usable / list.length); label(doc, String(row.date || "").slice(5), barX - 3, yy + 3, 5.8, BRAND.muted, "normal", "right"); fill(doc, [236, 230, 221]); doc.rect(barX, yy, barW, 5, "F"); fill(doc, color); doc.rect(barX, yy, Math.max(1, barW * Number(row[valueKey] || 0) / max), 5, "F"); label(doc, number(row[valueKey], 2), barX + barW - 1, yy + 4, 5.5, BRAND.ink, "bold", "right"); });
}

function table(doc, x, y, w, headers, rows, widths) {
  const rowH = 9; fill(doc, BRAND.ink); doc.rect(x, y, w, rowH, "F"); let xx = x;
  headers.forEach((item, index) => { label(doc, item, xx + 2, y + 6, 6.2, BRAND.white, "bold"); xx += widths[index]; });
  rows.forEach((row, ri) => { fill(doc, ri % 2 ? [255, 249, 241] : BRAND.white); doc.rect(x, y + rowH * (ri + 1), w, rowH, "F"); xx = x; row.forEach((item, index) => { label(doc, item, xx + 2, y + rowH * (ri + 1) + 6, 6.2, BRAND.ink); xx += widths[index]; }); });
}

function platformPage(doc, key, metrics, days, logo, page) {
  const meta = PLATFORM[key]; header(doc, `Panel de Rendimiento de ${meta.name}`, meta.short, logo, page, `Datos en vivo | Últimos ${days} días`);
  panel(doc, 7, 33, 145, 92, "Rendimiento Diario"); bars(doc, 7, 33, 145, 92, metrics.daily || [], "clicks", BRAND.orange);
  kpi(doc, 158, 33, 41, number(metrics.impressions), "Impresiones", BRAND.ink); kpi(doc, 203, 33, 41, number(metrics.clicks), "Clics", BRAND.orange); kpi(doc, 248, 33, 42, `${number(metrics.ctr, 2)}%`, "CTR", [255, 138, 61]);
  kpi(doc, 158, 68, 41, money(metrics.spend), "Gasto", BRAND.green); kpi(doc, 203, 68, 41, number(metrics.conversions, 1), "Conversiones", [201, 77, 0]); kpi(doc, 248, 68, 42, money(metrics.avgCpc), "CPC promedio", BRAND.steel);
  panel(doc, 7, 131, 145, 66, "Gasto Diario"); bars(doc, 7, 131, 145, 66, metrics.daily || [], "spend", BRAND.ink);
  panel(doc, 158, 106, 132, 91, "Resumen de la Plataforma");
  table(doc, 163, 122, 122, ["Métrica", "Valor"], [["Gasto", money(metrics.spend)], ["Impresiones", number(metrics.impressions)], ["Clics", number(metrics.clicks)], ["Conversiones", number(metrics.conversions, 1)], ["ROAS", `${number(metrics.roas, 2)}x`]], [75, 47]);
  label(doc, metrics.connected ? "Fuente conectada" : "Fuente no conectada", 163, 188, 7, metrics.connected ? BRAND.green : BRAND.muted, "bold");
}

function summaryPage(doc, summary, days, logo) {
  header(doc, "Resumen Ejecutivo de Anuncios TIRES SOS", "RESUMEN", logo, 4, `Vista multiplataforma | Últimos ${days} días`);
  kpi(doc, 7, 33, 66, money(summary.totalSpend), "Gasto total", BRAND.green); kpi(doc, 78, 33, 66, number(summary.totalImpressions), "Impresiones", BRAND.ink); kpi(doc, 149, 33, 66, number(summary.totalClicks), "Clics", BRAND.orange); kpi(doc, 220, 33, 70, number(summary.totalConversions, 1), "Conversiones", BRAND.steel);
  panel(doc, 7, 70, 140, 84, "Gasto por Plataforma");
  const entries = Object.entries(summary.byPlatform); const max = Math.max(...entries.map(([, value]) => value.spend), 1);
  entries.forEach(([key, value], index) => { const yy = 91 + index * 18; label(doc, PLATFORM[key]?.name || key, 14, yy, 7.5, BRAND.ink, "bold"); fill(doc, [236, 230, 221]); doc.rect(55, yy - 5, 78, 7, "F"); fill(doc, index ? BRAND.orange : BRAND.ink); doc.rect(55, yy - 5, 78 * value.spend / max, 7, "F"); label(doc, money(value.spend), 135, yy, 6.5, BRAND.ink, "bold", "right"); });
  panel(doc, 153, 70, 137, 84, "Eficiencia"); table(doc, 158, 87, 127, ["Plataforma", "CPC", "CTR", "ROAS"], entries.map(([key, value]) => [PLATFORM[key]?.name || key, money(value.avgCpc), `${number(value.ctr, 2)}%`, `${number(value.roas, 2)}x`]), [49, 25, 25, 28]);
  panel(doc, 7, 160, 283, 37, "Notas"); label(doc, "El reporte usa las métricas disponibles en las conexiones activas del administrador.", 12, 177, 7.5, BRAND.ink); label(doc, "Las plataformas no conectadas se muestran con cero y no se estiman datos faltantes.", 12, 186, 7.5, BRAND.muted);
}

export async function downloadAdsDashboardPdf(summary, days) {
  const [{ jsPDF }, logo] = await Promise.all([import("jspdf"), imageData("/logo.jpg")]);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4", compress: true });
  ["google_ads", "meta_ads", "yelp"].forEach((key, index) => { if (index) doc.addPage(); platformPage(doc, key, summary.byPlatform[key] || {}, days, logo, index + 1); });
  doc.addPage(); summaryPage(doc, summary, days, logo); doc.save(`tires-sos-ads-analytics-${days}-dias.pdf`);
}
