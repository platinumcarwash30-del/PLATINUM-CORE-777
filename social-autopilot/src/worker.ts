import type { CampaignWorkItem, DatabaseStore } from "./db";
import type { GeneratedPost, ManualPublishItem, PageMetadata, PlatformName, PublishResult, RunSummary } from "./types";

export interface WorkerDependencies {
  siteReader: { read(): Promise<PageMetadata[]> };
  db: Pick<DatabaseStore, "startRun" | "upsertPage" | "findEligiblePages" | "findRetryableCampaigns" | "getCampaignWorkItem" | "createCampaign" | "claimPlatformPublish" | "recordPublishResult" | "finishRun"> & Partial<Pick<DatabaseStore, "isStopped">>;
  generator: { generate(page: PageMetadata): Promise<GeneratedPost> };
  publisher: { publish(post: GeneratedPost, platforms: PlatformName[]): Promise<PublishResult[]> };
  notifications: { sendRunSummary(summary: RunSummary): Promise<void> };
  intervalMinutes: number;
  manualTargets?: { whydonate?: string; buyMeACoffee?: string };
}

const PLATFORMS: PlatformName[] = ["facebook", "linkedin"];

function nextRunAt(now: Date, intervalMinutes: number): string {
  return new Date(now.getTime() + intervalMinutes * 60_000).toISOString();
}

function statusFor(results: PublishResult[], errors: string[]): RunSummary["status"] {
  return results.some((result) => result.status === "failed") || errors.length > 0 ? "warning" : "success";
}

async function notifyAndRecord(deps: WorkerDependencies, summary: RunSummary): Promise<void> {
  deps.db.finishRun(summary.executionId, summary);
  try {
    await deps.notifications.sendRunSummary(summary);
  } catch (error) {
    summary.errors.push(error instanceof Error ? `Notification: ${error.message}` : "Notification failed");
    summary.status = "warning";
    deps.db.finishRun(summary.executionId, summary);
  }
}

async function publishCampaign(deps: WorkerDependencies, campaignId: string, post: GeneratedPost, summary: RunSummary): Promise<void> {
  const claimed = PLATFORMS.filter((platform) => deps.db.claimPlatformPublish(campaignId, platform));
  if (claimed.length === 0) return;
  let results: PublishResult[];
  try {
    results = await deps.publisher.publish(post, claimed);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Publisher failed";
    results = claimed.map((platform) => ({
      platform,
      status: "failed",
      errorCode: "TEMPORARY",
      errorMessage: message,
    }));
  }

  const returnedPlatforms = new Set(results.map((result) => result.platform));
  for (const platform of claimed) {
    if (!returnedPlatforms.has(platform)) {
      results.push({
        platform,
        status: "failed",
        errorCode: "CONFIG",
        errorMessage: "No publisher result was returned",
      });
    }
  }

  for (const result of results) {
    deps.db.recordPublishResult(campaignId, result);
    summary.results.push(result);
    if (result.status === "failed") summary.errors.push(`${result.platform}: ${result.errorCode ?? "FAILED"} — ${result.errorMessage ?? "unknown error"}`);
  }
}

export async function runOnce(deps: WorkerDependencies, now = new Date()): Promise<RunSummary> {
  const run = deps.db.startRun(now);
  const summary: RunSummary = {
    executionId: run.id,
    status: "success",
    startedAt: run.startedAt,
    nextRunAt: nextRunAt(now, deps.intervalMinutes),
    pagesSeen: 0,
    campaignsCreated: 0,
    results: [],
    manualPosts: [],
    errors: [],
  };

  if (deps.db.isStopped?.()) {
    summary.status = "stopped";
    summary.finishedAt = new Date().toISOString();
    await notifyAndRecord(deps, summary);
    return summary;
  }

  let pages: PageMetadata[];
  let retryable: CampaignWorkItem[] = [];
  try {
    pages = await deps.siteReader.read();
    summary.pagesSeen = pages.length;
    for (const page of pages) deps.db.upsertPage(page);
    retryable = deps.db.findRetryableCampaigns()
      .map((campaign) => deps.db.getCampaignWorkItem(campaign.id))
      .filter((item): item is CampaignWorkItem => Boolean(item));
  } catch (error) {
    summary.status = "failed";
    summary.errors.push(error instanceof Error ? error.message : "Site read failed");
    summary.finishedAt = new Date().toISOString();
    await notifyAndRecord(deps, summary);
    return summary;
  }

  for (const item of retryable) {
    await publishCampaign(deps, item.campaign.id, item.post, summary);
  }

  for (const page of deps.db.findEligiblePages()) {
    try {
      const post = await deps.generator.generate(page);
      const campaign = deps.db.createCampaign(page, post, summary.executionId);
      summary.campaignsCreated += 1;
      summary.manualPosts.push(...manualPostsFor(post, deps.manualTargets));
      await publishCampaign(deps, campaign.id, post, summary);
    } catch (error) {
      summary.errors.push(error instanceof Error ? `Page ${page.url}: ${error.message}` : `Page ${page.url}: generation failed`);
    }
  }

  summary.status = statusFor(summary.results, summary.errors);
  summary.finishedAt = new Date().toISOString();
  await notifyAndRecord(deps, summary);
  return summary;
}

function manualPostsFor(post: GeneratedPost, targets: WorkerDependencies["manualTargets"]): ManualPublishItem[] {
  const text = post.text.includes(post.pageUrl) ? post.text : `${post.text}\n\nRead more: ${post.pageUrl}`;
  return [
    { platform: "whydonate", targetUrl: targets?.whydonate, text, hashtags: post.hashtags, status: "ready-to-copy" },
    { platform: "buymeacoffee", targetUrl: targets?.buyMeACoffee, text, hashtags: post.hashtags, status: "ready-to-copy" },
  ];
}
