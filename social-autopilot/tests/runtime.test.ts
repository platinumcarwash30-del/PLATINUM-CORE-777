import { afterEach, describe, expect, it, vi } from "vitest";
import { createWorkerRuntime } from "../src/runtime";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("worker runtime", () => {
  it("executes one dry-run cycle without starting the dashboard", async () => {
    const sitemap = `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://platinumcore777.com/test.html</loc></url></urlset>`;
    const page = `<!doctype html><html><head><title>Test page</title><meta name="description" content="A test page for PLATINUM CORE 777."><link rel="canonical" href="https://platinumcore777.com/test.html"></head><body><main><p>Independent technology project from Belgrade.</p></main></body></html>`;
    vi.stubGlobal("fetch", vi.fn(async (input: string | URL) => new Response(String(input).endsWith("sitemap.xml") ? sitemap : page, { status: 200 })));

    const runtime = await createWorkerRuntime({
      NODE_ENV: "test",
      DATABASE_PATH: ":memory:",
      SITE_SITEMAP_URL: "https://platinumcore777.com/sitemap.xml",
      RUN_INTERVAL_MINUTES: "120",
      RUN_ON_START: "false",
      ADMIN_USERNAME: "marko",
      ADMIN_SESSION_SECRET: "a".repeat(32),
      NOTIFICATION_TO: "platinum303030@gmail.com",
      DRY_RUN: "true",
    });

    const summary = await runtime.executeRun();
    runtime.close();

    expect(summary.pagesSeen).toBe(1);
    expect(summary.results).toEqual([
      { platform: "facebook", status: "skipped", errorCode: "DRY_RUN", errorMessage: "Dry run enabled" },
      { platform: "linkedin", status: "skipped", errorCode: "DRY_RUN", errorMessage: "Dry run enabled" },
    ]);
  });
});
