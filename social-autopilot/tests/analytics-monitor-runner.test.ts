import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  ANALYTICS_MONITOR_CRON,
  ANALYTICS_MONITOR_TIMEZONE,
  formatAnalyticsMonitorReport,
  runAnalyticsMonitorOnce,
} from "../src/analytics-monitor-runner";
import { ANALYTICS_MONITOR_QUERIES } from "../src/analytics-monitor";
import { SEARCH_CONSOLE_QUERIES } from "../src/search-console";

function serviceAccountJson(): string {
  const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
  return JSON.stringify({
    client_email: "pc777-search-monitor@example.iam.gserviceaccount.com",
    private_key: keys.privateKey.export({ format: "pem", type: "pkcs8" }).toString(),
  });
}

const baseEnv = {
  NODE_ENV: "test",
  NOTIFICATION_TO: "platinum303030@gmail.com",
  GOOGLE_SERVICE_ACCOUNT_JSON: serviceAccountJson(),
};

describe("Analytics monitor runner", () => {
  it("keeps the Belgrade schedule and approved query set explicit", () => {
    expect(ANALYTICS_MONITOR_CRON).toBe("0 6 * * *");
    expect(ANALYTICS_MONITOR_TIMEZONE).toBe("Europe/Belgrade");
    expect(ANALYTICS_MONITOR_QUERIES).toEqual(expect.arrayContaining([
      ...SEARCH_CONSOLE_QUERIES,
      "platinum core 777",
      "core review",
      "sta je platinum core 777",
      "kako videti ponudu",
    ]));
  });

  it("sends exactly one combined report to the configured Gmail recipient", async () => {
    const fetchImpl = async (input: string): Promise<Response> => {
      if (input === "https://oauth2.googleapis.com/token") {
        return new Response(JSON.stringify({ access_token: "combined-token" }), { status: 200 });
      }
      if (input.includes("webmasters/v3")) {
        return new Response(JSON.stringify({ rows: [] }), { status: 200 });
      }
      return new Response(JSON.stringify({
        totals: [{ metricValues: [{ value: "0" }, { value: "0" }, { value: "0" }] }],
        rows: [],
      }), { status: 200 });
    };
    const deliveries: Array<{ recipient: string; reportCheckedAt: string }> = [];

    const result = await runAnalyticsMonitorOnce(baseEnv, {
      fetchImpl,
      now: new Date("2026-09-20T20:00:00.000Z"),
      notify: async (report, recipient) => {
        deliveries.push({ recipient, reportCheckedAt: report.checkedAt });
      },
    });

    expect(result.status).toBe("sent");
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]?.recipient).toBe("platinum303030@gmail.com");
  });

  it("includes source errors in the report instead of turning them into zeroes", () => {
    const text = formatAnalyticsMonitorReport({
      startDate: "2026-09-17",
      endDate: "2026-09-19",
      checkedAt: "2026-09-20T20:00:00.000Z",
      searchConsole: { status: "error", error: "Search Console API failed: HTTP 503" },
      analytics: {
        status: "ok",
        data: {
          propertyId: "554126635",
          startDate: "2026-09-17",
          endDate: "2026-09-19",
          checkedAt: "2026-09-20T20:00:00.000Z",
          summary: { activeUsers: 1, sessions: 2, screenPageViews: 3 },
          topPages: [],
        },
      },
    });

    expect(text).toContain("Search Console: ERROR — Search Console API failed: HTTP 503");
    expect(text).toContain("Analytics: OK");
    expect(text).not.toContain("Search Console clicks: 0");
  });
});
