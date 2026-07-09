// Central place for all business facts and bilingual copy.
// Update here to change anything shown on the site.

export const SITE = {
  name: "Tires SOS Rescue",
  nameShort: "Tires SOS",
  // Used for canonical URLs, sitemap, robots and Open Graph.
  // UPDATE this once the real domain is attached in Vercel.
  url: "https://tires-sos.vercel.app",
  tagline: {
    en: "Tire specialists. Fast service, best prices in the Bay Area. We speak your language.",
    es: "Especialistas en llantas. Servicio rápido, los mejores precios del Bay Area. Aquí te atendemos como en casa.",
  },
  phone: "(408) 332-8962",
  phoneHref: "tel:+14083328962",
  // WhatsApp number in international format, digits only (used by wa.me).
  // Confirm this line is WhatsApp-enabled, or replace with the shop's WhatsApp.
  whatsapp: "14083328962",
  locations: [
    {
      id: "taylor",
      line1: "623 E Taylor St",
      line2: "San José, CA 95112",
      full: "623 E Taylor St, San José, CA 95112",
      mapsHref:
        "https://www.google.com/maps/dir/?api=1&destination=623+E+Taylor+St,+San+Jose,+CA+95112",
      mapsEmbedSrc:
        "https://www.google.com/maps?q=623+E+Taylor+St,+San+Jose,+CA+95112&output=embed",
      postalCode: "95112",
    },
    {
      id: "tenth",
      line1: "1407 N 10th St",
      line2: "San José, CA 95112",
      full: "1407 N 10th St, San José, CA 95112",
      mapsHref:
        "https://www.google.com/maps/dir/?api=1&destination=1407+N+10th+St,+San+Jose,+CA+95112",
      mapsEmbedSrc:
        "https://www.google.com/maps?q=1407+N+10th+St,+San+Jose,+CA+95112&output=embed",
      postalCode: "95112",
    },
  ],

  social: {
    instagram: "https://www.instagram.com/tiressosrescue/",
    tiktok: "https://www.tiktok.com/@tiressosrescue",
    facebook: "https://www.facebook.com/61578329462658/",
  },
  // Hours in 24h time, per weekday (0 = Sunday ... 6 = Saturday). null = closed.
  hours: [
    { day: 0, label: { en: "Sunday", es: "Domingo" }, open: null, close: null },
    { day: 1, label: { en: "Monday", es: "Lunes" }, open: "09:00", close: "18:00" },
    { day: 2, label: { en: "Tuesday", es: "Martes" }, open: "09:00", close: "18:00" },
    { day: 3, label: { en: "Wednesday", es: "Miércoles" }, open: "09:00", close: "18:00" },
    { day: 4, label: { en: "Thursday", es: "Jueves" }, open: "09:00", close: "18:00" },
    { day: 5, label: { en: "Friday", es: "Viernes" }, open: "09:00", close: "18:00" },
    { day: 6, label: { en: "Saturday", es: "Sábado" }, open: "09:00", close: "17:00" },
  ],
};

