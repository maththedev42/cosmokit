# Google Ads conversion check

The marketing site records an App Store link click as the Google Ads outbound
click conversion configured in `GoogleAds.tsx`. The current default action is
`AW-18227085442/u_XUCJvKhYAdEIKBrfND` (the "Clique de saída" action). The
current App Store CTAs in `Hero.tsx`, `PlatformDownloads.tsx`, and
`marketing.tsx` all use `target="_blank"` and `rel="noopener noreferrer"`, so
the page does not unload and the `transport_type: "beacon"` hit is the
important delivery path. The same-tab callback and short timeout remain as a
safe fallback for future CTAs.

`AppStoreAttribution` also listens for the same selector, but it only rewrites
the App Store URL with attribution parameters. It does not call `gtag`, so one
click produces exactly one conversion event.

To verify this in a local production-like run:

1. Run `npm run dev` and open a page containing an App Store CTA.
2. In DevTools, enable the Network panel and preserve the log.
3. Click the CTA once. Confirm a request to Google containing the configured
   `send_to` value (`/pagead/conversion` or a `collect` request), then confirm
   that the App Store navigation still occurs.
4. In the request details, check for
   `AW-18227085442/u_XUCJvKhYAdEIKBrfND`, the conversion ID and label for the
   "Clique de saída" action.

The constants accept `NEXT_PUBLIC_GOOGLE_ADS_ID` and
`NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL`. Keep both values from the same
Google Ads account and conversion action; do not create a second action just to
make the tag fire.
