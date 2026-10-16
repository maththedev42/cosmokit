import "../globals.css";
import { SiteDocument } from "@/components/SiteDocument";
import { rootMetadata } from "@/lib/siteMetadata";

// Unprefixed marketing pages (/pricing, /push, ...) are English-only.
export const metadata = rootMetadata;

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteDocument lang="en">{children}</SiteDocument>;
}
