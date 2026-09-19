export type FeatureBlock = {
  title: string;
  subtitle?: string;
  body: string; // one short paragraph
  bullets: string[];
  image?: { src: string; alt: string }; // under /public/features/<slug>/
  code?: { lang: "bash" | "text" | "json"; content: string };
};

export type FeaturePageDef = {
  slug: string;
  title: string; // the H1 AND the card title — identical on purpose
  subtitle: string; // one line under the H1
  metaTitle: string;
  metaDescription: string;
  cardBlurb: string; // one line on the /features/ grid
  blocks: FeatureBlock[];
  launched: boolean; // false until FH-06
  related?: string[]; // other slugs, rendered as links above the CTA
  externalHref?: string; // card links here instead of /features/<slug>/ (used for /cli/)
};

export const FEATURE_PAGES: FeaturePageDef[] = [
  {
    slug: "agentic-development",
    title: "Let your AI agent see and drive the Simulator",
    subtitle: "Drive the iOS Simulator with Claude Code, Cursor, and any MCP client.",
    metaTitle: "Agentic Development | CosmoKit for iOS Simulator",
    metaDescription:
      "Let AI agents see and drive the iOS Simulator via CLI, MCP server, and Agent Skill.",
    cardBlurb: "Drive the Simulator with Claude Code, Cursor, Codex and any MCP client.",
    blocks: [
      {
        title: "Coming soon",
        body: "Full feature details are coming soon.",
        bullets: [],
      },
    ],
    launched: false,
    related: ["network-proxy", "control-panel"],
  },
  {
    slug: "network-proxy",
    title: "Inspect and mock every request, no SDK",
    subtitle: "Route simulator traffic through CosmoKit to inspect HTTPS and mock API calls.",
    metaTitle: "Network Proxy & Inspection | CosmoKit for iOS Simulator",
    metaDescription:
      "Inspect HTTPS requests, mock API responses, and test slow networks without an SDK.",
    cardBlurb: "Inspect HTTPS traffic and mock API responses without modifying your app.",
    blocks: [
      {
        title: "Coming soon",
        body: "Full feature details are coming soon.",
        bullets: [],
      },
    ],
    launched: false,
    related: ["agentic-development", "control-panel"],
  },
  {
    slug: "control-panel",
    title: "One panel for every simulator switch",
    subtitle: "Manage devices, diagnostics, presets, and disk space in one place.",
    metaTitle: "Control Panel | CosmoKit for iOS Simulator",
    metaDescription:
      "All your iOS Simulator controls, diagnostics, presets, and disk cleanup in one panel.",
    cardBlurb: "Control, boot, clean, and manage all your simulators in one unified panel.",
    blocks: [
      {
        title: "Coming soon",
        body: "Full feature details are coming soon.",
        bullets: [],
      },
    ],
    launched: false,
    related: ["app-environment", "network-proxy"],
  },
  {
    slug: "app-environment",
    title: "Set the app's world before it launches",
    subtitle: "Override appearance, status bar, permissions, Face ID, and UserDefaults.",
    metaTitle: "App Environment | CosmoKit for iOS Simulator",
    metaDescription:
      "Configure simulator appearance, status bar, Face ID, and permissions before launch.",
    cardBlurb: "Override appearance, status bar, Face ID, and permissions before launch.",
    blocks: [
      {
        title: "Coming soon",
        body: "Full feature details are coming soon.",
        bullets: [],
      },
    ],
    launched: false,
    related: ["control-panel", "push-and-deep-links"],
  },
  {
    slug: "screenshots-recordings",
    title: "Capture, record, and generate store screenshots",
    subtitle: "Pixel-perfect simulator captures, video recording, and App Store screenshot generation.",
    metaTitle: "Screenshots & Recordings | CosmoKit for iOS Simulator",
    metaDescription:
      "Capture simulator screenshots, record video, and generate App Store assets.",
    cardBlurb: "High-resolution simulator captures, video recordings, and App Store assets.",
    blocks: [
      {
        title: "Coming soon",
        body: "Full feature details are coming soon.",
        bullets: [],
      },
    ],
    launched: false,
    related: ["control-panel", "agentic-development"],
  },
  {
    slug: "push-and-deep-links",
    title: "Push notifications and deep links in one click",
    subtitle: "Test push notifications and open custom URLs without a backend or physical device.",
    metaTitle: "Push Notifications & Deep Links | CosmoKit for iOS Simulator",
    metaDescription:
      "Send custom push payloads and trigger deep links in the iOS Simulator instantly.",
    cardBlurb: "Send push payloads and test URL schemes directly in the simulator.",
    blocks: [
      {
        title: "Coming soon",
        body: "Full feature details are coming soon.",
        bullets: [],
      },
    ],
    launched: false,
    related: ["app-environment", "location"],
  },
  {
    slug: "location",
    title: "Simulate location, routes, and scenarios",
    subtitle: "Set GPS coordinates, simulate routes, and test geofencing with ease.",
    metaTitle: "Location Simulation | CosmoKit for iOS Simulator",
    metaDescription: "Set custom GPS coordinates and simulate routes in the iOS Simulator.",
    cardBlurb: "Simulate GPS coordinates, movement routes, and geofencing scenarios.",
    blocks: [
      {
        title: "Coming soon",
        body: "Full feature details are coming soon.",
        bullets: [],
      },
    ],
    launched: false,
    related: ["control-panel", "push-and-deep-links"],
  },
  {
    slug: "cli",
    title: "cosmokit CLI",
    subtitle: "Drive the iOS Simulator from the command line",
    metaTitle: "cosmokit CLI | CosmoKit for iOS Simulator",
    metaDescription: "Drive the iOS Simulator from your terminal, scripts, and CI jobs.",
    cardBlurb: "Drive the iOS Simulator from your terminal, scripts, and CI jobs.",
    blocks: [],
    launched: true,
    externalHref: "/cli/",
  },
];

export const isShown = (p: FeaturePageDef) =>
  p.launched || process.env.NEXT_PUBLIC_SHOW_UNLAUNCHED === "1";