export const SERVICES = [
  {
    id: "new-tires",
    icon: "tire",
    image: "/services/new-tires.jpg",
    title: { en: "New Tires", es: "Llantas Nuevas" },
    desc: {
      en: "All major brands and sizes, at the best prices in the Bay Area.",
      es: "Todas las marcas y medidas principales, a los mejores precios del Bay Area.",
    },
  },
  {
    id: "flat-repair",
    icon: "wrench",
    image: "/services/flat-repair.jpg",
    title: { en: "Flat Repair", es: "Reparación de Ponchaduras" },
    desc: {
      en: "Fast, reliable patch and plug repairs while you wait.",
      es: "Reparaciones rápidas y confiables mientras usted espera.",
    },
  },
  {
    id: "alignment",
    icon: "alignment",
    image: "/services/alignment.jpg",
    title: { en: "Wheel Alignment", es: "Alineación" },
    desc: {
      en: "Precise alignment to extend tire life and improve handling.",
      es: "Alineación precisa para prolongar la vida de sus llantas y mejorar el manejo.",
    },
  },
  {
    id: "brakes",
    icon: "brakes",
    image: "/services/brakes.jpg",
    title: { en: "Brakes", es: "Frenos" },
    desc: {
      en: "Pads, rotors, and full brake inspections done right.",
      es: "Pastillas, discos e inspecciones completas de frenos.",
    },
  },
  {
    id: "oil-change",
    icon: "oil",
    image: "/services/oil-change.jpg",
    title: { en: "Oil Change", es: "Cambio de Aceite" },
    desc: {
      en: "Quick, affordable oil changes to keep your engine healthy.",
      es: "Cambios de aceite rápidos y económicos para su motor.",
    },
  },
  {
    id: "batteries",
    icon: "battery",
    image: "/services/batteries.jpg",
    title: { en: "Batteries", es: "Baterías" },
    desc: {
      en: "Free testing and same-day battery replacement.",
      es: "Prueba gratis y reemplazo de batería el mismo día.",
    },
  },
  {
    id: "rims",
    icon: "rim",
    image: "/services/rims.jpg",
    title: { en: "Rims", es: "Rines" },
    desc: {
      en: "New rims to fit your ride and your budget.",
      es: "Rines nuevos para su vehículo y su presupuesto.",
    },
  },
];

// Strings for the scrolling marquee strip. Deliberately mixed EN/ES —
// it reads as one bilingual banner, so it does not switch with the toggle.
export const MARQUEE_ITEMS = [
  "Llantas Nuevas",
  "Brakes",
  "Alineación",
  "Oil Change",
  "Rines",
  "Batteries",
  "Flat Repair",
  "Best Prices in the Bay Area",
  "Snap Finance Available",
  "Afterpay Available",
];

// Instagram reels featured in the "From the Shop" section.
// Paste new reel permalinks here to rotate the featured content.
export const REELS = [
  "https://www.instagram.com/reel/DaQ2UFdSpnK/",
  "https://www.instagram.com/reel/DZ7-m7PztjQ/",
  "https://www.instagram.com/reel/DZsjXNexI8I/",
  "https://www.instagram.com/reel/DZWBzaGRmS8/",
];

export const OWNERS_RIDE = {
  kicker: { en: "Give your car a little treat", es: "Dale un gusto a tu carrito" },
  title: { en: "BMW M3 Competition", es: "BMW M3 Competition" },
  body: {
    en: "Every car that rolls into the shop gets treated the exact same way. Your ride is our ride.",
    es: "Cada carro que entra al taller recibe exactamente el mismo trato. Tu carro es nuestro carro, parce.",
  },
};

export const CHAT = {
  launcher: { en: "Chat", es: "Chat" },
  launcherSub: { en: "Ask the shop", es: "Pregunta al taller" },
  title: { en: "Real Shop Help", es: "Ayuda Real del Taller" },
  subtitle: {
    en: "Talk to me like you would at the counter. I�ll keep it friendly, direct, and human.",
    es: "H�blame como si estuvieras en el mostrador. Te responder� de forma amable, directa y humana.",
  },
  fastAnswers: { en: "Fast answers", es: "Respuestas r�pidas" },
  humanStyle: { en: "Human-style chat", es: "Chat con trato humano" },
  callUs: { en: "Call us", es: "Ll�manos" },
  whatsapp: { en: "WhatsApp", es: "WhatsApp" },
  openChat: { en: "Open chat", es: "Abrir chat" },
  close: { en: "Close chat", es: "Cerrar chat" },
  promptHours: { en: "What are your hours today?", es: "�Cu�l es su horario hoy?" },
  promptServices: { en: "What services do you offer?", es: "�Qu� servicios ofrecen?" },
  promptPrice: { en: "How much is a flat repair?", es: "�Cu�nto cuesta una reparaci�n de ponchadura?" },
  promptSpanish: { en: "Hablas espa�ol?", es: "�Hablas espa�ol?" },
  placeholder: {
    en: "Ask a question about your car...",
    es: "Haz una pregunta sobre tu carro...",
  },
  send: { en: "Send", es: "Enviar" },
  typing: { en: "Answering like a real person...", es: "Respondiendo como una persona real..." },
  fallback: {
    en: "I couldn�t reach the chat service just now. Please call the shop or try again in a moment.",
    es: "No pude conectar con el chat por ahora. Llama al taller o intenta de nuevo en un momento.",
  },
  intro: {
    en: "Hey, I�m here at the shop desk with you. Ask me anything about tires, brakes, alignment, oil changes, batteries, rims, hours, location, or walk-in help.",
    es: "Hola, estoy aqu� en el mostrador contigo. Preg�ntame sobre llantas, frenos, alineaci�n, cambio de aceite, bater�as, rines, horario, ubicaci�n o atenci�n sin cita.",
  },
  modeLabel: { en: "Shop helper", es: "Ayudante del taller" },
};

