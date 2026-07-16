// Central place for all business facts and bilingual copy.
// Update here to change anything shown on the site.

export const SITE = {
  name: "Tires SOS Rescue",
  nameShort: "Tires SOS",
  // Used for canonical URLs, sitemap, robots and Open Graph.
  // UPDATE this once the real domain is attached in Vercel.
  url: "https://tiressosrescue.com",
  tagline: {
    en: "Tire specialists. Fast service, actual brands, and WhatsApp-first support. We speak your language.",
    es: "Especialistas en llantas. Servicio rápido, marcas reales y atención primero por WhatsApp. Aquí te atendemos como en casa.",
  },
  phone: "(408) 332-8962",
  phoneHref: "https://wa.me/14083328962",
  whatsappHref: "https://wa.me/14083328962",
  smsHref: "sms:+14083328962",
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

export const BRAND_SHOWCASE = [
  {
    name: "Pirelli",
    logo: "/brands/pirelli.svg",
    tagline: {
      en: "Pirelli performance, prominently featured at Tires SOS Rescue.",
      es: "Rendimiento Pirelli, destacado en Tires SOS Rescue.",
    },
    featured: true,
  },
  {
    name: "Continental",
    logo: "/brands/continental.svg",
    tagline: {
      en: "Continental tires — premium driving feel, stocked for the Bay Area.",
      es: "Llantas Continental — manejo premium, disponibles para el Bay Area.",
    },
  },
  {
    name: "Dunlop",
    logo: "/brands/dunlop.svg",
    tagline: {
      en: "Dunlop tires — performance-minded grip and everyday reliability.",
      es: "Llantas Dunlop — agarre para rendimiento y confiabilidad diaria.",
    },
  },
  {
    name: "Falken",
    logo: "/brands/falken.svg",
    tagline: {
      en: "Falken tires — high performance with a street-ready price.",
      es: "Llantas Falken — alto rendimiento con precio amigable.",
    },
  },
  {
    name: "General",
    logo: "/brands/general.svg",
    tagline: {
      en: "General tires — dependable traction for the daily grind.",
      es: "Llantas General — tracción confiable para el día a día.",
    },
  },
  {
    name: "GT Radial",
    logo: "/brands/gt-radial.svg",
    tagline: {
      en: "GT Radial tires — balanced value, comfort, and road control.",
      es: "Llantas GT Radial — balance entre valor, comodidad y control.",
    },
  },
  {
    name: "Hankook",
    logo: "/brands/hankook.svg",
    tagline: {
      en: "Hankook tires — smart value with strong everyday performance.",
      es: "Llantas Hankook — gran valor y rendimiento diario.",
    },
  },
  {
    name: "Ironman",
    logo: "/brands/ironman.svg",
    tagline: {
      en: "Ironman tires — our bold value line for drivers who want savings.",
      es: "Llantas Ironman — nuestra línea de valor para ahorrar más.",
    },
  },
  {
    name: "Kumho",
    logo: "/brands/kumho.svg",
    tagline: {
      en: "Kumho tires — practical performance for real-world roads.",
      es: "Llantas Kumho — rendimiento práctico para calles reales.",
    },
  },
  {
    name: "Laufenn",
    logo: "/brands/laufenn.svg",
    tagline: {
      en: "Laufenn tires — clean handling and everyday dependability.",
      es: "Llantas Laufenn — manejo limpio y confianza diaria.",
    },
  },
  {
    name: "Nexen",
    logo: "/brands/nexen.svg",
    tagline: {
      en: "Nexen tires — modern comfort and value on the road.",
      es: "Llantas Nexen — comodidad moderna y buen valor.",
    },
  },
  {
    name: "Nokian",
    logo: "/brands/nokian.svg",
    tagline: {
      en: "Nokian tires — trusted performance in changing conditions.",
      es: "Llantas Nokian — confianza en condiciones cambiantes.",
    },
  },
  {
    name: "Toyo",
    logo: "/brands/toyo.svg",
    tagline: {
      en: "Toyo tires — a favorite for dependable performance and value.",
      es: "Llantas Toyo — favoritas por su rendimiento y valor.",
    },
  },
];

export const SERVICES = [
  {
    id: "new-tires",
    icon: "tire",
    image: "/services/new-tires.jpg",
    title: { en: "New Tires", es: "Llantas Nuevas" },
    desc: {
      en: "Continental, Dunlop, Falken, General, GT Radial, Hankook, Ironman, Kumho, Laufenn, Nexen, Nokian, and Toyo.",
      es: "Continental, Dunlop, Falken, General, GT Radial, Hankook, Ironman, Kumho, Laufenn, Nexen, Nokian y Toyo.",
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
  "Pirelli",
  "Continental",
  "Dunlop",
  "Falken",
  "General",
  "GT Radial",
  "Hankook",
  "Ironman",
  "Kumho",
  "Laufenn",
  "Nexen",
  "Nokian",
  "Toyo",
  "Chat or WhatsApp only",
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
  collab: {
    kicker: { en: "Pirelli spotlight", es: "Destacado Pirelli" },
    title: { en: "Performance starts here", es: "El rendimiento empieza aqui" },
    body: {
      en: "Ask us about Pirelli tires through chat or WhatsApp.",
      es: "Pregunta por llantas Pirelli por chat o WhatsApp.",
    },
  },
};

export const CHAT = {
  launcher: { en: "Chat", es: "Chat" },
  launcherSub: { en: "Ask the shop", es: "Pregunta al taller" },
  title: { en: "Shop Chat", es: "Chat del Taller" },
  subtitle: {
    en: "Questions about tires, hours, quotes, and services.",
    es: "Preguntas sobre llantas, horario, cotizaciones y servicios.",
  },
  fastAnswers: { en: "Fast answers", es: "Respuestas rápidas" },
  liveChat: { en: "Live chat", es: "Chat en vivo" },
  callUs: { en: "SMS", es: "SMS" },
  sms: { en: "Text us", es: "Envíanos un SMS" },
  whatsapp: { en: "WhatsApp", es: "WhatsApp" },
  openChat: { en: "Open chat", es: "Abrir chat" },
  close: { en: "Close chat", es: "Cerrar chat" },
  promptHours: { en: "What are your hours today?", es: "¿Cuál es su horario hoy?" },
  promptServices: { en: "What services do you offer?", es: "¿Qué servicios ofrecen?" },
  promptPrice: { en: "How much is a flat repair?", es: "¿Cuánto cuesta una reparación de ponchadura?" },
  promptSpanish: { en: "Hablas español?", es: "¿Hablas español?" },
  placeholder: {
    en: "Ask a question about your car...",
    es: "Haz una pregunta sobre tu carro...",
  },
  send: { en: "Send", es: "Enviar" },
  typing: { en: "Typing...", es: "Escribiendo..." },
  fallback: {
    en: "I couldn’t reach the chat service just now. Please use WhatsApp or try again in a moment.",
    es: "No pude conectar con el chat por ahora. Usa WhatsApp o intenta de nuevo en un momento.",
  },
  intro: {
    en: "Ask about tires, brakes, alignment, oil changes, batteries, rims, hours, location, or walk-in help.",
    es: "Pregunta sobre llantas, frenos, alineación, cambio de aceite, baterías, rines, horario, ubicación o atención sin cita.",
  },
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
    callNow: { en: "WhatsApp", es: "WhatsApp" },
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
    callNow: { en: "WhatsApp", es: "WhatsApp" },
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
    collab: {
      kicker: { en: "Pirelli spotlight", es: "Destacado Pirelli" },
      title: { en: "Own every turn.", es: "Domina cada curva." },
      body: {
        en: "Precision grip. Confident control. Pirelli performance for the road ahead.",
        es: "Agarre preciso. Control total. Rendimiento Pirelli para el camino.",
      },
      features: {
        en: ["Precision grip", "Confident control", "Premium performance"],
        es: ["Agarre preciso", "Control total", "Rendimiento premium"],
      },
      cta: { en: "Ask by WhatsApp", es: "Pregunta por WhatsApp" },
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
    collabTitle: { en: "Engineered to perform", es: "Disenadas para rendir" },
    collabBody: {
      en: "Bring legendary Pirelli performance to every mile.",
      es: "Lleva el rendimiento legendario de Pirelli a cada milla.",
    },
    collabCta: { en: "Ask on WhatsApp", es: "Pregunta por WhatsApp" },
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
      brandHeading: { en: "Brand tiers", es: "Niveles de marca" },
      brandHint: {
        en: "Standard is the 1.0 baseline. Use this for parts where the brand itself — not the vehicle — swings the price (tires, rims, batteries).",
        es: "Estándar es la base (1.0). Úsalo para partes donde la marca —no el vehículo— cambia el precio (llantas, rines, baterías).",
      },
      tireBrandsHeading: { en: "Tire brands we sell", es: "Marcas de llantas que vendemos" },
      tireBrandsHint: {
        en: "Add the brands your shop carries and pick their tier. The chatbot uses this to price a named brand automatically without asking the customer.",
        es: "Agrega las marcas que maneja tu taller y elige su nivel. El chatbot usa esto para cotizar una marca que el cliente mencione, sin preguntar.",
      },
      brandName: { en: "Brand name", es: "Nombre de marca" },
      brandTierLabel: { en: "Tier", es: "Nivel" },
      addBrand: { en: "+ Add brand", es: "+ Agregar marca" },
      removeBrand: { en: "Remove", es: "Quitar" },
      servicesHeading: { en: "Services", es: "Servicios" },
      appliesFactor: { en: "applies vehicle factor", es: "aplica factor de vehículo" },
      appliesBrandTier: { en: "varies by brand tier", es: "varía por nivel de marca" },
      chatQuotableOff: { en: "don't quote in chat (price varies)", es: "no cotizar en el chat (precio varía)" },
      basePrice: { en: "Base price / unit", es: "Precio base / unidad" },
      partsBase: { en: "Parts base", es: "Base de refacciones" },
      laborHours: { en: "Labor hours", es: "Horas de mano de obra" },
      flatPrice: { en: "Flat price", es: "Precio fijo" },
      perUnit: { en: "per unit", es: "por unidad" },
      perJob: { en: "per job", es: "por trabajo" },
      modelHelp: {
        perUnit: {
          en: "Per-unit price × vehicle factor × brand-tier factor × qty, plus fees.",
          es: "Precio por unidad × factor de vehículo × factor de marca × cantidad, más cargos.",
        },
        labor: {
          en: "Parts + (labor hours × vehicle factor × labor rate).",
          es: "Refacciones + (horas × factor de vehículo × tarifa).",
        },
        options: {
          en: "Customer picks one option; that price is used.",
          es: "El cliente elige una opción; se usa ese precio.",
        },
        flat: { en: "Flat price × vehicle factor × brand-tier factor (if enabled).", es: "Precio fijo × factor de vehículo × factor de marca (si aplica)." },
      },
      openingEditor: { en: "Opening pricing editor…", es: "Abriendo el editor de precios…" },
    },
  },
};
