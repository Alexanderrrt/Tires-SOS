"use client";

import { useEffect, useState } from "react";

export default function AdIntelligenceDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchIntelligenceData();
  }, []);

  async function fetchIntelligenceData() {
    try {
      const response = await fetch("/api/admin/intelligence");
      const data = await response.json();
      setData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-6 text-center">Loading intelligence...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!data) return <div className="p-6">No data available</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold mb-8">🤖 AI Intelligence Dashboard</h1>

      {/* CRITICAL ALERTS */}
      {data.anomalies?.requiresAction && (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-8 rounded">
          <h2 className="text-2xl font-bold text-red-800 mb-4">🚨 Critical Alerts</h2>
          {data.anomalies.anomalies?.map((anomaly, idx) => (
            <div key={idx} className="mb-4 p-4 bg-white rounded border-l-4 border-red-500">
              <div className="font-bold text-red-700">{anomaly.type}</div>
              <div className="text-sm text-gray-600 mt-2">
                <p><strong>Current:</strong> {anomaly.current}</p>
                <p><strong>Expected:</strong> {anomaly.expected}</p>
                <p><strong>Deviation:</strong> {anomaly.deviation}</p>
                <p className="mt-2 text-gray-700"><strong>Action:</strong> {anomaly.action}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PERFORMANCE PREDICTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Google Predictions */}
        {data.predictions?.google && (
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-xl font-bold mb-4">📊 Google Ads Forecast</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Predicted ROAS:</span>
                <span className="font-bold text-lg">{data.predictions.google.predicted_roas?.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between">
                <span>Trend:</span>
                <span className="font-bold text-green-600">{data.predictions.google.trend}</span>
              </div>
              <div className="flex justify-between">
                <span>Confidence:</span>
                <span className="font-bold">{data.predictions.google.confidence}%</span>
              </div>
              <div className="flex justify-between">
                <span>Recommendation:</span>
                <span className="font-bold text-blue-600">{data.predictions.google.budget_recommendation}</span>
              </div>
            </div>
          </div>
        )}

        {/* Meta Predictions */}
        {data.predictions?.meta && (
          <div className="bg-white p-6 rounded shadow">
            <h3 className="text-xl font-bold mb-4">📱 Meta Ads Forecast</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Predicted ROAS:</span>
                <span className="font-bold text-lg">{data.predictions.meta.predicted_roas?.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between">
                <span>Trend:</span>
                <span className="font-bold text-yellow-600">{data.predictions.meta.trend}</span>
              </div>
              <div className="flex justify-between">
                <span>Confidence:</span>
                <span className="font-bold">{data.predictions.meta.confidence}%</span>
              </div>
              <div className="flex justify-between">
                <span>Recommendation:</span>
                <span className="font-bold text-blue-600">{data.predictions.meta.budget_recommendation}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* TOP RECOMMENDATIONS */}
      <div className="bg-green-50 border-l-4 border-green-500 p-6 mb-8 rounded">
        <h2 className="text-2xl font-bold text-green-800 mb-4">✅ Top Recommendations</h2>
        <ol className="space-y-2">
          {data.recommendations?.topActions?.map((action, idx) => (
            <li key={idx} className="flex">
              <span className="font-bold text-green-600 mr-4">{idx + 1}.</span>
              <span className="text-gray-700">{action}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* BID ADJUSTMENTS */}
      {data.bidAdjustments?.adjustments && (
        <div className="bg-white p-6 rounded shadow mb-8">
          <h3 className="text-2xl font-bold mb-4">💰 Smart Bid Adjustments</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* By Time */}
            {data.bidAdjustments.adjustments.by_time && (
              <div>
                <h4 className="font-bold mb-3 text-lg">⏰ By Time</h4>
                {data.bidAdjustments.adjustments.by_time.map((adj, idx) => (
                  <div key={idx} className="mb-3 p-3 bg-gray-50 rounded text-sm">
                    <div className="font-semibold">{adj.segment}</div>
                    <div className="text-xs text-gray-600">
                      ${adj.current_bid.toFixed(2)} → ${adj.recommended_bid.toFixed(2)}
                    </div>
                    <div className={`text-xs font-bold ${adj.adjustment_percent > 0 ? "text-green-600" : "text-red-600"}`}>
                      {adj.adjustment_percent > 0 ? "+" : ""}{adj.adjustment_percent}%
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* By Device */}
            {data.bidAdjustments.adjustments.by_device && (
              <div>
                <h4 className="font-bold mb-3 text-lg">📱 By Device</h4>
                {data.bidAdjustments.adjustments.by_device.map((adj, idx) => (
                  <div key={idx} className="mb-3 p-3 bg-gray-50 rounded text-sm">
                    <div className="font-semibold">{adj.segment}</div>
                    <div className="text-xs text-gray-600">
                      ${adj.current_bid.toFixed(2)} → ${adj.recommended_bid.toFixed(2)}
                    </div>
                    <div className={`text-xs font-bold ${adj.adjustment_percent > 0 ? "text-green-600" : "text-red-600"}`}>
                      {adj.adjustment_percent > 0 ? "+" : ""}{adj.adjustment_percent}%
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* By Audience */}
            {data.bidAdjustments.adjustments.by_audience && (
              <div>
                <h4 className="font-bold mb-3 text-lg">👥 By Audience</h4>
                {data.bidAdjustments.adjustments.by_audience.map((adj, idx) => (
                  <div key={idx} className="mb-3 p-3 bg-gray-50 rounded text-sm">
                    <div className="font-semibold">{adj.segment}</div>
                    <div className="text-xs text-gray-600">
                      ${adj.current_bid.toFixed(2)} → ${adj.recommended_bid.toFixed(2)}
                    </div>
                    <div className={`text-xs font-bold ${adj.adjustment_percent > 0 ? "text-green-600" : "text-red-600"}`}>
                      {adj.adjustment_percent > 0 ? "+" : ""}{adj.adjustment_percent}%
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {data.bidAdjustments.expected_impact && (
            <div className="mt-6 p-4 bg-blue-50 rounded">
              <h5 className="font-bold mb-2">📈 Expected Impact:</h5>
              <div className="text-sm space-y-1">
                <p>Conversion Increase: <strong className="text-green-600">{data.bidAdjustments.expected_impact.conversion_increase}</strong></p>
                <p>Cost Increase: <strong>{data.bidAdjustments.expected_impact.cost_increase}</strong></p>
                <p>ROAS Improvement: <strong className="text-green-600">{data.bidAdjustments.expected_impact.roas_improvement}</strong></p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* KEYWORD OPPORTUNITIES */}
      {data.keywordOpportunities?.opportunities && (
        <div className="bg-white p-6 rounded shadow mb-8">
          <h3 className="text-2xl font-bold mb-4">🔍 Keyword Opportunities</h3>
          <div className="space-y-3">
            {data.keywordOpportunities.opportunities.slice(0, 5).map((kw, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded">
                <div className="font-bold text-lg">{kw.keyword}</div>
                <div className="grid grid-cols-4 gap-4 mt-2 text-sm">
                  <div>
                    <span className="text-gray-600">Volume:</span>
                    <div className="font-semibold">{kw.monthly_volume?.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Competition:</span>
                    <div className="font-semibold">{kw.competition}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Est. CPC:</span>
                    <div className="font-semibold">${kw.cpc_estimate?.toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Intent:</span>
                    <div className="font-semibold">{kw.intent}</div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">{kw.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SPEND FORECAST */}
      {data.spendForecast && (
        <div className="bg-white p-6 rounded shadow mb-8">
          <h3 className="text-2xl font-bold mb-4">💵 Budget Forecast</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Current Spend</div>
              <div className="text-2xl font-bold">${data.spendForecast.currentMonthSpend?.toFixed(0)}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Projected Monthly</div>
              <div className="text-2xl font-bold">${data.spendForecast.projectedMonthlyTotal?.toFixed(0)}</div>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Budget Target</div>
              <div className="text-2xl font-bold">$500</div>
            </div>
            <div className="p-4 bg-gray-50 rounded">
              <div className="text-sm text-gray-600">Remaining</div>
              <div className="text-2xl font-bold text-green-600">${data.spendForecast.remaining?.toFixed(0)}</div>
            </div>
            <div className={`p-4 rounded ${
              data.spendForecast.riskLevel === "OVER_BUDGET"
                ? "bg-red-50"
                : data.spendForecast.riskLevel === "AT_RISK"
                  ? "bg-yellow-50"
                  : "bg-green-50"
            }`}>
              <div className="text-sm text-gray-600">Risk Level</div>
              <div className={`text-2xl font-bold ${
                data.spendForecast.riskLevel === "OVER_BUDGET"
                  ? "text-red-600"
                  : data.spendForecast.riskLevel === "AT_RISK"
                    ? "text-yellow-600"
                    : "text-green-600"
              }`}>
                {data.spendForecast.riskLevel}
              </div>
            </div>
          </div>
          <p className="mt-4 text-gray-700"><strong>Recommendation:</strong> {data.spendForecast.recommendation}</p>
        </div>
      )}

      {/* CONVERSION PATHS */}
      {data.conversionPaths?.conversion_paths && (
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-2xl font-bold mb-4">📍 Conversion Paths</h3>
          <div className="space-y-3">
            {data.conversionPaths.conversion_paths.map((path, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded">
                <div className="font-bold text-lg">{path.source}</div>
                <div className="grid grid-cols-4 gap-4 mt-2 text-sm">
                  <div>
                    <span className="text-gray-600">Clicks:</span>
                    <div className="font-semibold">{path.clicks}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Conversions:</span>
                    <div className="font-semibold">{path.conversions}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Rate:</span>
                    <div className="font-semibold">{(path.conversion_rate * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Value:</span>
                    <div className="font-semibold text-green-600">{path.value}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 text-center text-gray-500 text-sm">
        Last updated: {data.timestamp ? new Date(data.timestamp).toLocaleString() : "N/A"}
      </div>
    </div>
  );
}
