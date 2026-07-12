import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

/**
 * MULTI-ARMED BANDIT ALGORITHM
 * Smart exploration vs exploitation of ad variations
 * Thompson Sampling approach
 */
export async function multiArmedBandit(variations, performanceHistory) {
  try {
    // Calculate Thompson Sampling scores
    const scores = variations.map((variation) => {
      const history = performanceHistory.filter(
        (h) => h.variationId === variation.id
      );

      if (history.length === 0) {
        // Explore new variations
        return { ...variation, score: Math.random() * 0.5 + 0.5 };
      }

      const conversions = history.reduce((sum, h) => sum + (h.conversions || 0), 0);
      const clicks = history.reduce((sum, h) => sum + (h.clicks || 0), 0);
      const conversionRate = clicks > 0 ? conversions / clicks : 0;

      // Thompson Sampling with uncertainty
      const alpha = conversions + 1;
      const beta = clicks - conversions + 1;
      const expectedValue = alpha / (alpha + beta);
      const uncertainty = Math.sqrt((alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1)));

      // Score = expected value + uncertainty (optimism in face of uncertainty)
      return {
        ...variation,
        score: expectedValue + uncertainty * 0.3,
        conversionRate,
        trials: clicks,
      };
    });

    // Sort by score
    const ranked = scores.sort((a, b) => b.score - a.score);

    return {
      bestPerformer: ranked[0],
      ranking: ranked,
      recommendation: `Allocate 50% budget to "${ranked[0].headline_en}", test 30% on #2, explore 20% on new`,
      reasoning: "Thompson Sampling balances exploitation of winners with exploration of unknowns",
    };
  } catch (error) {
    console.error("Error in multi-armed bandit:", error);
    throw error;
  }
}

/**
 * PREDICTIVE ROAS FORECASTING
 * Uses historical trends to predict future performance
 */
