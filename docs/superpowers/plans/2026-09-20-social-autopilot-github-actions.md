# GitHub Actions Social Autopilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Run the PLATINUM CORE 777 social-autopilot worker every two hours through GitHub Actions without a paid host or payment card, while preserving the current service behavior and keeping `main` untouched.

**Architecture:** Extract the existing worker setup into a reusable runtime that can either start the current Fastify dashboard or execute one worker cycle and exit. Add a GitHub Actions workflow that invokes the one-cycle entry point on a two-hour schedule and manual dispatch, restores/saves the SQLite registry with Actions cache, and keeps `DRY_RUN=true` until manual approval. Keep Render files and the existing HTTP dashboard code available for a later hosting option, but do not use Render for this deployment.

**Tech Stack:** Node.js 22, TypeScript, Fastify, sql.js, node-cron, Vitest, GitHub Actions, `actions/cache@v4).

**Spec:** `docs/superpowers/specs/2026-09-20-social-autopilot-github-actions-design.md`

## Global Constraints

- Apply changes only to `feat/social-autopilot`; do not modify `main`.
- The existing website, Supabase, PC777, Core Review, and website repository files are out of scope.
- The schedule remains every two hours: `RUN_INTERVAL_MINUTES=120`.
- The initial workflow must keep `DRY_RUN=true`.
- Automatic publication is limited to an authorized Facebook Page and LinkedIn organization/page.
- Instagram, third-party comments, likes, follows, direct messages, group posting, WhyDonate submission, and Buy Me a Coffee submission remain disabled/manual.
- Never commit passwords, access tokens, SMTP credentials, OpenAI keys, or private session secrets.
- The notification recipient remains `platinum303030@gmail.com`.
- Node.js must remain at version 22 or newer.

## Review Focus

- A cached database must prevent the same page/content pair from becoming a new campaign on the next scheduled run; test restore/save behavior with an existing registry.
- A missing `ADMIN_SESSION_SECRET` must not weaken the HTTP dashboard security; the one-cycle runner may use an ephemeral process-local secret because it does not expose the dashboard.
- A missing SMTP configuration must produce a visible warning/failure in the run output rather than silently claiming that an email was sent.
- `DRY_RUN=true` must return skipped platform results and must not call Facebook or LinkedIn adapters; test this before any real tokens are configured.
- Overlapping scheduled runs must be prevented with a workflow concurrency group so two jobs cannot mutate the same cached SQLite state.

---

### Task 1: Extract a reusable one-cycle worker runtime

**Files:**

- Create: `social-autopilot/src/runtime.ts`
- Create: `social-autopilot/src/run-once.ts`
- Modify: `social-autopilot/src/index.ts`
- Modify: `social-autopilot/package.json`
- Test: `social-autopilot/tests/runtime.test.ts`

**Interfaces:**

- `createWorkerRuntime(env: NodeJS.ProcessEnv): Promise<{ config: AppConfig; db: DatabaseStore; executeRun(): Promise<RunSummary>; close(): void }>`
- `run-once.ts` loads the runtime, executes exactly one cycle, prints the JSON summary, closes the database, and exits nonzero only for an uncaught worker failure.
- `index.ts` uses the same runtime, then adds the existing Fastify server and cron scheduler.

- [ ] **Step 1: Write the failing runtime test**

Add a test that imports `createWorkerRuntime`, supplies a dry-run environment with an in-memory database, a valid notification recipient, and a 32-character session secret, then asserts that the returned object exposes `executeRun` and `close`. The test must also assert that the runtime's dry-run publisher returns `skipped` results when the worker is invoked with a controlled sitemap reader.

Use the existing `tests/worker.test.ts` dependency shapes for `PageMetadata`, `GeneratedPost`, and `RunSummary`; do not call external Facebook, LinkedIn, SMTP, or the public website from the unit test.

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run from `social-autopilot`:

```bash
npm run test:run -- tests/runtime.test.ts
```

Expected result: FAIL because `src/runtime.ts` and `createWorkerRuntime` do not exist yet.

- [ ] **Step 3: Implement the shared runtime**

Move the common setup currently inside `src/index.ts` into `src/runtime.ts`:

```typescript
export async function createWorkerRuntime(env: NodeJS.ProcessEnv) {
  const config = loadConfig(env);
  const dryRun = env.DRY_RUN === "true";
  const db = await createDatabase(config.databasePath);
  const adapters = [
    config.facebookPageId && config.facebookPageAccessToken
      ? new FacebookPageAdapter({ pageId: config.facebookPageId, accessToken: config.facebookPageAccessToken })
      : undefined,
    config.linkedinOrganizationId && config.linkedinAccessToken
      ? new LinkedInPageAdapter({ organizationId: config.linkedinOrganizationId, accessToken: config.linkedinAccessToken })
      : undefined,
  ].filter(Boolean);

  const executeRun = () => runOnce({
    siteReader: { read: () => readSitePages(fetch, config.siteSitemapUrl) },
    db,
    generator: { generate: (page) => generatePost(page) },
    publisher: {
      publish: (post, platforms) => dryRun
        ? Promise.resolve(platforms.map((platform) => ({
            platform,
            status: "skipped" as const,
            errorCode: "DRY_RUN",
            errorMessage: "Dry run enabled",
          })))
        : publishToConnectedPlatforms(adapters, post, { platforms }),
    },
    notifications: createNotificationService(config),
    intervalMinutes: config.runIntervalMinutes,
    manualTargets: { whydonate: config.whyDonateUrl, buyMeACoffee: config.buyMeACoffeeUrl },
  });

  return { config, db, executeRun, close: () => db.close() };
}
```

Keep the HTTP server's session-secret validation unchanged. In `run-once.ts`, generate a process-local random session secret only when the workflow did not provide one, because the dashboard is not started in one-cycle mode:

```typescript
if (!process.env.ADMIN_SESSION_SECRET) {
  process.env.ADMIN_SESSION_SECRET = randomBytes(32).toString("hex");
}
```

Add the package script:

```json
"run:once": "node dist/run-once.js"
```

- [ ] **Step 4: Update the server entry point**

Make `src/index.ts` call `createWorkerRuntime(process.env)`, keep its existing `buildServer`, `listen`, two-hour cron, and `RUN_ON_START` behavior, and close the database when the process receives `SIGTERM` or `SIGINT`.

- [ ] **Step 5: Run the focused test and the existing worker tests**

Run:

```bash
npm run test:run -- tests/runtime.test.ts tests/worker.test.ts
```

Expected result: PASS with no external network calls.

- [ ] **Step 6: Run typecheck and build**

Run:

```bash
npm run typecheck
npm run build
```

Expected result: both commands exit with code 0 and create `dist/run-once.js`.

- [ ] **Step 7: Commit the runtime change**

```bash
git add social-autopilot/src/runtime.ts social-autopilot/src/run-once.ts social-autopilot/src/index.ts social-autopilot/package.json social-autopilot/tests/runtime.test.ts
git commit -m "feat: add one-cycle autopilot runner"
```

---

### Task 2: Add the no-cost GitHub Actions workflow

**Files:**

- Create: `.github/workflows/social-autopilot.yml`
- Modify: `social-autopilot/README.md`

**Interfaces:**

- Workflow triggers: `schedule` with `0 */2 * * *` and manual `workflow_dispatch`.
- Runtime command: `npm run run:once` from `social-autopilot`.
- State path: `social-autopilot/autopilot.sqlite`.
- Cache key: `social-autopilot-state-${{ github.run_id }}`.
- Restore prefix: `social-autopilot-state-`.

- [ ] **Step 1: Add the workflow configuration**

Create `.github/workflows/social-autopilot.yml` with the following behavior:

```yaml
name: PLATINUM CORE 777 Social Autopilot

