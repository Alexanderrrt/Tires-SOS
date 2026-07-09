import { getPricing } from "./pricing-store";

const MAX_CONTEXT_LENGTH = 6000;

function finiteNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function money(value, currency) {
  return `${currency} ${finiteNumber(value).toFixed(2)}`;
}

function label(value) {
  if (!value || typeof value !== "object") return "Unnamed service";
  const en = typeof value.en === "string" ? value.en.replace(/\s+/g, " ").trim().slice(0, 120) : "";
  const es = typeof value.es === "string" ? value.es.replace(/\s+/g, " ").trim().slice(0, 120) : "";
  return en && es && en !== es ? `${en} / ${es}` : en || es || "Unnamed service";
}

function feeText(fees, currency) {
  if (!Array.isArray(fees) || !fees.length) return "";
  const values = fees
    .slice(0, 8)
    .map((fee) => `${label(fee?.label)} ${money(fee?.amount, currency)} ${fee?.per === "unit" ? "per unit" : "per job"}`);
  return values.length ? `; fees: ${values.join(", ")}` : "";
}

function serviceLine(service, currency, laborRate) {
  const name = label(service?.label);
  const factor = service?.appliesVehicleFactor ? "; apply vehicle multiplier" : "";
  switch (service?.model) {
    case "perUnit":
      return `- ${name}: ${money(service.basePrice, currency)} per ${label(service.unitLabel)}${factor}${feeText(service.fees, currency)}.`;
    case "labor":
      return `- ${name}: (${money(service.partsBase, currency)} parts + ${finiteNumber(service.laborHours)} labor hours at ${money(laborRate, currency)}/hour)${factor}.`;
    case "options": {
      const options = (Array.isArray(service.options) ? service.options : [])
        .slice(0, 10)
        .map((option) => `${label(option?.label)} ${money(option?.price, currency)}`)
        .join(", ");
      return `- ${name}: ${options || "shop confirmation required"}${factor}.`;
    }
    case "flat":
      return `- ${name}: ${money(service.flatPrice, currency)} flat estimate${factor}.`;
    default:
      return `- ${name}: price must be confirmed by the shop.`;
  }
}

export function compactPricingContext(pricing) {
  const source = pricing && typeof pricing === "object" ? pricing : {};
  const currency = typeof source.currency === "string" && source.currency.trim()
    ? source.currency.trim().slice(0, 8)
    : "USD";
  const laborRate = finiteNumber(source.laborRate);
  const rangePct = Math.max(0, finiteNumber(source.rangePct));
  const vehicles = (Array.isArray(source.vehicleClasses) ? source.vehicleClasses : [])
    .slice(0, 12)
    .map((vehicle) => `${label(vehicle?.label)} x${finiteNumber(vehicle?.factor, 1)}`)
    .join(", ");
  const services = (Array.isArray(source.services) ? source.services : [])
    .slice(0, 30)
    .map((service) => serviceLine(service, currency, laborRate));

  const lines = [
    "Authoritative current estimate rules (admin-controlled):",
    `Currency: ${currency}. Estimate range: plus/minus ${(rangePct * 100).toFixed(1)}%.`,
    vehicles ? `Vehicle multipliers: ${vehicles}.` : "Vehicle multiplier is unknown; ask the shop to confirm.",
    ...services,
    "Use only these values for price estimates. Apply the stated quantity, fees, labor, vehicle multiplier, and estimate range. Label every result as an estimate; final price requires shop inspection. If required inputs or a service price are absent, do not invent a number.",
  ];
  return lines.join("\n").slice(0, MAX_CONTEXT_LENGTH);
}

export async function loadChatPricingContext() {
  try {
    return compactPricingContext(await getPricing());
  } catch {
    return "Authoritative pricing is currently unavailable. Do not provide a numeric price; ask the shop to confirm.";
  }
}
