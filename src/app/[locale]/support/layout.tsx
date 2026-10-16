import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/siteMetadata";

const TITLES: Record<string, string> = {
  en: "Support | CosmoKit",
  "pt-BR": "Suporte | CosmoKit",
  es: "Soporte | CosmoKit",
};

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  return {
    title: TITLES[params.locale] ?? TITLES.en,
    alternates: localizedAlternates(params.locale, "support"),
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
