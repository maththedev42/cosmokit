# cosmohq-mcp — the tools the 4.6.2 launch needs and does not have

**Status 2026-09-03:** MCP-01, 02, 03 landed on cosmohq-v3 branch
`feature/cosmohq-mcp-launch-tools` (d491858, edb2e3e, c291abb; pushed).
Reviewed: build/vet/test green, 18 tools on stdio, live calls against the
local API pass, confirm gating works. **Merged to `main`** as `31ab449`
and pushed 2026-09-03 10:00; `~/.local/bin/cosmohq-mcp` rebuilt from
`main` — restart the MCP server in Claude to see the new tools. One
follow-up open: `MCP-03b`.

Read this before dispatching any MCP prompt. Anchor: the **cosmohq-v3**
repo, package `api/cmd/cosmohq-mcp/` (Go, `modelcontextprotocol/go-sdk`),
installed with `go build -o ~/.local/bin/cosmohq-mcp ./cmd/cosmohq-mcp` from
`api/` and registered in `~/.claude.json` as `mcpServers.cosmohq` against
`http://localhost:3003`.

## What the server does today (9 tools, verified 2026-09-03)

`cosmohq_apps`, `cosmohq_campaigns` (community executions only),
`cosmohq_communities` (eligibility + cooldowns), `cosmohq_voice_contract`,
`cosmohq_record_post` (after the operator posted by hand), `cosmohq_results`
(posts + tracking-link clicks side by side), `cosmohq_set_metrics`
(operator-reported), `cosmohq_get_store_listing`,
`cosmohq_update_store_listing`.

Hard rule of the server, unchanged: **it never publishes anything
externally** — no community posts, no App Store Connect pushes, no ad
launches. It drafts, checks, records and reads back.

## What the launch needs and the server cannot do

Every one of these already exists as a REST route on the growth API; the
gap is only the MCP surface:

| need | REST that exists | prompt |
|---|---|---|
| set the Apple provider token, give each execution a `ct`, build store links with `pt`/`ct`/`mt=12` | `handlers_apple.go`: `GET/PUT /v1/growth/apple-provider-token`, `GET/PATCH/PUT /v1/growth/executions/{executionId}/apple-campaign-token` | MCP-01 |
| create or re-point tracking links (all 19 CosmoKit links go to the landing page) | `handlers_tracking.go`: `GET/POST /v1/growth/tracking-links` (POST on an existing slug upserts its destination; DELETE returns 501), `GET …/{code}/stats` | MCP-01 |
| trigger the App Store Connect download sync and read daily downloads | `handlers_insights.go`: `POST /v1/growth/apps/{appId}/sync-app-store` (~36 s), `GET /v1/growth/apps/{appId}/results-timeline` | MCP-02 |
| read the product funnel that gates paid (`paywall_shown` by trigger, `trial_started`) | `http/router.go`: `GET /v1/apps/{id}/analytics?windowDays=30` | MCP-02 |
| look up a Reddit post's live score/comments so the operator can report them | Reddit's public `<post url>.json` (no auth, needs a User-Agent) | MCP-02 |
| read paid campaigns with spend and sync health; pause/resume/budget with confirmation; prove a reconnect | `handlers_campaigns.go`: `GET /v1/growth/campaigns`, `POST …/{id}/status`, `POST …/{id}/budget`; `handlers_insights.go`: `GET /v1/growth/insights`, `POST /v1/growth/apps/{appId}/insights/sync` | MCP-03 |
| list creatives and clear the 13 stuck in `IN_REVIEW` | `handlers_creatives.go`: `GET /v1/growth/apps/{appId}/creatives`, `GET/PATCH /v1/growth/creatives/{id}` | MCP-03 |

## Patterns to copy

- One file per tool: `<name>.go` with an `args` struct, a `json.RawMessage`
  schema, and `register<Name>Tool(server, client)` added to `main.go`
  (`campaigns.go` is the smallest example).
- HTTP goes through `Client` in `client.go` (`COSMOHQ_API_URL`, optional
  `X-Service-Token`, 30 s timeout — the sync tool in MCP-02 needs its own
  longer timeout).
- `textResult` / `errorResult` in `tools.go`; tool-level errors, never
  protocol errors.
