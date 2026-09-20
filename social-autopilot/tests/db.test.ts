import { describe, expect, it } from "vitest";
import { createDatabase } from "../src/db";

describe("campaign registry", () => {
  it("returns a changed page once and then deduplicates it", async () => {
    const db = await createDatabase(":memory:");
    const page = { url: "https://platinumcore777.com/a.html", title: "A", description: "D", text: "T", contentHash: "hash-a" };

    db.upsertPage(page);
    expect(db.findEligiblePages()).toHaveLength(1);
    db.createCampaign(page, { pageUrl: page.url, text: "Post", hashtags: ["#PLATINUMCORE777"], generatedBy: "fallback" });
    expect(db.findEligiblePages()).toHaveLength(0);
  });

  it("allows LinkedIn to publish when Facebook failed", async () => {
    const db = await createDatabase(":memory:");
    const page = { url: "https://platinumcore777.com/a.html", title: "A", description: "D", text: "T", contentHash: "hash-a" };
    db.upsertPage(page);
    const campaign = db.createCampaign(page, { pageUrl: page.url, text: "Post", hashtags: [], generatedBy: "fallback" });
    db.claimPlatformPublish(campaign.id, "facebook");
    db.recordPublishResult(campaign.id, { platform: "facebook", status: "failed", errorCode: "AUTH", errorMessage: "expired" });
    expect(db.claimPlatformPublish(campaign.id, "linkedin")).toBe(true);
  });
});