export const TESTIMONIALS = [
  {
    quote: {
      en: "Fast, friendly service and fair prices — got a flat fixed in no time.",
      es: "Servicio rápido y amable a precios justos — me arreglaron una ponchadura en un momento.",
    },
    author: "Yelp review",
  },
  {
    quote: {
      en: "Family-owned shop that actually treats you right. My go-to for tires now.",
      es: "Negocio familiar que de verdad te trata bien. Ahora es mi lugar de confianza para llantas.",
    },
    author: "Yelp review",
  },
  {
    quote: {
      en: "Best tire prices I found in San José, and they speak Spanish too.",
      es: "Los mejores precios de llantas que encontré en San José, y también hablan español.",
    },
    author: "Yelp review",
  },
];

export const COPY = {
  nav: {
    services: { en: "Services", es: "Servicios" },
    gallery: { en: "Gallery", es: "Galería" },
    location: { en: "Location", es: "Ubicación" },
    reviews: { en: "Reviews", es: "Reseñas" },
    quote: { en: "Get a Quote", es: "Cotizar" },
    callNow: { en: "Call Now", es: "Llamar" },
  },
  quote: {
    heading: { en: "Instant Price Estimate", es: "Estimado de Precio Instantáneo" },
    sub: {
      en: "Pick your vehicle and services for a ballpark price. We confirm the exact price at the shop.",
      es: "Elija su vehículo y servicios para un precio aproximado. Confirmamos el precio exacto en el taller.",
    },
      vehicleStep: { en: "1. Your vehicle", es: "1. Su vehículo" },
      vehicleMakeLabel: { en: "Brand", es: "Marca" },
      vehicleModelLabel: { en: "Model", es: "Modelo" },
      vehicleYearLabel: { en: "Year", es: "Año" },
      vehicleClassLabel: { en: "Vehicle type", es: "Tipo de vehículo" },
      vehicleTextLabel: { en: "Describe your vehicle", es: "Describe tu vehículo" },
      vehicleTextPlaceholder: { en: "e.g. 2019 Toyota Camry", es: "ej. 2019 Toyota Camry" },
    servicesStep: { en: "2. What do you need?", es: "2. ¿Qué necesita?" },
    qtyLabel: { en: "Quantity", es: "Cantidad" },
    estimateLabel: { en: "Estimated total", es: "Total estimado" },
    emptyState: {
      en: "Select one or more services to see your estimate.",
      es: "Seleccione uno o más servicios para ver su estimado.",
    },
    send: { en: "Send to shop on WhatsApp", es: "Enviar al taller por WhatsApp" },
    ctaFromHome: { en: "Get an instant estimate", es: "Obtenga un estimado instantáneo" },
  },
  status: {
    open: { en: "Open now", es: "Abierto ahora" },
    closed: { en: "Closed", es: "Cerrado" },
  },
  hero: {
    kicker: { en: "San José, CA", es: "San José, CA" },
    callNow: { en: "Call Now", es: "Llamar Ahora" },
    directions: { en: "Get Directions", es: "Cómo Llegar" },
    note: {
      en: "Walk-ins welcome — no appointment needed. Shop service only.",
      es: "Sin cita, sin problema — llegá cuando quieras. Servicio solo en tienda.",
    },
    alignment: {
      badge: { en: "Our rack, in action", es: "Nuestra rampa en acción" },
      kicker: { en: "Our key equipment", es: "Nuestro equipo estrella" },
      title: {
        en: "Specialized Computerized Alignment Machine",
        es: "Máquina Especializada de Alineación Computarizada",
      },
      body: {
        en: "The heart of our shop. Our precision alignment system measures every angle digitally, so your car drives straight, your tires last longer, and you save on gas.",
        es: "El corazón de nuestro taller. Nuestro sistema de alineación de precisión mide cada ángulo digitalmente, para que tu carro vaya derecho, tus llantas duren más y ahorres gasolina.",
      },
      points: {
        en: ["Digital precision on every angle", "Sedans, SUVs & trucks", "Longer tire life, better MPG"],
        es: ["Precisión digital en cada ángulo", "Sedanes, SUVs y camionetas", "Llantas que duran más, menos gasolina"],
      },
      cta: { en: "Book an alignment", es: "Agenda tu alineación" },
      ctaSecondary: { en: "All services", es: "Todos los servicios" },
    },
    afterpay: {
      en: "Snap Finance & Afterpay available — flexible payments on your terms",
      es: "Snap Finance y Afterpay disponibles — pagos flexibles a tu manera",
    },
  },
  services: {
    heading: { en: "What We Do", es: "Lo Que Hacemos" },
    sub: {
      en: "Tap a service to learn more.",
      es: "Toque un servicio para más información.",
    },
  },
  gallery: {
    heading: { en: "From the Shop", es: "Desde el Taller" },
    sub: {
      en: "A look at our work. Follow us on Instagram for daily updates.",
      es: "Un vistazo a nuestro trabajo. Síganos en Instagram para actualizaciones diarias.",
    },
  },
  location: {
    heading: { en: "Visit Us", es: "Visítenos" },
    hoursTitle: { en: "Hours", es: "Horario" },
    closedLabel: { en: "Closed", es: "Cerrado" },
  },
  reviews: {
    heading: { en: "What Customers Say", es: "Lo Que Dicen Nuestros Clientes" },
  },
  promos: {
    heading: { en: "Deals & Programs", es: "Ofertas y Programas" },
    sub: {
      en: "Flexible financing and rewards to keep you on the road.",
      es: "Financiamiento flexible y recompensas para mantenerte en el camino.",
    },
    financeTitle: { en: "Buy Now, Pay Later", es: "Compra Ahora, Paga Después" },
    financeSub: {
      en: "Snap Finance & Afterpay available. Snap Finance approvals from $300 to $5,000. Afterpay lets you split purchases into 4 easy payments. No perfect credit needed.",
      es: "Snap Finance y Afterpay disponibles. Snap Finance con aprobaciones desde $300 hasta $5,000. Afterpay te permite dividir tus compras en 4 pagos fáciles. Sin necesidad de crédito perfecto.",
    },
    financeCta: { en: "Ask about financing", es: "Pregunta por financiamiento" },
    loyaltyTitle: { en: "Loyalty Card", es: "Tarjeta de Fidelidad" },
    loyaltySub: {
      en: "Get your 5th oil change FREE. Every oil change includes fluid top-off, filter, and tire pressure check.",
      es: "Tu 5to cambio de aceite GRATIS. Cada cambio incluye llenado de líquidos, filtro y calibración de neumáticos.",
    },
    loyaltyCta: { en: "Ask for your card", es: "Pide tu tarjeta" },
    driverTitle: { en: "Driver Program", es: "Programa del Conductor" },
    driverSub: {
      en: "4 new tires for just $340 — includes mount, balance, and alignment. Everything your car needs in one deal.",
      es: "4 llantas nuevas por solo $340 — incluye montaje, balanceo y alineación. Todo lo que tu carro necesita en un solo paquete.",
    },
    driverPrice: "$340",
    driverIncludes: {
      en: ["4 new tires", "Mount & balance", "Wheel alignment"],
      es: ["4 llantas nuevas", "Montaje y balanceo", "Alineación"],
    },
    driverCta: { en: "Claim this deal", es: "Aprovecha esta oferta" },
  },
  footer: {
    rights: {
      en: "All rights reserved.",
      es: "Todos los derechos reservados.",
    },
    followUs: { en: "Follow us", es: "Síganos" },
  },
  admin: {
    login: {
      title: { en: "Admin — Pricing", es: "Admin — Precios" },
      intro: {
        en: "Enter the admin password to edit quote pricing.",
        es: "Ingresa la contraseña de administrador para editar los precios.",
      },
      passwordPlaceholder: { en: "Password", es: "Contraseña" },
      passwordAria: { en: "Admin password", es: "Contraseña de administrador" },
      signIn: { en: "Sign in", es: "Iniciar sesión" },
      signingIn: { en: "Signing in…", es: "Iniciando sesión…" },
      wrongPassword: { en: "Incorrect password.", es: "Contraseña incorrecta." },
      notConfigured: {
        en: "Admin auth is not configured (set ADMIN_PASSWORD and AUTH_SECRET).",
        es: "La autenticación de admin no está configurada (define ADMIN_PASSWORD y AUTH_SECRET).",
      },
      failed: { en: "Login failed.", es: "No se pudo iniciar sesión." },
    },
    editor: {
      title: { en: "Quote Pricing", es: "Precios del Cotizador" },
      storageWarn: {
        en: "Storage not connected — changes apply for this session only. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to persist.",
        es: "Almacenamiento no conectado — los cambios solo aplican en esta sesión. Define SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY para guardarlos.",
      },
      logOut: { en: "Log out", es: "Cerrar sesión" },
      loggingOut: { en: "Signing out…", es: "Cerrando sesión…" },
      save: { en: "Save changes", es: "Guardar cambios" },
      saving: { en: "Saving…", es: "Guardando…" },
      saved: { en: "Saved.", es: "Guardado." },
      savedSession: {
        en: "Saved for this session — connect Supabase to make it permanent.",
        es: "Guardado para esta sesión — conecta Supabase para hacerlo permanente.",
      },
      saveFailed: { en: "Save failed.", es: "No se pudo guardar." },
      globalHeading: { en: "Global", es: "General" },
      laborRate: { en: "Labor rate ($/hr)", es: "Mano de obra ($/hr)" },
      spread: { en: "Estimate spread (%)", es: "Margen del estimado (%)" },
      currency: { en: "Currency", es: "Moneda" },
      vehicleHeading: { en: "Vehicle multipliers", es: "Multiplicadores por vehículo" },
      vehicleHint: {
        en: "Sedan is the 1.0 baseline. Bigger/more premium vehicles cost more.",
        es: "El sedán es la base (1.0). Vehículos más grandes o premium cuestan más.",
      },
      servicesHeading: { en: "Services", es: "Servicios" },
      appliesFactor: { en: "applies vehicle factor", es: "aplica factor de vehículo" },
      basePrice: { en: "Base price / unit", es: "Precio base / unidad" },
      partsBase: { en: "Parts base", es: "Base de refacciones" },
      laborHours: { en: "Labor hours", es: "Horas de mano de obra" },
      flatPrice: { en: "Flat price", es: "Precio fijo" },
      perUnit: { en: "per unit", es: "por unidad" },
      perJob: { en: "per job", es: "por trabajo" },
      modelHelp: {
        perUnit: {
          en: "Per-unit price × vehicle factor × qty, plus fees.",
          es: "Precio por unidad × factor de vehículo × cantidad, más cargos.",
        },
        labor: {
          en: "Parts + (labor hours × vehicle factor × labor rate).",
          es: "Refacciones + (horas × factor de vehículo × tarifa).",
        },
        options: {
          en: "Customer picks one option; that price is used.",
          es: "El cliente elige una opción; se usa ese precio.",
        },
        flat: { en: "Single flat price.", es: "Un solo precio fijo." },
      },
      openingEditor: { en: "Opening pricing editor…", es: "Abriendo el editor de precios…" },
    },
  },
};
