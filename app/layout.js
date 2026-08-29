import { Barlow, Barlow_Condensed, Caveat } from "next/font/google";
import "./globals.css";
import JsonLd from "./components/JsonLd";
import PostHogAnalytics from "./components/PostHogAnalytics";
import PageTransition from "./components/PageTransition";
import AuthProviderScope from "./components/AuthProviderScope";
import { LanguageProvider } from "./i18n/LanguageContext";
import { SITE } from "./site.config";

// Barlow Condensed (display) reads like garage / highway signage; Barlow
// (body) shares that American industrial-signage heritage — a grounded
// pairing for a San José auto shop, deliberately not the generic Inter.
const displayFont = Barlow_Condensed({
  weight: ["600", "700", "800"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-display",
});

const bodyFont = Barlow({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-body",
});

const signatureFont = Caveat({
  weight: ["600"],
  subsets: ["latin"],
  variable: "--font-signature",
});

const TITLE = `Tire Shop & Llantas in San Jose, CA | ${SITE.name}`;
const DESCRIPTION =
  "Bilingual tire and auto shop in San Jose, CA offering new tires, flat repair, alignments, brakes, oil changes, batteries and rims. Walk-ins welcome.";

export const metadata = {
  metadataBase: new URL(SITE.url),
  applicationName: SITE.name,
  title: TITLE,
  description: DESCRIPTION,
  category: "automotive",
  alternates: {
    canonical: "/",
  },
  keywords: [
    "tire shop San Jose",
    "llantas San Jose",
    "flat tire repair San Jose",
    "wheel alignment San Jose",
    "brakes San Jose",
    "oil change San Jose",
    "rims San Jose",
    "taller de llantas",
    "Tires SOS Rescue",
  ],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/",
    siteName: SITE.name,
    type: "website",
    locale: "en_US",
    alternateLocale: "es_US",
    images: [
      {
        url: "/og.png",
        width: 1659,
        height: 948,
        alt: "Tires SOS Rescue — tire shop in San José, CA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
    apple: [
      { url: "/apple-touch-icon-v2.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon-152.png", sizes: "152x152", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#14100c",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable} ${signatureFont.variable}`}>
      <body>
        <AuthProviderScope>
          <JsonLd />
          <LanguageProvider>
            <PostHogAnalytics />
            <PageTransition />
            {children}
          </LanguageProvider>
        </AuthProviderScope>
      </body>
    </html>
  );
}
