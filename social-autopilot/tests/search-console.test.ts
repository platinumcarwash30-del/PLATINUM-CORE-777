import { describe, expect, it } from "vitest";
import {
  SEARCH_CONSOLE_QUERIES,
  buildSearchAnalyticsRequest,
  fetchSearchConsoleReport,
  formatSearchConsoleReport,
  parseSearchAnalyticsResponse,
  previousCompleteDateWindow,
} from "../src/search-console";

describe("Search Console monitor", () => {
  it("keeps the project queries explicit and unique", () => {
    expect(SEARCH_CONSOLE_QUERIES).toEqual([
      "What is Core Review",
      "Core Review",
      "Who is behind Core Review",
      "When is Core Review launching",
      "Core Review app",
      "PLATINUM CORE 777",
      "How to support Core Review",
      "Donate to Core Review",
      "Marko Cuca Core Review",
    ]);
    expect(new Set(SEARCH_CONSOLE_QUERIES).size).toBe(SEARCH_CONSOLE_QUERIES.length);
  });

  it("builds a read-only Search Analytics query for the watched terms", () => {
    const request = buildSearchAnalyticsRequest(
      "sc-domain:platinumcore777.com",
      SEARCH_CONSOLE_QUERIES,
      "2026-09-17",
      "2026-09-19",
    );

    expect(request.url).toContain("sc-domain%3Aplatinumcore777.com");
    expect(request.body).toMatchObject({
      startDate: "2026-09-17",
      endDate: "2026-09-19",
      dimensions: ["query"],
      type: "web",
    });
    expect(request.body.dimensionFilterGroups?.[0]?.filters?.[0]).toMatchObject({
      dimension: "query",
      operator: "includingRegex",
    });
  });

  it("keeps only rows matching the watched queries", () => {
    const rows = parseSearchAnalyticsResponse(
      {
        rows: [
          { keys: ["what is core review"], clicks: 2, impressions: 10, ctr: 0.2, position: 4.5 },
          { keys: ["unrelated query"], clicks: 99, impressions: 100, ctr: 0.99, position: 1 },
          { keys: ["PLATINUM CORE 777"], clicks: 1, impressions: 3, ctr: 0.333, position: 7 },
        ],
      },
      SEARCH_CONSOLE_QUERIES,
    );

    expect(rows).toEqual([
      { query: "what is core review", clicks: 2, impressions: 10, ctr: 0.2, position: 4.5 },
      { query: "PLATINUM CORE 777", clicks: 1, impressions: 3, ctr: 0.333, position: 7 },
    ]);
  });

  it("formats a concise report for the owner", () => {
    const text = formatSearchConsoleReport({
      property: "sc-domain:platinumcore777.com",
      startDate: "2026-09-17",
      endDate: "2026-09-19",
      checkedAt: "2026-09-20T20:00:00.000Z",
      rows: [{ query: "Core Review", clicks: 3, impressions: 20, ctr: 0.15, position: 6.25 }],
    });

    expect(text).toContain("Core Review");
    expect(text).toContain("Clicks: 3");
    expect(text).toContain("Impressions: 20");
    expect(text).toContain("Average position: 6.25");
  });

  it("reads a report with the read-only bearer token", async () => {
    const calls: Array<{ input: string; init?: RequestInit }> = [];
    const fetchImpl = async (input: string, init?: RequestInit): Promise<Response> => {
      calls.push({ input, init });
      return new Response(JSON.stringify({
        rows: [{ keys: ["Core Review"], clicks: 1, impressions: 4, ctr: 0.25, position: 8 }],
      }), { status: 200, headers: { "content-type": "application/json" } });
    };

    const report = await fetchSearchConsoleReport(
      fetchImpl,
      "token",
      "sc-domain:platinumcore777.com",
      SEARCH_CONSOLE_QUERIES,
      "2026-09-17",
      "2026-09-19",
    );

    expect(report.rows[0]?.query).toBe("Core Review");
    expect(calls[0]?.init?.headers).toMatchObject({ authorization: "Bearer token" });
  });

  it("uses complete prior dates for the hourly report", () => {
    expect(previousCompleteDateWindow(new Date("2026-09-20T20:00:00.000Z"))).toEqual({
      startDate: "2026-09-17",
      endDate: "2026-09-19",
    });
  });
});