export async function predictROAS(historicalData) {
  try {
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analyze this ad performance history and predict next week's ROAS using trend analysis:

Historical Data (last 30 days):
${JSON.stringify(historicalData, null, 2)}

Based on trends, provide:
1. Predicted ROAS for next 7 days
2. Confidence level (0-100%)
3. Factors driving the trend
4. Recommended budget adjustments
5. Risk factors to watch

Return as JSON:
{
  "platform": "string",
  "predicted_roas": number,
  "confidence": number,
  "trend": "improving" | "declining" | "stable",
  "7day_forecast": [{date: "YYYY-MM-DD", roas: number}],
  "factors": ["factor1", "factor2"],
  "budget_recommendation": "increase" | "maintain" | "decrease",
  "risk_factors": ["risk1", "risk2"]
}`,
        },
      ],
    });

    const content = message.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) throw new Error("Failed to parse forecast");

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error in ROAS forecasting:", error);
    throw error;
  }
}

/**
 * ANOMALY DETECTION
 * Real-time alerts on unusual patterns
 */
export async function detectAnomalies(currentMetrics, historicalAverage, threshold = 0.3) {
  try {
    const anomalies = [];

    // CPC anomaly
    const cpcDeviation = Math.abs(currentMetrics.avgCpc - historicalAverage.avgCpc) /
      historicalAverage.avgCpc;
    if (cpcDeviation > threshold) {
      anomalies.push({
        type: "CPC_SPIKE",
        severity: cpcDeviation > 0.5 ? "CRITICAL" : "WARNING",
        current: currentMetrics.avgCpc,
        expected: historicalAverage.avgCpc,
        deviation: `+${(cpcDeviation * 100).toFixed(1)}%`,
        cause: "Possible increased competition or bid strategy issue",
        action: "Review keyword bids, pause underperformers, check competitor activity",
      });
    }

    // CTR anomaly
    const ctrDeviation = Math.abs(currentMetrics.ctr - historicalAverage.ctr) /
      historicalAverage.ctr;
    if (ctrDeviation > threshold) {
      anomalies.push({
        type: "CTR_DROP",
        severity: ctrDeviation > 0.5 ? "CRITICAL" : "WARNING",
        current: currentMetrics.ctr,
        expected: historicalAverage.ctr,
        deviation: `-${(ctrDeviation * 100).toFixed(1)}%`,
        cause: "Ad fatigue, poor ad relevance, or ad rotation issue",
        action: "Refresh ad creatives, improve targeting, increase bid",
      });
    }

    // Conversion rate anomaly
    if (currentMetrics.conversions && historicalAverage.conversions) {
      const conversionDeviation = Math.abs(
        currentMetrics.conversions - historicalAverage.conversions
      ) / historicalAverage.conversions;
      if (conversionDeviation > threshold) {
        anomalies.push({
          type: "CONVERSION_ANOMALY",
          severity: "WARNING",
          current: currentMetrics.conversions,
          expected: historicalAverage.conversions,
          deviation: conversionDeviation > 0 ? `+${(conversionDeviation * 100).toFixed(1)}%` : `-${(conversionDeviation * 100).toFixed(1)}%`,
          cause: "Landing page issues, conversion tracking error, or market change",
          action: "Check conversion tracking, test landing page, verify funnel",
        });
      }
    }

    return {
      anomaliesDetected: anomalies.length,
      anomalies,
      timestamp: new Date().toISOString(),
      requiresAction: anomalies.some((a) => a.severity === "CRITICAL"),
    };
  } catch (error) {
    console.error("Error in anomaly detection:", error);
    throw error;
  }
}

/**
 * SMART BID ADJUSTMENT ENGINE
 * Adjusts bids based on time, device, audience
 */
export async function smartBidAdjustment(performanceBySegment) {
  try {
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      messages: [
        {
          role: "user",
          content: `Analyze this segmented ad performance and recommend bid adjustments:

Performance by Time:
${JSON.stringify(performanceBySegment.byTime, null, 2)}

Performance by Device:
${JSON.stringify(performanceBySegment.byDevice, null, 2)}

Performance by Audience:
${JSON.stringify(performanceBySegment.byAudience, null, 2)}

Current base bid: $${performanceBySegment.baseBid}

For each segment, provide:
1. Recommended bid adjustment (%change)
2. Rationale
3. Expected impact on conversions

Return as JSON:
{
  "adjustments": {
    "by_time": [
      {
        "segment": "6am-10am",
        "current_bid": number,
        "recommended_bid": number,
        "adjustment_percent": number,
        "roas": number,
        "reason": "string"
      }
    ],
    "by_device": [...],
    "by_audience": [...]
  },
  "expected_impact": {
    "conversion_increase": "X%",
    "cost_increase": "Y%",
    "roas_improvement": "Z%"
  }
}`,
        },
      ],
    });

    const content = message.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) throw new Error("Failed to parse bid adjustments");

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error in bid adjustment:", error);
    throw error;
  }
}

/**
 * CROSS-PLATFORM LEARNING
 * Transfer insights from one platform to another
 */
export async function crossPlatformLearning(allMetrics) {
  try {
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analyze performance across platforms and recommend cross-platform optimizations:

Google Ads Performance:
${JSON.stringify(allMetrics.google, null, 2)}

Meta Ads Performance:
${JSON.stringify(allMetrics.meta, null, 2)}

Yelp Performance:
${JSON.stringify(allMetrics.yelp, null, 2)}

Identify:
1. What works best on each platform (keywords, audiences, creative)
2. Tactics from high-performing platform to apply elsewhere
3. Platform-specific opportunities
4. Budget reallocation based on comparative advantage

Return as JSON:
{
  "google_strength": "string",
  "meta_strength": "string",
  "yelp_strength": "string",
  "transfer_tactics": ["tactic1", "tactic2"],
  "opportunities": {
    "google": "string",
    "meta": "string",
    "yelp": "string"
  },
  "reallocation": {
    "from": "string",
    "to": "string",
    "amount": "$XXX",
    "expected_impact": "string"
  }
}`,
        },
      ],
    });

    const content = message.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) throw new Error("Failed to parse cross-platform insights");

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error in cross-platform learning:", error);
    throw error;
  }
}

/**
 * CONVERSION PATH ANALYSIS
 * Track customer journey through funnel
 */
