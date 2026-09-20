import { describe, expect, it, vi } from "vitest";
import { runSearchConsoleOnce } from "../src/search-console-runner";

const baseEnv = {
  NODE_ENV: "test",
  DATABASE_PATH: ":memory:",
  NOTIFICATION_TO: "platinum303030@gmail.com",
  SITE_SITEMAP_URL: "https://platinumcore777.com/sitemap.xml",
  RUN_INTERVAL_MINUTES: "120",
  ADMIN_SESSION_SECRET: "12345678901234567890123456789012",
};

describe("Search Console runner", () => {
  it("skips cleanly until the Google service-account secret is configured", async () => {
    const fetchImpl = vi.fn();
    const result = await runSearchConsoleOnce(baseEnv, { fetchImpl });

    expect(result.status).toBe("skipped");
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
