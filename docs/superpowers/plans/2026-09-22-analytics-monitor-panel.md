# Analytics Monitor Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the read-only Search Console + GA4 monitor first, then expose the same verified report through a separately installable local panel without touching the main PC777 application.

**Architecture:** Keep Google API access in a server-side TypeScript service. Extend the existing service-account JWT helper with an explicit list of read-only scopes, then compose Search Console and GA4 results into one typed report. Phase 1 adds a scheduled monitor and email report; Phase 2 adds a protected Fastify route and a small installable web-app page. Credentials remain in local process configuration.

**Tech Stack:** Node.js 22, TypeScript, Fastify 5, Vitest, Google Search Console REST API, Google Analytics Data API v1beta, HTML/CSS/vanilla browser JavaScript, Web App Manifest.

**Spec:** `docs/superpowers/specs/2026-09-22-analytics-monitor-panel.md`

## Global Constraints

- The standalone panel is read-only and uses the existing service account.
- The GA4 property ID is `554126635` and the Search Console property is `sc-domain:platinumcore777.com` by default.
- The existing hourly Search Console workflow is not changed; the new monitor recipient is `platinum303030@gmail.com`.
- The new monitor schedule is `0 8,15,21 * * *` in timezone `Europe/Belgrade`.
- Service-account JSON, SMTP credentials, OAuth assertions, and access tokens must never enter source control or browser responses.
- No local synchronization folder, main PC777 integration, website change, Supabase change, or publishing behavior change is part of this plan.
- Every production behavior is introduced through a failing test first.

## Review Focus

- A missing or unreadable local service-account file must produce a clear configuration error without exposing file contents; test in Task 2.
- A Google API response containing malformed rows must not crash the panel or produce fake metrics; test in Task 1 and Task 2.
- The monitor must use the fixed approved query set and recipient; test in Task 3.
- An unauthenticated browser request must not reach the report provider; test in Task 4.
- A failed single source must be visible as an error rather than being presented as zero traffic; test in Task 2 and Task 4.
- The browser response must contain report values but no token or key material; test in Task 4.

### Task 1: Google Analytics Data API service

**Files:**
- Modify: `social-autopilot/src/search-console-auth.ts`
- Create: `social-autopilot/src/analytics.ts`
- Create: `social-autopilot/tests/analytics.test.ts`
- Modify: `social-autopilot/tests/search-console-auth.test.ts`

**Interfaces:**
- Consumes: existing `GoogleServiceAccount`, `requestGoogleAccessToken`, and previous-complete-date window.
- Produces: `AnalyticsReport`, `buildAnalyticsReportRequest`, `fetchAnalyticsReport`, and a scope-aware token request used by the combined service.

- [ ] **Step 1: Write the failing tests**

  Add tests that assert:

  ```ts
  expect(createServiceAccountAssertion(account, 100, [
    "https://www.googleapis.com/auth/webmasters.readonly",
    "https://www.googleapis.com/auth/analytics.readonly",
  ])).toContain(/* a JWT payload with both scopes */);

  expect(buildAnalyticsReportRequest("554126635", "2026-09-17", "2026-09-19").url)
    .toBe("https://analyticsdata.googleapis.com/v1beta/properties/554126635:runReport");
  ```

  Also test that `fetchAnalyticsReport` parses summary metrics and top-page rows, ignores malformed rows, sends the bearer token, and throws on a non-2xx response.

- [ ] **Step 2: Run the focused tests and verify RED**

  Run `npm test -- --run tests/analytics.test.ts tests/search-console-auth.test.ts` from `social-autopilot`.

  Expected: the new analytics imports/functions are missing and the new assertions fail for the intended missing behavior.

- [ ] **Step 3: Implement the minimal API service**

  Add a scope parameter with the existing Search Console scope as the default, add the GA4 read-only scope for the combined call, and implement one GA4 `runReport` request for summary metrics plus page-path dimensions. Parse only finite numeric values and return a typed report with source status.

- [ ] **Step 4: Run the focused tests and verify GREEN**

  Run the same focused command. Expected: all focused tests pass.

- [ ] **Step 5: Run the full existing suite**

  Run `npm run test:run`. Expected: all existing tests and the new analytics tests pass.

### Task 2: Combined report and local credential configuration

**Files:**
- Create: `social-autopilot/src/analytics-monitor.ts`
- Modify: `social-autopilot/src/config.ts`
- Create: `social-autopilot/tests/analytics-monitor.test.ts`
- Modify: `social-autopilot/tests/config.test.ts`

**Interfaces:**
- Consumes: Task 1 `AnalyticsReport`, existing Search Console fetcher, service-account parser, and token helper.
- Produces: `AnalyticsMonitorReport`, `fetchAnalyticsMonitorReport`, and `loadAnalyticsMonitorConfig`.

- [ ] **Step 1: Write the failing tests**

  Test the default property values, a `GOOGLE_SERVICE_ACCOUNT_JSON_PATH` configuration value, combined Search Console plus GA4 output, source error status, and the rule that report serialization excludes credentials.

- [ ] **Step 2: Run the focused tests and verify RED**

  Run `npm test -- --run tests/analytics-monitor.test.ts tests/config.test.ts`.

  Expected: the new configuration/report exports are missing or fail the new assertions.

- [ ] **Step 3: Implement the minimal combined service**

  Load inline JSON first when supplied, otherwise read the configured local file with a clear path-specific error. Request one access token with both read-only scopes, fetch both sources for the same date window, preserve a source-level error instead of converting a failed source to zero, and return only typed report data.