on:
  schedule:
    - cron: "0 */2 * * *"
  workflow_dispatch:

concurrency:
  group: social-autopilot-state
  cancel-in-progress: false

permissions:
  contents: read

jobs:
  run-once:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: social-autopilot
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: social-autopilot/package-lock.json

      - uses: actions/cache/restore@v4
        with:
          path: social-autopilot/autopilot.sqlite
          key: social-autopilot-state-${{ github.run_id }}
          restore-keys: |
            social-autopilot-state-

      - run: npm ci
      - run: npm run build
      - run: npm run run:once
        env:
          NODE_ENV: production
          DATABASE_PATH: ./autopilot.sqlite
          SITE_SITEMAP_URL: https://platinumcore777.com/sitemap.xml
          RUN_INTERVAL_MINUTES: "120"
          RUN_ON_START: "false"
          ADMIN_USERNAME: marko
          ADMIN_SESSION_SECRET: ${{ secrets.SOCIAL_AUTOPILOT_SESSION_SECRET }}
          ADMIN_PASSWORD_HASH: ${{ secrets.SOCIAL_AUTOPILOT_PASSWORD_HASH }}
          NOTIFICATION_TO: platinum303030@gmail.com
          SMTP_HOST: ${{ secrets.SOCIAL_AUTOPILOT_SMTP_HOST }}
          SMTP_PORT: "587"
          SMTP_SECURE: "false"
          SMTP_USER: ${{ secrets.SOCIAL_AUTOPILOT_SMTP_USER }}
          SMTP_PASSWORD: ${{ secrets.SOCIAL_AUTOPILOT_SMTP_PASSWORD }}
          SMTP_FROM: "PLATINUM CORE 777 <contact@platinumcore777.com>"
          FACEBOOK_PAGE_ID: ${{ secrets.SOCIAL_AUTOPILOT_FACEBOOK_PAGE_ID }}
          FACEBOOK_PAGE_ACCESS_TOKEN: ${{ secrets.SOCIAL_AUTOPILOT_FACEBOOK_PAGE_ACCESS_TOKEN }}
          LINKEDIN_ORGANIZATION_ID: ${{ secrets.SOCIAL_AUTOPILOT_LINKEDIN_ORGANIZATION_ID }}
          LINKEDIN_ACCESS_TOKEN: ${{ secrets.SOCIAL_AUTOPILOT_LINKEDIN_ACCESS_TOKEN }}
          OPENAI_API_KEY: ${{ secrets.SOCIAL_AUTOPILOT_OPENAI_API_KEY }}
          OPENAI_MODEL: ${{ secrets.SOCIAL_AUTOPILOT_OPENAI_MODEL }}
          WHYDONATE_URL: ${{ secrets.SOCIAL_AUTOPILOT_WHYDONATE_URL }}
          BUYMEACOFFEE_URL: ${{ secrets.SOCIAL_AUTOPILOT_BUYMEACOFFEE_URL }}
          DRY_RUN: "true"

      - uses: actions/cache/save@v4
        if: always()
        with:
          path: social-autopilot/autopilot.sqlite
          key: social-autopilot-state-${{ github.run_id }}
