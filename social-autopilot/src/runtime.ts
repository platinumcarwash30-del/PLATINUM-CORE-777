import { loadConfig, type AppConfig } from "./config";
import { createDatabase, type DatabaseStore } from "./db";
import { generatePost } from "./content-generator";
import { createNotificationService } from "./notifications";
import { FacebookPageAdapter } from "./platforms/facebook";
import { LinkedInPageAdapter } from "./platforms/linkedin";
import { publishToConnectedPlatforms } from "./publisher";
import { readSitePages } from "./site-reader";
import type { RunSummary } from "./types";
import { runOnce } from "./worker";

export interface WorkerRuntime {
  config: AppConfig;
  db: DatabaseStore;
  executeRun(): Promise<RunSummary>;
  close(): void;
}

export async function createWorkerRuntime(env: NodeJS.ProcessEnv): Promise<WorkerRuntime> {
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
  ].filter((adapter): adapter is FacebookPageAdapter | LinkedInPageAdapter => Boolean(adapter));

  if (!dryRun) {
    if (adapters.length !== 2) {
      throw new Error("Live publishing requires both Facebook Page and LinkedIn organization credentials");
    }
    if (!config.smtpHost || !config.smtpUser || !config.smtpPassword) {
      throw new Error("Live publishing requires SMTP_HOST, SMTP_USER, and SMTP_PASSWORD for run notifications");
    }
  }

  let running = false;
  const executeRun = async (): Promise<RunSummary> => {
    if (running) throw new Error("A run is already in progress");
    running = true;
    try {
      return await runOnce({
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
        intervalMinutes: 1440,
        manualTargets: { whydonate: config.whyDonateUrl, buyMeACoffee: config.buyMeACoffeeUrl },
      });
    } finally {
      running = false;
    }
  };

  return { config, db, executeRun, close: () => db.close() };
}
