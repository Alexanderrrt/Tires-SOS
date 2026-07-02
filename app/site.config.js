// Central place for all business facts and bilingual copy.
// Update here to change anything shown on the site.

export const SITE = {
  name: "Tires SOS Rescue",
  // Used for canonical URLs, sitemap, robots and Open Graph.
  // UPDATE this once the real domain is attached in Vercel.
  url: "https://tires-sos.vercel.app",
  tagline: {
    en: "Tire specialists. Fast service, best prices in the Bay Area.",
    es: "Especialistas en neumáticos. Servicio rápido, los mejores precios del Bay Area.",
  },
  phone: "(408) 332-8962",
  phoneHref: "tel:+14083328962",
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
  kicker: { en: "The Boss's Ride", es: "El Carro del Jefe" },
  title: { en: "BMW M3 Competition", es: "BMW M3 Competition" },
  body: {
    en: "Our owner's daily driver is his pride and joy — and every car that rolls into the shop gets treated the exact same way. Your ride is our ride.",
    es: "El carro diario de nuestro dueño es su orgullo — y cada carro que entra al taller recibe exactamente el mismo trato. Su carro es nuestro carro.",
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
    callNow: { en: "Call Now", es: "Llamar" },
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
      en: "Walk-ins welcome. Shop service only — no mobile dispatch.",
      es: "Se aceptan clientes sin cita. Servicio solo en tienda — no ofrecemos servicio móvil.",
    },
    afterpay: {
      en: "Afterpay accepted — split it into 4 easy interest-free payments",
      es: "Aceptamos Afterpay — divida su pago en 4 pagos fáciles sin interés",
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
  footer: {
    rights: {
      en: "All rights reserved.",
      es: "Todos los derechos reservados.",
    },
    followUs: { en: "Follow us", es: "Síganos" },
  },
};
