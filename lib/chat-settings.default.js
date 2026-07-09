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
    { en: "How much for brakes on my car?", es: "Cuanto cuesta revisar los frenos de mi carro?" },
    { en: "Do you offer financing?", es: "Ofrecen financiamiento?" },
  ],
  systemInstructions:
    "Collect one useful missing detail at a time. Prioritize vehicle, tire size, service needed, timing, name, and phone number. Keep answers concise and invite WhatsApp or a call when ready.",
};
