import nodemailer from "nodemailer";
import { renderReportHTML } from "./report-template.js";

/**
 * Send optimization report via email
 */
export async function sendOptimizationReport(reportData) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const htmlContent = renderReportHTML(reportData);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.NOTIFY_EMAIL_RECIPIENT,
      subject: `🚀 Ad Optimization Report - ${new Date().toLocaleDateString()}`,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("Report sent successfully:", result.messageId);

    return {
      success: true,
      messageId: result.messageId,
      sentTo: process.env.NOTIFY_EMAIL_RECIPIENT,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error sending report:", error);
    throw error;
  }
}

/**
 * Send daily performance summary
 */
export async function sendDailySummary(summaryData) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Daily Ad Performance - ${summaryData.date}</h2>

        <h3>Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background-color: #f0f0f0;">
            <th style="border: 1px solid #ddd; padding: 8px;">Metric</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Value</th>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Total Spend</td>
            <td style="border: 1px solid #ddd; padding: 8px;">$${summaryData.totalSpend.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Total Conversions</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${summaryData.totalConversions}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Budget Remaining</td>
            <td style="border: 1px solid #ddd; padding: 8px;">$${summaryData.budgetRemaining.toFixed(2)}</td>
          </tr>
        </table>

        <h3>Google Ads</h3>
        <ul>
          <li><strong>Spend:</strong> $${summaryData.google.spend.toFixed(2)}</li>
          <li><strong>Conversions:</strong> ${summaryData.google.conversions}</li>
          <li><strong>ROAS:</strong> ${summaryData.google.roas.toFixed(2)}x</li>
        </ul>

        <h3>Meta Ads</h3>
        <ul>
          <li><strong>Spend:</strong> $${summaryData.meta.spend.toFixed(2)}</li>
          <li><strong>Conversions:</strong> ${summaryData.meta.conversions}</li>
          <li><strong>ROAS:</strong> ${summaryData.meta.roas.toFixed(2)}x</li>
        </ul>

        <hr style="margin-top: 20px;">
        <p style="color: #666; font-size: 12px;">
          This is an automated report. Next optimization run: Tomorrow at 9 AM
        </p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.NOTIFY_EMAIL_RECIPIENT,
      subject: `📊 Daily Summary - ${summaryData.date}`,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending daily summary:", error);
    throw error;
  }
}

/**
 * Send alert for budget threshold exceeded
 */
export async function sendBudgetAlert(threshold, currentSpend) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin-bottom: 20px;">
          <h2 style="color: #856404; margin-top: 0;">⚠️ Budget Alert</h2>
          <p style="color: #856404;">Your ad spend is approaching the monthly budget limit.</p>
        </div>

        <h3>Current Status</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background-color: #f0f0f0;">
            <th style="border: 1px solid #ddd; padding: 8px;">Metric</th>
            <th style="border: 1px solid #ddd; padding: 8px;">Value</th>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Budget Limit</td>
            <td style="border: 1px solid #ddd; padding: 8px;">$${threshold.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Current Spend</td>
            <td style="border: 1px solid #ddd; padding: 8px;">$${currentSpend.toFixed(2)}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">Percentage Used</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${((currentSpend / threshold) * 100).toFixed(1)}%</td>
          </tr>
        </table>

        <p style="margin-top: 20px;">
          Please review your campaigns or adjust budgets to stay within limits.
        </p>

        <hr>
        <p style="color: #666; font-size: 12px;">
          Sent at ${new Date().toLocaleString()}
        </p>
      </div>
    `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.NOTIFY_EMAIL_RECIPIENT,
      subject: `⚠️ Budget Alert - Approaching Monthly Limit`,
      html: htmlContent,
    };

    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending budget alert:", error);
    throw error;
  }
}
