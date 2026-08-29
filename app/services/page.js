import Header from "../components/Header";
import Footer from "../components/Footer";
import { ServicesHubView } from "../components/SeoViews";

export const metadata = {
  title: "Tire & Auto Services in San Jose, CA",
  description: "Explore new tires, flat repair, wheel alignment, brakes, oil changes, batteries, and custom wheels at Tires SOS Rescue in San Jose.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return <><Header /><ServicesHubView /><Footer /></>;
}
