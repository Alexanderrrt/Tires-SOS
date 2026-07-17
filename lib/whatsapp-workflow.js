function foldedText(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function userMessages(messages) {
  return Array.isArray(messages) ? messages.filter((message) => message?.role === "user") : [];
}

function detectServiceInText(text) {
  const folded = foldedText(text);
  const checks = [
    [/(?:\bno (?:prende|enciende|arranca)\b|(?:doy|dar|giro|girar|vuelta).{0,30}\bllave\b.{0,35}(?:no pasa nada|nada)|\bllave\b.{0,35}(?:no pasa nada|nada)|\b(?:won'?t|will not|doesn'?t|does not) start\b|turn.{0,30}\bkey\b.{0,35}(?:nothing happens|nothing)|\bno crank\b|\bcranks? but (?:won'?t|will not|doesn'?t|does not) start\b)/i, "Diagnostic"],
    [/(?:\bruido\b|sonido\s+(?:metalico|raro|extrano|fuerte)|\bvibracion\b|\bvibra\b|\bgolpeteo\b|\bchirrido\b|\brechina\b|\bmetalico\b|\bfuga\b|\bgotea\b|\bhumo\b|\bvapor\b|olor\s+(?:a\s+)?quemado|huele.{0,20}(?:a\s+)?quemado|\bse calienta\b|\bsobrecalienta\b|luz\s+(?:en|del)\s+(?:el\s+)?tablero|\bcheck engine\b|\bwarning light\b|\bgrinding\b|\bsqueal(?:ing)?\b|\bknock(?:ing)?\b|\bvibration\b|\bnoise\b|\bsmoke\b|\bsteam\b|burning\s+smell|smell.{0,20}burning|\bleak(?:ing)?\b|\boverheat(?:ing)?\b|\bpulls?\s+to\b)/i, "Diagnostic"],
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
    if (message?.role !== "user") continue;
    const detected = languageSignal(message?.content);
    if (detected) return detected;
  }
  return "en";
}

export function hasWhatsAppAppointmentIntent(history = []) {
  return userMessages(history).some((message) => /\b(appointment|book|booking|schedule|cita|agendar|reservar|programar)\b/i.test(foldedText(message.content)));
}

export function hasWhatsAppRescheduleIntent(value) {
  return /\b(reschedule|change|move|different time|different date|reprogramar|cambiar|mover|otro horario|otra fecha)\b.{0,40}\b(appointment|booking|time|date|cita|reserva|horario|fecha)\b/i.test(foldedText(value))
    || /\b(appointment|booking|time|date|cita|reserva|horario|fecha)\b.{0,40}\b(reschedule|change|move|reprogramar|cambiar|mover)\b/i.test(foldedText(value));
}

export function assistantAskedForName(value) {
  return /(?:what(?:'?s| is) your name|your name\??|cual es tu nombre|como te llamas)/i.test(foldedText(value));
}

export function isWhatsAppNonNameReply(value) {
  return /^(?:gracias|muchas gracias|thank you|thanks|ok|okay|perfecto|perfect|claro|sure|bien|good|listo|ready|dale|sounds good|esta bien|all good|de nada|por favor|please)[\s!?.]*$/i.test(foldedText(value).trim());
}

export function isWhatsAppNameRefusal(value) {
  const text = foldedText(value).trim();
  return /(?:prefiero|preferiria|no quiero|no voy a).{0,30}(?:dar|decir|compartir).{0,20}(?:mi )?nombre/.test(text)
    || /(?:i(?:'d| would) rather not|i do not want|i don't want|prefer not to).{0,35}(?:give|share|say).{0,20}(?:my )?name/.test(text);
}

function greetingOnly(value) {
  return /^(?:hola|hello|hi|hey|buenas|buenos dias|buenas tardes|buenas noches)[\s!?.]*$/i.test(foldedText(value).trim());
}

export function whatsAppGreetingReply(value, lang) {
  if (!greetingOnly(value)) return "";
  return lang === "es"
    ? "¡Hola! Gracias por contactar a Tires SOS Rescue. ¿Cómo puedo ayudarte hoy?"
    : "Hi! Thanks for contacting Tires SOS Rescue. How can I help you today?";
}

export function whatsAppStaleSlotReply(value, offeredSlots, lang) {
  if (!/^\s*[1-9]\s*$/.test(String(value || "")) || (Array.isArray(offeredSlots) && offeredSlots.length)) return "";
  return lang === "es"
    ? "No tengo una lista de horarios activa en este chat. Empecemos de nuevo: ¿qué servicio necesitas?"
    : "I don't have an active list of appointment times in this chat. Let's start again: what service do you need?";
}

function normalizedReply(value) {
  return foldedText(value).replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

export function detectWhatsAppHandoff(history = [], { appointmentConfirmed = false } = {}) {
  const users = Array.isArray(history) ? history.filter((message) => message?.role === "user" && message?.content) : [];
  const assistants = Array.isArray(history) ? history.filter((message) => message?.role === "assistant" && message?.content) : [];
  const latest = foldedText(users.at(-1)?.content).trim();
  if (!latest) return { shouldHandoff: false, reason: "" };

  if (/\b(?:human|representative|agent|manager|humano|representante|agente|asesor|encargado|gerente)\b/i.test(latest)
    || /(?:hablar|comunicarme|conectar|pasame|quiero hablar).{0,35}(?:alguien|persona|representante|agente|asesor|encargado|gerente)/i.test(latest)
    || /(?:talk|speak|connect).{0,25}(?:someone|person|representative|agent|manager)/i.test(latest)) {
    return { shouldHandoff: true, reason: "Customer requested a human representative" };
  }

  if (appointmentConfirmed && greetingOnly(latest)) {
    return { shouldHandoff: true, reason: "Customer needs more help after a confirmed appointment" };
  }

  const recentGreetings = users.slice(-4).filter((message) => greetingOnly(message.content)).length;
  if (greetingOnly(latest) && recentGreetings >= 2) {
    return { shouldHandoff: true, reason: "Customer repeated a greeting to get continued attention" };
  }

  if (/\b(?:no me entiendes|no entiende|no ayudas|no sirve|otra vez|sigues preguntando|this is not helping|you do not understand|you dont understand|same question|again)\b/i.test(latest)) {
    return { shouldHandoff: true, reason: "Customer expressed frustration with the automated conversation" };
  }

  const lastReplies = assistants.slice(-2).map((message) => normalizedReply(message.content));
  const botRepeatedItself = lastReplies.length === 2 && lastReplies[0] && lastReplies[0] === lastReplies[1];
  if (botRepeatedItself && /^(?:\?{2,}|help|ayuda|hola|hello|hi|hey)$/i.test(latest.replace(/\s+/g, ""))) {
    return { shouldHandoff: true, reason: "Customer is stuck in a repeated bot response" };
  }

  return { shouldHandoff: false, reason: "" };
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
    const latest = foldedText(latestText);
    if (/\b(humo|fuego|incendio|quemado|sobrecalienta|smoke|fire|burning|overheat(?:ing)?)\b/.test(latest)) {
      return lang === "es"
        ? "Por seguridad, apaga el vehículo si está encendido y no sigas conduciendo. ¿Cuál es el año, la marca y el modelo?"
        : "For safety, turn the vehicle off if it's running and don't keep driving. What is the year, make, and model?";
    }
    if (/(?:sin frenos|frenos?.{0,24}(?:no funcionan|fallaron)|pedal.{0,20}(?:al fondo|hasta el piso)|no brakes|brakes?.{0,24}(?:failed|not working)|brake pedal.{0,20}(?:floor|bottom))/i.test(latest)) {
      return lang === "es"
        ? "No conduzcas el vehículo. Si puedes hacerlo con seguridad, estaciónalo y solicita asistencia. ¿Cuál es el año, la marca y el modelo?"
        : "Do not drive the vehicle. If you can do so safely, park it and request assistance. What is the year, make, and model?";
    }
    if (/\b(ponchad[ao]|revent(?:o|ada)|llanta baja|flat tire|blowout|blown tire)\b/i.test(latest)) {
      return lang === "es"
        ? "Detente en un lugar seguro y no conduzcas sobre la llanta ponchada. ¿Cuál es el año, la marca y el modelo?"
        : "Pull over somewhere safe and don't drive on the flat tire. What is the year, make, and model?";
    }
    if (fields.service === "Diagnostic") {
      return lang === "es"
        ? "Gracias, eso ayuda. Vamos a revisar ese síntoma para encontrar la causa. ¿Cuál es el año, la marca y el modelo de tu vehículo?"
        : "Thanks, that helps. We'll inspect that symptom to find the cause. What is your vehicle's year, make, and model?";
    }
    return lang === "es" ? "¿Cuál es el año, la marca y el modelo de tu vehículo?" : "What is your vehicle's year, make, and model?";
  }
  if (!fields.customerName) {
    if (isWhatsAppNameRefusal(latestText)) {
      return lang === "es"
        ? "No hay problema. Para reservar solo necesitamos un primer nombre de contacto; no tiene que ser tu nombre completo. Si prefieres, también puedo pedir que un representante continúe contigo."
        : "No problem. To book, we only need a contact first name; it doesn't have to be your full name. If you prefer, I can also ask a representative to continue with you.";
    }
    return lang === "es" ? "¿Cuál es tu nombre?" : "What is your name?";
  }
  return "";
}
