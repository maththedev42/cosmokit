# Changelog

## 0.3.0 — 2026-09-08

- Added client-side screen hash to `ui tree` and `--screen` guard to UI actions (`screenChanged` error).
- Added `ui wait` to block on element appearance or disappearance (`--gone`) without polling trees.
- Added `ui do` to run sequential UI action steps stopping on first failure with step index and final tree.
- Added `ui_wait` and `ui_do` MCP tools and `--screen` parameter to actions (52 tools total, 18,038 bytes `tools/list`).
- Added `agent stream`: loopback MJPEG HTTP server with per-session token path and crosshair click-to-element feedback.
- Added `feedback next|list|ack|clear`: read and acknowledge human comments from the stream without keeping it running.
- Added `agent_stream` and `feedback` MCP tools.
- Updated `cosmokit-simulator` skill and Cursor rule with screen guard, wait, and do flow.

## 0.2.0 — 2026-09-03

- Added the XCUITest simulator driver and cached agent lifecycle.
- Added compact UI tree inspection and tap, press, swipe, type, button, alert,
  screenshot, and find commands.
- Added MCP tools and the `cosmokit-simulator` Agent Skill.
