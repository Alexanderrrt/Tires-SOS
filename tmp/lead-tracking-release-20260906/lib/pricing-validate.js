// Coerce + clamp an incoming pricing document to a safe shape before saving.
// Numbers become finite and >= 0; unknown fields are dropped. This runs on the
// server for the admin PUT so a malformed payload can't corrupt the store.

const num = (v, d = 0) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : d;
};
const str = (v) => (typeof v === "string" ? v : "");
const bilingual = (v) => ({ en: str(v?.en), es: str(v?.es) });

export function sanitizePricing(input) {
  if (!input || typeof input !== "object") throw new Error("invalid payload");

  const vehicleClasses = (Array.isArray(input.vehicleClasses) ? input.vehicleClasses : [])
    .map((c) => ({ id: str(c.id), label: bilingual(c.label), factor: num(c.factor, 1) }))
    .filter((c) => c.id);

  const brandTiers = (Array.isArray(input.brandTiers) ? input.brandTiers : [])
    .map((b) => ({ id: str(b.id), label: bilingual(b.label), factor: num(b.factor, 1) }))
    .filter((b) => b.id);

  const tierIds = new Set(brandTiers.map((b) => b.id));
  const tireBrands = (Array.isArray(input.tireBrands) ? input.tireBrands : [])
    .map((b) => ({ id: str(b.id), name: str(b.name).slice(0, 60), tier: str(b.tier) }))
    .filter((b) => b.id && b.name)
    .map((b) => ({ ...b, tier: tierIds.has(b.tier) ? b.tier : "standard" }));

  const services = (Array.isArray(input.services) ? input.services : [])
    .map((s) => {
      const base = {
        id: str(s.id),
        icon: str(s.icon),
        label: bilingual(s.label),
        model: ["perUnit", "labor", "options", "flat"].includes(s.model) ? s.model : "flat",
        appliesVehicleFactor: Boolean(s.appliesVehicleFactor),
        appliesBrandTier: Boolean(s.appliesBrandTier),
        chatQuotable: s.chatQuotable === false ? false : true,
      };
      if (base.model === "perUnit") {
        base.basePrice = num(s.basePrice);
        base.unitLabel = bilingual(s.unitLabel);
        base.qty = {
          min: num(s.qty?.min, 1),
          max: num(s.qty?.max, 4),
          default: num(s.qty?.default, 4),
        };
        base.fees = (Array.isArray(s.fees) ? s.fees : []).map((f) => ({
          label: bilingual(f.label),
          amount: num(f.amount),
          per: f.per === "unit" ? "unit" : "job",
        }));
      } else if (base.model === "labor") {
        base.partsBase = num(s.partsBase);
        base.laborHours = num(s.laborHours);
      } else if (base.model === "options") {
        base.options = (Array.isArray(s.options) ? s.options : []).map((o) => ({
          id: str(o.id),
          label: bilingual(o.label),
          price: num(o.price),
        }));
      } else {
        base.flatPrice = num(s.flatPrice);
      }
      return base;
    })
    .filter((s) => s.id);

  if (!services.length || !vehicleClasses.length) {
    throw new Error("pricing must have at least one service and one vehicle class");
  }

  return {
    laborRate: num(input.laborRate, 100),
    rangePct: Math.min(0.9, num(input.rangePct, 0.15)),
    currency: str(input.currency) || "USD",
    vehicleClasses,
    brandTiers,
    tireBrands,
    services,
    disclaimer: bilingual(input.disclaimer),
  };
}
