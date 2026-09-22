export interface AnalyticsSummary {
  activeUsers: number;
  sessions: number;
  screenPageViews: number;
}

export interface AnalyticsPageRow {
  pagePath: string;
  activeUsers: number;
  sessions: number;
  screenPageViews: number;
}

export interface AnalyticsReport {
  propertyId: string;
  startDate: string;
  endDate: string;
  checkedAt: string;
  summary: AnalyticsSummary;
  topPages: AnalyticsPageRow[];
}

export interface AnalyticsReportRequest {
  url: string;
  body: {
    dateRanges: [{ startDate: string; endDate: string }];
    dimensions: [{ name: "pagePath" }];
    metrics: [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
    ];
    metricAggregations: ["TOTAL"];
    limit: 25;
    orderBys: [{ metric: { metricName: "screenPageViews" }; desc: true }];
  };
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const ANALYTICS_API_BASE = "https://analyticsdata.googleapis.com/v1beta/properties";

function finiteMetricValue(value: unknown): number | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = (value as { value?: unknown }).value;
  if (typeof raw !== "string" && typeof raw !== "number") return undefined;
  const parsed = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function metricValues(value: unknown): number[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const parsed = value.map(finiteMetricValue);
  return parsed.every((metric): metric is number => metric !== undefined) ? parsed : undefined;
}

export function buildAnalyticsReportRequest(
  propertyId: string,
  startDate: string,
  endDate: string,
): AnalyticsReportRequest {
  return {
    url: `${ANALYTICS_API_BASE}/${encodeURIComponent(propertyId)}:runReport`,
    body: {
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: "pagePath" }],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
      ],
      metricAggregations: ["TOTAL"],
      limit: 25,
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    },
  };
}

export function parseAnalyticsResponse(
  payload: unknown,
  propertyId: string,
  startDate: string,
  endDate: string,
): AnalyticsReport {
  if (!payload || typeof payload !== "object") {
    throw new Error("Google Analytics response is invalid");
  }

  const value = payload as {
    totals?: unknown;
    rows?: unknown;
  };
  const totals = Array.isArray(value.totals) ? value.totals[0] : undefined;
  const totalMetricValues = totals && typeof totals === "object"
    ? metricValues((totals as { metricValues?: unknown }).metricValues)
    : undefined;
  if (!totalMetricValues || totalMetricValues.length < 3) {
    throw new Error("Google Analytics response did not contain numeric totals");
  }

  const topPages = Array.isArray(value.rows)
    ? value.rows.flatMap((row): AnalyticsPageRow[] => {
      if (!row || typeof row !== "object") return [];
      const typedRow = row as { dimensionValues?: unknown; metricValues?: unknown };
      const dimensions = typedRow.dimensionValues;
      const metrics = metricValues(typedRow.metricValues);
      const pagePath = Array.isArray(dimensions) && dimensions[0] && typeof dimensions[0] === "object"
        ? (dimensions[0] as { value?: unknown }).value
        : undefined;
      if (typeof pagePath !== "string" || !pagePath || !metrics || metrics.length < 3) return [];
      return [{
        pagePath,
        activeUsers: metrics[0],
        sessions: metrics[1],
        screenPageViews: metrics[2],
      }];
    })
    : [];

  return {
    propertyId,
    startDate,
    endDate,
    checkedAt: new Date().toISOString(),
    summary: {
      activeUsers: totalMetricValues[0],
      sessions: totalMetricValues[1],
      screenPageViews: totalMetricValues[2],
    },
    topPages,
  };
}

export async function fetchAnalyticsReport(
  fetchImpl: FetchLike,
  accessToken: string,
  propertyId: string,
  startDate: string,
  endDate: string,
): Promise<AnalyticsReport> {
  const request = buildAnalyticsReportRequest(propertyId, startDate, endDate);
  const response = await fetchImpl(request.url, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(request.body),
  });
  if (!response.ok) throw new Error(`Google Analytics Data API failed: HTTP ${response.status}`);
  return parseAnalyticsResponse(await response.json(), propertyId, startDate, endDate);
}
