export const DEFAULT_CHAT_SETTINGS = {
  title: { en: "Service Desk", es: "Servicio y Citas" },
  subtitle: {
    en: "Tell us the service you need. We can answer questions or help you book.",
    es: "Dinos qué servicio necesitas. Podemos responder tus preguntas o ayudarte a agendar.",
  },
  intro: {
    en: "Hi! What service can we help you with today?",
    es: "¡Hola! ¿Con qué servicio te podemos ayudar hoy?",
  },
  placeholder: {
    en: "Tell us the service or question...",
    es: "Cuéntanos qué servicio o pregunta tienes...",
  },
  quickPrompts: [
    { en: "I need tires.", es: "Necesito llantas." },
    { en: "I have a flat tire. Can you help today?", es: "Tengo una llanta ponchada. Me pueden ayudar hoy?" },
    { en: "Can I schedule an appointment?", es: "Puedo agendar una cita?" },
    { en: "How much for brakes on my car?", es: "Cuanto cuesta revisar los frenos de mi carro?" },
    { en: "Do you offer financing?", es: "Ofrecen financiamiento?" },
  ],
  systemInstructions:
    "For appointments, collect exactly four things in this order: service, vehicle year/make/model, name, and phone number. Ask for one missing item at a time. Never ask for quantity, tire size, tire brand, oil type, viscosity, trim, engine, or any other technical detail. Keep replies concise, warm, and natural. Once all four required items are present, move directly to available times.",
  disableEstimates: false,
};
