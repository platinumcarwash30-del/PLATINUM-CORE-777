# PLATINUM CORE 777 Social Autopilot

This is a separate online service for publishing approved project updates to the owned PLATINUM CORE 777 Facebook Page and LinkedIn Page.

It does not modify the existing website files, Supabase, PC777, Core Review, or any existing application database. It reads only the public sitemap at `https://platinumcore777.com/sitemap.xml` and keeps its own SQLite registry for deduplication.

## Boundaries

- Runs every two hours.
- Publishes only to the connected Facebook Page and LinkedIn organization/page.
- Prepares copy for WhyDonate and Buy Me a Coffee for manual paste; those platforms are not logged into automatically.
- Instagram remains manual.
- Facebook groups and public pages without administrator authorization are disabled.
- No third-party likes, follows, comments, or direct messages.
- No platform passwords are stored.
- Copy is limited to facts read from the website and approved project context.
- A pending patent is never described as granted.

## Local setup

```bash
npm install
cp .env.example .env
npm run typecheck
npm run test:run
npm run build
```

For a safe first run, configure `NOTIFICATION_TO`, `ADMIN_SESSION_SECRET`, and `ADMIN_PASSWORD_HASH`, leave `DRY_RUN=true`, then run:

```bash
DRY_RUN=true npm run dev
```

Dry-run reads the sitemap and creates registry records but returns `skipped` for both platforms; it never calls Facebook or LinkedIn.

## Analytics monitor and private panel

The separate analytics monitor reads Search Console and Google Analytics 4 through their read-only APIs. It does not type searches into Google or scrape result pages. Configure the local values from `.env.analytics-monitor.example`, including this Windows key path outside the repository:

`E:\PLATINUM_CORE_777_WORK\secrets\pc777-search-monitor.json`

After building, run one report with `npm run analytics-monitor:once`, or run the scheduled monitor with `npm run analytics-monitor:dev`. The schedule is 08:00, 15:00, and 21:00 in `Europe/Belgrade`. If SMTP is configured, the report is sent to `platinum303030@gmail.com`; otherwise it is printed locally.

Start the normal local service with `npm run dev`, then open `http://localhost:3000/analytics-monitor` and sign in with the existing private dashboard credentials. In Chrome or Edge, use the browser menu and choose **Install app** to place the panel on the desktop/taskbar. This panel is separate from the main PC777 application.

## No-cost GitHub Actions mode

This repository includes a native GitHub Actions runner, so the service can run without Render or a payment card:

- `.github/workflows/social-autopilot.yml` runs one cycle every two hours.
- `workflow_dispatch` lets you start a test run manually from the **Actions** tab.
- The workflow is configured with `DRY_RUN=true`; it never publishes until that value is deliberately changed after inspection.
- Run summaries and errors are visible in GitHub Actions logs. SMTP notification remains optional until its secrets are configured.
- The workflow keeps the separate SQLite registry between runs so the same page/platform item is not republished.
- Automatic scheduled runs are active from the repository's default `main` branch; use manual dispatch for immediate testing.

The separate `.github/workflows/search-console-monitor.yml` workflow checks Google Search Console once per hour. It reads real Search Analytics data for the project's Core Review and PLATINUM CORE 777 queries; it does not type artificial searches or click results. Until `SOCIAL_AUTOPILOT_GOOGLE_SERVICE_ACCOUNT_JSON` is configured, the monitor exits cleanly without making a request. Once configured, it emails the report when SMTP secrets are available and otherwise prints it in the workflow log.

The separate `.github/workflows/identity-monitor.yml` workflow checks public, indexable web results once per day for the approved project identities: `Marko Ćuća`, `Marko Cuca`, `Cuca` with project context, `PLATINUM CORE 777`, `CORE REVIEW`, `Platinum Car Wash`, `Platinum Luxury Spa`, `markoplatinum@icloud.com`, and `contact@platinumcore777.com`. It also searches public Facebook and Instagram results through the configured web-search API; it does not log in, join groups, post, comment, like, follow, or message anyone.

The identity monitor sends only new external results in a digest to `platinum303030@gmail.com`; the same URL is suppressed for seven days. Official source URLs are excluded through `OFFICIAL_SOURCE_URLS`. It prepares a Google legal-report link and evidence in the email, but never submits automatic reports or labels a result as a confirmed impersonation without human review.

