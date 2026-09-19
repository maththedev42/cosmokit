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
    subtitle:
      "A built-in MITM proxy for any app on the iOS Simulator without SDKs, framework dependencies, or code changes.",
    metaTitle: "Network Proxy & Inspection | CosmoKit for iOS Simulator",
    metaDescription:
      "Inspect HTTPS traffic, mock API responses, and throttle network conditions on the iOS Simulator without an SDK or code changes.",
    cardBlurb:
      "Inspect HTTPS traffic, mock API responses, and throttle conditions without modifying your app.",
    blocks: [
      {
        title: "See every request as it happens",
        subtitle: "Built-in MITM proxy with one-click simulator setup",
        body: "Route simulator traffic through CosmoKit's built-in proxy to inspect HTTPS requests and responses in real time. Inspect headers, query parameters, payloads, and response times without installing separate proxy tools or manually configuring certificates.",
        bullets: [
          "Inspect live HTTPS requests and responses",
          "View headers, query parameters, and JSON payloads",
          "Track request latency and timing",
          "One-click simulator CA certificate and proxy setup",
        ],
        image: {
          src: "/screenshots/store/en/proxy.webp",
          alt: "CosmoKit Network Proxy inspecting simulator requests",
        },
      },
      {
        title: "Mock the response",
        subtitle: "URL pattern matching and custom status codes",
        body: "Intercept outgoing requests and return custom mock responses to test edge cases before backend endpoints are ready. Define rules by URL pattern and HTTP method to override status codes, headers, and response bodies on demand.",
        bullets: [
          "Match requests by URL glob pattern and HTTP method",
          "Override status codes, custom headers, and response JSON",
          "Organize mock rules into toggleable folders",
          "Simulate backend errors and edge cases without deploying code",
        ],
      },
      {
        title: "Throttle and go offline",
        subtitle: "Network condition presets and injected failure rates",
        body: "Shape simulator traffic with built-in network condition presets or custom latency and bandwidth limits. Test how your application handles flaky connections, timeouts, packet drops, or complete offline states without leaving your desk.",
        bullets: [
          "Presets for Edge, 3G, LTE, Very Bad Network, and Offline",
          "Custom latency (ms) and bandwidth throttling (download/upload kbps)",
          "Injected failure rates with connection drop, timeout, or 503 errors",
          "Validate offline banners, retry loops, and empty states",
        ],
      },
      {
        title: "Works with apps you didn't write",
        subtitle: "System-level proxying without swizzling or SDKs",
        body: "CosmoKit operates at the simulator network layer rather than inside your application binary. Because nothing is linked into your app, there is no SDK to bundle, no build phase to configure, and no method swizzling. Any app running in the simulator—including App Store builds, third-party apps, and client binaries—can be inspected immediately.",
        bullets: [
          "Zero SDKs, pods, or SPM packages required",
          "No code changes, method swizzling, or build configuration",
          "Inspect third-party apps, system apps, and precompiled builds",
          "Production builds remain completely untouched",
        ],
      },
      {
        title: "From the CLI and your agent",
        subtitle: "Check proxy status from scripts, terminal, or MCP",
        body: "Query inherited proxy configuration from your terminal or pass it to AI coding agents. The proxy engine and TLS stack run inside the macOS app to protect host routing, while the CLI and MCP server expose read-only status commands for diagnostics.",
        bullets: [
          "Run cosmokit proxy-status to inspect inherited host proxy settings",
          "Use the proxy_status MCP tool from Claude Code, Cursor, and Codex",
          "Status checks from the CLI; configure rules and start the proxy in the app",
          "Included in cosmokit doctor diagnostic reports",
        ],
        code: {
          lang: "bash",
          content:
            "$ cosmokit proxy-status\nHTTP Proxy:  127.0.0.1:9090 (enabled)\nHTTPS Proxy: 127.0.0.1:9090 (enabled)\nBypass:      *.local, 169.254/16",
        },
      },
    ],
    launched: false,
    related: ["agentic-development", "app-environment"],
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