- Tests in `server_test.go` style: `httptest.NewServer` faking the API,
  call the handler, assert on `resultText`.
- README tool list and the repo `CLAUDE.md` list of tool names updated in
  the same commit.

## Rules for every prompt

- Anchor check: `pwd` ends in `/cosmohq-v3` and `api/cmd/cosmohq-mcp/main.go`
  exists. Work in `api/`. NEVER `cd` to an absolute path.
- **Another session has uncommitted edits in `api/cmd/cosmohq-mcp/`**
  (`client.go`, `main.go`, `server_test.go`, `README.md`) on branch
  `feature/whatsapp-automations`. Branch from `main`. Stage only the files
  you created or changed, by path; never sweep those edits into your commit.
- Gate: `cd api && go build ./... && go vet ./cmd/cosmohq-mcp/... && go test
  ./cmd/cosmohq-mcp/...` green, then rebuild the binary with the README
  command and prove the new tool answers over stdio:
  `printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | ~/.local/bin/cosmohq-mcp`
  (after `initialize`, as the existing tests do it).
- Write tools that change state take `confirm: true` and refuse without it;
  their descriptions say what they change. Read tools never write.
- **Deliverables:** one commit per prompt, English, conventional-commit
  subject, body says why and names the tools. Remove the prompt file (it
  lives in the CosmoKit outer repo's `.planning/cosmohq-mcp/`) once the
  gates pass — the dispatcher does this if the run cannot reach it.


---

## Addendum 2026-09-11 — paid campaigns end to end (ADS-00..07)

**Status 2026-09-11 17:30: all eight landed.** ADS-00 went straight to
`main` (`73b808d`) and `feat/community-submit-07` (`039ee3f`). ADS-01..07
came back as seven `feat/mcp-*` branches off `73b808d`; merged into `main`
(conflicts only in CLAUDE.md/README tool lists, reconciled in
`docs(mcp): reconcile the tool lists`), pushed, `go build/vet/test` green
for `cmd/cosmohq-mcp` and `internal/growth`, binary rebuilt: **41 tools**
over stdio. Two small API changes rode along: `run-chain` accepts
`{stopBefore}` and creative image upload accepts `sourceUrl`. The ADS-02
live gate left a DRAFT execution "ADS-02 dry run" (`g_e65945a897523fea61faeb3d`,
Reddit) on CosmoKit. Prompt files deleted.

Goal: everything the Ads Workspace can do for **Google Ads, Meta Ads and
Reddit Ads** is doable from the MCP. Verified on 2026-09-11 against
`main` (`59fde43`): the growth API already has every route; the MCP has
only read + pause/resume/budget + creative review.

What exists on `main` (25 tools, `go test ./cmd/cosmohq-mcp/` green):
`cosmohq_ad_campaigns`, `cosmohq_ad_campaign_control` (pause/resume/
set_budget), `cosmohq_sync_insights`, `cosmohq_creatives` (list/get/
review), `cosmohq_tracking_links`, `cosmohq_apple_attribution`, plus the
community/store tools. **No tool creates a campaign, runs a step, edits a
setting, or handles credentials.**

How a paid campaign works in CosmoHQ (read `handlers_runner.go`,
`store_initiatives.go:890`, `runner.go:75-110, 254, 490`,
`store_campaigns_write.go:123`): initiative → execution of a paid
campaign type → the type's `stepTemplates` become steps → `run-chain`
runs them (AI drafts, test connection, keyword sizing, **launch =
create PAUSED on the platform**) and stops at the activation step, which
is "always a human click". Going live is the lifecycle `resume`, which
also marks the activate step DONE.

| id | tools | depends on |
|---|---|---|
| ADS-00 | fix the CC-06 `record_post` schema (extra `}`), test that registering every tool doesn't panic | — |
| ADS-01 | `cosmohq_ad_platforms`, `cosmohq_ad_credentials`, `cosmohq_google_reauth` | — |
| ADS-02 | `cosmohq_campaign_types`, `cosmohq_ad_campaign_create`, `cosmohq_execution` | — |
| ADS-03 | `cosmohq_campaign_chain`, `cosmohq_campaign_step`, (`cosmohq_job`) | ADS-02 |
| ADS-04 | `cosmohq_google_campaign` (settings + every setter) | — |
| ADS-05 | `cosmohq_google_search_terms`, `cosmohq_google_recommendations`, `cosmohq_google_keyword_ideas`, `cosmohq_ad_campaign_health` | ADS-02 for keyword ideas |
| ADS-06 | `cosmohq_creatives` create/update/delete/upload, `cosmohq_meta_campaign`, `ad_campaign_control delete` | — |
| ADS-07 | windowed `cosmohq_ad_campaigns`, `cosmohq_manual_metrics`, `cosmohq_ad_test_report` | — |

Order: ADS-00 first (it's why the MCP died). Then 01 → 02 → 03 in
sequence; 04, 05, 06, 07 are independent of each other and can run in
parallel after 01.

### Rules for the ADS prompts (on top of the rules above)

- Branch from `main`; the community branches (`feat/community-submit-07`
  and friends) carry the broken schema until ADS-00 lands there.
- **Confirm matrix:** anything that creates, changes or deletes on an ad
  platform or spends AI tokens *and* writes a draft takes `confirm: true`.
  Reads, connection tests, syncs and AI drafts don't. Activation is never
  a new path: only `cosmohq_ad_campaign_control resume` with `confirm`.
- **Read-back is the result.** After every write, return the platform's
  or the store's read of the row, never the 200.
- **No secrets in output or logs.** Credential values go in, summaries
  with `fieldPreviews` come out.
- Live gates run against the local API (:3003, :3002 for OAuth) on
  CosmoKit `cmn9cnfhx000rwb79k5sxx17p`. A gate that would create or change
  something on Google/Meta/Reddit needs the owner's go-ahead in the run
  chat; without it, the prompt says skip and record.
- README tool list, its hard-rule paragraph, and the repo `CLAUDE.md`
  list are updated in every commit. Rebuild `~/.local/bin/cosmohq-mcp`
  from the merged `main` at the end, and note it here.

### Addendum 2026-09-11 19:30 — Reddit launch cannot happen through the API yet (ADS-08, ADS-09)

Live run of the Reddit test (`g_12996d5fff5bbf98b81e52e8`) got through
connection test, audience draft and creative draft (5 creative rows,
`g_0ce9…`, `g_c9e4…`, `g_cc3f…` (B), `g_f4b1…`, `g_c402…` (pt-BR)). It
stopped there because `platforms/reddit/campaign.go` never launched a
real campaign: bare (un-`data`-wrapped) bodies, no funding instrument,
no asset upload, no post, guessed field names. **ADS-08** rewrites the
adapter; the Sep 2026 test is launched by hand in Reddit Ads Manager and
attached with `cosmohq_execution update {externalPlatformRef}` so
`reddit_fetch_insights` works. **ADS-09** fixes the four tool bugs the
day exposed (locale dropped, 30 s client timeout on AI steps,
`set_schedule` startDate, `build_store_link` mt for Mac).

Also learned: the `:3003` API is supposed to serve the
`.tanya/worktrees/api-main` worktree (launchd start script sets
`COSMOHQ_V3_API_DIR`), which had sat at `d1e6650` (31 commits behind
main, no ADS work) since Sep 7 — fast-forwarded to `4b89349` today. At
19:12 a Codex session killed the API and relaunched it from the root
checkout on `feature/whatsapp-automations`, so the process on :3003 now
lacks the ADS API changes (`stopBefore`, creative `sourceUrl`) until it
is restarted from `api-main`.

| id | scope | depends on |
|---|---|---|
| ADS-08 | real Reddit Ads API launch: `data` envelope, funding instrument, targeting translation, asset → post → ad, insights report shape | — |
| ADS-09 | MCP fixes: `locale` persisted, long-running step/chain tools, `set_schedule` startDate, `build_store_link` mt=12 | — |
| ADS-10 | Reddit launch creates one post + ad per approved creative (cap 5, Meta pattern); `Raw.ads[]`, metadata `externalAdIds`; runner rewrites every creative's image URL | ADS-08b (landed) |
| ADS-11 | `cosmohq_ad_campaign_control add_creative`: new `platforms.AdAppender`, `POST /v1/growth/campaigns/{id}/ads`, adds an approved creative as a new ad on a running Reddit campaign | ADS-10 |
| ADS-12 | per-ad metrics: `platforms.AdInsightsReader` (Reddit `AD_ID` breakdown, Meta `level=ad`), `GET …/ad-insights`, `ads[]` with per-ad verdict in `cosmohq_ad_test_report` | ADS-10 |

**Status 2026-09-11 20:10:** ADS-08 (`a6f5a05`) and ADS-09 (`f182020`)
merged to `main` as `4af2243`, pushed; build/vet/test green; MCP binary
rebuilt; `api-main` worktree at `4af2243`. ADS-09 is good (root cause of
the dropped `locale` was the workspace *read* not scanning the column).
ADS-08 is **not launchable**: checked against Reddit's OpenAPI file
(`reddit-ads-api-v3-excerpt.md`), posts/assets live under `profiles/`,
media is pulled from a public URL, objective `TRAFFIC` doesn't exist,
`spend_cap` is lifetime, budget is the ad group's `DAILY_SPEND` goal,
targeting keys differ. **ADS-08b** redoes it with the excerpt as the
contract and runs the live gate ADS-08 skipped. The test image is
committed at `public/promo/reddit-ad-1080x1080-deeplinks-en.png`
(outer repo `main`, pushed) and goes live at
`https://usecosmoskittool.com/promo/…` once cosmoship deploys the landing.

**Status 2026-09-12 15:20: Reddit test launched through the MCP.** ADS-08b
was implemented directly (user's call): `54db133`/`419ccfe` rewrite the
adapter to Reddit's v3 spec, `5738bc4` lets a first launch find its
approved creatives (the campaign row only exists after launch — every
launch since June had reused an old row), `54db133` adds the ad group
bid + pixel rules, field-level error text, cleanup of failed launches
and `cmd/redditadmin`, and `3b494fb` fixes `rawJSONFromMap` base64-ing
the audience (all adapters got a string instead of the targeting
object). Main at `3b494fb`+merge; `api-main` follows. Reddit campaign
`2589591202776102693` / ad group `2589591212290443460` / ad
`2589591218232006074` / post `t3_1wejfzq`, PAUSED, on CosmoHQ row
`g_2cfcb1a6151b178a4dbe8fa5`. The first launch's targeting went out
wrong (base64 bug) and was corrected by hand on Reddit: communities
iOSProgramming/swift/iosdev, US/GB/CA/DE/BR, DESKTOP, end 2026-09-19.
Leftovers: orphan campaign `2589585496022530541` (PAUSED, has a probe ad
group + ad; Reddit refuses deleting ads modified <3 h ago — delete after
2026-09-12 21:30 UTC with `redditadmin delete-campaign`), the MCP
`cosmohq_ad_campaigns` list omits Reddit rows the REST list returns
(follow-up), and `campaignShapeForLaunch` records Meta wording
("Facebook Feed") on non-Meta launches (cosmetic). `reddit-ads-api-v3-excerpt.md`
stays as the reference until it moves into the repo.

- 2026-09-12 15:20 BRT: user OK → `cosmohq_ad_campaign_control resume` on `g_2cfcb1a6151b178a4dbe8fa5`; Reddit campaign/ad group/ad configured ACTIVE, ad effective PENDING_APPROVAL. Orphan campaign 2589585496022530541 still to delete after 21:30 UTC.

- 2026-09-12 15:40 BRT: user asked for the multi-image option in CosmoHQ (decision: not on the live test before day 3). Prompts ADS-10, ADS-11, ADS-12 written; dispatch in that order.

- 2026-09-12 15:55 BRT: numbers check. Reddit insights sync had failed on every run ("campaign_id is an invalid filter field"); fixed as `eda81f3` (`campaign:id==`), main pushed, api-main ff, API restarted. Reddit ad still PENDING_APPROVAL, 0 impressions. Google search test: 1 impression in 30 days, ~90% impression share lost to rank. Organic Reddit posts read live from Chrome (macapps 14/18c, iosapps 6/8c, Xcode 5/6c). Note: `r-ms-ads-10` worktree exists — ADS-10 already dispatched.

- 2026-09-12: ADS-12 merged as `6801961`: Reddit and Meta now expose live per-ad insights, the MCP paid test report includes creative-level verdicts, and the MCP binary was rebuilt. Live read was not run because no separate approval was given.
