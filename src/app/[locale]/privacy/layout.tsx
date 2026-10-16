import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/siteMetadata";

const TITLES: Record<string, string> = {
  en: "Privacy Policy | CosmoKit",
  "pt-BR": "Política de Privacidade | CosmoKit",
  es: "Política de Privacidad | CosmoKit",
};

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  return {
    title: TITLES[params.locale] ?? TITLES.en,
    alternates: localizedAlternates(params.locale, "privacy"),
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