The separate `.github/workflows/serbia-client-finder.yml` workflow runs a public-web Serbia client finder once per day at 07:00 UTC and supports manual dispatch. It searches public business pages for service, beauty/wellness, hospitality/retail, professional-services, and referral-partner opportunities; scores each result with visible reasons; and sends up to 10 new leads to `platinum303030@gmail.com`. The same public URL is suppressed for seven days through a separate `serbia-client-finder-state.json` cache. Configure `SOCIAL_AUTOPILOT_BRAVE_SEARCH_API_KEY`, `SOCIAL_AUTOPILOT_SMTP_HOST`, `SOCIAL_AUTOPILOT_SMTP_USER`, and `SOCIAL_AUTOPILOT_SMTP_PASSWORD` in GitHub Actions secrets. Outreach drafts are for Marko to review and copy manually only: the workflow never emails prospects, sends social messages, submits forms, comments, likes, follows, or accesses private pages. Run it manually from [the Serbia Client Finder workflow](https://github.com/platinumcarwash30-del/PLATINUM-CORE-777/actions/workflows/serbia-client-finder.yml).

The separate `.github/workflows/wikipedia-draft-monitor.yml` workflow runs once per day at 08:00 UTC and supports manual dispatch. It reads only pages listed by the official `platinumcore777.com` sitemap, adds one neutral source-backed section per day, and uploads the pending 15-day draft as a GitHub Actions artifact. It does not commit to `main`, change website source files, trigger a site-content update, or write to Loopia, DNS, Supabase, or Wikipedia. The artifact contains `PLATINUM-CORE-777-draft.md`, `PLATINUM-CORE-777-sources.md`, and the runner state file `social-autopilot/wikipedia-draft-state.json`; the state is kept in a separate Actions cache. Any future Wikipedia integration would require a dedicated account, conflict-of-interest disclosure, bot-task approval, a secret, and an explicit `Draft:` namespace boundary.

Add these repository secrets under **Settings → Secrets and variables → Actions** before expecting email or real platform access:

`SOCIAL_AUTOPILOT_SESSION_SECRET`, `SOCIAL_AUTOPILOT_PASSWORD_HASH`, `SOCIAL_AUTOPILOT_SMTP_HOST`, `SOCIAL_AUTOPILOT_SMTP_USER`, `SOCIAL_AUTOPILOT_SMTP_PASSWORD`, `SOCIAL_AUTOPILOT_FACEBOOK_PAGE_ID`, `SOCIAL_AUTOPILOT_FACEBOOK_PAGE_ACCESS_TOKEN`, `SOCIAL_AUTOPILOT_LINKEDIN_ORGANIZATION_ID`, `SOCIAL_AUTOPILOT_LINKEDIN_ACCESS_TOKEN`, and optionally `SOCIAL_AUTOPILOT_OPENAI_API_KEY`, `SOCIAL_AUTOPILOT_OPENAI_MODEL`, `SOCIAL_AUTOPILOT_WHYDONATE_URL`, and `SOCIAL_AUTOPILOT_BUYMEACOFFEE_URL`.

For the public identity monitor, add `SOCIAL_AUTOPILOT_BRAVE_SEARCH_API_KEY`. Keep the official owned-site and repository URLs in `OFFICIAL_SOURCE_URLS`; add exact official Facebook and Instagram profile URLs there once they are confirmed. This credential is used only for read-only public search through Brave Search API.

For the Search Console monitor, add `SOCIAL_AUTOPILOT_GOOGLE_SERVICE_ACCOUNT_JSON` as a GitHub Actions secret after granting that service account read access to the verified `sc-domain:platinumcore777.com` property in Google Search Console.

Never put tokens, passwords, card details, or `.env` contents in GitHub files, issues, screenshots, or chat.

## Required online-server secrets

Set these in the host's secret manager, never in Git:

- `ADMIN_SESSION_SECRET` — at least 32 random characters.
- `ADMIN_PASSWORD_HASH` — generate with `node -e "console.log(require('./dist/auth').hashPassword('CHOOSE-A-PASSWORD'))"` after `npm run build`.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD`, and `SMTP_FROM` — the SMTP values provided by the mail host.
- `FACEBOOK_PAGE_ID` and `FACEBOOK_PAGE_ACCESS_TOKEN` — an official Page token for the owned page.
- `LINKEDIN_ORGANIZATION_ID` and `LINKEDIN_ACCESS_TOKEN` — official organization publishing authorization.
- `WHYDONATE_URL` — your fundraiser/update page URL used as the dashboard target.
- `BUYMEACOFFEE_URL` — your creator page URL used as the dashboard target.
- Optional `OPENAI_API_KEY` and `OPENAI_MODEL` — if absent, the deterministic fact-checked fallback generator is used.

The notification recipient is fixed by configuration as `platinum303030@gmail.com`.

Every new website campaign also creates two ready-to-copy sections in the email and private dashboard. Copy the text under **WhyDonate** into the fundraiser's Updates editor, then copy the same prepared text under **Buy Me a Coffee** wherever you publish creator updates. The service does not submit either form automatically.

## Official platform connection checklist

1. Create or use the official Meta developer application, request only the Page publishing permissions required for the owned Facebook Page, and generate a Page access token for that Page.
2. Create or use the official LinkedIn application, complete the organization/page authorization required for posting, and generate the organization access token.
3. Put the IDs and tokens into the online host's secret settings. Do not paste them into source files, screenshots, GitHub, or the website repository.
4. Deploy with `DRY_RUN=true`, sign in to the private dashboard, inspect one generated post, and confirm the target URL.
5. Set `DRY_RUN=false` only after the dry-run email and dashboard result are correct.

## Dashboard

The service exposes:

- `GET /health` — returns `{ "ok": true }` and contains no secrets.
- `GET /login` — private operator login.
- `GET /dashboard` — run history, generated results, errors, and the stop switch.
- `POST /run-now` — runs one cycle after CSRF validation.
- `POST /stop-autopilot` — disables scheduled runs while keeping the dashboard available.

The scheduler is fixed to the two-hour cadence required by the project. A second check cannot republish a successfully recorded page/platform combination.

## Emergency stop and credential rotation

Use the dashboard's **Stop autopilot** button, or set `DRY_RUN=true` and redeploy. Rotate Facebook, LinkedIn, SMTP, and OpenAI credentials in the host secret manager, then restart the service. No credential rotation requires changing the website or Supabase.
