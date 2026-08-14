import { SITE } from "../app/site.config.js";

const digits = (value) => String(value || "").replace(/\D/g, "");

function mainStore(location, storeNumber) {
  const phone = location.phone || SITE.phone;
  const phoneDigits = digits(phone);
  const internationalPhone = phoneDigits.length === 10 ? `1${phoneDigits}` : phoneDigits;
  return {
    ...location,
    storeNumber,
    businessName: `Tires SOS Rescue ${storeNumber}`,
    phone,
    phoneHref: location.phoneHref || `tel:+${internationalPhone}`,
    whatsappHref: location.whatsappHref || `https://wa.me/${internationalPhone}`,
  };
}

export function getStoreContacts() {
  const [taylor, tenth] = SITE.locations;
  const haywardPhone = process.env.HAYWARD_STORE_PHONE || "(669) 877-4279";
  const haywardPhoneDigits = digits(haywardPhone);
  const haywardLine1 = process.env.HAYWARD_STORE_ADDRESS_LINE1 || "905 W A Street";
  const haywardLine2 = process.env.HAYWARD_STORE_ADDRESS_LINE2 || "Hayward, CA 94541";

  return [
    mainStore(taylor, 1),
    mainStore(tenth, 2),
    {
      id: "hayward",
      storeNumber: 3,
      businessName: "Tires SOS Rescue 3",
      line1: haywardLine1,
      line2: haywardLine2,
      full: `${haywardLine1}, ${haywardLine2}`,
      postalCode: process.env.HAYWARD_STORE_POSTAL_CODE || "94541",
      mapsHref:
        process.env.HAYWARD_STORE_MAPS_HREF ||
        "https://www.google.com/maps/dir/?api=1&destination=905+W+A+Street,+Hayward,+CA+94541",
      mapsEmbedSrc:
        process.env.HAYWARD_STORE_MAPS_EMBED_SRC ||
        "https://www.google.com/maps?q=905+W+A+Street,+Hayward,+CA+94541&output=embed",
      phone: haywardPhone,
      phoneHref: `tel:+1${haywardPhoneDigits}`,
      whatsappHref:
        process.env.HAYWARD_STORE_WHATSAPP_HREF || `https://wa.me/1${haywardPhoneDigits}`,
      hours: SITE.hours,
    },
  ];
}

export function getStoreContact(storeId = "taylor") {
  const stores = getStoreContacts();
  return stores.find((store) => store.id === storeId) || stores[0];
}

function searchableText(values) {
  return values
    .filter(Boolean)
    .join("\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

export function detectStoreContact({ subject, to, text, html } = {}) {
  const value = searchableText([subject, to, text, html]);

  const numbered = value.match(
    /tires\s*sos\s*rescue\s*(?:store|shop|location|tienda|sucursal|#|no\.?\s*)?\s*([123])\b/i,
  );
  if (numbered) return getStoreContacts()[Number(numbered[1]) - 1];

  if (/\b905\s+w(?:est)?\s+a\s+(?:st|street)\b|\b94541\b/i.test(value)) {
    return getStoreContact("hayward");
  }
  if (/\b1407\s+n(?:orth)?\s+10(?:th)?\s+(?:st|street)\b|\bn\s+10th\b/i.test(value)) {
    return getStoreContact("tenth");
  }
  if (/\b623\s+e(?:ast)?\s+taylor\s+(?:st|street)\b|\be\s+taylor\b/i.test(value)) {
    return getStoreContact("taylor");
  }
  if (/\bhayward\b/i.test(value)) return getStoreContact("hayward");

  return getStoreContact("taylor");
}
