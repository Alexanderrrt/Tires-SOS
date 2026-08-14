import { SITE } from "../app/site.config";
import { getHaywardRevealed } from "./location-launch-store";
import { getStoreContact } from "./store-contact.js";

const privateHayward = {
  ...getStoreContact("hayward"),
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
