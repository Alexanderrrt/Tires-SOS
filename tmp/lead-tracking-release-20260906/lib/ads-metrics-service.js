import { getAdConnections } from "./ad-connections-store.js";
import { getGoogleAdsMetrics } from "./google-ads-api.js";
import { getMetaAdsMetrics } from "./meta-ads-api.js";
import { getYelpMetrics } from "./yelp-api.js";
import { emptyPlatformMetrics, normalizeAdsDays, summarizeAdsMetrics } from "./ads-metrics-summary.js";

const LOADERS = {
  google_ads: getGoogleAdsMetrics,
  meta_ads: getMetaAdsMetrics,
  yelp: getYelpMetrics,
};

export async function loadLiveAdsMetrics(requestedDays = 7, dependencies = {}) {
  const days = normalizeAdsDays(requestedDays);
  const loadConnections = dependencies.getAdConnections || getAdConnections;
  const loaders = { ...LOADERS, ...(dependencies.loaders || {}) };
  const connections = await loadConnections();

  const entries = await Promise.all(
    Object.entries(loaders).map(async ([platform, loader]) => {
      const connection = connections?.[platform];
      if (!connection?.connected) {
        return [platform, emptyPlatformMetrics({ note: "Platform is not connected." })];
      }
      try {
        const metrics = await loader(connection, { days });
        return [platform, {
          ...metrics,
          connected: true,
          available: !metrics?.error,
          source: "live",
        }];
      } catch (error) {
        return [platform, emptyPlatformMetrics({
          connected: true,
          error: error?.message || "Could not load live metrics.",
          note: "The platform is connected, but live metrics are unavailable.",
        })];
      }
    })
  );

  return summarizeAdsMetrics(Object.fromEntries(entries), days);
}
