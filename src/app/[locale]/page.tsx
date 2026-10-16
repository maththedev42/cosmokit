import type { Metadata } from "next";
import { HomeClient } from "@/components/HomeClient";
import en from "../../../messages/en.json";
import es from "../../../messages/es.json";
import ptBR from "../../../messages/pt-BR.json";

import { SITE, localizedAlternates } from "@/lib/siteMetadata";

const messages: Record<string, typeof en> = {
  en,
  es,
  "pt-BR": ptBR,
};

const localeMeta: Record<string, { title: string; description: string; og: string }> = {
  en: {
    title: "CosmoKit | iOS Simulator Toolkit for Mac",
    description:
      "iOS Simulator toolkit for Mac: HTTPS proxy, real APNs push, screenshots, video, GPS and an MCP server for AI agents. Free tier.",
    og: "en_US",
  },
  "pt-BR": {
    title: "CosmoKit | Ferramentas do Simulador iOS para Mac",
    description:
      "Ferramentas do Simulador iOS para Mac: proxy HTTPS, push real (APNs), capturas, vídeo, GPS e servidor MCP para agentes de IA. Plano grátis.",
    og: "pt_BR",
  },
  es: {
    title: "CosmoKit | Herramientas del Simulador iOS para Mac",
    description:
      "Herramientas del Simulador iOS para Mac: proxy HTTPS, push real (APNs), capturas, video, GPS y servidor MCP para agentes de IA. Plan gratis.",
    og: "es_ES",
  },
};

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "pt-BR" }, { locale: "es" }];
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const meta = localeMeta[params.locale] ?? localeMeta.en;
  return {
    title: meta.title,
    description: meta.description,
    alternates: localizedAlternates(params.locale),
    openGraph: {
      title: meta.title,
      description: meta.description,
      locale: meta.og,
      url: `${SITE}/${params.locale}/`,
      // Next replaces the root layout's openGraph wholesale rather than merging
      // into it, so everything the root sets has to be repeated here. Leaving
      // images out cost every locale its og:image, which is the field Facebook,
      // Instagram, LinkedIn, WhatsApp, Slack and iMessage read: shares of this
      // site rendered as a bare text card with no picture.
      type: "website",
      siteName: "CosmoKit",
      images: [
        {
          url: "/screenshots/og.jpg",
          width: 1200,
          height: 750,
          alt: "CosmoKit App Screenshot",
        },
      ],
    },
  };
}

export default function Home({ params }: { params: { locale: string } }) {
  const m = messages[params.locale] ?? en;
  const faqItems = Object.values(
    (m.FAQ?.items ?? {}) as Record<string, { question: string; answer: string }>
  );

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <HomeClient />
    </>
  );
}
