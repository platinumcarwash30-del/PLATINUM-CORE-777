import { describe, expect, it, vi } from "vitest";
import { runOnce } from "../src/worker";

describe("two-hour worker", () => {
  it("creates one campaign, publishes to both platforms, and emails a summary", async () => {
    const page = { url: "https://platinumcore777.com/a.html", title: "A", description: "D", text: "T", contentHash: "h" };
    const deps = {
      siteReader: { read: vi.fn().mockResolvedValue([page]) },
      db: {
        startRun: vi.fn().mockReturnValue({ id: "run-1" }),
        upsertPage: vi.fn(),
        findEligiblePages: vi.fn().mockReturnValue([page]),
        findRetryableCampaigns: vi.fn().mockReturnValue([]),
        createCampaign: vi.fn().mockReturnValue({ id: "campaign-1" }),
        claimPlatformPublish: vi.fn().mockReturnValue(true),
        recordPublishResult: vi.fn(),
        finishRun: vi.fn(),
      },
      generator: { generate: vi.fn().mockResolvedValue({ pageUrl: page.url, text: "Post", hashtags: ["#PLATINUMCORE777"], generatedBy: "fallback" }) },
      publisher: { publish: vi.fn().mockResolvedValue([{ platform: "facebook", status: "published" }, { platform: "linkedin", status: "published" }]) },
      notifications: { sendRunSummary: vi.fn().mockResolvedValue(undefined) },
      intervalMinutes: 120,
      manualTargets: {
        whydonate: "https://whydonate.com/fundraising/platinum-core-777",
        buyMeACoffee: "https://buymeacoffee.com/platinumcore777",
      },
    };

    const summary = await runOnce(deps as never, new Date("2026-09-20T12:00:00Z"));
    expect(summary.executionId).toBe("run-1");
    expect(deps.notifications.sendRunSummary).toHaveBeenCalledOnce();
    expect(summary.manualPosts.map((post) => post.platform)).toEqual(["whydonate", "buymeacoffee"]);
    expect(summary.manualPosts[0]?.text).toContain(page.url);
  });

  it("continues with the next page when one page generator fails", async () => {
    const first = { url: "https://platinumcore777.com/first.html", title: "First", description: "D", text: "T", contentHash: "first" };
    const second = { url: "https://platinumcore777.com/second.html", title: "Second", description: "D", text: "T", contentHash: "second" };
    const created: string[] = [];
    const deps = {
      siteReader: { read: vi.fn().mockResolvedValue([first, second]) },
      db: {
        startRun: vi.fn().mockReturnValue({ id: "run-2", startedAt: new Date().toISOString() }),
        upsertPage: vi.fn(), findEligiblePages: vi.fn().mockReturnValue([first, second]),
        findRetryableCampaigns: vi.fn().mockReturnValue([]), getCampaignWorkItem: vi.fn(),
        createCampaign: vi.fn((page) => { created.push(page.url); return { id: `campaign-${created.length}` }; }),
        claimPlatformPublish: vi.fn().mockReturnValue(true), recordPublishResult: vi.fn(), finishRun: vi.fn(),
      },
      generator: { generate: vi.fn().mockRejectedValueOnce(new Error("bad page")).mockResolvedValueOnce({ pageUrl: second.url, text: "Post", hashtags: [], generatedBy: "fallback" }) },
      publisher: { publish: vi.fn().mockResolvedValue([]) },
      notifications: { sendRunSummary: vi.fn().mockResolvedValue(undefined) },
      intervalMinutes: 120,
    };

    const summary = await runOnce(deps as never);
    expect(created).toEqual([second.url]);
    expect(summary.errors.join(" ")).toContain(first.url);
  });

  it("records a configuration failure when a claimed platform has no publisher result", async () => {
    const page = { url: "https://platinumcore777.com/a.html", title: "A", description: "D", text: "T", contentHash: "h" };
    const deps = {
      siteReader: { read: vi.fn().mockResolvedValue([page]) },
      db: {
        startRun: vi.fn().mockReturnValue({ id: "run-3", startedAt: new Date().toISOString() }), upsertPage: vi.fn(),
        findEligiblePages: vi.fn().mockReturnValue([page]), findRetryableCampaigns: vi.fn().mockReturnValue([]), getCampaignWorkItem: vi.fn(),
        createCampaign: vi.fn().mockReturnValue({ id: "campaign-3" }), claimPlatformPublish: vi.fn().mockReturnValue(true), recordPublishResult: vi.fn(), finishRun: vi.fn(),
      },
      generator: { generate: vi.fn().mockResolvedValue({ pageUrl: page.url, text: "Post", hashtags: [], generatedBy: "fallback" }) },
      publisher: { publish: vi.fn().mockResolvedValue([{ platform: "facebook", status: "published" }]) },
      notifications: { sendRunSummary: vi.fn().mockResolvedValue(undefined) }, intervalMinutes: 120,
    };

    const summary = await runOnce(deps as never);
    expect(summary.errors.join(" ")).toContain("linkedin");
  });
});
