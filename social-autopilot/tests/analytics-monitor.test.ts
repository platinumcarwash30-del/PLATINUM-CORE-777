import { generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import { fetchAnalyticsMonitorReport, ANALYTICS_MONITOR_QUERIES } from "../src/analytics-monitor";
import { loadAnalyticsMonitorConfig } from "../src/config";
import type { GoogleServiceAccount } from "../src/search-console-auth";

function serviceAccount(): GoogleServiceAccount {
  const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
  return {
    client_email: "pc777-search-monitor@example.iam.gserviceaccount.com",
    private_key: keys.privateKey.export({ format: "pem", type: "pkcs8" }).toString(),
  };
}

describe("combined Analytics monitor", () => {
  it("uses one read-only token and combines both Google reports", async () => {
    const account = serviceAccount();
    const calls: string[] = [];
    const fetchImpl = async (input: string): Promise<Response> => {
      calls.push(input);
      if (input === "https://oauth2.googleapis.com/token") {
        return new Response(JSON.stringify({ access_token: "combined-token" }), { status: 200 });
      }
      if (input.includes("webmasters/v3")) {
        return new Response(JSON.stringify({
          rows: [{ keys: ["sta je platinum core 777"], clicks: 2, impressions: 10, ctr: 0.2, position: 4 }],
        }), { status: 200 });
      }
      return new Response(JSON.stringify({
        totals: [{ metricValues: [{ value: "16" }, { value: "20" }, { value: "31" }] }],
        rows: [{
          dimensionValues: [{ value: "/" }],
          metricValues: [{ value: "16" }, { value: "20" }, { value: "31" }],
        }],
      }), { status: 200 });
    };
    const config = loadAnalyticsMonitorConfig({
      NOTIFICATION_TO: "platinum303030@gmail.com",
      GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify(account),
    });

    const report = await fetchAnalyticsMonitorReport(config, {
      fetchImpl,
      now: new Date("2026-09-20T20:00:00.000Z"),
    });

    expect(report.searchConsole.status).toBe("ok");
    expect(report.searchConsole.data?.rows[0]?.query).toBe("sta je platinum core 777");
    expect(report.analytics.status).toBe("ok");
    expect(report.analytics.data?.summary.activeUsers).toBe(16);
    expect(ANALYTICS_MONITOR_QUERIES).toContain("kako videti ponudu");
    expect(JSON.stringify(report)).not.toContain("private_key");
    expect(JSON.stringify(report)).not.toContain("access_token");
    expect(JSON.stringify(report)).not.toContain(account.client_email);
    expect(calls).toContain("https://oauth2.googleapis.com/token");
  });

  it("preserves a source error instead of reporting zero traffic", async () => {
    const account = serviceAccount();
    const fetchImpl = async (input: string): Promise<Response> => {
      if (input === "https://oauth2.googleapis.com/token") {
        return new Response(JSON.stringify({ access_token: "combined-token" }), { status: 200 });
      }
      if (input.includes("webmasters/v3")) return new Response("temporary failure", { status: 503 });
      return new Response(JSON.stringify({
        totals: [{ metricValues: [{ value: "1" }, { value: "2" }, { value: "3" }] }],
        rows: [],
      }), { status: 200 });
    };
    const config = loadAnalyticsMonitorConfig({
      NOTIFICATION_TO: "platinum303030@gmail.com",
      GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify(account),
    });

    const report = await fetchAnalyticsMonitorReport(config, { fetchImpl });

    expect(report.searchConsole).toMatchObject({
      status: "error",
      error: "Search Console API failed: HTTP 503",
    });
    expect(report.analytics).toMatchObject({ status: "ok" });
  });

  it("reports a missing local service-account file without exposing its contents", async () => {
    const config = loadAnalyticsMonitorConfig({
      NOTIFICATION_TO: "platinum303030@gmail.com",
      GOOGLE_SERVICE_ACCOUNT_JSON_PATH: "E:\\PLATINUM_CORE_777_WORK\\secrets\\missing.json",
    });

    await expect(fetchAnalyticsMonitorReport(config)).rejects.toThrow(
      "Google service-account file could not be read: E:\\PLATINUM_CORE_777_WORK\\secrets\\missing.json",
    );
  });
});
