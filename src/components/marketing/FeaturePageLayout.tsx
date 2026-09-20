import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  MarketingShell,
  PageHero,
  BulletList,
} from "@/components/marketing/marketing";
import { ReadyCTA } from "@/components/marketing/ReadyCTA";
import {
  FEATURE_PAGES,
  type FeaturePageDef,
} from "@/components/marketing/featurePages";

export function FeaturePageLayout({ page }: { page: FeaturePageDef }) {
  const relatedPages = (page.related ?? [])
    .map((slug) => FEATURE_PAGES.find((p) => p.slug === slug))
    .filter((p): p is FeaturePageDef => Boolean(p));

  return (
    <MarketingShell>
      <PageHero
        eyebrow="Feature"
        title={page.title}
        subtitle={page.subtitle}
      />

      <div className="container mx-auto px-4 pb-16">
        <div className="max-w-4xl mx-auto space-y-12">
          {page.blocks.map((block, i) => {
            const hasSideContent = Boolean(
              block.code ||
                block.image ||
                (block.bullets && block.bullets.length > 0)
            );

            return (
              <section
                key={i}
                className="rounded-2xl border border-border/60 bg-card/40 backdrop-blur-sm p-6 md:p-8"
              >
                <div
                  className={
                    hasSideContent
                      ? "grid md:grid-cols-2 gap-8 items-start"
                      : "max-w-2xl"
                  }
                >
                  <div>
                    <h2 className="text-2xl font-bold mb-2">{block.title}</h2>
                    {block.subtitle && (
                      <p className="text-sm font-medium text-violet-light/80 mb-3">
                        {block.subtitle}
                      </p>
                    )}
                    <p className="text-[15px] text-muted-foreground leading-relaxed mb-4">
                      {block.body}
                    </p>
                    {/* If we have code or image on the right, keep bullets on the left */}
                    {(block.code || block.image) &&
                      block.bullets &&
                      block.bullets.length > 0 && (
                        <div className="mt-4">
                          <BulletList items={block.bullets} />
                        </div>
                      )}
                  </div>

                  {/* Right column: image, code, or bullets if no image/code */}
                  {hasSideContent && (
                    <div className="space-y-4">
                      {block.image && (
                        <div className="overflow-hidden rounded-xl border border-border/60">
                          <Image
                            src={block.image.src}
                            alt={block.image.alt}
                            width={800}
                            height={500}
                            unoptimized
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      )}
                      {block.code && (
                        <pre className="overflow-x-auto rounded-lg bg-background/80 border border-border/60 p-4 text-xs font-mono text-violet-light leading-relaxed">
                          <code>{block.code.content}</code>
                        </pre>
                      )}
                      {!block.code &&
                        !block.image &&
                        block.bullets &&
                        block.bullets.length > 0 && (
                          <div className="rounded-xl border border-border/40 bg-card/20 p-4">
                            <BulletList items={block.bullets} />
                          </div>
                        )}
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      {relatedPages.length > 0 && (
        <section className="container mx-auto px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold mb-6 text-center">
              Related features
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {relatedPages.map((rel) => {
                const href = rel.externalHref ?? `/features/${rel.slug}/`;
                return (
                  <Link
                    key={rel.slug}
                    href={href}
                    className="group block p-6 rounded-2xl border border-border/60 bg-card/40 hover:border-violet-DEFAULT/40 hover:bg-card/60 transition-all"
                  >
                    <h3 className="text-base font-semibold group-hover:text-violet-light transition-colors flex items-center justify-between">
                      {rel.title}
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {rel.cardBlurb}
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <ReadyCTA title={page.ctaTitle} />
    </MarketingShell>
  );
}
