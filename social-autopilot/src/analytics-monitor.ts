import { readFile } from "node:fs/promises";
import {
  fetchAnalyticsReport,
  type AnalyticsReport,
} from "./analytics";
import type { AnalyticsMonitorConfig } from "./config";
import {
  fetchSearchConsoleReport,
  previousCompleteDateWindow,
  SEARCH_CONSOLE_QUERIES,
  type SearchConsoleReport,
} from "./search-console";
import {
  ANALYTICS_READONLY_SCOPE,
  parseGoogleServiceAccountJson,
  requestGoogleAccessToken,
  SEARCH_CONSOLE_SCOPE,
  type GoogleServiceAccount,
} from "./search-console-auth";

export const ANALYTICS_MONITOR_QUERIES = [
  ...SEARCH_CONSOLE_QUERIES,
  "platinum core 777",
  "core review",
  "sta je platinum core 777",
  "kako videti ponudu",
] as const;

export interface AnalyticsMonitorSource<T> {
  status: "ok" | "error";
  data?: T;
  error?: string;
}

export interface AnalyticsMonitorReport {
  searchConsole: AnalyticsMonitorSource<SearchConsoleReport>;
  analytics: AnalyticsMonitorSource<AnalyticsReport>;
  startDate: string;
  endDate: string;
  checkedAt: string;
}

function sumSearchConsoleRows(report: SearchConsoleReport): { clicks: number; impressions: number } {
  return report.rows.reduce(
    (totals, row) => ({
      clicks: totals.clicks + row.clicks,
      impressions: totals.impressions + row.impressions,
    }),
    { clicks: 0, impressions: 0 },
  );
}

export function formatAnalyticsMonitorReport(report: AnalyticsMonitorReport): string {
  const searchConsoleText = report.searchConsole.status === "error"
    ? `Search Console: ERROR — ${report.searchConsole.error ?? "unknown error"}`
    : (() => {
      const data = report.searchConsole.data;
      if (!data) return "Search Console: ERROR — report data is missing";
      const totals = sumSearchConsoleRows(data);
      const rows = data.rows.length === 0
        ? "No watched queries had data in this period."
        : data.rows.map((row) => [
          `Query: ${row.query}`,
          `Clicks: ${row.clicks}`,
          `Impressions: ${row.impressions}`,
          `CTR: ${(row.ctr * 100).toFixed(2)}%`,
          `Average position: ${row.position}`,
        ].join(" | ")).join("\n");
      return [
        "Search Console: OK",
        `Watched-query clicks: ${totals.clicks}`,
        `Watched-query impressions: ${totals.impressions}`,
        rows,
      ].join("\n");
    })();

  const analyticsText = report.analytics.status === "error"
    ? `Analytics: ERROR — ${report.analytics.error ?? "unknown error"}`
    : (() => {
      const data = report.analytics.data;
      if (!data) return "Analytics: ERROR — report data is missing";
      const pages = data.topPages.length === 0
        ? "No page rows had data in this period."
        : data.topPages.map((page) => `${page.pagePath} — users: ${page.activeUsers}, sessions: ${page.sessions}, views: ${page.screenPageViews}`).join("\n");
      return [
        "Analytics: OK",
        `Active users: ${data.summary.activeUsers}`,
        `Sessions: ${data.summary.sessions}`,
        `Screen/page views: ${data.summary.screenPageViews}`,
        "Top pages:",
        pages,
      ].join("\n");
    })();

  return [
    "PLATINUM CORE 777 Analytics monitor",
    `Period: ${report.startDate} to ${report.endDate}`,
    `Checked: ${report.checkedAt}`,
    "",
    searchConsoleText,
    "",
    analyticsText,
  ].join("\n");
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface AnalyticsMonitorDependencies {
  fetchImpl?: FetchLike;
  now?: Date;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Analytics monitor source failed";
}

async function loadServiceAccount(config: AnalyticsMonitorConfig): Promise<GoogleServiceAccount> {
  if (config.googleServiceAccountJson) {
    return parseGoogleServiceAccountJson(config.googleServiceAccountJson);
  }
  if (!config.googleServiceAccountJsonPath) {
    throw new Error("Configure GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_SERVICE_ACCOUNT_JSON_PATH");
  }
  let content: string;
  try {
    content = await readFile(config.googleServiceAccountJsonPath, "utf8");
  } catch {
    throw new Error(`Google service-account file could not be read: ${config.googleServiceAccountJsonPath}`);
  }
  return parseGoogleServiceAccountJson(content);
}

async function sourceResult<T>(operation: Promise<T>): Promise<AnalyticsMonitorSource<T>> {
  try {
    return { status: "ok", data: await operation };
  } catch (error) {
    return { status: "error", error: errorMessage(error) };
  }
}

export async function fetchAnalyticsMonitorReport(
  config: AnalyticsMonitorConfig,
  dependencies: AnalyticsMonitorDependencies = {},
): Promise<AnalyticsMonitorReport> {
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const account = await loadServiceAccount(config);
  const accessToken = await requestGoogleAccessToken(
    fetchImpl,
    account,
    Math.floor(Date.now() / 1000),
    [SEARCH_CONSOLE_SCOPE, ANALYTICS_READONLY_SCOPE],
  );
  const window = previousCompleteDateWindow(dependencies.now ?? new Date());
  const [searchConsole, analytics] = await Promise.all([
    sourceResult(fetchSearchConsoleReport(
      fetchImpl,
      accessToken,
      config.searchConsoleProperty,
      ANALYTICS_MONITOR_QUERIES,
      window.startDate,
      window.endDate,
    )),
    sourceResult(fetchAnalyticsReport(
      fetchImpl,
      accessToken,
      config.googleAnalyticsPropertyId,
      window.startDate,
      window.endDate,
    )),
  ]);

  return {
    searchConsole,
    analytics,
    startDate: window.startDate,
    endDate: window.endDate,
    checkedAt: new Date().toISOString(),
  };
}
