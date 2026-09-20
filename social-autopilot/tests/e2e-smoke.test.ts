import { describe, expect, it } from "vitest";
import { runOnce } from "../src/worker";

describe("autopilot smoke flow", () => {
  it("is safe to run twice for the same page", async () => {
    const page = { url: "https://platinumcore777.com/a.html", title: "A", description: "D", text: "T", contentHash: "h" };
    let eligible = [page];
    const publish = { publish: async () => [{ platform: "facebook" as const, status: "published" as const }, { platform: "linkedin" as const, status: "published" as const }] };
    const db = {
      startRun: () => ({ id: crypto.randomUUID(), startedAt: new Date().toISOString(), status: "running" as const, pagesSeen: 0, campaignsCreated: 0, results: [], errors: [] }), upsertPage: () => {}, findEligiblePages: () => eligible,
      findRetryableCampaigns: () => [], getCampaignWorkItem: () => undefined,
      createCampaign: () => { eligible = []; return { id: crypto.randomUUID(), pageUrl: page.url, contentHash: page.contentHash }; }, claimPlatformPublish: () => true,
      recordPublishResult: () => {}, finishRun: () => {},
    };
    const deps = { siteReader: { read: async () => [page] }, db, generator: { generate: async () => ({ pageUrl: page.url, text: "Post", hashtags: [], generatedBy: "fallback" as const }) }, publisher: publish, notifications: { sendRunSummary: async () => {} }, intervalMinutes: 120 };

    await runOnce(deps as never, new Date());
    await runOnce(deps as never, new Date());
    expect(eligible).toHaveLength(0);
  });
});
