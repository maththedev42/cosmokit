import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/siteMetadata";

const TITLES: Record<string, string> = {
  en: "Suggest a Feature | CosmoKit",
  "pt-BR": "Sugerir um recurso | CosmoKit",
  es: "Sugerir una función | CosmoKit",
};

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  return {
    title: TITLES[params.locale] ?? TITLES.en,
    alternates: localizedAlternates(params.locale, "suggest"),
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
