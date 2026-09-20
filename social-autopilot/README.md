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
npm run dev -- --dry-run
```

Dry-run reads the sitemap and creates registry records but returns `skipped` for both platforms; it never calls Facebook or LinkedIn.

## No-cost GitHub Actions mode

This repository includes a native GitHub Actions runner, so the service can run without Render or a payment card:

- `.github/workflows/social-autopilot.yml` runs one cycle every two hours.
- `workflow_dispatch` lets you start a test run manually from the **Actions** tab.
- The workflow is configured with `DRY_RUN=true`; it never publishes until that value is deliberately changed after inspection.
- Run summaries and errors are visible in GitHub Actions logs. SMTP notification remains optional until its secrets are configured.
- The workflow keeps the separate SQLite registry between runs so the same page/platform item is not republished.

Add these repository secrets under **Settings → Secrets and variables → Actions** before expecting email or real platform access:

`SOCIAL_AUTOPILOT_SESSION_SECRET`, `SOCIAL_AUTOPILOT_PASSWORD_HASH`, `SOCIAL_AUTOPILOT_SMTP_HOST`, `SOCIAL_AUTOPILOT_SMTP_USER`, `SOCIAL_AUTOPILOT_SMTP_PASSWORD`, `SOCIAL_AUTOPILOT_FACEBOOK_PAGE_ID`, `SOCIAL_AUTOPILOT_FACEBOOK_PAGE_ACCESS_TOKEN`, `SOCIAL_AUTOPILOT_LINKEDIN_ORGANIZATION_ID`, `SOCIAL_AUTOPILOT_LINKEDIN_ACCESS_TOKEN`, and optionally `SOCIAL_AUTOPILOT_OPENAI_API_KEY`, `SOCIAL_AUTOPILOT_OPENAI_MODEL`, `SOCIAL_AUTOPILOT_WHYDONATE_URL`, and `SOCIAL_AUTOPILOT_BUYMEACOFFEE_URL`.

Never put tokens, passwords, card details, or `.env` contents in GitHub files, issues, screenshots, or chat. The `main` branch remains unchanged while this feature is tested on `feat/social-autopilot`.

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
