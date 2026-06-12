import type { Metadata } from "next";
import localFont from "next/font/local";
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

export const metadata: Metadata = {
  title: "OSRS Hours to Max",
  description:
    "Old School RuneScape hours-to-max calculator. Enter your username, pull your hiscores, set your XP/hr, and see exactly how long until you max your account.",
  keywords: [
    "OSRS",
    "Old School RuneScape",
    "hours to max",
    "max calculator",
    "XP per hour",
    "hiscores",
  ],
  openGraph: {
    title: "OSRS Hours to Max",
    description:
      "See exactly how many hours you have left until you max your Old School RuneScape account.",
    type: "website",
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
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
