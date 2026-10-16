import "../globals.css";
import { SiteDocument } from "@/components/SiteDocument";
import { rootMetadata } from "@/lib/siteMetadata";
import { LocaleProvider } from "./provider";

export const metadata = rootMetadata;

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "pt-BR" }, { locale: "es" }];
}

export default function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <SiteDocument lang={params.locale}>
      <LocaleProvider>{children}</LocaleProvider>
    </SiteDocument>
  );
}
