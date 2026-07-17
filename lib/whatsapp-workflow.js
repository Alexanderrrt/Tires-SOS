function foldedText(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function userMessages(messages) {
  return Array.isArray(messages) ? messages.filter((message) => message?.role === "user") : [];
}

function detectServiceInText(text) {
  const folded = foldedText(text);
  const checks = [
    [/(?:\bruido\b|sonido\s+(?:metalico|raro|extrano|fuerte)|\bvibracion\b|\bvibra\b|\bgolpeteo\b|\bchirrido\b|\brechina\b|\bmetalico\b|\bfuga\b|\bgotea\b|\bse calienta\b|\bsobrecalienta\b|luz\s+(?:en|del)\s+(?:el\s+)?tablero|\bcheck engine\b|\bwarning light\b|\bgrinding\b|\bsqueal(?:ing)?\b|\bknock(?:ing)?\b|\bvibration\b|\bnoise\b|\bleak(?:ing)?\b|\boverheat(?:ing)?\b|\bpulls?\s+to\b)/i, "Diagnostic"],
    [/(?:suena|ruido|sonido|vibra|vibracion|golpeteo|chirrido|rechinar).{0,60}(?:raro|extrano|inusual|diferente|mal)|(?:raro|extrano|inusual|diferente).{0,60}(?:ruido|sonido|vibracion|golpeteo|chirrido)|(?:strange|weird|unusual|odd).{0,60}(?:noise|sound|vibration|knock|squeal)|(?:noise|sound|vibration|knock|squeal).{0,60}(?:strange|weird|unusual|odd)/i, "Diagnostic"],
    [/(oil change|cambio de aceite|aceite)/i, "Oil change"],
    [/(flat|patch|plug|ponchad|reparacion de llanta)/i, "Flat repair"],
    [/(rotation|rotate|rotacion)/i, "Tire rotation"],
    [/(wheel balancing|balance wheels|balancing|balanceo)/i, "Wheel balancing"],
    [/(tpms|tire pressure sensor|sensor de presion)/i, "TPMS"],
    [/(\btire\b|\btires\b|\bllanta\b|\bllantas\b|tire size|medida)/i, "Tires"],
    [/(brake|brakes|freno|frenos)/i, "Brakes"],
    [/(alignment|alineacion)/i, "Alignment"],
    [/(battery|bateria)/i, "Battery"],
    [/(rim|wheel|rin|rines)/i, "Rims / wheels"],
    [/(suspension|shock|shocks|strut|struts|amortiguador)/i, "Suspension"],
    [/(inspection|inspect|inspeccion|revisar)/i, "Inspection"],
    [/(diagnostic|diagnostico)/i, "Diagnostic"],
    [/(maintenance|mantenimiento|tune[ -]?up|afinacion)/i, "Maintenance"],
  ];
  return checks.find(([pattern]) => pattern.test(folded))?.[1] || "";
}

function rejectsServiceMention(text) {
  const folded = foldedText(text);
  return (
    /\b(cual|que|what|which)\b.{0,28}\b(cambio de aceite|oil change|servicio|service)\b/.test(folded)
    || /\b(no sabes|no sabe|todavia no sabes|aun no sabes|you do not know|you dont know)\b.{0,30}\b(servicio|service)\b/.test(folded)
    || /\b(no dije|nunca dije|no mencione|i did not say|i didnt say|i never said)\b.{0,36}\b(cambio de aceite|oil change|servicio|service)\b/.test(folded)
    || /\b(no quiero|no necesito|no es|not|dont want|do not want)\b.{0,28}\b(cambio de aceite|oil change|llantas|tires|frenos|brakes|alineacion|alignment|servicio|service)\b/.test(folded)
  );
}

export function detectWhatsAppServiceState(messages = []) {
  let service = "";
  let rejected = false;
  for (const message of userMessages(messages)) {
    const text = message.content;
    const detected = detectServiceInText(text);
    if (rejectsServiceMention(text)) {
      const folded = foldedText(text);
      const correction = folded.match(/\b(?:pero|sino|but|instead)\b(.+)$/)?.[1]
        || folded.match(/\b(?:necesito|quiero|need|want)\b([^,.;!?]+)$/)?.[1]
        || "";
      service = detectServiceInText(correction);
      rejected = !service;
      continue;
    }
    if (detected) {
      service = detected;
      rejected = false;
    }
  }
  return { service, rejected };
}

export function detectWhatsAppService(messages = []) {
  return detectWhatsAppServiceState(messages).service;
}

function languageSignal(value) {
  const text = foldedText(value);
  const spanish = text.match(/\b(hola|cita|agendar|reservar|aceite|servicio|carro|vehiculo|gracias|quiero|quisiera|gustaria|necesito|solo|cual|que|pero|sabes|aun|todavia|nombre|por favor|si|no)\b/g)?.length || 0;
  const english = text.match(/\b(hello|hi|appointment|book|schedule|oil|service|car|vehicle|thanks|want|would|need|which|what|but|know|still|name|please|yes|no)\b/g)?.length || 0;
  if (spanish > english) return "es";
  if (english > spanish) return "en";
  return "";
}

export function detectWhatsAppLanguage(latestText, history = []) {
  const latest = languageSignal(latestText);
  if (latest) return latest;
  for (const message of [...history].reverse()) {
    const detected = languageSignal(message?.content);
    if (detected) return detected;
  }
  return "en";
}

export function hasWhatsAppAppointmentIntent(history = []) {
  return userMessages(history).some((message) => /\b(appointment|book|booking|schedule|cita|agendar|reservar|programar)\b/i.test(foldedText(message.content)));
}

export function nextWhatsAppBookingQuestion(fields = {}, lang = "en", latestText = "") {
  if (!fields.service) {
    const unsure = /\b(no estoy seguro|no estoy segura|no se|no tengo idea|not sure|i dont know|i do not know|no idea)\b/i.test(foldedText(latestText));
    if (unsure) {
      return lang === "es"
        ? "No hay problema; no necesitas saber el nombre del servicio. Cuéntame qué notas en el carro, como un ruido, vibración, luz en el tablero o pérdida de aire, y te ayudo a identificar qué revisión necesitas."
        : "No problem; you don't need to know the service name. Tell me what the car is doing, such as a noise, vibration, dashboard light, or air loss, and I'll help identify the right inspection.";
    }
    return lang === "es" ? "Claro. ¿Qué servicio necesitas?" : "Of course. What service do you need?";
  }
  if (!fields.vehicle) {
    if (fields.service === "Diagnostic") {
      return lang === "es"
        ? "Gracias, eso ayuda. Vamos a revisar ese síntoma para encontrar la causa. ¿Cuál es el año, la marca y el modelo de tu vehículo?"
        : "Thanks, that helps. We'll inspect that symptom to find the cause. What is your vehicle's year, make, and model?";
    }
    return lang === "es" ? "¿Cuál es el año, la marca y el modelo de tu vehículo?" : "What is your vehicle's year, make, and model?";
  }
  if (!fields.customerName) return lang === "es" ? "¿Cuál es tu nombre?" : "What is your name?";
  return "";
}
