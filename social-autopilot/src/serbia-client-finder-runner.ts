import { readFile, writeFile } from "node:fs/promises";
import { loadSerbiaClientFinderConfig, type SerbiaClientFinderConfig } from "./config";
import { createNotificationService } from "./notifications";
import {
  buildSerbiaClientFinderQueries,
  deduplicateSerbiaLeads,
  filterFreshSerbiaLeads,
  formatSerbiaClientFinderDigest,
  markSerbiaLeadsReported,
  normalizeSerbiaLead,
  scoreSerbiaLead,
  type ScoredSerbiaLead,
} from "./serbia-client-finder";
import { fetchBraveWebSearchResults, type IdentitySearchResult } from "./identity-monitor";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;
type FinderState = Record<string, string>;

export interface SerbiaClientFinderRunnerDependencies {
  fetchImpl?: FetchLike;
  now?: Date;
  notify?: (leads: readonly ScoredSerbiaLead[], checkedAt: Date) => Promise<void>;
  readState?: (path: string) => Promise<FinderState>;
  writeState?: (path: string, state: FinderState) => Promise<void>;
}

export interface SerbiaClientFinderRunResult {
  status: "skipped" | "quiet" | "logged" | "sent";
  leads: ScoredSerbiaLead[];
}

async function readStateFile(path: string): Promise<FinderState> {
  try {
    const raw = await readFile(path, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([, value]) => typeof value === "string"));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") return {};
    throw error;
  }
}

async function writeStateFile(path: string, state: FinderState): Promise<void> {
  await writeFile(path, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

export async function runSerbiaClientFinderOnce(
  env: NodeJS.ProcessEnv,
  dependencies: SerbiaClientFinderRunnerDependencies = {},
): Promise<SerbiaClientFinderRunResult> {
  const config: SerbiaClientFinderConfig = loadSerbiaClientFinderConfig(env);
  if (!config.braveSearchApiKey) {
    console.log("Serbia client finder skipped: BRAVE_SEARCH_API_KEY is not configured");
    return { status: "skipped", leads: [] };
  }

  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const checkedAt = dependencies.now ?? new Date();
  const queries = buildSerbiaClientFinderQueries();
  const queryByText = new Map(queries.map((query) => [query.query, query]));
  const results: IdentitySearchResult[] = [];
  for (const query of queries) {
    results.push(...await fetchBraveWebSearchResults(fetchImpl, config.braveSearchApiKey, query.query));
  }

  const scoredLeads = results
    .flatMap((result) => {
      const query = queryByText.get(result.query);
      if (!query) return [];
      const candidate = normalizeSerbiaLead(result, query);
      return candidate ? [scoreSerbiaLead(candidate)] : [];
    });

  const state = await (dependencies.readState ?? readStateFile)(config.statePath);
  const leads = filterFreshSerbiaLeads(
    deduplicateSerbiaLeads(scoredLeads),
    state,
    checkedAt,
  ).sort((left, right) => right.score - left.score).slice(0, config.maxLeads);

  if (leads.length === 0) {
    console.log("Serbia client finder completed: no new public leads");
    return { status: "quiet", leads: [] };
  }

  if (!config.smtpHost) {
    console.log(formatSerbiaClientFinderDigest(leads, checkedAt));
    console.log("Serbia client finder logged leads only: SMTP_HOST is not configured");
    return { status: "logged", leads };
  }

  if (dependencies.notify) {
    await dependencies.notify(leads, checkedAt);
  } else {
    await createNotificationService(config).sendSerbiaClientFinderDigest(leads, checkedAt);
  }

  const nextState = markSerbiaLeadsReported(state, leads, checkedAt);
  await (dependencies.writeState ?? writeStateFile)(config.statePath, nextState);
  console.log(`Serbia client finder sent ${leads.length} lead(s)`);
  return { status: "sent", leads };
}

if (require.main === module) {
  void runSerbiaClientFinderOnce(process.env)
    .then((result) => console.log(`Serbia client finder: ${result.status}`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : "Serbia client finder failed");
      process.exitCode = 1;
    });
}
