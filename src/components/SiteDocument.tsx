import { Inter, JetBrains_Mono } from "next/font/google";
import { GoogleAds } from "@/components/analytics/GoogleAds";
import { PostHogAnalytics } from "@/components/analytics/PostHogAnalytics";
import { AppStoreAttribution } from "@/components/analytics/AppStoreAttribution";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const appJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "CosmoKit Tools",
  operatingSystem: "macOS 14.7 or later",
  applicationCategory: "DeveloperApplication",
  description:
    "Native macOS toolkit for the iOS Simulator: screenshots, video recording, HTTPS network proxy, real push notifications, deep links, GPS simulation and an MCP server for AI agents.",
  url: "https://usecosmoskittool.com",
  downloadUrl: "https://apps.apple.com/app/cosmokit-tools/id6756494471?mt=12",
  image: "https://usecosmoskittool.com/screenshots/og.jpg",
  author: { "@type": "Organization", name: "CosmoHQ" },
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "0",
    highPrice: "69.99",
    priceCurrency: "USD",
    offerCount: 4,
  },
};

// The one <html>/<body> shell for the whole site. Next only lets a layout emit
// <html> when it is a root layout, and the site has two (the [locale] tree and
// the unprefixed English pages in the (site) group), so both render this with
// their own `lang`.
export function SiteDocument({
  lang,
  children,
}: {
  lang: string;
  children: React.ReactNode;
}) {
  return (
    <html lang={lang} className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }}
        />
        <GoogleAds />
        <PostHogAnalytics />
        <AppStoreAttribution />
        {children}
      </body>
    </html>
  );
}