- [ ] **Step 4: Run the focused tests and verify GREEN**

  Run the same focused command. Expected: all focused tests pass.

- [ ] **Step 5: Run the full suite**

  Run `npm run test:run`. Expected: all tests pass.

### Task 3: Scheduled monitor and email report

**Files:**
- Create: `social-autopilot/src/analytics-monitor-runner.ts`
- Modify: `social-autopilot/src/notifications.ts`
- Create: `social-autopilot/tests/analytics-monitor-runner.test.ts`

**Interfaces:**
- Consumes: Task 2 `fetchAnalyticsMonitorReport` and `AnalyticsMonitorReport`.
- Produces: `ANALYTICS_MONITOR_CRON`, `ANALYTICS_MONITOR_TIMEZONE`, `runAnalyticsMonitorOnce`, and the scheduled monitor entry point.

- [ ] **Step 1: Write the failing tests**

  Assert that the schedule is `0 8,15,21 * * *` in `Europe/Belgrade`, that the monitor uses the four approved queries plus the existing watched queries, and that a successful run sends exactly one report to `platinum303030@gmail.com`. Also test that a source error is included in the email rather than rendered as zero data.

- [ ] **Step 2: Run the focused tests and verify RED**

  Run `npm test -- --run tests/analytics-monitor-runner.test.ts` from `social-autopilot`.

  Expected: the runner exports and combined notification method are missing.

- [ ] **Step 3: Implement the minimal scheduled monitor**

  Add a once-run function for manual verification, add the `node-cron` schedule with the explicit Belgrade timezone, and add a plain-text combined report notification using the existing SMTP configuration. Do not change the existing Search Console workflow or social publishing scheduler.

- [ ] **Step 4: Run the focused tests and verify GREEN**

  Run `npm test -- --run tests/analytics-monitor-runner.test.ts`. Expected: all monitor tests pass.

- [ ] **Step 5: Run the full suite**

  Run `npm run test:run`. Expected: all tests pass.

### Task 4: Protected panel route and installable browser UI

**Files:**
- Modify: `social-autopilot/src/server.ts`
- Create: `social-autopilot/src/views/analytics-monitor.html`
- Create: `social-autopilot/src/views/analytics-monitor.css`
- Create: `social-autopilot/src/views/analytics-monitor.js`
- Create: `social-autopilot/src/views/manifest.webmanifest`
- Modify: `social-autopilot/tests/server.test.ts`

**Interfaces:**
- Consumes: Task 2 `AnalyticsMonitorReport` provider injected through `ServerDependencies`.
- Produces: authenticated `GET /analytics-monitor` and authenticated `GET /api/analytics-monitor`.

- [ ] **Step 1: Write the failing route tests**

  Add a test provider that records calls and returns a deterministic combined report. Assert that an unauthenticated page request redirects to `/login`, an authenticated API request returns report JSON, the provider is not called for an unauthenticated request, and response JSON does not contain `private_key`, `access_token`, or `client_email`.

- [ ] **Step 2: Run the focused server tests and verify RED**

  Run `npm test -- --run tests/server.test.ts`.

  Expected: the new routes and dependency injection are missing.

- [ ] **Step 3: Implement the protected panel**

  Reuse the current session guard, serve the static panel and manifest, call the provider only after authentication, and render cards for Search Console totals, GA4 totals, watched queries, and top pages. Show the period, checked time, manual refresh, loading state, and source errors.

- [ ] **Step 4: Run the focused server tests and verify GREEN**

  Run `npm test -- --run tests/server.test.ts`. Expected: all server tests pass.

- [ ] **Step 5: Run the full suite and typecheck**

  Run `npm run test:run && npm run typecheck`. Expected: all tests pass and TypeScript reports no errors.

### Task 5: Standalone launch documentation and safe verification

**Files:**
- Modify: `social-autopilot/src/index.ts`
- Modify: `social-autopilot/package.json`
- Modify: `social-autopilot/README.md`
- Create: `social-autopilot/.env.analytics-monitor.example`

**Interfaces:**
- Consumes: Task 2 configuration, Task 3 monitor runner, and Task 4 server route.
- Produces: documented once-run and scheduled monitor commands plus a browser-installable panel.

- [ ] **Step 1: Write the failing configuration/launch test**

  Add a test for the documented defaults: GA4 property `554126635`, Search Console property `sc-domain:platinumcore777.com`, and a local service-account path that is not inside the repository.

- [ ] **Step 2: Run it and verify RED**

  Run `npm test -- --run tests/config.test.ts`. Expected: the new defaults and launch configuration are absent.

- [ ] **Step 3: Implement the launch surface**

  Add separate `analytics-monitor:once` and `analytics-monitor:dev` scripts, add the example environment file with placeholders only, and document the Windows path under `E:\PLATINUM_CORE_777_WORK\secrets\pc777-search-monitor.json`, the local URL, the three daily times, and Chrome/Edge “Install app” action. Keep the existing GitHub workflow unchanged.

- [ ] **Step 4: Run all verification**

  Run `npm run test:run`, `npm run typecheck`, and `npm run build`. Expected: all commands succeed with no secret files created in the repository.

- [ ] **Step 5: Inspect the final diff**

  Run `git status --short` and `git diff --check`. Expected: only the planned panel files and docs are changed; no `.env`, JSON key, token, or generated build output is tracked.
