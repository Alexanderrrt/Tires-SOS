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
  const vehicleNote = service?.appliesVehicleFactor ? "vehicle size changes this price" : "vehicle size does NOT change this price";
  const brandNote = service?.appliesBrandTier ? "; brand tier changes this price a lot" : "";
  switch (service?.model) {
    case "perUnit": {
      const { min = 1, max = 4, default: def = 1 } = service?.qty || {};
      return `- id="${service.id}" ${name}: ${money(service.basePrice, currency)} per ${label(service.unitLabel)} (${vehicleNote}${brandNote})${feeText(service.fees, currency)}. Priced per unit — ask how many (${min}-${max}, usually ${def}) only if the customer hasn't said.`;
    }
    case "labor":
      return `- id="${service.id}" ${name}: parts + labor job (${vehicleNote}${brandNote}). Quote as one job price via the tool, not broken into parts/labor for the customer.`;
    case "options": {
      const opts = (Array.isArray(service.options) ? service.options : []).slice(0, 10);
      const optionIds = opts.map((option) => `${option.id} (${label(option?.label)})`).join(", ");
      return `- id="${service.id}" ${name}: options are ${optionIds || "none configured"} (${vehicleNote}${brandNote}). Do NOT ask the customer which option to pick — call the tool without optionId to get the full range across all options, and mention the shop will confirm the best pick at drop-off.`;
    }
    case "flat":
      return `- id="${service.id}" ${name}: flat-rate job (${vehicleNote}${brandNote}).`;
    default:
      return `- id="${service.id}" ${name}: price must be confirmed by the shop.`;
  }
}

export function compactPricingContext(pricing) {
  const source = pricing && typeof pricing === "object" ? pricing : {};
  const currency = typeof source.currency === "string" && source.currency.trim()
    ? source.currency.trim().slice(0, 8)
    : "USD";
  const laborRate = finiteNumber(source.laborRate);
  const vehicleClasses = Array.isArray(source.vehicleClasses) ? source.vehicleClasses.slice(0, 12) : [];
  const vehicles = vehicleClasses
    .map((vehicle) => `${vehicle?.id} = ${label(vehicle?.label)}`)
    .join(", ");
  const brandTiers = Array.isArray(source.brandTiers) ? source.brandTiers.slice(0, 12) : [];
  const brands = brandTiers.map((tier) => `${tier?.id} = ${label(tier?.label)}`).join(", ");
  const services = (Array.isArray(source.services) ? source.services : [])
    .slice(0, 30)
    .map((service) => serviceLine(service, currency, laborRate));

  const lines = [
    "Authoritative current pricing catalog (admin-controlled, from the shop's Prices tab). This is ONLY a reference to help you pick the right arguments for the get_price_estimate tool — you do not calculate prices yourself, and you never state a price without calling the tool first.",
    `Currency: ${currency}.`,
    vehicles
      ? `Vehicle classes (pass the id as vehicleClass): ${vehicles}.`
      : "No vehicle classes configured.",
    "How to pick vehicleClass: match the customer's vehicle to the closest class by typical body style — small cars/coupes = compact, everyday sedans = sedan, SUVs/trucks/minivans = suv_truck, luxury or high-performance brands (BMW, Mercedes, Audi, Porsche, etc.) = luxury_perf. If the vehicle isn't known yet or doesn't clearly fit, use sedan by default.",
    brands
      ? `Brand tiers (pass the id as brandTier): ${brands}.`
      : "No brand tiers configured.",
    "How to pick brandTier: default to 'standard' unless the customer explicitly asks for a cheaper/economy brand or a premium/name brand. Never ask the customer which brand tier they want — infer it, defaulting to standard.",
    "Services (use the exact id shown when calling the tool):",
    ...services,
    "",
    "Rules:",
    "- To give any price, price range, or cost figure, you MUST call the get_price_estimate tool with the service id(s), quantity if relevant, vehicleClass, and brandTier. Never do the math yourself and never state a number the tool didn't return.",
    "- After the tool returns, relay its low/high numbers back to the customer exactly as given, framed as an estimate the shop confirms in person. Do not round, adjust, or recompute them.",
    "- If the tool result says a service id was unknown or nothing was selected, ask a quick follow-up instead of guessing a price.",
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
