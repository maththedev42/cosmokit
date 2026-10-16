"use client";

// Google Ads global site tag (gtag.js) + conversion tracking.
// The base tag enables Google Ads to verify the site, build remarketing
// audiences and feed Smart Bidding. Because CosmoKit is purchased off-site on
// the Mac App Store, the "conversion" event is fired when a visitor clicks any
// App Store link (the only meaningful on-site conversion action) — a delegated
// document listener so every CTA across the site is covered without touching
// each component.
import { useEffect } from "react";

const AW_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? "AW-18227085442";
const CONVERSION_LABEL =
  process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL ?? "u_XUCJvKhYAdEIKBrfND";
const CONVERSION_SEND_TO = `${AW_ID}/${CONVERSION_LABEL}`;
const GTAG_SRC = `https://www.googletagmanager.com/gtag/js?id=${AW_ID}`;
const GTAG_SCRIPT_ID = "gtag-js";

// gtag.js is kept off the critical path (it costs ~150 ms of main-thread time
// on mobile): it loads once the page is idle after `load`, the same timing as
// next/script's lazyOnload. The inline stub below queues every gtag() call in
// window.dataLayer until then, so nothing is lost. The exception is an App
// Store click that happens before that: the conversion is queued, but the
// script is fetched right away so the hit can still go out (and fire
// event_callback) before the visitor leaves.
function loadGtag() {
  if (document.getElementById(GTAG_SCRIPT_ID)) return;
  const script = document.createElement("script");
  script.id = GTAG_SCRIPT_ID;
  script.async = true;
  script.src = GTAG_SRC;
  document.head.appendChild(script);
}

export function GoogleAds() {
  useEffect(() => {
    const w = window as unknown as {
      dataLayer?: unknown[];
      gtag?: (...args: unknown[]) => void;
    };
    w.dataLayer = w.dataLayer ?? [];
    const hadGtag = typeof w.gtag === "function";
    w.gtag = w.gtag ?? ((...args: unknown[]) => w.dataLayer?.push(args));
    if (!hadGtag) {
      w.gtag("js", new Date());
      w.gtag("config", AW_ID);
    }

    // Idle after load, like next/script's lazyOnload.
    const idle = (fn: () => void) => {
      const ric = (window as unknown as {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      }).requestIdleCallback;
      if (ric) ric(fn, { timeout: 3000 });
      else window.setTimeout(fn, 1);
    };
    const scheduleLoad = () => idle(loadGtag);
    if (document.readyState === "complete") scheduleLoad();
    else window.addEventListener("load", scheduleLoad, { once: true });

    const onClick = (e: Event) => {
      const target = e.target as HTMLElement | null;
      const link = target?.closest?.('a[href*="apps.apple.com"]') as HTMLAnchorElement | null;
      if (!link) return;
      if (typeof w.gtag !== "function") return;
      loadGtag();

      const mouseEvent = e as MouseEvent;
      const shouldHoldNavigation =
        mouseEvent.button === 0 &&
        !mouseEvent.metaKey &&
        !mouseEvent.ctrlKey &&
        !mouseEvent.shiftKey &&
        !mouseEvent.altKey &&
        (!link.target || link.target === "_self");
      const destination = link.href;
      let navigated = false;
      const continueNavigation = () => {
        if (navigated) return;
        navigated = true;
        window.location.assign(destination);
      };

      if (shouldHoldNavigation) e.preventDefault();
      w.gtag("event", "conversion", {
        send_to: CONVERSION_SEND_TO,
        value: 1.0,
        currency: "BRL",
        transport_type: "beacon",
        ...(shouldHoldNavigation
          ? {
              event_callback: continueNavigation,
              event_timeout: 1000,
            }
          : {}),
      });

      // A blocked tag or an offline browser must not strand the visitor after
      // the click. Google calls event_callback when the hit is queued, while
      // this timeout is the safety net for a missing/blocked script.
      if (shouldHoldNavigation) window.setTimeout(continueNavigation, 1100);
    };
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("load", scheduleLoad);
      document.removeEventListener("click", onClick, true);
    };
  }, []);

  return (
    <>
      <meta name="google-ads-conversion-label" content={CONVERSION_LABEL} />
      <script
        dangerouslySetInnerHTML={{
          __html: `window.dataLayer = window.dataLayer || [];
window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
gtag('js', new Date());
gtag('config', '${AW_ID}');
// Conversion action label: ${CONVERSION_LABEL}`,
        }}
      />
    </>
  );
}