export async function analyzeConversionPath(clickData, conversionData) {
  try {
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analyze customer journey and identify conversion bottlenecks:

Click Data (where customers came from):
${JSON.stringify(clickData, null, 2)}

Conversion Data (where they converted):
${JSON.stringify(conversionData, null, 2)}

Identify:
1. Conversion rate by traffic source
2. Where customers drop off
3. Highest-value traffic sources
4. Optimization priorities

Return as JSON:
{
  "conversion_paths": [
    {
      "source": "string",
      "clicks": number,
      "conversions": number,
      "conversion_rate": number,
      "value": "string"
    }
  ],
  "bottlenecks": ["bottleneck1", "bottleneck2"],
  "highest_value": "string",
  "optimization_priority": "string",
  "expected_improvement": "string"
}`,
        },
      ],
    });

    const content = message.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) throw new Error("Failed to parse conversion path");

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error in conversion path analysis:", error);
    throw error;
  }
}

/**
 * KEYWORD OPPORTUNITY DISCOVERY
 * Find hidden, high-potential keywords
 */
export async function discoverKeywordOpportunities(currentKeywords, searchData) {
  try {
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Find hidden keyword opportunities for a tire shop in San José:

Current Keywords Bidding On:
${JSON.stringify(currentKeywords, null, 2)}

Search Volume Data:
${JSON.stringify(searchData, null, 2)}

Find:
1. High-volume keywords not currently targeted
2. Low-competition, high-intent keywords
3. Long-tail variations with good conversion potential
4. Seasonal opportunities

Return as JSON:
{
  "opportunities": [
    {
      "keyword": "string",
      "monthly_volume": number,
      "competition": "low" | "medium" | "high",
      "cpc_estimate": number,
      "intent": "high" | "medium" | "low",
      "reason": "string"
    }
  ],
  "quick_wins": ["keyword1", "keyword2"],
  "seasonal_keywords": ["keyword1", "keyword2"]
}`,
        },
      ],
    });

    const content = message.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) throw new Error("Failed to parse keyword opportunities");

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error in keyword discovery:", error);
    throw error;
  }
}

/**
 * PREDICTIVE SPEND FORECASTING
 * Predict monthly spend and alert on deviations
 */
export function predictiveSpendForecast(dailySpend, daysRemaining) {
  try {
    // Calculate trend
    const recentDays = dailySpend.slice(-7);
    const recentAvg = recentDays.reduce((a, b) => a + b, 0) / recentDays.length;

    const projectedMonthlySpend = recentAvg * 30;
    const currentSpend = dailySpend.reduce((a, b) => a + b, 0);
    const remainingBudget = 500 - currentSpend;
    const projectedDaily = remainingBudget / daysRemaining;

    return {
      currentMonthSpend: currentSpend,
      projectedMonthlyTotal: projectedMonthlySpend,
      budgetTarget: 500,
      remaining: remainingBudget,
      riskLevel:
        projectedMonthlySpend > 550
          ? "OVER_BUDGET"
          : projectedMonthlySpend > 500
            ? "AT_RISK"
            : "SAFE",
      recommendation:
        projectedMonthlySpend > 550
          ? "Reduce daily spend by 15-20%"
          : "Current pace is sustainable",
      projectedDailySpend: projectedDaily,
      daysRemaining,
    };
  } catch (error) {
    console.error("Error in spend forecasting:", error);
    throw error;
  }
}

/**
 * COMPETITOR SENTIMENT ANALYSIS
 * Analyze reviews and feedback for opportunities
 */
export async function analyzeCompetitorSentiment(reviews, feedback) {
  try {
    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Analyze competitor reviews and Tires SOS customer feedback to find ad messaging opportunities:

Competitor Reviews (negative themes):
${JSON.stringify(reviews, null, 2)}

Our Customer Feedback (positive themes):
${JSON.stringify(feedback, null, 2)}

Identify:
1. Common complaints about competitors
2. What customers love about us
3. Ad messaging angles that differentiate us
4. Emotional triggers we can use

Return as JSON:
{
  "competitor_weaknesses": ["weakness1", "weakness2"],
  "our_strengths": ["strength1", "strength2"],
  "messaging_angles": [
    {
      "angle": "string",
      "supporting_evidence": "string",
      "ad_headline": "string",
      "target_audience": "string"
    }
  ]
}`,
        },
      ],
    });

    const content = message.content[0].text;
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) throw new Error("Failed to parse sentiment analysis");

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error("Error in sentiment analysis:", error);
    throw error;
  }
}
