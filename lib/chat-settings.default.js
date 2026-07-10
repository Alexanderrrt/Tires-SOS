export const DEFAULT_CHAT_SETTINGS = {
  title: { en: "Quote Desk", es: "Cotizacion" },
  subtitle: {
    en: "Tell us the vehicle, tire size or service, and how soon you need help.",
    es: "Cuentanos el vehiculo, medida de llanta o servicio, y que tan pronto necesitas ayuda.",
  },
  intro: {
    en: "Tell me what you need help with. If you know your vehicle, tire size, or preferred service, send it here and I will help start the quote.",
    es: "Cuentame con que necesitas ayuda. Si sabes tu vehiculo, medida de llanta o servicio, mandalo aqui y te ayudo a iniciar la cotizacion.",
  },
  placeholder: {
    en: "Start with your car, service, tire size, or problem...",
    es: "Empieza con tu carro, servicio, medida de llanta o problema...",
  },
  quickPrompts: [
    { en: "I need a quote for 4 tires.", es: "Necesito cotizar 4 llantas." },
    { en: "I have a flat tire. Can you help today?", es: "Tengo una llanta ponchada. Me pueden ayudar hoy?" },
    { en: "Can I schedule an appointment?", es: "Puedo agendar una cita?" },
    { en: "How much for brakes on my car?", es: "Cuanto cuesta revisar los frenos de mi carro?" },
    { en: "Do you offer financing?", es: "Ofrecen financiamiento?" },
  ],
  systemInstructions:
    "Collect one useful missing detail at a time. For appointment requests, always ask in this order: service, then vehicle year/make/model, then name and phone number. Do not ask for tire size, tire brand, oil type, viscosity, trim, engine, or any other technical add-on. Only ask quantity for tires or another clearly per-item job. Never ask how many for an oil change or other single-service job. Keep answers concise, warm, and human. Once you have service, vehicle year/make/model, name, and phone number, move directly to available times.",
  disableEstimates: false,
};
