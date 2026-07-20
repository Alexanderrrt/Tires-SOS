import { gmailConfigured, sendGmailEmail } from "./gmail-client";
import { renderReportHTML } from "./report-template.js";
import { renderBrandedEmail } from "./email-template";

async function sendReportEmail({ subject, html }) {
  const recipient = process.env.NOTIFY_EMAIL_RECIPIENT?.trim();
  if (!gmailConfigured() || !recipient) {
    throw new Error("Gmail is not configured or NOTIFY_EMAIL_RECIPIENT is unset.");
  }
  const result = await sendGmailEmail({
    to: recipient,
    fromEmail: process.env.YELP_REPLY_FROM_EMAIL || "",
    fromName: process.env.YELP_REPLY_FROM_NAME || "Tires SOS Rescue",
    subject,
    html,
  });
  return { messageId: result.id };
}

export async function sendErrorAlert(subject, error) {
  try {
    const result = await sendReportEmail({
      subject,
      html: renderBrandedEmail({
        eyebrow: "Automation alert",
        title: subject,
        intro: "The ad optimization job needs your attention.",
        content: `<div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:6px;padding:14px;font-size:14px;line-height:22px;"><strong>Error:</strong> ${error.message}<br><strong>Time:</strong> ${new Date().toLocaleString()}</div>`,
        primary: { href: "https://tiressosrescue.com/admin?view=ads-overview", label: "Open dashboard" },
        footerNote: "Automated alert from Tires SOS Rescue.",
      }),
    });
    return { success: true, messageId: result.messageId };
  } catch (emailError) {
    console.error("Could not send error email:", emailError);
    return { success: false, error: emailError.message };
  }
}

export async function sendOptimizationReport(reportData) {
  const result = await sendReportEmail({
    subject: `Ad Optimization Report - ${new Date().toLocaleDateString()}`,
    html: renderReportHTML(reportData),
  });
  console.log("Report sent successfully:", result.messageId);
  return { success: true, messageId: result.messageId, sentTo: process.env.NOTIFY_EMAIL_RECIPIENT, timestamp: new Date().toISOString() };
}

export async function sendDailySummary(summaryData) {
  const content = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
    <h2>Daily Ad Performance - ${summaryData.date}</h2>
    <p><strong>Total Spend:</strong> $${summaryData.totalSpend.toFixed(2)}</p>
    <p><strong>Total Conversions:</strong> ${summaryData.totalConversions}</p>
    <p><strong>Budget Remaining:</strong> $${summaryData.budgetRemaining.toFixed(2)}</p>
    <h3>Google Ads</h3><p>Spend: $${summaryData.google.spend.toFixed(2)} · Conversions: ${summaryData.google.conversions} · ROAS: ${summaryData.google.roas.toFixed(2)}x</p>
    <h3>Meta Ads</h3><p>Spend: $${summaryData.meta.spend.toFixed(2)} · Conversions: ${summaryData.meta.conversions} · ROAS: ${summaryData.meta.roas.toFixed(2)}x</p>
  </div>`;
  const html = renderBrandedEmail({ eyebrow: "Daily marketing report", title: "Daily ad performance", intro: `Summary for ${summaryData.date}.`, content, primary: { href: "https://tiressosrescue.com/admin?view=ads-overview", label: "Open dashboard" }, footerNote: "Automated performance insights for Tires SOS Rescue." });
  const result = await sendReportEmail({ subject: `Daily Summary - ${summaryData.date}`, html });
  return { success: true, messageId: result.messageId };
}

export async function sendBudgetAlert(threshold, currentSpend) {
  const content = `<div style="background:#fff7ed;border-left:4px solid #f97316;border-radius:6px;padding:14px;font-size:14px;line-height:24px;"><p style="margin:0 0 8px;">Your ad spend is approaching the monthly budget limit.</p><strong>Budget Limit:</strong> $${threshold.toFixed(2)}<br><strong>Current Spend:</strong> $${currentSpend.toFixed(2)}<br><strong>Percentage Used:</strong> ${((currentSpend / threshold) * 100).toFixed(1)}%</div>`;
  const html = renderBrandedEmail({ eyebrow: "Budget alert", title: "Your ad budget needs attention", intro: "Review your campaigns before the monthly limit is reached.", content, primary: { href: "https://tiressosrescue.com/admin?view=ads-overview", label: "Review campaigns" }, footerNote: "Automated alert from Tires SOS Rescue." });
  const result = await sendReportEmail({ subject: "Budget Alert - Approaching Monthly Limit", html });
  return { success: true, messageId: result.messageId };
}
