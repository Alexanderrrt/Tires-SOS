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
  const factor = service?.appliesVehicleFactor ? "; multiply by the vehicle class factor" : "; vehicle class does not change this price";
  switch (service?.model) {
    case "perUnit": {
      const { min = 1, max = 4, default: def = 1 } = service?.qty || {};
      return `- ${name}: ${money(service.basePrice, currency)} per ${label(service.unitLabel)}${factor}${feeText(service.fees, currency)}. Priced per unit — ask how many (${min}-${max}, usually ${def}) only if the customer hasn't said.`;
    }
    case "labor":
      return `- ${name}: (${money(service.partsBase, currency)} parts + ${finiteNumber(service.laborHours)} labor hours at ${money(laborRate, currency)}/hour)${factor}. Quote as one job price, not broken into parts/labor for the customer.`;
    case "options": {
      const opts = (Array.isArray(service.options) ? service.options : []).slice(0, 10);
      const options = opts.map((option) => `${label(option?.label)} ${money(option?.price, currency)}`).join(", ");
      const prices = opts.map((option) => finiteNumber(option?.price)).filter((n) => n > 0);
      const lowHigh = prices.length ? `${money(Math.min(...prices), currency)}-${money(Math.max(...prices), currency)}` : "";
      return `- ${name}: ${options || "shop confirmation required"}${factor}. Do NOT ask the customer which option/type to pick. Quote the full range (${lowHigh || "n/a"}) and mention the shop will confirm the best option when the vehicle is inspected.`;
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
  const vehicleClasses = Array.isArray(source.vehicleClasses) ? source.vehicleClasses.slice(0, 12) : [];
  const vehicles = vehicleClasses
    .map((vehicle) => `${vehicle?.id} = ${label(vehicle?.label)} x${finiteNumber(vehicle?.factor, 1)}`)
    .join(", ");
  const services = (Array.isArray(source.services) ? source.services : [])
    .slice(0, 30)
    .map((service) => serviceLine(service, currency, laborRate));

  const lines = [
    "Authoritative current estimate rules (admin-controlled, from the shop's Prices tab). These are the ONLY numbers you may use — never invent, guess, or remember a price from elsewhere.",
    `Currency: ${currency}. Labor rate: ${money(laborRate, currency)}/hour.`,
    vehicles
      ? `Vehicle classes and multipliers: ${vehicles}.`
      : "Vehicle multiplier is unknown; ask the shop to confirm.",
    "How to pick the vehicle class: match the customer's vehicle to the closest class by typical body style — small cars/coupes = compact, everyday sedans = sedan, SUVs/trucks/minivans = suv_truck, luxury or high-performance brands (BMW, Mercedes, Audi, Porsche, etc.) = luxury_perf. If the vehicle isn't known yet or doesn't clearly fit, use sedan (factor 1.0) as the default and say the price may be a bit higher for larger vehicles.",
    "Services:",
    ...services,
    "",
    "How to calculate an estimate:",
    "1. Take the service's base/parts price (and labor cost if it's a labor-model service).",
    "2. Multiply by the vehicle class factor ONLY for services marked to apply it.",
    "3. Multiply by quantity for per-unit services (tires, wheels, rims, sensors), and add any listed fees per unit or per job.",
    `4. Apply the estimate spread: low = subtotal - (subtotal x ${rangePct}), high = subtotal + (subtotal x ${rangePct}). Round both to the nearest $5.`,
    "5. Always present a low-high range, never a single exact number, and always call it an estimate that the shop confirms in person.",
    "6. If the customer wants more than one service, total each service's own low and high, then add them together for a combined range — do not just re-run the spread on the combined subtotal differently than step 4.",
    "If a required price or input is missing from the rules above, say pricing needs shop confirmation instead of guessing.",
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
