// Deterministic pricing for the chatbot. Instead of asking the LLM to do
// arithmetic (which drifts on multi-step math), the model calls this as a
// tool with structured picks (services/qty/vehicle/brand) and we compute the
// real number here with the same estimateTotal() the /quote page uses. The
// model only ever relays a number we produced — it never invents one.
import { estimateTotal, formatMoney } from "./quote";

function pickId(list, requestedId, preferredFallbackId) {
  if (!Array.isArray(list) || !list.length) return requestedId;
  if (list.some((item) => item.id === requestedId)) return requestedId;
  const preferred = list.find((item) => item.id === preferredFallbackId);
  if (preferred) return preferred.id;
  const neutral = list.find((item) => item.factor === 1);
  return (neutral || list[0]).id;
}

// Services flagged chatQuotable: false (e.g. battery, whose price swings too
// much by group size/CCA/warranty to trust a chat estimate) are excluded
// entirely — not offered in the tool schema, and never resolved even if an
// id for one is somehow passed in.
function quotableServices(pricing) {
  return (pricing.services || []).filter((s) => s.chatQuotable !== false);
}

export function buildPriceEstimateTool(pricing) {
  const serviceIds = quotableServices(pricing).map((s) => s.id);
  const vehicleIds = (pricing.vehicleClasses || []).map((v) => v.id);
  const brandIds = (pricing.brandTiers || []).map((b) => b.id);

  const serviceItem = {
    type: "object",
    properties: {
      id: { type: "string", enum: serviceIds, description: "Service id from the pricing rules." },
      qty: { type: "number", description: "Quantity for per-unit services (e.g. number of tires). Omit otherwise." },
      optionId: { type: "string", description: "Chosen option id for option-based services. Omit if the customer hasn't stated a preference — the tool will return the full range." },
    },
    required: ["id"],
  };

  return {
    type: "function",
    function: {
      name: "get_price_estimate",
      description:
        "Compute an exact price estimate from the shop's real, current pricing data. Always call this before stating any price, range, or number tied to cost — never calculate or state one yourself.",
      parameters: {
        type: "object",
        properties: {
          vehicleClass: {
            type: "string",
            enum: vehicleIds.length ? vehicleIds : undefined,
            description: "Best-matching vehicle class for a vehicle the customer actually provided. Omit if the vehicle is unknown or unclear.",
          },
          brandTier: {
            type: "string",
            enum: brandIds.length ? brandIds : undefined,
            description: "Use 'standard' unless the customer explicitly asked for an economy/budget brand or a premium/name brand.",
          },
          services: {
            type: "array",
            description: "One entry per service the customer wants priced.",
            items: serviceItem,
          },
        },
        required: ["services"],
      },
    },
  };
}

function extremeOption(options, pick) {
  if (!Array.isArray(options) || !options.length) return undefined;
  return options.reduce((best, opt) => {
    if (!best) return opt;
    const better = pick === "min" ? opt.price < best.price : opt.price > best.price;
    return better ? opt : best;
  }, undefined);
}

// Builds a selections map for estimateTotal(). When an options-model service
// has no optionId, `ambiguousPick` ("min" | "max") resolves it to the
// cheapest/priciest option instead of silently defaulting to the first one —
// that silent default previously made "give me an oil change price" quote
// only the conventional-oil price instead of the true option range.
function buildSelections(pricing, requested, brandTierId, ambiguousPick) {
  const selections = {};
  const unknownServiceIds = [];
  for (const item of requested) {
    const id = typeof item?.id === "string" ? item.id : "";
    const service = quotableServices(pricing).find((s) => s.id === id);
    if (!service) {
      if (id) unknownServiceIds.push(id);
      continue;
    }
    let optionId = typeof item?.optionId === "string" ? item.optionId : undefined;
    if (service.model === "options" && !optionId && ambiguousPick) {
      optionId = extremeOption(service.options, ambiguousPick)?.id;
    }
    const qty = Number(item?.qty);
    selections[id] = {
      selected: true,
      qty: Number.isFinite(qty) ? qty : undefined,
      optionId,
      brandTierId,
    };
  }
  return { selections, unknownServiceIds };
}

export function runPriceEstimateTool(pricing, args) {
  const vehicleClassId = pickId(pricing.vehicleClasses, args?.vehicleClass, "sedan");
  const brandTierId = pickId(pricing.brandTiers, args?.brandTier, "standard");
  const requested = Array.isArray(args?.services) ? args.services.slice(0, 10) : [];
  const currency = pricing.currency || "USD";

  const hasAmbiguousOption = requested.some((item) => {
    const service = quotableServices(pricing).find((s) => s.id === item?.id);
    return service?.model === "options" && typeof item?.optionId !== "string";
  });

  let low, high, lines, unknownServiceIds, hasSelection;

  if (hasAmbiguousOption) {
    // Span the full price range across the undecided option(s): the "low"
    // variant picks the cheapest option everywhere it's ambiguous, the
    // "high" variant picks the priciest — the real low/high is the min/max
    // across both, so the customer sees the true range instead of one option.
    const lowVariant = buildSelections(pricing, requested, brandTierId, "min");
    const highVariant = buildSelections(pricing, requested, brandTierId, "max");
    const lowResult = estimateTotal(pricing, vehicleClassId, lowVariant.selections);
    const highResult = estimateTotal(pricing, vehicleClassId, highVariant.selections);
    low = Math.min(lowResult.low, highResult.low);
    high = Math.max(lowResult.high, highResult.high);
    lines = highResult.lines;
    unknownServiceIds = lowVariant.unknownServiceIds;
    hasSelection = lowResult.hasSelection;
  } else {
    const { selections, unknownServiceIds: unk } = buildSelections(pricing, requested, brandTierId, null);
    const result = estimateTotal(pricing, vehicleClassId, selections);
    low = result.low;
    high = result.high;
    lines = result.lines;
    unknownServiceIds = unk;
    hasSelection = result.hasSelection;
  }

  return {
    ok: hasSelection,
    unknownServiceIds,
    currency,
    vehicleClass: vehicleClassId,
    brandTier: brandTierId,
    low,
    high,
    lowFormatted: formatMoney(low, currency),
    highFormatted: formatMoney(high, currency),
    lines: lines.map((line) => ({
      id: line.id,
      label: line.label?.en || line.label?.es || line.id,
      amount: Math.round(line.amount),
    })),
  };
}

// Bilingual fallback message built directly from the computed numbers, used
// only when the model's own phrasing doesn't faithfully relay the tool's
// low/high figures (or the phrasing call fails) — guarantees the customer
// never sees a number the tool didn't produce.
export function renderDeterministicEstimate(result, lang) {
  if (lang === "es") {
    return `Segun nuestros precios actuales, el estimado es de ${result.lowFormatted} a ${result.highFormatted}. Es solo un estimado; el precio final se confirma en el taller.`;
  }
  return `Based on our current pricing, that comes out to an estimate of ${result.lowFormatted}-${result.highFormatted}. This is just an estimate — the shop confirms the exact price in person.`;
}

// True if the reply text actually contains the tool's computed low/high
// numbers (as digit strings), regardless of currency formatting the model
// chose. Used to catch a model that ignored/misquoted the tool result.
export function replyMatchesComputedRange(content, result) {
  if (!content || !result?.ok) return false;
  const low = String(result.low);
  const high = String(result.high);
  return content.includes(low) && content.includes(high);
}
