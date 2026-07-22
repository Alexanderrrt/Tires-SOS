"use client";

import { useCallback, useEffect, useState } from "react";

async function readJson(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status}).`);
  return body;
}

function useAdminJson(url, select) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const retry = useCallback(() => setReloadKey((value) => value + 1), []);

  useEffect(() => {
    const controller = new AbortController();
    setData(null);
    setError("");
    fetch(url, { cache: "no-store", signal: controller.signal })
      .then(readJson)
      .then((body) => setData(select(body)))
      .catch((requestError) => {
        if (requestError?.name !== "AbortError") setError(requestError?.message || "Request failed.");
      });
    return () => controller.abort();
  }, [url, reloadKey, select]);

  return { data, setData, error, loading: !data && !error, retry };
}

const selectMetrics = (body) => body;
const selectPlatforms = (body) => body.platforms;

export function useAdsMetrics(days) {
  return useAdminJson(`/api/admin/ads-metrics?days=${days}`, selectMetrics);
}

export function useAdsConnections() {
  return useAdminJson("/api/admin/ads-connections", selectPlatforms);
}
