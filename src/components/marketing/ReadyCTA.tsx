import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppStoreButton } from "@/components/marketing/marketing";

export function ReadyCTA({ title = "Ready to test faster?" }: { title?: string }) {
  return (
    <section className="container mx-auto px-4 pb-24 text-center">
      <div className="max-w-2xl mx-auto rounded-2xl border border-border/60 bg-card/40 p-10">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">
          {title}
        </h2>
        <p className="text-muted-foreground mb-6">
          CosmoKit is a native macOS app. Free to start, no signup.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <AppStoreButton />
          <Link
            href="/pricing/"
            className="inline-flex items-center gap-2 rounded-xl border border-border/60 hover:border-violet-DEFAULT/30 hover:bg-violet-glow transition-colors px-5 py-2.5 text-sm font-medium"
          >
            View pricing <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
