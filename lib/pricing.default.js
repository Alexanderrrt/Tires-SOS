// Default / seed pricing for the quote estimator. This is the single source
// of truth for prices until a Supabase store is connected; after that, the
// admin panel edits a copy of this shape in the database.
//
// All money is in whole USD. The estimate engine (lib/quote.js) reads this.

export const DEFAULT_PRICING = {
  laborRate: 120, // $/hour
  rangePct: 0.15, // estimate spread: shown as ±15% around the subtotal
  currency: "USD",

  // Vehicle variation is captured by a class factor (not a full model DB).
  // sedan = 1.0 is the baseline every base price is quoted against.
  vehicleClasses: [
    { id: "compact", label: { en: "Compact / Coupe", es: "Compacto / Coupé" }, factor: 0.9 },
    { id: "sedan", label: { en: "Sedan", es: "Sedán" }, factor: 1.0 },
    { id: "suv_truck", label: { en: "SUV / Truck", es: "SUV / Camioneta" }, factor: 1.25 },
    { id: "luxury_perf", label: { en: "Luxury / Performance", es: "Lujo / Alto Desempeño" }, factor: 1.6 },
  ],

  services: [
    {
      id: "new-tires",
      icon: "tire",
      label: { en: "New Tires", es: "Llantas Nuevas" },
      model: "perUnit",
      appliesVehicleFactor: true,
      basePrice: 130, // per tire, sedan baseline
      unitLabel: { en: "tires", es: "llantas" },
      qty: { min: 1, max: 4, default: 4 },
      fees: [
        { label: { en: "Mount & balance", es: "Montaje y balanceo" }, amount: 25, per: "unit" },
        { label: { en: "Disposal", es: "Desecho" }, amount: 4, per: "unit" },
      ],
    },
    {
      id: "flat-repair",
      icon: "wrench",
      label: { en: "Flat Repair", es: "Reparación de Ponchadura" },
      model: "flat",
      flatPrice: 30,
      appliesVehicleFactor: false,
    },
    {
      id: "alignment",
      icon: "alignment",
      label: { en: "Wheel Alignment", es: "Alineación" },
      model: "flat",
      flatPrice: 90,
      appliesVehicleFactor: true,
    },
    {
      id: "brakes",
      icon: "brakes",
      label: { en: "Brakes (per axle)", es: "Frenos (por eje)" },
      model: "labor",
      appliesVehicleFactor: true,
      partsBase: 110, // pads + rotors, sedan baseline
      laborHours: 1.5, // sedan baseline; scaled by class factor
    },
    {
      id: "oil-change",
      icon: "oil",
      label: { en: "Oil Change", es: "Cambio de Aceite" },
      model: "options",
      appliesVehicleFactor: false,
      options: [
        { id: "conventional", label: { en: "Conventional", es: "Convencional" }, price: 55 },
        { id: "synthetic-blend", label: { en: "Synthetic Blend", es: "Semi-Sintético" }, price: 75 },
        { id: "full-synthetic", label: { en: "Full Synthetic", es: "Sintético" }, price: 95 },
      ],
    },
    {
      id: "battery",
      icon: "battery",
      label: { en: "Battery", es: "Batería" },
      model: "flat",
      flatPrice: 180,
      appliesVehicleFactor: true,
    },
  ],

  disclaimer: {
    en: "This is an estimate only. Final price is confirmed at the shop after we check your vehicle.",
    es: "Esto es solo un estimado. El precio final se confirma en el taller después de revisar su vehículo.",
  },
};
