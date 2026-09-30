import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  MarketingShell,
  PageHero,
} from "@/components/marketing/marketing";
import { ReadyCTA } from "@/components/marketing/ReadyCTA";
import {
  FEATURE_PAGES,
  isShown,
} from "@/components/marketing/featurePages";

export const metadata: Metadata = {
  title: "Features | CosmoKit for iOS Simulator",
  description:
    "Everything CosmoKit brings to your iOS Simulator workflow: simulator control, screen capture & recording, network proxy, push notifications, GPS simulation and deep links.",
  alternates: { canonical: "https://usecosmoskittool.com/features" },
};

export default function FeaturesPage() {
  const visiblePages = FEATURE_PAGES.filter(isShown);

  return (
    <MarketingShell>
      <PageHero
        eyebrow="Features"
        title="Everything you need to"
        highlight="test simulators faster"
        subtitle="CosmoKit is the native macOS companion for iOS developers: control, capture and inspect any simulator without touching the terminal."
      />

      <div className="container mx-auto px-4 pb-20">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-6">
          {visiblePages.map((p) => {
            const href = p.externalHref ?? `/features/${p.slug}/`;
            return (
              <Link
                key={p.slug}
                href={href}
                className="group flex flex-col justify-between p-8 rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm hover:border-violet-DEFAULT/40 hover:bg-card/60 transition-all shadow-sm"
              >
                <div>
                  <h2 className="text-xl font-bold tracking-tight mb-2 group-hover:text-violet-light transition-colors">
                    {p.title}
                  </h2>
                  <p className="text-[15px] text-muted-foreground leading-relaxed">
                    {p.cardBlurb}
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-1.5 text-sm font-medium text-violet-light group-hover:translate-x-1 transition-transform">
                  {"\n"}Learn more <ArrowRight className="h-4 w-4" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <ReadyCTA />
    </MarketingShell>
  );
}
