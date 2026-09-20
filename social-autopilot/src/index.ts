import cron from "node-cron";
import { loadConfig } from "./config";
import { createDatabase } from "./db";
import { generatePost } from "./content-generator";
import { createNotificationService } from "./notifications";
import { FacebookPageAdapter } from "./platforms/facebook";
import { LinkedInPageAdapter } from "./platforms/linkedin";
import { publishToConnectedPlatforms } from "./publisher";
import { readSitePages } from "./site-reader";
import { buildServer } from "./server";
import { runOnce } from "./worker";

async function main(): Promise<void> {
  const config = loadConfig(process.env);
  const dryRun = process.env.DRY_RUN === "true" || process.argv.includes("--dry-run");
  const db = await createDatabase(config.databasePath);
  const adapters = [
    config.facebookPageId && config.facebookPageAccessToken ? new FacebookPageAdapter({ pageId: config.facebookPageId, accessToken: config.facebookPageAccessToken }) : undefined,
    config.linkedinOrganizationId && config.linkedinAccessToken ? new LinkedInPageAdapter({ organizationId: config.linkedinOrganizationId, accessToken: config.linkedinAccessToken }) : undefined,
  ].filter((adapter): adapter is FacebookPageAdapter | LinkedInPageAdapter => Boolean(adapter));
  let running = false;
  const executeRun = async () => {
    if (running) throw new Error("A run is already in progress");
    running = true;
    try {
      return await runOnce({
        siteReader: { read: () => readSitePages(fetch, config.siteSitemapUrl) },
        db,
        generator: { generate: (page) => generatePost(page) },
        publisher: {
          publish: (post, platforms) => dryRun
            ? Promise.resolve(platforms.map((platform) => ({ platform, status: "skipped" as const, errorCode: "DRY_RUN", errorMessage: "Dry run enabled" })))
            : publishToConnectedPlatforms(adapters, post, { platforms }),
        },
        notifications: createNotificationService(config),
        intervalMinutes: config.runIntervalMinutes,
        manualTargets: { whydonate: config.whyDonateUrl, buyMeACoffee: config.buyMeACoffeeUrl },
      });
    } finally {
      running = false;
    }
  };

  const app = await buildServer({ config, db, runNow: executeRun });
  await app.listen({ port: config.port, host: "0.0.0.0" });
  cron.schedule("0 */2 * * *", () => { void executeRun(); });
  if (config.runOnStart) void executeRun();
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Autopilot failed to start");
  process.exitCode = 1;
});
