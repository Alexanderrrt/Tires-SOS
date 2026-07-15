import { renderBrandedEmail, escapeHtml } from "./email-template";

function money(value) {
  return `$${(Number(value) || 0).toFixed(2)}`;
}

function metricCard(label, value, note) {
  return `<td width="33.33%" style="padding:0 5px 10px 0;vertical-align:top;"><div style="background:#f7f8fa;border:1px solid #e7ebef;border-radius:9px;padding:14px;"><div style="color:#7b8794;font-size:11px;font-weight:700;letter-spacing:.7px;text-transform:uppercase;">${label}</div><div style="color:#182230;font-size:22px;font-weight:800;margin-top:5px;">${value}</div><div style="color:#74808d;font-size:12px;margin-top:4px;">${note}</div></div></td>`;
}

export function renderReportHTML(reportData) {
  const previousBudget = reportData.previousBudget || {};
  const newBudget = reportData.newBudget || {};
  const metrics = reportData.metrics || {};
  const google = metrics.google || {};
  const meta = metrics.meta || {};
  const date = new Date(reportData.timestamp || Date.now());
  const actions = reportData.aiRecommendations?.actions || [];
  const pauses = reportData.aiRecommendations?.pause_keywords || [];
  const variations = reportData.aiRecommendations?.test_variations || [];
  const body = `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
      ${metricCard("Total spend", money(metrics.totalSpend), `${Number(metrics.totalConversions) || 0} conversions`)}
      ${metricCard("Google ROAS", `${Number(google.roas || 0).toFixed(2)}x`, `${money(google.spend)} spent`)}
      ${metricCard("Meta ROAS", `${Number(meta.roas || 0).toFixed(2)}x`, `${money(meta.spend)} spent`)}
    </tr></table>
    <h2 style="color:#182230;font-size:18px;margin:16px 0 10px;">Budget recommendations</h2>
    <div style="border-left:4px solid #f97316;background:#fff7ed;border-radius:6px;padding:13px 15px;color:#4b5563;font-size:14px;line-height:22px;">
      <strong style="color:#182230;">Google Ads:</strong> ${money(previousBudget.google)} &rarr; <strong>${money(newBudget.google)}</strong><br>
      <strong style="color:#182230;">Meta Ads:</strong> ${money(previousBudget.meta)} &rarr; <strong>${money(newBudget.meta)}</strong><br>
      <strong style="color:#182230;">Yelp Ads:</strong> ${money(previousBudget.yelp)} &rarr; <strong>${money(newBudget.yelp)}</strong>
    </div>
    <h2 style="color:#182230;font-size:18px;margin:24px 0 10px;">Performance snapshot</h2>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="font-size:14px;line-height:24px;color:#536171;">
      <tr><td style="border-bottom:1px solid #edf0f3;padding:7px 0;">Google clicks</td><td align="right" style="border-bottom:1px solid #edf0f3;padding:7px 0;font-weight:700;color:#182230;">${Number(google.clicks || 0).toLocaleString()}</td></tr>
      <tr><td style="border-bottom:1px solid #edf0f3;padding:7px 0;">Google conversions</td><td align="right" style="border-bottom:1px solid #edf0f3;padding:7px 0;font-weight:700;color:#182230;">${Number(google.conversions || 0)}</td></tr>
      <tr><td style="border-bottom:1px solid #edf0f3;padding:7px 0;">Meta clicks</td><td align="right" style="border-bottom:1px solid #edf0f3;padding:7px 0;font-weight:700;color:#182230;">${Number(meta.clicks || 0).toLocaleString()}</td></tr>
      <tr><td style="padding:7px 0;">Meta conversions</td><td align="right" style="padding:7px 0;font-weight:700;color:#182230;">${Number(meta.conversions || 0)}</td></tr>
    </table>
    ${actions.length ? `<h2 style="color:#182230;font-size:18px;margin:24px 0 10px;">AI recommended actions</h2>${actions.map((action) => `<div style="border:1px solid #dbeafe;background:#eff6ff;border-radius:7px;padding:11px 13px;margin:7px 0;color:#334155;font-size:14px;line-height:21px;">${escapeHtml(action)}</div>`).join("")}` : ""}
    ${pauses.length ? `<p style="font-size:14px;color:#536171;"><strong style="color:#b45309;">Keywords to pause:</strong> ${pauses.map(escapeHtml).join(", ")}</p>` : ""}
    ${variations.length ? `<p style="font-size:14px;color:#536171;"><strong style="color:#182230;">Test variations:</strong> ${variations.map(escapeHtml).join(", ")}</p>` : ""}`;

  return renderBrandedEmail({
    preheader: "Your Tires SOS Rescue advertising performance report is ready.",
    eyebrow: "Daily marketing report",
    title: "Your ad performance at a glance",
    intro: `Generated ${date.toLocaleDateString()} at ${date.toLocaleTimeString()}.`,
    content: body,
    primary: { href: "https://tires-sos.vercel.app/dashboard", label: "Open dashboard" },
    secondary: { href: "https://tires-sos.vercel.app", label: "Visit website" },
    footerNote: "Automated performance insights for Tires SOS Rescue.",
  });
}
