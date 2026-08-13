import { SITE } from "../app/site.config";
import { getHaywardRevealed } from "./location-launch-store";

const privateHayward = {
  id: "hayward",
  line1: process.env.HAYWARD_STORE_ADDRESS_LINE1 || "905 W A Street",
  line2: process.env.HAYWARD_STORE_ADDRESS_LINE2 || "Hayward, CA 94541",
  full: [process.env.HAYWARD_STORE_ADDRESS_LINE1 || "905 W A Street", process.env.HAYWARD_STORE_ADDRESS_LINE2 || "Hayward, CA 94541"].join(", "),
  mapsHref: process.env.HAYWARD_STORE_MAPS_HREF || "https://www.google.com/maps/dir/?api=1&destination=905+W+A+Street,+Hayward,+CA+94541",
  mapsEmbedSrc: process.env.HAYWARD_STORE_MAPS_EMBED_SRC || "https://www.google.com/maps?q=905+W+A+Street,+Hayward,+CA+94541&output=embed",
  postalCode: process.env.HAYWARD_STORE_POSTAL_CODE || "94541",
  phone: process.env.HAYWARD_STORE_PHONE || SITE.phone,
  whatsappHref: process.env.HAYWARD_STORE_WHATSAPP_HREF || SITE.whatsappHref,
  hours: SITE.hours,
};

export async function getPublicLocations() {
  const revealed = await getHaywardRevealed();
  const base = SITE.locations.filter((location) => location.id !== "hayward");
  const teaser = SITE.locations.find((location) => location.id === "hayward");
  if (!revealed) return [...base, teaser];
  return [...base, { ...teaser, ...privateHayward, status: "revealed", isPublic: true }];
}

export async function getPublicSite() {
  return { ...SITE, locations: await getPublicLocations() };
}
