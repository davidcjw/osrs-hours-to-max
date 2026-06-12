import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const runescape = localFont({
  src: "./fonts/RuneScape-Plain-12.ttf",
  variable: "--font-rs",
  display: "swap",
});

const runescapeBold = localFont({
  src: "./fonts/RuneScape-Bold-12.ttf",
  variable: "--font-rs-bold",
  display: "swap",
});

const runescapeQuill = localFont({
  src: "./fonts/RuneScape-Quill-8.ttf",
  variable: "--font-rs-quill",
  display: "swap",
});

const SITE_URL = "https://hourstomax.davidcjw.com";
const TITLE = "OSRS Hours to Max — Time to Max Calculator";
const DESCRIPTION =
  "Free Old School RuneScape hours-to-max calculator. Enter your username, pull your live hiscores, set your XP/hr per skill, and see exactly how many hours until you max all 24 skills at 99.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · OSRS Hours to Max",
  },
  description: DESCRIPTION,
  applicationName: "OSRS Hours to Max",
  authors: [{ name: "davidcjw" }],
  creator: "davidcjw",
  keywords: [
    "OSRS",
    "Old School RuneScape",
    "hours to max",
    "time to max",
    "max calculator",
    "OSRS max calc",
    "XP per hour",
    "OSRS hiscores",
    "RuneScape skill calculator",
    "99 all skills",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "OSRS Hours to Max",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  category: "games",
};

// Structured data so search engines understand this is a free web app/tool.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "OSRS Hours to Max",
  url: SITE_URL,
  description: DESCRIPTION,
  applicationCategory: "GameApplication",
  operatingSystem: "Any",
  browserRequirements: "Requires JavaScript",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Person",
    name: "davidcjw",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${runescape.variable} ${runescapeBold.variable} ${runescapeQuill.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
