# PLATINUM CORE 777 Analytics Monitor Panel

## Goal

Create a separate, read-only monitoring service first, then a panel for the PC777 project that combines the existing Google Search Console monitor with the GA4 property `554126635`, can be installed as a desktop web app on Windows, and can later be moved into the main PC777 application without changing the data layer.

## First-version behavior

- Phase 1 is the monitor: it runs at 08:00, 15:00, and 21:00 in `Europe/Belgrade`, reads the approved APIs, analyzes the configured queries, and emails the report to `platinum303030@gmail.com`.
- Phase 2 is the panel: it runs locally from the separate `social-autopilot` service and is opened at a dedicated route named `/analytics-monitor`.
- The panel is protected by the existing local operator login and exposes no service-account key, SMTP password, or bearer token to the browser.
- The reporting window uses the same previous-complete-date rule as the existing Search Console monitor so both sources describe the same period.
- Search Console shows overall clicks, impressions, CTR, average position, and the existing nine watched queries.
- GA4 shows active users, sessions, screen/page views, and a top-pages table for property `554126635`.
- The panel has a manual refresh button, a visible reporting period, last successful update time, and a clear error state when one source is unavailable.
- The existing hourly Search Console workflow remains addressed to `platinum303030@gmail.com` and unchanged until the new monitor is verified; the new monitor uses the same recipient and does not modify publishing behavior.
- The panel includes a web-app manifest so Chrome or Edge can install it with a desktop/taskbar icon after the local service is running.

## Security and operational boundaries

- The service account JSON is read from a local path or environment variable and is never committed, embedded in HTML, or returned by an API route.
- The existing Search Console service account remains read-only in Google Analytics and Search Console.
- No local synchronization folder is added in this phase.
- No changes are made to the main PC777 Electron installation, website, Supabase, social publishing, or the existing GitHub Actions workflow.
- The numeric GA4 property ID and Search Console property are configuration values, not secrets.
- The local panel uses the existing authentication and CSRF/session boundary for all report requests.

## Later integration seam

The combined report is defined as a typed service boundary independent of both the monitor scheduler and the HTML page. The future PC777 integration can call that service or reuse its report DTO without moving credentials into the main renderer. Desktop packaging as a native `.exe` is deliberately deferred until the local panel has been tested with real data.

## Acceptance criteria

1. `npm run typecheck` and the complete Vitest suite pass.
2. Unit tests prove that the Google assertion requests both read-only scopes, GA4 request bodies are correct, invalid API rows are ignored, and the report combines both sources without exposing credentials.
3. An authenticated request to `/analytics-monitor` returns the panel, while an unauthenticated request redirects to `/login`.
4. The monitor schedule is explicitly `0 8,15,21 * * *` with timezone `Europe/Belgrade`, and its tests prove the recipient and query set.
5. The panel API returns only report data and never the service-account JSON or access token.
6. `npm run build` succeeds and the README documents the Windows local path, launch command, and Chrome/Edge “Install app” action.
