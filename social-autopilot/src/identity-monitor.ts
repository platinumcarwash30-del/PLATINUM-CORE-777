export const IDENTITY_MONITOR_RETENTION_DAYS = 7;

export const DEFAULT_IDENTITY_MONITOR_QUERIES = [
  '"PLATINUM CORE 777"',
  '"CORE REVIEW" "Marko Ćuća"',
  '"CORE REVIEW" "Marko Cuca"',
  '"Marko Ćuća"',
  '"Marko Cuca"',
  '"Cuca" "PLATINUM CORE 777"',
  '"Platinum Car Wash"',
  '"Platinum Luxury Spa"',
  '"markoplatinum@icloud.com"',
  '"contact@platinumcore777.com"',
  'site:facebook.com "PLATINUM CORE 777"',
  'site:instagram.com "PLATINUM CORE 777"',
  'site:facebook.com "CORE REVIEW" "Marko Cuca"',
  'site:instagram.com "CORE REVIEW" "Marko Cuca"',
] as const;

export const OFFICIAL_IDENTITY_EMAILS = [
  "markoplatinum@icloud.com",
  "contact@platinumcore777.com",
] as const;

export const OFFICIAL_IDENTITY_NAMES = [
  "Marko Ćuća",
  "Marko Cuca",
] as const;

export const OFFICIAL_PROJECT_NAMES = [
  "PLATINUM CORE 777",
  "CORE REVIEW",
  "Platinum Car Wash",
  "Platinum Luxury Spa",
] as const;

export interface IdentitySearchResult {
  title: string;
  link: string;
  snippet: string;
  query: string;
}

export type IdentityMonitorState = Record<string, string>;

export interface BraveWebSearchItem {
  title?: unknown;
  url?: unknown;
  description?: unknown;
}

export interface BraveWebSearchResponse {
  web?: unknown;
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

function asNonEmptyString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function sameOriginOrPath(url: URL, officialUrl: URL): boolean {
  if (url.origin !== officialUrl.origin) return false;
  const path = officialUrl.pathname.endsWith("/") ? officialUrl.pathname : `${officialUrl.pathname}/`;
  return officialUrl.pathname === "/" || url.pathname === officialUrl.pathname || url.pathname.startsWith(path);
}

export function isOfficialSource(link: string, officialSourceUrls: readonly string[]): boolean {
  try {
    const url = new URL(link);
    return officialSourceUrls.some((source) => {
      try {
        return sameOriginOrPath(url, new URL(source));
      } catch {
        return false;
      }
    });
  } catch {
    return false;
  }
}

export function parseBraveWebSearchResponse(payload: unknown, query: string): IdentitySearchResult[] {
  if (!payload || typeof payload !== "object") return [];
  const web = (payload as BraveWebSearchResponse).web;
  if (!web || typeof web !== "object") return [];
  const items = (web as { results?: unknown }).results;
  if (!Array.isArray(items)) return [];
  return items.map((item): IdentitySearchResult | undefined => {
    if (!item || typeof item !== "object") return undefined;
    const value = item as BraveWebSearchItem;
    const title = asNonEmptyString(value.title);
    const link = asNonEmptyString(value.url);
    const snippet = asNonEmptyString(value.description) ?? "";
    if (!title || !link) return undefined;
    return { title, link, snippet, query };
  }).filter((item): item is IdentitySearchResult => Boolean(item));
}

export async function fetchBraveWebSearchResults(
  fetchImpl: FetchLike,
  apiKey: string,
  query: string,
): Promise<IdentitySearchResult[]> {
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", "20");

  const response = await fetchImpl(url.toString(), {
    headers: {
      accept: "application/json",
      "X-Subscription-Token": apiKey,
    },
  });
  if (!response.ok) throw new Error(`Brave web search failed: HTTP ${response.status}`);
  return parseBraveWebSearchResponse(await response.json(), query);
}

export function deduplicateResults(results: readonly IdentitySearchResult[]): IdentitySearchResult[] {
  const seen = new Set<string>();
  return results.filter((result) => {
    if (seen.has(result.link)) return false;
    seen.add(result.link);
    return true;
  });
}

export function filterFreshFindings(
  findings: readonly IdentitySearchResult[],
  state: IdentityMonitorState,
  now: Date,
  retentionDays = IDENTITY_MONITOR_RETENTION_DAYS,
): IdentitySearchResult[] {
  const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
  return findings.filter((finding) => {
    const lastReportedAt = state[finding.link];
    if (!lastReportedAt) return true;
    const parsed = Date.parse(lastReportedAt);
    return !Number.isFinite(parsed) || now.getTime() - parsed >= retentionMs;
  });
}

export function markFindingsReported(
  state: IdentityMonitorState,
  findings: readonly IdentitySearchResult[],
  now: Date,
): IdentityMonitorState {
  const next = { ...state };
  const timestamp = now.toISOString();
  for (const finding of findings) next[finding.link] = timestamp;
  return next;
}

export function formatIdentityMonitorDigest(
  findings: readonly IdentitySearchResult[],
  officialSourceUrls: readonly string[],
  checkedAt: Date,
): string {
  const lines = findings.map((finding, index) => [
    `${index + 1}. ${finding.title}`,
    `URL: ${finding.link}`,
    `Query: ${finding.query}`,
    `Snippet: ${finding.snippet || "(no snippet returned)"}`,
    `Official source match: ${isOfficialSource(finding.link, officialSourceUrls) ? "yes" : "no — review this result"}`,
  ].join("\n"));

  return [
    "PLATINUM CORE 777 public identity monitor",
    `Checked: ${checkedAt.toISOString()}`,
    `New public results: ${findings.length}`,
    "",
    ...lines,
    "",
    "Google report preparation:",
    "Review the evidence before submitting any report:",
    "https://support.google.com/legal/troubleshooter/1114905/?hl=en-GB",
    "",
    "This monitor does not submit automatic Google reports or contact third parties.",
  ].join("\n");
}
