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

function tags(service) {
  const v = service?.appliesVehicleFactor ? "V" : "";
  const b = service?.appliesBrandTier ? "B" : "";
  const t = `${v}${b}`;
  return t ? `[${t}]` : "";
}

function serviceLine(service, currency, laborRate) {
  const name = label(service?.label);
  const tag = tags(service);

  if (service?.chatQuotable === false) {
    return `- id="${service.id}" ${name}: price varies too much to quote in chat (depends on exact type/specs and vehicle). Do NOT call the tool for this id. If asked, say the price varies and the shop will confirm it in person or through WhatsApp.`;
  }

  switch (service?.model) {
    case "perUnit": {
      const { min = 1, max = 4, default: def = 1 } = service?.qty || {};
      return `- id="${service.id}" ${name}: ${money(service.basePrice, currency)}/${label(service.unitLabel)} ${tag}${feeText(service.fees, currency)}. Ask qty (${min}-${max}, usually ${def}) only if not said.`;
    }
    case "labor":
      return `- id="${service.id}" ${name}: parts+labor job ${tag}. Quote as one job price, not broken out.`;
    case "options": {
      const opts = (Array.isArray(service.options) ? service.options : []).slice(0, 10);
      const optionIds = opts.map((option) => `${option.id} (${label(option?.label)})`).join(", ");
      return `- id="${service.id}" ${name}: options ${optionIds || "none"} ${tag}. No optionId unless customer stated one — full range returned automatically.`;
    }
    case "flat":
      return `- id="${service.id}" ${name}: flat-rate job ${tag}.`;
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
  const tireBrands = Array.isArray(source.tireBrands) ? source.tireBrands.slice(0, 40) : [];
  const brandsByTier = brandTiers
    .map((tier) => {
      const names = tireBrands.filter((b) => b?.tier === tier.id).map((b) => b?.name).filter(Boolean);
      return names.length ? `${tier.id}: ${names.join(", ")}` : "";
    })
    .filter(Boolean)
    .join("; ");
  const serviceLines = (Array.isArray(source.services) ? source.services : [])
    .slice(0, 30)
    .map((service) => serviceLine(service, currency, laborRate));

  const header = [
    "Pricing catalog (admin-controlled). Reference only — pick arguments for get_price_estimate; never calculate or state a price yourself.",
    `Currency: ${currency}.`,
    vehicles ? `vehicleClass ids: ${vehicles}. Match only a vehicle the customer actually provided by body style (small→compact, everyday→sedan, SUV/truck→suv_truck, luxury/performance→luxury_perf); omit if unclear.` : "No vehicle classes configured.",
    brands ? `brandTier ids: ${brands}. Default 'standard' unless customer names economy or premium; never ask which tier.` : "No brand tiers configured.",
    brandsByTier ? `Tire brands we carry, by tier — ${brandsByTier}. If the customer names one of these brands, use its tier automatically; never ask which tier they want.` : "",
    "Tags: [V]=vehicle size changes price, [B]=brand tier changes price a lot.",
    "Services (use the exact id):",
  ].filter(Boolean);

  const footer = [
    "",
    "Rules:",
    "- Any price/range/cost figure MUST come from calling get_price_estimate with service id(s), qty if relevant, vehicleClass, brandTier. Never state a number the tool didn't return.",
    "- Relay the tool's low/high exactly, framed as an estimate the shop confirms in person. Do not round or recompute.",
    "- Unknown service id or nothing selected: ask a quick follow-up instead of guessing.",
  ];

  // Only the service list can grow unbounded with a large catalog, so only it
  // gets truncated (by whole lines, never mid-string) — the header and Rules
  // footer always survive intact so the "always call the tool" reinforcement
  // is never silently dropped.
  const reserved = header.join("\n").length + footer.join("\n").length + 2;
  const budget = Math.max(0, MAX_CONTEXT_LENGTH - reserved);
  const keptServiceLines = [];
  let used = 0;
  for (const line of serviceLines) {
    used += line.length + 1;
    if (used > budget) break;
    keptServiceLines.push(line);
  }

  return [...header, ...keptServiceLines, ...footer].join("\n");
}

export async function loadChatPricingContext() {
  try {
    return compactPricingContext(await getPricing());
  } catch {
    return "Authoritative pricing is currently unavailable. Do not provide a numeric price; ask the shop to confirm.";
  }
}
