export const SEARCH_CONSOLE_QUERIES = [
  "What is Core Review",
  "Core Review",
  "Who is behind Core Review",
  "When is Core Review launching",
  "Core Review app",
  "PLATINUM CORE 777",
  "How to support Core Review",
  "Donate to Core Review",
  "Marko Cuca Core Review",
] as const;

export interface SearchConsoleRow {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface SearchConsoleReport {
  property: string;
  startDate: string;
  endDate: string;
  checkedAt: string;
  rows: SearchConsoleRow[];
}

export interface SearchConsoleDateWindow {
  startDate: string;
  endDate: string;
}

export interface SearchAnalyticsRequest {
  url: string;
  body: {
    startDate: string;
    endDate: string;
    dimensions: ["query"];
    type: "web";
    rowLimit: number;
    dimensionFilterGroups: [{
      groupType: "and";
      filters: [{
        dimension: "query";
        operator: "includingRegex";
        expression: string;
      }];
    }];
  };
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function queryExpression(queries: readonly string[]): string {
  return queries
    .map((query) => escapeRegex(query).replace(/\\ /g, "\\s+"))
    .join("|");
}

function dateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function previousCompleteDateWindow(now: Date): SearchConsoleDateWindow {
  const end = new Date(now);
  end.setUTCDate(end.getUTCDate() - 1);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 2);
  return { startDate: dateOnly(start), endDate: dateOnly(end) };
}

export function buildSearchAnalyticsRequest(
  property: string,
  queries: readonly string[],
  startDate: string,
  endDate: string,
): SearchAnalyticsRequest {
  return {
    url: `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`,
    body: {
      startDate,
      endDate,
      dimensions: ["query"],
      type: "web",
      rowLimit: 25000,
      dimensionFilterGroups: [{
        groupType: "and",
        filters: [{
          dimension: "query",
          operator: "includingRegex",
          expression: queryExpression(queries),
        }],
      }],
    },
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function parseSearchAnalyticsResponse(
  payload: unknown,
  watchedQueries: readonly string[],
): SearchConsoleRow[] {
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { rows?: unknown }).rows)) return [];
  const watched = watchedQueries.map((query) => query.toLowerCase());
  return ((payload as { rows: unknown[] }).rows)
    .map((row): SearchConsoleRow | undefined => {
      if (!row || typeof row !== "object") return undefined;
      const value = row as { keys?: unknown; clicks?: unknown; impressions?: unknown; ctr?: unknown; position?: unknown };
      const query = Array.isArray(value.keys) && typeof value.keys[0] === "string" ? value.keys[0] : undefined;
      if (!query || !watched.includes(query.toLowerCase())) return undefined;
      if (!isFiniteNumber(value.clicks) || !isFiniteNumber(value.impressions) || !isFiniteNumber(value.ctr) || !isFiniteNumber(value.position)) return undefined;
      return {
        query,
        clicks: value.clicks,
        impressions: value.impressions,
        ctr: value.ctr,
        position: value.position,
      };
    })
    .filter((row): row is SearchConsoleRow => Boolean(row));
}

export async function fetchSearchConsoleReport(
  fetchImpl: FetchLike,
  accessToken: string,
  property: string,
  queries: readonly string[],
  startDate: string,
  endDate: string,
): Promise<SearchConsoleReport> {
  const request = buildSearchAnalyticsRequest(property, queries, startDate, endDate);
  const response = await fetchImpl(request.url, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(request.body),
  });
  if (!response.ok) throw new Error(`Search Console API failed: HTTP ${response.status}`);
  const payload: unknown = await response.json();
  return {
    property,
    startDate,
    endDate,
    checkedAt: new Date().toISOString(),
    rows: parseSearchAnalyticsResponse(payload, queries),
  };
}

export function formatSearchConsoleReport(report: SearchConsoleReport): string {
  const rows = report.rows.length === 0
    ? "No matching queries had Search Console data in this period."
    : report.rows.map((row) => [
      `Query: ${row.query}`,
      `Clicks: ${row.clicks}`,
      `Impressions: ${row.impressions}`,
      `CTR: ${(row.ctr * 100).toFixed(2)}%`,
      `Average position: ${row.position}`,
    ].join(" | ")).join("\n");

  return [
    "PLATINUM CORE 777 Search Console monitor",
    `Property: ${report.property}`,
    `Period: ${report.startDate} to ${report.endDate}`,
    `Checked: ${report.checkedAt}`,
    "",
    rows,
  ].join("\n");
}
