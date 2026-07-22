import test from "node:test";
import assert from "node:assert/strict";
import { getGoogleAdsMetrics } from "../lib/google-ads-api.js";
import { getMetaAdsMetrics } from "../lib/meta-ads-api.js";

test("Google adapter uses the current API and returns daily conversion-value metrics", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (input, init = {}) => {
    const url = String(input);
    requests.push({ url, init });
    if (url.includes("oauth2.googleapis.com/token")) return Response.json({ access_token: "access" });
    return Response.json({ results: [
      { campaign: { id: "1", name: "Search", status: "ENABLED", campaignBudget: "customers/1/campaignBudgets/2" }, segments: { date: "2026-07-19" }, metrics: { costMicros: "10000000", conversions: 2, conversionsValue: 40, clicks: 5, impressions: 100 } },
      { campaign: { id: "1", name: "Search", status: "ENABLED", campaignBudget: "customers/1/campaignBudgets/2" }, segments: { date: "2026-07-20" }, metrics: { costMicros: "5000000", conversions: 1, conversionsValue: 10, clicks: 2, impressions: 40 } },
    ] });
  };
  try {
    const metrics = await getGoogleAdsMetrics({ connected: true, fields: { customer_id: "123-456-7890", developer_token: "dev", client_id: "client", client_secret: "secret", refresh_token: "refresh" } }, { days: 7 });
    assert.equal(metrics.available, true);
    assert.equal(metrics.spend, 15);
    assert.equal(metrics.conversionsValue, 50);
    assert.equal(metrics.roas, 50 / 15);
    assert.equal(metrics.daily.length, 2);
    assert.equal(metrics.campaigns[0].budgetResourceName, "customers/1/campaignBudgets/2");
    assert.match(requests[1].url, /googleads\.googleapis\.com\/v24/);
    const searchBody = JSON.parse(requests[1].init.body);
    assert.match(searchBody.query, /segments\.date BETWEEN/);
    assert.equal(searchBody.pageSize, undefined);
    assert.equal(requests[1].init.headers["login-customer-id"], undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Google adapter sends a distinct optional manager account ID", async () => {
  const originalFetch = globalThis.fetch;
  const requests = [];
  globalThis.fetch = async (input, init = {}) => {
    requests.push({ url: String(input), init });
    if (String(input).includes("oauth2.googleapis.com/token")) return Response.json({ access_token: "access" });
    return Response.json({ results: [] });
  };
  try {
    await getGoogleAdsMetrics({ connected: true, fields: { customer_id: "123-456-7890", login_customer_id: "987-654-3210", developer_token: "dev", client_id: "client", client_secret: "secret", refresh_token: "refresh" } });
    assert.equal(requests[1].init.headers["login-customer-id"], "9876543210");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Meta adapter uses account insights and separates campaign and daily totals", async () => {
  const originalFetch = globalThis.fetch;
  const urls = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    urls.push(url);
    const parsed = new URL(url);
    if (parsed.searchParams.get("level") === "campaign") {
      return Response.json({ data: [{ campaign_id: "c1", campaign_name: "Leads", spend: "20", clicks: "10", impressions: "200", actions: [{ action_type: "lead", value: "3" }], action_values: [{ action_type: "purchase", value: "80" }] }] });
    }
    return Response.json({ data: [{ date_start: "2026-07-20", spend: "20", clicks: "10", impressions: "200", actions: [{ action_type: "lead", value: "3" }], action_values: [{ action_type: "purchase", value: "80" }] }] });
  };
  try {
    const metrics = await getMetaAdsMetrics({ connected: true, fields: { ad_account_id: "123", access_token: "token" } }, { days: 7 });
    assert.equal(metrics.available, true);
    assert.equal(metrics.roas, 4);
    assert.equal(metrics.daily[0].conversionsValue, 80);
    assert.ok(urls.every((url) => url.includes("graph.facebook.com/v23.0")));
    assert.ok(urls.some((url) => new URL(url).searchParams.get("time_increment") === "1"));
  } finally {
    globalThis.fetch = originalFetch;
  }
});
