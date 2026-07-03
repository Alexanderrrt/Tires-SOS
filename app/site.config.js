// Central place for all business facts and bilingual copy.
// Update here to change anything shown on the site.

export const SITE = {
  name: "Tires SOS Rescue",
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
  address: {
    line1: "623 E Taylor St",
    line2: "San José, CA 95112",
    full: "623 E Taylor St, San José, CA 95112",
  },
  mapsHref:
    "https://www.google.com/maps/dir/?api=1&destination=623+E+Taylor+St,+San+Jose,+CA+95112",
  mapsEmbedSrc:
    "https://www.google.com/maps?q=623+E+Taylor+St,+San+Jose,+CA+95112&output=embed",
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
    title: { en: "New Tires", es: "Llantas Nuevas" },
    desc: {
      en: "All major brands and sizes, at the best prices in the Bay Area.",
      es: "Todas las marcas y medidas principales, a los mejores precios del Bay Area.",
    },
  },
  {
    id: "flat-repair",
    icon: "wrench",
    title: { en: "Flat Repair", es: "Reparación de Ponchaduras" },
    desc: {
      en: "Fast, reliable patch and plug repairs while you wait.",
      es: "Reparaciones rápidas y confiables mientras usted espera.",
    },
  },
  {
    id: "alignment",
    icon: "alignment",
    title: { en: "Wheel Alignment", es: "Alineación" },
    desc: {
      en: "Precise alignment to extend tire life and improve handling.",
      es: "Alineación precisa para prolongar la vida de sus llantas y mejorar el manejo.",
    },
  },
  {
    id: "brakes",
    icon: "brakes",
    title: { en: "Brakes", es: "Frenos" },
    desc: {
      en: "Pads, rotors, and full brake inspections done right.",
      es: "Pastillas, discos e inspecciones completas de frenos.",
    },
  },
  {
    id: "oil-change",
    icon: "oil",
    title: { en: "Oil Change", es: "Cambio de Aceite" },
    desc: {
      en: "Quick, affordable oil changes to keep your engine healthy.",
      es: "Cambios de aceite rápidos y económicos para su motor.",
    },
  },
  {
    id: "batteries",
    icon: "battery",
    title: { en: "Batteries", es: "Baterías" },
    desc: {
      en: "Free testing and same-day battery replacement.",
      es: "Prueba gratis y reemplazo de batería el mismo día.",
    },
  },
  {
    id: "rims",
    icon: "rim",
    title: { en: "Rims", es: "Rines" },
    desc: {
      en: "New and used rims to fit your ride and your budget.",
      es: "Rines nuevos y usados para su vehículo y su presupuesto.",
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
  kicker: { en: "The Boss's Ride", es: "El Carro del Jefe" },
  title: { en: "BMW M3 Competition", es: "BMW M3 Competition" },
  body: {
    en: "Our owner's daily driver is his pride and joy — and every car that rolls into the shop gets treated the exact same way. Your ride is our ride.",
    es: "El carro del patrón es su orgullo — y cada carro que entra al taller recibe exactamente el mismo trato. Tu carro es nuestro carro, parce.",
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
    callNow: { en: "Call Now", es: "Llamar" },
  },
  quote: {
    heading: { en: "Instant Price Estimate", es: "Estimado de Precio Instantáneo" },
    sub: {
      en: "Pick your vehicle and services for a ballpark price. We confirm the exact price at the shop.",
      es: "Elija su vehículo y servicios para un precio aproximado. Confirmamos el precio exacto en el taller.",
    },
    vehicleStep: { en: "1. Your vehicle", es: "1. Su vehículo" },
    vehicleClassLabel: { en: "Vehicle type", es: "Tipo de vehículo" },
    vehicleTextLabel: { en: "Year / Make / Model (optional)", es: "Año / Marca / Modelo (opcional)" },
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
    afterpay: {
      en: "Snap Finance available — approvals from $300 to $5,000",
      es: "Snap Finance disponible — aprobaciones desde $300 hasta $5,000",
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
      en: "Snap Finance — approvals from $300 to $5,000. No perfect credit needed. Quick approval, flexible payments.",
      es: "Snap Finance — aprobaciones desde $300 hasta $5,000. Sin necesidad de crédito perfecto. Aprobación rápida, pagos flexibles.",
    },
    financeCta: { en: "Ask about Snap Finance", es: "Pregunta por Snap Finance" },
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
};
