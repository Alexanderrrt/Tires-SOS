import "./globals.css";
import { LanguageProvider } from "./i18n/LanguageContext";
import { SITE } from "./site.config";

export const metadata = {
  title: `${SITE.name} — Tire & Auto Shop in San José, CA`,
  description:
    "Tires SOS Rescue: tires, brakes, oil changes, batteries, rims and alignment in San José, CA. Fast, bilingual, best prices in the Bay Area. Walk-ins welcome.",
  openGraph: {
    title: `${SITE.name} — Tire & Auto Shop in San José, CA`,
    description:
      "Tires, brakes, oil changes, batteries, rims and alignment. Fast, bilingual service in San José, CA.",
    type: "website",
    locale: "en_US",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
