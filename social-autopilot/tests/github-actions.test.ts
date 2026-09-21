import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { createDatabase } from "../src/db";

const workflowPath = join(process.cwd(), "..", ".github", "workflows", "social-autopilot.yml");
const searchConsoleWorkflowPath = join(process.cwd(), "..", ".github", "workflows", "search-console-monitor.yml");
const identityMonitorWorkflowPath = join(process.cwd(), "..", ".github", "workflows", "identity-monitor.yml");
const serbiaClientFinderWorkflowPath = join(process.cwd(), "..", ".github", "workflows", "serbia-client-finder.yml");

describe("native GitHub Actions runner", () => {
  it("keeps the two-hour dry-run and SQLite cache contract", () => {
    const workflow = readFileSync(workflowPath, "utf8");

    expect(workflow).toContain('cron: "0 */2 * * *"');
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("cancel-in-progress: false");
    expect(workflow).toContain("DATABASE_PATH: ./autopilot.sqlite");
    expect(workflow).toContain("path: social-autopilot/autopilot.sqlite");
    expect(workflow).toContain("actions/cache/restore@v4");
    expect(workflow).toContain("actions/cache/save@v4");
    expect(workflow).toContain('DRY_RUN: "true"');
    expect(workflow).toContain("npm run run:once");
  });

  it("deduplicates campaigns after a cached SQLite database is reopened", async () => {
    const directory = mkdtempSync(join(tmpdir(), "social-autopilot-actions-"));
    const databasePath = join(directory, "autopilot.sqlite");
    const page = {
      url: "https://platinumcore777.com/cached-page.html",
      title: "Cached page",
      description: "Description",
      text: "Page text",
      contentHash: "cached-hash",
    };

    try {
      const firstRun = await createDatabase(databasePath);
      firstRun.upsertPage(page);
      const campaign = firstRun.createCampaign(page, {
        pageUrl: page.url,
        text: "Post",
        hashtags: ["#PLATINUMCORE777"],
        generatedBy: "fallback",
      });
      firstRun.recordPublishResult(campaign.id, { platform: "facebook", status: "skipped", errorCode: "DRY_RUN" });
      firstRun.close();

      const secondRun = await createDatabase(databasePath);
      expect(secondRun.findEligiblePages()).toHaveLength(0);
      expect(secondRun.findRetryableCampaigns()).toHaveLength(1);
      secondRun.close();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("keeps Search Console monitoring hourly and read-only", () => {
    const workflow = readFileSync(searchConsoleWorkflowPath, "utf8");

    expect(workflow).toContain('cron: "0 * * * *"');
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("GOOGLE_SERVICE_ACCOUNT_JSON");
    expect(workflow).toContain("SEARCH_CONSOLE_PROPERTY: sc-domain:platinumcore777.com");
    expect(workflow).toContain("npm run search-console:once");
    expect(workflow).not.toContain("ADMIN_SESSION_SECRET");
    expect(workflow).not.toContain("google.com/search?q=");
  });

  it("keeps public identity monitoring separate and non-posting", () => {
    const workflow = readFileSync(identityMonitorWorkflowPath, "utf8");

    expect(workflow).toContain('cron: "30 7 * * *"');
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("BRAVE_SEARCH_API_KEY");
    expect(workflow).not.toContain("GOOGLE_WEB_SEARCH");
    expect(workflow).toContain("identity-monitor-state.json");
    expect(workflow).toContain("npm run identity-monitor:once");
    expect(workflow).not.toContain("facebook.com/groups");
    expect(workflow).not.toContain("instagram.com/p/");
  });

  it("configures a separate daily Serbia client finder workflow", () => {
    const workflow = readFileSync(serbiaClientFinderWorkflowPath, "utf8");

    expect(workflow).toContain('cron: "0 7 * * *"');
    expect(workflow).toContain("workflow_dispatch:");
    expect(workflow).toContain("npm run serbia-client-finder:once");
    expect(workflow).toContain("BRAVE_SEARCH_API_KEY: ${{ secrets.SOCIAL_AUTOPILOT_BRAVE_SEARCH_API_KEY }}");
    expect(workflow).toContain("SMTP_HOST: ${{ secrets.SOCIAL_AUTOPILOT_SMTP_HOST }}");
    expect(workflow).toContain("SMTP_USER: ${{ secrets.SOCIAL_AUTOPILOT_SMTP_USER }}");
    expect(workflow).toContain("SMTP_PASSWORD: ${{ secrets.SOCIAL_AUTOPILOT_SMTP_PASSWORD }}");
    expect(workflow).toContain("NOTIFICATION_TO: platinum303030@gmail.com");
    expect(workflow).toContain("SERBIA_CLIENT_FINDER_STATE_PATH");
    expect(workflow).toContain("./serbia-client-finder-state.json");
    expect(workflow).toContain("key: serbia-client-finder-${{ github.run_id }}");
    expect(workflow).not.toContain("key: identity-monitor-");
  });
});
