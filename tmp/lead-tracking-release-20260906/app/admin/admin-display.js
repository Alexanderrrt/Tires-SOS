const SERVICE_ES = {
  "Oil change": "Cambio de aceite",
  "Flat repair": "Reparación de llanta",
  "Tire rotation": "Rotación de llantas",
  "Wheel balancing": "Balanceo de ruedas",
  "TPMS service": "Servicio TPMS",
  Tires: "Llantas",
  Brakes: "Frenos",
  Alignment: "Alineación",
  Battery: "Batería",
  "Rims / wheels": "Rines / ruedas",
  Suspension: "Suspensión",
  Diagnostic: "Diagnóstico",
  Inspection: "Inspección",
  Maintenance: "Mantenimiento",
};

const SOURCE_ES = {
  "Quote chat": "Chat de cotización",
  "Site chat": "Chat del sitio",
  Manual: "Manual",
  WhatsApp: "WhatsApp",
  Yelp: "Yelp",
};

export function adminServiceLabel(value, lang) {
  return lang === "es" && SERVICE_ES[value] ? SERVICE_ES[value] : value;
}

export function adminSourceLabel(value, lang) {
  return lang === "es" && SOURCE_ES[value] ? SOURCE_ES[value] : value;
}
