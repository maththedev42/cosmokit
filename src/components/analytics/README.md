# Google Ads conversion check

The marketing site records an App Store link click as the Google Ads conversion
configured in `GoogleAds.tsx`. The click handler briefly holds an ordinary
same-tab navigation so Google can queue the conversion hit, then continues via
the callback or a short timeout. Modified clicks and links opened in a new tab
keep their native browser behavior.

To verify this in a local production-like run:

1. Run `npm run dev` and open a page containing an App Store CTA.
2. In DevTools, enable the Network panel and preserve the log.
3. Click the CTA once. Confirm a request to Google containing the configured
   `send_to` value (`/pagead/conversion` or a `collect` request), then confirm
   that the App Store navigation still occurs.
4. In the request details, check that the conversion ID and label match the
   Google Ads conversion action currently intended for App Store clicks.

The constants accept `NEXT_PUBLIC_GOOGLE_ADS_ID` and
`NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL`. Keep both values from the same
Google Ads account and conversion action; do not create a second action just to
make the tag fire.
