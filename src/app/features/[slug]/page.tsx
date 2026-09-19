import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FEATURE_PAGES } from "@/components/marketing/featurePages";
import { FeaturePageLayout } from "@/components/marketing/FeaturePageLayout";

type Props = {
  params: { slug: string };
};

export function generateStaticParams() {
  return FEATURE_PAGES.filter((p) => p.blocks.length > 0).map((p) => ({
    slug: p.slug,
  }));
}

export function generateMetadata({ params }: Props): Metadata {
  const page = FEATURE_PAGES.find((p) => p.slug === params.slug);
  if (!page) {
    return {};
  }
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    robots: {
      index: page.launched,
      follow: page.launched,
    },
    alternates: {
      canonical: `https://usecosmoskittool.com/features/${page.slug}/`,
    },
  };
}

export default function FeatureSlugPage({ params }: Props) {
  const page = FEATURE_PAGES.find((p) => p.slug === params.slug);
  if (!page) {
    notFound();
  }
  return <FeaturePageLayout page={page} />;
}
