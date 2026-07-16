import {ClerkProvider} from "@clerk/nextjs";
import { Barlow, Barlow_Condensed, Caveat } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import JsonLd from "./components/JsonLd";
import PostHogAnalytics from "./components/PostHogAnalytics";
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

const TITLE = `${SITE.name} — Tire Shop in San José, CA | Llantas San José`;
const DESCRIPTION =
  "Tire shop in San José, CA: new tires, flat repair, wheel alignment, brakes, oil changes, batteries and rims. Bilingual English/Spanish, best prices in the Bay Area, walk-ins welcome. Taller de llantas en San José.";

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: TITLE,
  description: DESCRIPTION,
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
        width: 1200,
        height: 630,
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
  },
  icons: {
    icon: "/favicon.svg",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
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
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-18328053401"
          strategy="afterInteractive"
        />
        <Script id="google-tag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-18328053401');
          `}
        </Script>
        <ClerkProvider>
          <JsonLd />
          <LanguageProvider>
            <PostHogAnalytics />
            {children}
          </LanguageProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