```

The implementation must keep `DRY_RUN: "true"` in the first version. Empty optional secrets must be handled by the existing config schema or by documented pre-run setup; the workflow must not print secret values.

- [ ] **Step 2: Document the setup**

Update `social-autopilot/README.md` with:

- GitHub Actions schedule and manual dispatch instructions.
- The exact secret names used by the workflow.
- A statement that the first runs are dry-run only.
- A statement that Actions logs and email replace the always-on dashboard for this no-cost mode.
- A statement that no platform credentials are to be placed in Git or chat.

- [ ] **Step 3: Validate the workflow text**

Run from the repository root:

```bash
git diff --check
```

Then inspect the workflow and verify:

- only `schedule` and `workflow_dispatch` triggers exist;
- concurrency is enabled;
- `DRY_RUN` is exactly `"true"`;
- the cache path matches `DATABASE_PATH`;
- no literal token, password, or private key exists in the file.

- [ ] **Step 4: Commit the workflow**

```bash
git add .github/workflows/social-autopilot.yml social-autopilot/README.md
git commit -m "feat: schedule autopilot with GitHub Actions"
```

---

### Task 3: Add deterministic dry-run and cache verification

**Files:**

- Modify: `social-autopilot/tests/e2e-smoke.test.ts`
- Create: `social-autopilot/tests/github-actions-contract.test.ts`

**Interfaces:**

- The contract test reads `.github/workflows/social-autopilot.yml` as text.
- The cache test uses `createDatabase` twice against the same temporary SQLite path and verifies that a campaign created by the first run is not eligible on the second run.

- [ ] **Step 1: Write the failing contract and cache tests**

Add assertions for:

```typescript
expect(workflow).toContain('cron: "0 */2 * * *"');
expect(workflow).toContain('workflow_dispatch:');
expect(workflow).toContain('DRY_RUN: "true"');
expect(workflow).toContain("actions/cache/restore@v4");
expect(workflow).toContain("actions/cache/save@v4");
expect(workflow).not.toMatch(/(token|password|private[_-]?key)\\s*:/i);
```

Add a database test that runs one dry-run cycle, closes the database, reopens the same path, and expects the same page/content hash not to produce a second campaign.

- [ ] **Step 2: Run the focused tests and verify the expected failures**

Run:

```bash
npm run test:run -- tests/github-actions-contract.test.ts tests/e2e-smoke.test.ts
```

Expected result: FAIL until the workflow contract and one-cycle state behavior are present.

- [ ] **Step 3: Implement only the missing test-support behavior**

Use the production runtime and existing database APIs; do not add a second deduplication mechanism. If the test needs a temporary path, use a test-owned temporary directory and remove it after the test.

- [ ] **Step 4: Run the focused tests again**

Run:

```bash
npm run test:run -- tests/github-actions-contract.test.ts tests/e2e-smoke.test.ts
```

Expected result: PASS.

---

### Task 4: Full verification and manual dry-run

**Files:**

- No new production files.
- Verify: all files in Tasks 1–3.

- [ ] **Step 1: Run the complete test and build checks**

Run from `social-autopilot`:

```bash
npm run typecheck
npm run test:run
npm run build
git diff --check
```

Expected result: all commands exit 0; the complete Vitest suite passes; `dist/run-once.js` exists.

- [ ] **Step 2: Trigger the workflow manually**

In GitHub, open **Actions**, select **PLATINUM CORE 777 Social Autopilot**, click **Run workflow**, choose `feat/social-autopilot`, and run it with `DRY_RUN=true`.

Expected result: the workflow reads the sitemap, generates campaign records, reports Facebook and LinkedIn as skipped, and does not publish externally.

- [ ] **Step 3: Inspect the second run**

Run the workflow again manually.

Expected result: previously recorded page/content pairs are not recreated because the SQLite state was restored from Actions cache.

- [ ] **Step 4: Confirm the handoff**

Report the exact workflow run URL, test counts, build result, dry-run status, and any missing SMTP secret without claiming live publication.

- [ ] **Step 5: Commit verification notes only if needed**

Do not commit credentials or run output. Commit only a documentation correction if the verified workflow behavior differs from the README.
