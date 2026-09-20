import { describe, expect, it } from "vitest";
import { loadConfig } from "../src/config";

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
});
