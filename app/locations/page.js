import Header from "../components/Header";
import Footer from "../components/Footer";
import { LocationsHubView } from "../components/SeoViews";
import { LOCATION_PAGES } from "../seo-content";
import { SITE } from "../site.config";

export const metadata = { title: "Tire Shop Locations in San Jose, CA", description: "Visit Tires SOS Rescue at two San Jose tire shop locations on East Taylor Street and North 10th Street. See addresses, hours, and directions.", alternates: { canonical: "/locations" } };
export default function LocationsPage() { const locations = Object.entries(LOCATION_PAGES).map(([slug, page]) => ({ slug, page, loc: SITE.locations.find((item) => item.id === page.locationId) })); return <><Header /><LocationsHubView locations={locations} /><Footer /></>; }
