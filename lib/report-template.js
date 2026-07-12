/**
 * Generate HTML report for optimization results
 */
export function renderReportHTML(reportData) {
  const {
    previousBudget,
    newBudget,
    aiRecommendations,
    metrics,
    timestamp,
  } = reportData;

  const dateStr = new Date(timestamp).toLocaleDateString();
  const timeStr = new Date(timestamp).toLocaleTimeString();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background-color: #f5f5f5;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
          color: #1976d2;
          border-bottom: 3px solid #1976d2;
          padding-bottom: 10px;
        }
        h2 {
          color: #333;
          margin-top: 30px;
          font-size: 1.3em;
        }
        .summary {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 15px;
          margin-bottom: 30px;
        }
        .metric-card {
          background-color: #f9f9f9;
          border-left: 4px solid #1976d2;
          padding: 15px;
          border-radius: 4px;
        }
        .metric-card h3 {
          margin: 0 0 5px 0;
          font-size: 0.9em;
          color: #666;
          text-transform: uppercase;
        }
        .metric-card .value {
          font-size: 1.8em;
          font-weight: bold;
          color: #1976d2;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th {
          background-color: #1976d2;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
        }
        td {
          border-bottom: 1px solid #e0e0e0;
          padding: 10px 12px;
        }
        tr:hover {
          background-color: #f5f5f5;
        }
        .recommendation {
          background-color: #e3f2fd;
          border-left: 4px solid #1976d2;
          padding: 15px;
          margin: 10px 0;
          border-radius: 4px;
        }
        .recommendation strong {
          color: #1976d2;
        }
        .alert {
          background-color: #fff3e0;
          border-left: 4px solid #ff9800;
          padding: 15px;
          margin: 10px 0;
          border-radius: 4px;
        }
        .alert strong {
          color: #ff9800;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
          font-size: 0.9em;
          color: #999;
        }
        .arrow {
          color: #4caf50;
          font-weight: bold;
        }
        .positive {
          color: #4caf50;
        }
        .negative {
          color: #f44336;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 AI-Driven Ad Optimization Report</h1>
        <p><strong>Generated:</strong> ${dateStr} at ${timeStr}</p>

        <h2>Budget Optimization Summary</h2>
        <div class="summary">
          <div class="metric-card">
            <h3>Google Ads</h3>
            <div style="font-size: 0.9em; margin-bottom: 8px;">
              <span class="negative">${previousBudget.google.toFixed(2)}</span>
              <span class="arrow">→</span>
              <span class="positive">${newBudget.google.toFixed(2)}</span>
            </div>
            <div style="font-size: 0.8em; color: #999;">
              ROAS: ${metrics.google.roas.toFixed(2)}x
            </div>
          </div>

          <div class="metric-card">
            <h3>Meta Ads</h3>
            <div style="font-size: 0.9em; margin-bottom: 8px;">
              <span class="negative">${previousBudget.meta.toFixed(2)}</span>
              <span class="arrow">→</span>
              <span class="positive">${newBudget.meta.toFixed(2)}</span>
            </div>
            <div style="font-size: 0.8em; color: #999;">
              ROAS: ${metrics.meta.roas.toFixed(2)}x
            </div>
          </div>

          <div class="metric-card">
            <h3>Yelp Ads</h3>
            <div style="font-size: 0.9em; margin-bottom: 8px;">
              <span class="negative">${previousBudget.yelp.toFixed(2)}</span>
              <span class="arrow">→</span>
              <span class="positive">${newBudget.yelp.toFixed(2)}</span>
            </div>
            <div style="font-size: 0.8em; color: #999;">
              ROAS: ${metrics.yelp.roas.toFixed(2)}x
            </div>
          </div>
        </div>

        <h2>Detailed Metrics</h2>
        <h3>Google Ads Performance</h3>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Spend</td>
              <td>$${metrics.google.spend.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Clicks</td>
              <td>${metrics.google.clicks.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Conversions</td>
              <td>${metrics.google.conversions}</td>
            </tr>
            <tr>
              <td>CTR</td>
              <td>${metrics.google.ctr.toFixed(2)}%</td>
            </tr>
            <tr>
              <td>Avg CPC</td>
              <td>$${metrics.google.avgCpc.toFixed(2)}</td>
            </tr>
            <tr>
              <td>ROAS</td>
              <td><strong class="positive">${metrics.google.roas.toFixed(2)}x</strong></td>
            </tr>
          </tbody>
        </table>

        <h3>Meta Ads Performance</h3>
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Spend</td>
              <td>$${metrics.meta.spend.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Clicks</td>
              <td>${metrics.meta.clicks.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Conversions</td>
              <td>${metrics.meta.conversions}</td>
            </tr>
            <tr>
              <td>CTR</td>
              <td>${metrics.meta.ctr.toFixed(2)}%</td>
            </tr>
            <tr>
              <td>Avg CPC</td>
              <td>$${metrics.meta.avgCpc.toFixed(2)}</td>
            </tr>
            <tr>
              <td>ROAS</td>
              <td><strong class="positive">${metrics.meta.roas.toFixed(2)}x</strong></td>
            </tr>
          </tbody>
        </table>

        <h2>AI Recommendations</h2>
        ${
          aiRecommendations?.actions?.map((action) => `
            <div class="recommendation">
              <strong>Action:</strong> ${action}
            </div>
          `).join('')
        }

        ${
          aiRecommendations?.pause_keywords?.length > 0
            ? `
              <div class="alert">
                <strong>Keywords to Pause:</strong> ${aiRecommendations.pause_keywords.join(", ")}
              </div>
            `
            : ""
        }

        ${
          aiRecommendations?.test_variations?.length > 0
            ? `
              <div class="recommendation">
                <strong>Test These Variations:</strong>
                <ul>
                  ${aiRecommendations.test_variations.map((v) => `<li>${v}</li>`).join('')}
                </ul>
              </div>
            `
            : ""
        }

        <h2>Next Steps</h2>
        <ol>
          <li>Review the new budget allocation above</li>
          <li>Approve changes in Google Ads and Meta</li>
          <li>Monitor performance tomorrow</li>
          <li>Test recommended ad variations</li>
          <li>Pause underperforming keywords</li>
        </ol>

        <div class="footer">
          <p>This is an automated AI-driven optimization report generated daily at 9 AM.</p>
          <p>Next optimization run: Tomorrow</p>
          <p><strong>Tires SOS Rescue | Digital Marketing Automation</strong></p>
        </div>
      </div>
    </body>
    </html>
  `;
}
