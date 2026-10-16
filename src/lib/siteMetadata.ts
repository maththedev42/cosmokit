import type { Metadata } from "next";

export const SITE = "https://usecosmoskittool.com";
export const LOCALES = ["en", "pt-BR", "es"] as const;
export type SiteLocale = (typeof LOCALES)[number];

const OG_IMAGE = {
  url: "/screenshots/og.jpg",
  width: 1200,
  height: 750,
  alt: "CosmoKit App Screenshot",
};

export const rootMetadata: Metadata = {
  metadataBase: new URL(SITE),
  title: "CosmoKit | iOS Simulator Toolkit for Mac",
  description:
    "iOS Simulator toolkit for Mac: HTTPS proxy, real APNs push, screenshots, video, GPS and an MCP server for AI agents. Free tier.",
  keywords: [
    "iOS Simulator",
    "macOS",
    "developer tools",
    "Xcode",
    "simulator management",
    "screenshot",
    "video recording",
    "push notifications",
    "APNs",
    "MCP server",
    "deep links",
    "GPS simulation",
    "network proxy",
    "xcrun simctl",
  ],
  authors: [{ name: "CosmoHQ" }],
  icons: { icon: "/icon.png", apple: "/icon.png" },
  openGraph: {
    title: "CosmoKit | iOS Simulator Toolkit for Mac",
    description:
      "HTTPS proxy, real APNs push, screenshots, video, GPS and an MCP server for AI agents, in one native Mac app.",
    type: "website",
    locale: "en_US",
    siteName: "CosmoKit",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "CosmoKit | iOS Simulator Toolkit for Mac",
    description:
      "HTTPS proxy, real APNs push, screenshots, video, GPS and an MCP server for AI agents, in one native Mac app.",
    images: ["/screenshots/og.jpg"],
  },
};

// hreflang cluster for a localized route. `path` has no locale and no slashes
// at the ends ("" for the home page, "privacy" for /privacy/).
export function localizedAlternates(locale: string, path = ""): Metadata["alternates"] {
  const tail = path ? `${path}/` : "";
  const url = (l: string) => `${SITE}/${l}/${tail}`;
  return {
    canonical: url(locale),
    languages: {
      en: url("en"),
      "pt-BR": url("pt-BR"),
      es: url("es"),
      "x-default": url("en"),
    },
  };
}
