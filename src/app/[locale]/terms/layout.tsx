import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/siteMetadata";

const TITLES: Record<string, string> = {
  en: "Terms of Service | CosmoKit",
  "pt-BR": "Termos de Serviço | CosmoKit",
  es: "Términos del Servicio | CosmoKit",
};

export function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Metadata {
  return {
    title: TITLES[params.locale] ?? TITLES.en,
    alternates: localizedAlternates(params.locale, "terms"),
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
