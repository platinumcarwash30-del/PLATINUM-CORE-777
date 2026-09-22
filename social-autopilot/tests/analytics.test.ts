import { describe, expect, it } from "vitest";
import {
  buildAnalyticsReportRequest,
  fetchAnalyticsReport,
} from "../src/analytics";

describe("Google Analytics Data API", () => {
  it("builds a read-only report request for the configured property", () => {
    const request = buildAnalyticsReportRequest("554126635", "2026-09-17", "2026-09-19");

    expect(request.url).toBe(
      "https://analyticsdata.googleapis.com/v1beta/properties/554126635:runReport",
    );
    expect(request.body).toMatchObject({
      dateRanges: [{ startDate: "2026-09-17", endDate: "2026-09-19" }],
      dimensions: [{ name: "pagePath" }],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
      ],
      metricAggregations: ["TOTAL"],
      limit: 25,
    });
  });

  it("parses summary metrics and ignores malformed page rows", async () => {
    const calls: Array<{ input: string; init?: RequestInit }> = [];
    const fetchImpl = async (input: string, init?: RequestInit): Promise<Response> => {
      calls.push({ input, init });
      return new Response(JSON.stringify({
        totals: [{ metricValues: [{ value: "16" }, { value: "20" }, { value: "31" }] }],
        rows: [
          {
            dimensionValues: [{ value: "/" }],
            metricValues: [{ value: "16" }, { value: "20" }, { value: "31" }],
          },
          {
            dimensionValues: [{ value: "/broken" }],
            metricValues: [{ value: "not-a-number" }, { value: "2" }, { value: "3" }],
          },
          { dimensionValues: [], metricValues: [] },
        ],
      }), { status: 200, headers: { "content-type": "application/json" } });
    };

    const report = await fetchAnalyticsReport(
      fetchImpl,
      "token",
      "554126635",
      "2026-09-17",
      "2026-09-19",
    );

    expect(report.summary).toEqual({ activeUsers: 16, sessions: 20, screenPageViews: 31 });
    expect(report.topPages).toEqual([
      { pagePath: "/", activeUsers: 16, sessions: 20, screenPageViews: 31 },
    ]);
    expect(calls[0]?.input).toContain("properties/554126635:runReport");
    expect(calls[0]?.init?.headers).toMatchObject({ authorization: "Bearer token" });
  });

  it("fails clearly when the Analytics API rejects the request", async () => {
    const fetchImpl = async (): Promise<Response> => new Response("denied", { status: 403 });

    await expect(fetchAnalyticsReport(
      fetchImpl,
      "token",
      "554126635",
      "2026-09-17",
      "2026-09-19",
    )).rejects.toThrow("Google Analytics Data API failed: HTTP 403");
  });
});
