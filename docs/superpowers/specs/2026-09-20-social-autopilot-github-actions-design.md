# PLATINUM CORE 777 GitHub Actions Social Autopilot Design

## Goal

Run the existing PLATINUM CORE 777 social-autopilot workflow every two hours without a paid hosting provider or payment card, while keeping the existing website, Supabase, PC777, Core Review, and `main` branch unchanged.

## Scope

This design applies only to the `feat/social-autopilot` branch.

The existing service remains the source of truth for:

- reading the public PLATINUM CORE 777 sitemap;
- generating fact-checked project copy;
- preparing WhyDonate and Buy Me a Coffee copy for manual pasting;
- publishing only to an authorized PLATINUM CORE 777 Facebook Page and LinkedIn organization/page;
- email run summaries.

The following remain disabled or manual:

- Instagram automation;
- third-party comments, likes, follows, direct messages, or group posting;
- automatic WhyDonate or Buy Me a Coffee form submission;
- publishing while `DRY_RUN=true`.

## Architecture

GitHub Actions replaces the always-on Render service for scheduled execution.

1. A scheduled workflow runs at a two-hour cadence and also supports manual `workflow_dispatch`.
2. The workflow checks out `feat/social-autopilot`, installs Node.js 22 dependencies, builds the TypeScript service, and runs one worker cycle without starting the HTTP dashboard.
3. The worker cycle reads the sitemap, creates new campaign records, prepares manual donation-platform copy, and skips Facebook/LinkedIn publication while `DRY_RUN=true`.
4. The SQLite registry is restored and saved through GitHub Actions cache so successful campaigns are not regenerated on every run.
5. Credentials are supplied only through GitHub Actions Secrets. No tokens, passwords, SMTP credentials, or API keys are committed to Git.
6. Run output is available in GitHub Actions logs and the configured notification email.

## Required code changes

- Add a run-once entry point that reuses the existing configuration, database, site reader, content generator, platform adapters, publisher, and notification service without opening the Fastify dashboard server.
- Add a workflow at `.github/workflows/social-autopilot.yml`.
- Configure workflow concurrency so overlapping scheduled runs cannot corrupt the cached SQLite state.
- Keep the existing server entry point unchanged for possible future hosting.
- Do not modify website files, Supabase functions, PC777, Core Review, or the repository `main` branch.

## Safety defaults

- `DRY_RUN=true` is fixed for the first deployment.
- Facebook and LinkedIn tokens are optional during dry-run and are never requested in chat.
- Publishing is enabled only after a separate deliberate configuration change.
- The notification recipient remains `platinum303030@gmail.com`.
- The workflow must fail visibly if a configured SMTP notification cannot be sent.
- The service must continue to deduplicate page/content combinations using the cached registry.

## Trade-offs

This no-cost route provides scheduled execution, GitHub run history, and email notifications. It does not provide a continuously available private dashboard URL, because that requires a continuously running host. The existing dashboard code is preserved for a later paid or local deployment.

## Verification

Before enabling any real publication:

1. Run the existing typecheck, test suite, build, and whitespace checks.
2. Trigger the workflow manually with `DRY_RUN=true`.
3. Confirm the run reads the sitemap and creates no Facebook or LinkedIn publication.
4. Confirm the email summary and manual WhyDonate/Buy Me a Coffee copy.
5. Confirm a second run does not duplicate already recorded campaigns.
6. Keep the publishing tokens absent until the dry-run behavior is accepted.
