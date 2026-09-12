export const AD_PLATFORM_KEYS = ["google_ads", "meta_ads", "yelp"];

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((finiteNumber(value) + Number.EPSILON) * factor) / factor;
}

export function normalizeAdsDays(value, fallback = 7) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.min(90, Math.max(1, parsed)) : fallback;
}

export function emptyPlatformMetrics(extra = {}) {
  return {
    spend: 0,
    conversions: 0,
    conversionValue: 0,
    clicks: 0,
    impressions: 0,
    roas: 0,
    ctr: 0,
    avgCpc: 0,
    daily: [],
    connected: false,
    available: false,
    source: "unavailable",
    error: null,
    ...extra,
  };
}

export function emptyAdsSummary(days = 7) {
  return {
    days,
    totalSpend: 0,
    totalClicks: 0,
    totalConversions: 0,
    totalConversionValue: 0,
    totalImpressions: 0,
    avgROAS: 0,
    avgCTR: 0,
    avgCPC: 0,
    byPlatform: Object.fromEntries(AD_PLATFORM_KEYS.map((key) => [key, emptyPlatformMetrics()])),
    daily: [],
    trend: "stable",
    source: "live",
    fetchedAt: new Date().toISOString(),
  };
}

function dailyTrend(daily) {
  if (daily.length < 6) return "stable";
  const recent = daily.slice(-3);
  const older = daily.slice(-6, -3);
  const average = (rows) => rows.reduce((sum, row) => sum + finiteNumber(row.roas), 0) / rows.length;
  const recentAverage = average(recent);
  const olderAverage = average(older);
  if (olderAverage === 0) return recentAverage > 0 ? "improving" : "stable";
  if (recentAverage > olderAverage * 1.1) return "improving";
  if (recentAverage < olderAverage * 0.9) return "declining";
  return "stable";
}

export function summarizeAdsMetrics(platformMetrics = {}, days = 7) {
  const summary = emptyAdsSummary(normalizeAdsDays(days));
  const dailyMap = new Map();

  for (const key of AD_PLATFORM_KEYS) {
    const raw = platformMetrics[key] || {};
    const spend = finiteNumber(raw.spend);
    const conversions = finiteNumber(raw.conversions);
    const conversionValue = finiteNumber(raw.conversionsValue ?? raw.conversionValue);
    const clicks = finiteNumber(raw.clicks);
    const impressions = finiteNumber(raw.impressions);
    const platform = emptyPlatformMetrics({
      spend: round(spend),
      conversions: round(conversions),
      conversionValue: round(conversionValue),
      clicks: round(clicks),
      impressions: round(impressions),
      roas: spend > 0 ? round(conversionValue / spend) : 0,
      ctr: impressions > 0 ? round((clicks / impressions) * 100) : 0,
      avgCpc: clicks > 0 ? round(spend / clicks) : 0,
      daily: Array.isArray(raw.daily) ? raw.daily : [],
      connected: Boolean(raw.connected),
      available: raw.available !== false && !raw.error,
      source: raw.source || (raw.connected ? "live" : "unavailable"),
      error: raw.error || null,
      note: raw.note || null,
      rating: raw.rating ?? null,
      reviewCount: raw.reviewCount ?? null,
      lastUpdated: raw.lastUpdated || null,
    });
    summary.byPlatform[key] = platform;
    summary.totalSpend += spend;
    summary.totalConversions += conversions;
    summary.totalConversionValue += conversionValue;
    summary.totalClicks += clicks;
    summary.totalImpressions += impressions;

    for (const rawDay of platform.daily) {
      if (!rawDay?.date) continue;
      const day = dailyMap.get(rawDay.date) || {
        date: rawDay.date,
        spend: 0,
        conversions: 0,
        conversionValue: 0,
        clicks: 0,
        impressions: 0,
      };
      day.spend += finiteNumber(rawDay.spend);
      day.conversions += finiteNumber(rawDay.conversions);
      day.conversionValue += finiteNumber(rawDay.conversionsValue ?? rawDay.conversionValue);
      day.clicks += finiteNumber(rawDay.clicks);
      day.impressions += finiteNumber(rawDay.impressions);
      dailyMap.set(rawDay.date, day);
    }
  }

  summary.totalSpend = round(summary.totalSpend);
  summary.totalConversions = round(summary.totalConversions);
  summary.totalConversionValue = round(summary.totalConversionValue);
  summary.totalClicks = round(summary.totalClicks);
  summary.totalImpressions = round(summary.totalImpressions);
  summary.avgROAS = summary.totalSpend > 0 ? round(summary.totalConversionValue / summary.totalSpend) : 0;
  summary.avgCTR = summary.totalImpressions > 0 ? round((summary.totalClicks / summary.totalImpressions) * 100) : 0;
  summary.avgCPC = summary.totalClicks > 0 ? round(summary.totalSpend / summary.totalClicks) : 0;
  summary.daily = [...dailyMap.values()]
    .sort((left, right) => left.date.localeCompare(right.date))
    .map((day) => ({
      ...day,
      spend: round(day.spend),
      conversions: round(day.conversions),
      conversionValue: round(day.conversionValue),
      clicks: round(day.clicks),
      impressions: round(day.impressions),
      roas: day.spend > 0 ? round(day.conversionValue / day.spend) : 0,
    }));
  summary.trend = dailyTrend(summary.daily);
  return summary;
}
