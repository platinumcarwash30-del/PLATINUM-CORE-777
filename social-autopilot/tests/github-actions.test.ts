import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { createDatabase } from "../src/db";

const workflowPath = join(process.cwd(), "..", ".github", "workflows", "social-autopilot.yml");

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
});
