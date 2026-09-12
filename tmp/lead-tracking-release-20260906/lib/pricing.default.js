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

  // Brand quality tiers. For parts where the brand itself swings price far more
  // than the vehicle does (tires, rims, batteries), this factor stacks on top
  // of the vehicle class factor for any service with appliesBrandTier: true.
  // "standard" (factor 1.0) is the baseline every base price is quoted against.
  brandTiers: [
    { id: "economy", label: { en: "Economy brand", es: "Marca económica" }, factor: 0.75 },
    { id: "standard", label: { en: "Standard brand", es: "Marca estándar" }, factor: 1.0 },
    { id: "premium", label: { en: "Premium brand", es: "Marca premium" }, factor: 1.45 },
  ],

  // Actual tire brands carried in the shop, each mapped to a brand tier above.
  // Lets the chatbot recognize a named brand ("I want Michelin") and quote
  // using that tier's factor automatically, without asking the customer to
  // pick economy/standard/premium themselves.
  tireBrands: [
    { id: "ironman", name: "Ironman", tier: "economy" },
    { id: "general", name: "General", tier: "economy" },
    { id: "kumho", name: "Kumho", tier: "economy" },
    { id: "laufenn", name: "Laufenn", tier: "economy" },
    { id: "nexen", name: "Nexen", tier: "standard" },
    { id: "falken", name: "Falken", tier: "standard" },
    { id: "gt-radial", name: "GT Radial", tier: "standard" },
    { id: "hankook", name: "Hankook", tier: "standard" },
    { id: "dunlop", name: "Dunlop", tier: "standard" },
    { id: "toyo", name: "Toyo", tier: "standard" },
    { id: "continental", name: "Continental", tier: "premium" },
    { id: "nokian", name: "Nokian", tier: "premium" },
  ],

  services: [
    {
      id: "new-tires",
      icon: "tire",
      label: { en: "New Tires", es: "Llantas Nuevas" },
      model: "perUnit",
      appliesVehicleFactor: true,
      appliesBrandTier: true,
      basePrice: 130, // per tire, sedan + standard-brand baseline
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
      id: "tire-rotation",
      icon: "rotation",
      label: { en: "Tire Rotation", es: "Rotación de Llantas" },
      model: "flat",
      flatPrice: 25,
      appliesVehicleFactor: false,
    },
    {
      id: "wheel-balancing",
      icon: "balance",
      label: { en: "Wheel Balancing", es: "Balanceo" },
      model: "perUnit",
      appliesVehicleFactor: false,
      basePrice: 15, // per wheel
      unitLabel: { en: "wheels", es: "ruedas" },
      qty: { min: 1, max: 4, default: 4 },
      fees: [],
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
      id: "rims",
      icon: "rim",
      label: { en: "Rims", es: "Rines" },
      model: "perUnit",
      appliesVehicleFactor: true,
      appliesBrandTier: true,
      basePrice: 110, // per rim, sedan + standard-brand baseline — varies widely by style/size
      unitLabel: { en: "rims", es: "rines" },
      qty: { min: 1, max: 4, default: 4 },
      fees: [
        { label: { en: "Mount & balance", es: "Montaje y balanceo" }, amount: 25, per: "unit" },
      ],
    },
    {
      id: "tpms",
      icon: "tpms",
      label: { en: "TPMS Sensor", es: "Sensor TPMS (presión)" },
      model: "perUnit",
      appliesVehicleFactor: false,
      basePrice: 65, // per sensor, installed & programmed
      unitLabel: { en: "sensors", es: "sensores" },
      qty: { min: 1, max: 4, default: 1 },
      fees: [],
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
      id: "suspension",
      icon: "suspension",
      label: { en: "Shocks & Struts (per pair)", es: "Amortiguadores (por par)" },
      model: "labor",
      appliesVehicleFactor: true,
      partsBase: 140, // pair of shocks/struts, sedan baseline
      laborHours: 1.75, // sedan baseline; scaled by class factor
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
      appliesBrandTier: true,
      // Battery pricing varies too much by group size, CCA, warranty, and
      // vehicle to give a trustworthy chat estimate — the chatbot must never
      // quote this one; the shop confirms in person or through WhatsApp.
      chatQuotable: false,
    },
  ],

  disclaimer: {
    en: "This is an estimate only. Final price is confirmed at the shop after we check your vehicle.",
    es: "Esto es solo un estimado. El precio final se confirma en el taller después de revisar su vehículo.",
  },
};
