import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadAnalyticsMonitorConfig,
  loadConfig,
  loadSerbiaClientFinderConfig,
  loadWikipediaDraftConfig,
} from "../src/config";

describe("loadConfig", () => {
  it("requires the notification recipient and two-hour interval", () => {
    const config = loadConfig({
      NODE_ENV: "test",
      DATABASE_PATH: ":memory:",
      NOTIFICATION_TO: "platinum303030@gmail.com",
      SITE_SITEMAP_URL: "https://platinumcore777.com/sitemap.xml",
      RUN_INTERVAL_MINUTES: "120",
      ADMIN_SESSION_SECRET: "12345678901234567890123456789012",
    });

    expect(config.notificationTo).toBe("platinum303030@gmail.com");
    expect(config.runIntervalMinutes).toBe(120);
    expect(config.searchConsoleProperty).toBe("sc-domain:platinumcore777.com");
    expect(config.googleServiceAccountJson).toBeUndefined();
  });

  it("rejects an interval shorter than two hours", () => {
    expect(() => loadConfig({ RUN_INTERVAL_MINUTES: "20" })).toThrow(
      "RUN_INTERVAL_MINUTES must be at least 120",
    );
  });

  it("loads the Serbia client finder defaults and requires a recipient", () => {
    const config = loadSerbiaClientFinderConfig({
      NOTIFICATION_TO: "platinum303030@gmail.com",
    });

    expect(config.notificationTo).toBe("platinum303030@gmail.com");
    expect(config.statePath).toBe("./serbia-client-finder-state.json");
    expect(config.maxLeads).toBe(10);
  });

  it("rejects an explicitly empty finder max-leads value", () => {
    expect(() => loadSerbiaClientFinderConfig({
      NOTIFICATION_TO: "platinum303030@gmail.com",
      SERBIA_CLIENT_FINDER_MAX_LEADS: "",
    })).toThrow();

    expect(() => loadSerbiaClientFinderConfig({})).toThrow();
  });

  it("loads the Wikipedia draft paths and official site defaults", () => {
    const config = loadWikipediaDraftConfig({});
    expect(config.siteUrl).toBe("https://platinumcore777.com/");
    expect(config.sitemapUrl).toBe("https://platinumcore777.com/sitemap.xml");
    expect(config.statePath).toBe("./wikipedia-draft-state.json");
    expect(config.draftPath).toBe("../docs/wikipedia/PLATINUM-CORE-777-draft.md");
    expect(config.sourcesPath).toBe("../docs/wikipedia/PLATINUM-CORE-777-sources.md");
  });

  it("rejects a configured Wikipedia draft URL outside the official site", () => {
    expect(() => loadWikipediaDraftConfig({
      WIKIPEDIA_DRAFT_SITE_URL: "https://example.com/",
    })).toThrow();
  });

  it("loads the analytics monitor defaults and a local key path", () => {
    const config = loadAnalyticsMonitorConfig({
      NOTIFICATION_TO: "platinum303030@gmail.com",
    });

    expect(config.notificationTo).toBe("platinum303030@gmail.com");
    expect(config.searchConsoleProperty).toBe("sc-domain:platinumcore777.com");
    expect(config.googleAnalyticsPropertyId).toBe("554126635");
    expect(config.googleServiceAccountJsonPath).toBeUndefined();

    const withPath = loadAnalyticsMonitorConfig({
      NOTIFICATION_TO: "platinum303030@gmail.com",
      GOOGLE_SERVICE_ACCOUNT_JSON_PATH: "E:\\PLATINUM_CORE_777_WORK\\secrets\\pc777-search-monitor.json",
    });
    expect(withPath.googleServiceAccountJsonPath).toBe(
      "E:\\PLATINUM_CORE_777_WORK\\secrets\\pc777-search-monitor.json",
    );
  });

  it("exposes standalone monitor launch commands without embedding credentials", () => {
    const packageJson = JSON.parse(readFileSync(resolve(__dirname, "../package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    expect(packageJson.scripts["analytics-monitor:once"]).toBe("node dist/src/analytics-monitor-runner.js");
    expect(packageJson.scripts["analytics-monitor:dev"]).toBe("node dist/src/analytics-monitor-runner.js --schedule");

    const example = readFileSync(resolve(__dirname, "../.env.analytics-monitor.example"), "utf8");
    expect(example).toContain("GOOGLE_SERVICE_ACCOUNT_JSON_PATH=E:\\PLATINUM_CORE_777_WORK\\secrets\\pc777-search-monitor.json");
    expect(example).not.toContain("private_key");
  });
});
