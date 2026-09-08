# Changelog

## 0.3.0 — 2026-09-08

- Added `agent stream`: loopback MJPEG HTTP server with per-session token path and crosshair click-to-element feedback.
- Added `feedback next|list|ack|clear`: read and acknowledge human comments from the stream without keeping it running.
- Added `agent_stream` and `feedback` MCP tools (50 tools total, 17,401 bytes `tools/list`).
- Added Hand-off section to `cosmokit-simulator` skill and updated Cursor rule.

## 0.2.0 — 2026-09-03

- Added the XCUITest simulator driver and cached agent lifecycle.
- Added compact UI tree inspection and tap, press, swipe, type, button, alert,
  screenshot, and find commands.
- Added MCP tools and the `cosmokit-simulator` Agent Skill.
