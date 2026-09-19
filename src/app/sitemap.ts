import type { MetadataRoute } from "next";
import { FEATURE_PAGES } from "@/components/marketing/featurePages";

const SITE = "https://usecosmoskittool.com";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const locales = ["en", "pt-BR", "es"];
  const localePages = ["", "privacy", "terms", "support", "suggest"];
  const marketingPages = [
    "features",
    "capture",
    "network",
    "push",
    "location",
    "download",
    "pricing",
    "cli",
    "recursos",
    "rocketsim-alternative",
    "ios-simulator-on-windows",
    "teams",
    "students",
  ];

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const page of localePages) {
      entries.push({
        url: `${SITE}/${locale}/${page ? `${page}/` : ""}`,
        changeFrequency: page === "" ? "weekly" : "monthly",
        priority: page === "" ? 1 : 0.4,
      });
    }
  }

  for (const page of marketingPages) {
    entries.push({
      url: `${SITE}/${page}/`,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  const launchedFeaturePages = FEATURE_PAGES.filter(
    (p) => p.launched && !p.externalHref
  );
  for (const page of launchedFeaturePages) {
    entries.push({
      url: `${SITE}/features/${page.slug}/`,
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return entries;
}
