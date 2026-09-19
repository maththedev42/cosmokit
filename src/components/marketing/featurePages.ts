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
    subtitle:
      "Manage app profiles, scheme diagnostics, dev presets, and disk cleanup from a single unified macOS control panel.",
    metaTitle: "Control Panel | CosmoKit for iOS Simulator",
    metaDescription:
      "All your iOS Simulator controls in one place: app profiles, runtime diagnostics, dev presets, menu bar shortcuts, and Disk Doctor cleanup.",
    cardBlurb:
      "Control, boot, diagnose, and clean all your simulators in one unified panel.",
    blocks: [
      {
        title: "App profiles with isolated environments",
        subtitle: "Saved configurations per bundle ID",
        body: "Configure launch arguments, environment variables, appearance overrides, and locale settings saved specifically per application. Switch between production and staging configs or test localized layouts with one-click Save & Relaunch.",
        bullets: [
          "Save isolated launch arguments and environment variables per app",
          "Override system appearance, language, and regional locale",
          "One-click Save & Relaunch to restart the app with updated flags",
          "Organize and manage profiles across all installed simulator apps",
        ],
        image: {
          src: "/screenshots/store/en/profiles.webp",
          alt: "CosmoKit App Profiles configuration",
        },
      },
      {
        title: "Scheme diagnostics without Xcode scheme editing",
        subtitle: "Toggle runtime sanitizers and debug flags instantly",
        body: "Enable critical runtime diagnostic tools without opening Xcode scheme editors or rebuilding your project. Catch memory corruption, threading violations, and database performance bottlenecks on demand.",
        bullets: [
          "Enable Zombies (NSZombieEnabled) to catch messages to deallocated objects",
          "Run Main Thread Checker to detect background thread UI API calls",
          "Toggle Malloc stack logging and guard edges for memory safety",
          "Stream Core Data SQL logs and timing directly to Console",
        ],
      },
      {
        title: "Dev presets for instant context switching",
        subtitle: "Restore your entire workspace in one click",
        body: "Rebuild your exact development state in seconds instead of configuring simulators by hand every morning. Dev presets bundle device configurations, active profiles, and testing tools into reusable snapshots.",
        bullets: [
          "Save complete simulator configurations as reusable presets",
          "Restore booted devices, target applications, and environment state",
          "Switch between bug reproduction setups and clean testing baselines",
          "Eliminate manual setup steps before starting a development session",
        ],
      },
      {
        title: "Always within reach in the menu bar",
        subtitle: "Global shortcuts and fast actions from any app",
        body: "Access essential simulator controls without leaving your editor or debugger. The lightweight menu bar companion lets you trigger captures, boot your last simulator, and resend notifications from anywhere in macOS.",
        bullets: [
          "Capture screenshots from any app with global shortcut ⌃⌥⌘S",
          "Keep your last five captures accessible in one click",
          "Boot your most recently used simulator instantly",
          "Re-send recent push payloads directly from the menu bar",
        ],
      },
      {
        title: "Complete device management",
        subtitle: "Boot, shutdown, and erase without simctl syntax",
        body: "Monitor and control every simulator runtime installed on your Mac. View paired hardware devices alongside virtual simulators, check battery and connection status, and perform device lifecycles cleanly.",
        bullets: [
          "View paired physical devices and virtual simulator runtimes",
          "Boot, shut down, and manage multiple simulators side by side",
          "Single-click device wipe and factory reset",
          "Inspect device model, iOS version, and connection state",
        ],
      },
      {
        title: "Disk Doctor storage cleanup",
        subtitle: "Reclaim gigabytes of wasted simulator caches",
        body: "Xcode simulators leave behind tens of gigabytes of orphaned runtimes, cache files, and abandoned app data. Disk Doctor scans simulator directories and safely reclaims disk space with a single click.",
        bullets: [
          "Scan simulator caches, derived data, and orphaned runtimes",
          "Visualize storage consumption broken down by simulator",
          "Safely delete unused simulator data without breaking Xcode",
          "Reclaim tens of gigabytes of disk space in seconds",
        ],
      },
    ],
    launched: false,
    related: ["app-environment", "agentic-development"],
  },
  {
    slug: "app-environment",
    title: "Set the app's world before it launches",
    subtitle:
      "Configure appearance, status bar, permissions, biometric auth, keychain, and UserDefaults before running your tests.",
    metaTitle: "App Environment | CosmoKit for iOS Simulator",
    metaDescription:
      "Configure simulator appearance, clean status bar, Face ID, permissions, keychain, and live UserDefaults from a native UI or the cosmokit CLI.",
    cardBlurb:
      "Override appearance, status bar, Face ID, permissions, and live UserDefaults before launch.",
    blocks: [
      {
        title: "Appearance, dynamic type, and accessibility",
        subtitle: "Instant light/dark and accessibility overrides",
        body: "Test dark mode, dynamic type sizing, and accessibility options without digging through the iOS Settings app. CosmoKit applies appearance changes immediately so you can verify color contrast and layout scalability side by side.",
        bullets: [
          "Toggle between Light and Dark mode instantly",
          "Adjust Dynamic Type content size categories on the fly",
          "Preview high contrast and accessibility display options",
          "Verify adaptive layouts and color schemes across screens",
        ],
      },
      {
        title: "Pixel-perfect status bar overrides",
        subtitle: "Clean frames for marketing and App Store captures",
        body: "Set a pristine status bar before taking screenshots or recording demo videos. CosmoKit standardizes the time, battery percentage, cellular bars, and Wi-Fi signal so every capture looks polished and consistent.",
        bullets: [
          "Standardize clock display to 9:41 AM (or any custom time)",
          "Pin battery status to 100% charged with full indicators",
          "Set full Wi-Fi and cellular signal strength bars",
          "Clear overrides with a single click to restore live system state",
        ],
      },
      {
        title: "Permissions without app reinstallation",
        subtitle: "Grant, revoke, and reset privacy permissions",
        body: "Modify privacy and hardware permissions on demand without uninstalling the app or resetting the simulator. Toggle access to Camera, Photos, Location, Notifications, and Contacts to test permission prompts and denied states.",
        bullets: [
          "Grant or revoke Camera, Microphone, and Photo Library access",
          "Toggle Location Services, Contacts, and Push Notification access",
          "Reset all permissions for a specific bundle ID to test onboarding",
          "Validate fallback UI and graceful degradation when access is denied",
        ],
      },
      {
        title: "Biometric authentication & Face ID",
        subtitle: "Simulate enrollment, matches, and failures",
        body: "Test LocalAuthentication flows without physical hardware. CosmoKit simulates whether the device has biometrics enrolled and lets you trigger matching authentication successes or non-matching failures on demand.",
        bullets: [
          "Toggle Face ID and Touch ID biometric enrollment on or off",
          "Trigger successful biometric match to test authenticated flows",
          "Simulate biometric non-match failure to test fallback passcode UI",
          "Test biometric lockout and retry flows seamlessly",
        ],
      },
      {
        title: "Live UserDefaults and keychain management",
        subtitle: "Inspect, edit, and reset app state",
        body: "Browse and edit your application's live UserDefaults plist directly. Flip feature flags, edit stored strings or arrays, delete keys, and inspect stored keychain credentials with automatic app relaunch.",
        bullets: [
          "Read and edit app UserDefaults keys, types, and values in real time",
          "Delete specific preference keys or reset app domain state",
          "Browse and manage keychain items stored by your simulator app",
          "Install custom root certificates and reset simulator keychain",
        ],
        image: {
          src: "/screenshots/store/en/defaults.webp",
          alt: "CosmoKit UserDefaults Editor",
        },
      },
      {
        title: "Installed apps & container access",
        subtitle: "Inspect sandboxes and launch lifecycles",
        body: "Inspect all applications installed in the simulator with bundle IDs and version metadata. Launch, terminate, or uninstall apps with one click, or jump directly into the app's sandboxed Documents and App Group containers.",
        bullets: [
          "Browse installed third-party and system applications",
          "Launch, terminate, or uninstall apps instantly",
          "Open app sandboxes, Documents, and Caches in Finder",
          "Inspect shared App Group container directories directly",
        ],
      },
      {
        title: "Every switch is also a command",
        subtitle: "Drive environment states from your CLI and scripts",
        body: "Every environment control in CosmoKit is backed by the free cosmokit CLI and exposed via MCP tools. Automate pristine status bars, permission states, and preference writes inside your CI jobs or AI agent loops.",
        bullets: [
          "Run cosmokit statusbar and cosmokit appearance in scripts",
          "Control permissions with cosmokit permission grant|revoke|reset",
          "Trigger biometrics with biometric-enroll and biometric-match",
          "Read and write preferences with defaults and defaults-write",
        ],
        code: {
          lang: "bash",
          content:
            "$ cosmokit statusbar --time \"9:41\" --battery 100\n$ cosmokit appearance dark\n$ cosmokit permission grant camera com.example.app\n$ cosmokit biometric-match match",
        },
      },
    ],
    launched: false,
    related: ["control-panel", "agentic-development"],
  },
  {
    slug: "screenshots-recordings",
    title: "Capture, record, and generate store screenshots",
    subtitle:
      "Pixel-perfect simulator captures, MP4 and animated GIF video recording, and automated App Store screenshot generation.",
    metaTitle: "Screenshots & Recordings | CosmoKit for iOS Simulator",
    metaDescription:
      "Capture high-resolution simulator screenshots, record MP4 and GIF video, and generate framed App Store assets without design tools.",
    cardBlurb:
      "High-resolution simulator captures, MP4/GIF video recording, and App Store screenshot generation.",
    blocks: [
      {
        title: "One-click pixel-perfect screenshots",
        subtitle: "Lossless captures directly from the menu bar or workspace",
        body: "Grab clean, uncompressed simulator screenshots instantly without hunting through desktop clutter. Capture with a single click or global hotkey ⌃⌥⌘S, with optional native device bezels and direct clipboard copying.",
        bullets: [
          "Capture high-resolution simulator screenshots in one click",
          "Global system shortcut ⌃⌥⌘S captures without switching windows",
          "Optional native device frames and drop shadows",
          "Recent captures saved to your workspace and ready to share",
        ],
        image: {
          src: "/screenshots/store/en/capture.webp",
          alt: "CosmoKit Screen Capture tool",
        },
      },
      {
        title: "Smooth video recording and animated GIFs",
        subtitle: "Export demo recordings for QA, pull requests, and marketing",
        body: "Record smooth simulator walkthroughs without clunky QuickTime menus or command line tools. Export directly to compressed MP4 for bug reports and PR walkthroughs, or lightweight animated GIFs for documentation.",
        bullets: [
          "Record smooth video sessions directly from the control panel",
          "Export to standard MP4 video or animated GIF formats",
          "Optional audio recording toggle for spoken walkthroughs",
          "Ideal for QA bug reproduction, pull request previews, and docs",
        ],
      },
      {
        title: "App Store screenshot generator",
        subtitle: "Generate store-ready assets without opening Figma",
        body: "Transform raw simulator captures into framed, localized App Store screenshot sets ready for App Store Connect. Choose from official Apple display size presets, apply gradient backgrounds, and manage localized copy.",
        bullets: [
          "Presets for required iPhone, iPad, and Mac App Store display sizes",
          "Automated device framing with accurate hardware bezels",
          "Customizable background colors, gradients, and font typography",
          "Multi-locale template sets for localized App Store submissions",
        ],
      },
      {
        title: "Automated captures in CI and scripts",
        subtitle: "Drive visual regression tests from the cosmokit CLI",
        body: "Incorporate simulator visual capture into your automated build pipelines and git hooks. The free cosmokit CLI provides scriptable capture and recording commands that output directly to target directories.",
        bullets: [
          "Run cosmokit capture to save screenshot artifacts in CI jobs",
          "Record simulator sessions during integration tests with cosmokit record",
          "Target specific booted or named simulators with UDID flags",
          "Zero graphical dependencies required for CLI screenshot tasks",
        ],
        code: {
          lang: "bash",
          content:
            "# Capture booted simulator into repository screenshots\n$ cosmokit capture --output ./screenshots\n\n# Record 10-second interaction video\n$ cosmokit record --output ./artifacts/test-run.mp4",
        },
      },
    ],
    launched: false,
    related: ["control-panel", "push-and-deep-links"],
  },
  {
    slug: "push-and-deep-links",
    title: "Push notifications and deep links in one click",
    subtitle:
      "Send custom APNs push payloads, test Universal Links, and open custom URL schemes directly in the iOS Simulator without a backend.",
    metaTitle: "Push Notifications & Deep Links | CosmoKit for iOS Simulator",
    metaDescription:
      "Send custom APNs payloads and open deep links or Universal Links in the iOS Simulator without a backend server or physical device.",
    cardBlurb:
      "Send push payloads and test URL schemes directly in the simulator without a backend.",
    blocks: [
      {
        title: "Push payload editor and simulated delivery",
        subtitle: "Test notification UI and badges without Apple Push Notification keys",
        body: "Compose custom APNs JSON payloads and simulate delivery directly to any running simulator. Verify banner layouts, notification action buttons, badge counts, and payload data handling without provisioning certificates or setting up backend push services.",
        bullets: [
          "Send custom APNs JSON payloads directly to the simulator",
          "Test notification banners, alert titles, subtitles, and bodies",
          "Verify badge counts, custom sounds, and background notification triggers",
          "Zero backend servers, physical devices, or APNs certificates required",
        ],
        image: {
          src: "/screenshots/store/en/push.webp",
          alt: "CosmoKit Push Notification tool",
        },
      },
      {
        title: "Saved payload templates for edge cases",
        subtitle: "Build a library of reusable notification test scenarios",
        body: "Store frequently used push notification structures into reusable templates. Quickly test edge cases such as long notification text, missing parameters, deep link routes, and order updates without retyping JSON.",
        bullets: [
          "Save reusable payload templates per application or profile",
          "Test edge-case text lengths, missing keys, and invalid formats",
          "Quickly re-send recent payloads from the main window or menu bar",
          "Organize and manage team testing templates side by side",
        ],
      },
      {
        title: "Deep links and Universal Links routing",
        subtitle: "Validate custom schemes and URL handling instantly",
        body: "Trigger custom URL schemes (like myapp://) and HTTP/HTTPS Universal Links directly in the simulator. Test routing logic, authentication callbacks, referral codes, and deep-linked screens in seconds.",
        bullets: [
          "Open custom URL schemes and HTTP/HTTPS Universal Links directly",
          "Verify routing logic, URL query parameters, and screen transitions",
          "Store reusable deep links in your history for instant access",
          "Validate deep-linked authentication and onboarding funnels",
        ],
      },
      {
        title: "Automate pushes and links from the CLI",
        subtitle: "Exercise notification flows in git hooks and CI suites",
        body: "Trigger pushes and deep links programmatically using the free cosmokit CLI. Incorporate deep link validation into pull request checks or simulate pushes inside automated end-to-end tests.",
        bullets: [
          "Run cosmokit push to send JSON payloads to target bundle IDs",
          "Run cosmokit open to fire URL schemes and deep links from scripts",
          "Exercise routing checks automatically inside git pre-commit hooks",
          "Use push and open MCP tools from Claude Code, Cursor, and Codex",
        ],
        code: {
          lang: "bash",
          content:
            "# Send custom push notification payload\n$ cosmokit push com.example.app ./payload.json\n\n# Open deep link route\n$ cosmokit open \"myapp://settings/notifications?source=promo\"",
        },
      },
    ],
    launched: false,
    related: ["location", "app-environment"],
  },
  {
    slug: "location",
    title: "Simulate location, routes, and scenarios",
    subtitle:
      "Set GPS coordinates, replay movement routes with walk, bike, or drive speeds, and trigger built-in location scenarios.",
    metaTitle: "Location Simulation | CosmoKit for iOS Simulator",
    metaDescription:
      "Simulate GPS coordinates, movement routes with custom speeds, and built-in location scenarios in the iOS Simulator without leaving your desk.",
    cardBlurb:
      "Simulate GPS coordinates, movement routes, and geofencing scenarios directly on the simulator.",
    blocks: [
      {
        title: "Set any GPS coordinate on Earth",
        subtitle: "Address search and favorite location presets",
        body: "Teleport any iOS Simulator to any coordinate worldwide in one click. Search addresses, drop custom latitude and longitude coordinates, and save frequently used testing locations for geofencing and localized content checks.",
        bullets: [
          "Set exact latitude and longitude coordinates on any booted simulator",
          "Search places and addresses with built-in geocoding lookup",
          "Save favorite location presets per application profile",
          "Test region-restricted content, geofencing triggers, and maps",
        ],
        image: {
          src: "/screenshots/store/en/location.webp",
          alt: "CosmoKit Location Simulation tool",
        },
      },
      {
        title: "Replay dynamic movement routes",
        subtitle: "Simulate realistic transit with walk, bike, and drive speeds",
        body: "Simulate smooth movement between coordinates to test fitness tracking, turn-by-turn navigation, and background location updates. Choose between walking, cycling, or driving presets, or configure custom speeds with real-time ETA calculation.",
        bullets: [
          "Simulate GPS movement between start and destination waypoints",
          "Select presets for Walk, Bicycle, or Automobile speeds",
          "Configure custom velocity in km/h for high-speed or precision testing",
          "Real-time distance and estimated time of arrival calculations",
        ],
      },
      {
        title: "Built-in simulator location scenarios",
        subtitle: "Exercise Apple's standard simulation routines",
        body: "Run standard location routes built into the iOS Simulator platform without configuring custom waypoint files. Simulate common transit patterns to verify background tracking behavior and battery optimization.",
        bullets: [
          "List and execute built-in simulator location scenarios",
          "Run City Bicycle Ride, City Run, and Freeway Drive routines",
          "Continuous route simulation until explicitly paused or cleared",
          "Verify background location delegates and power-saving modes",
        ],
      },
      {
        title: "Clear and reset location state",
        subtitle: "Return to neutral simulator state in one click",
        body: "Stop active route simulations and clear fixed location overrides whenever your test run concludes. CosmoKit cleanly resets simulated location state so subsequent test runs start from a known neutral baseline.",
        bullets: [
          "Stop running location scenarios with a single click",
          "Clear fixed GPS positions to restore default simulator state",
          "Eliminate leftover mock coordinates between automated test runs",
          "Ensure clean, reproducible test baselines for test suites",
        ],
      },
      {
        title: "Scriptable location commands for CLI & AI agents",
        subtitle: "Automate location testing in CI pipelines and agent loops",
        body: "Every location tool in CosmoKit is accessible via the free cosmokit CLI and stdio MCP server. AI agents and shell scripts can query scenarios, set coordinates, and run routes programmatically.",
        bullets: [
          "Run cosmokit location <lat> <lon> to position simulators from scripts",
          "Query built-in scenarios with cosmokit scenarios",
          "Start dynamic routes with cosmokit route <scenario>",
          "Stop simulation cleanly with cosmokit location-clear",
        ],
        code: {
          lang: "bash",
          content:
            "# Put the simulator in Rio de Janeiro before running tests\n$ cosmokit location -22.9068 -43.1729\n\n# Run built-in freeway drive scenario\n$ cosmokit route \"Freeway Drive\"\n\n# Clear location simulation\n$ cosmokit location-clear",
        },
      },
    ],
    launched: false,
    related: ["push-and-deep-links", "agentic-development"],
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
