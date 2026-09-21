import { readFile, writeFile } from "node:fs/promises";
import { loadIdentityMonitorConfig } from "./config";
import { createNotificationService } from "./notifications";
import {
  DEFAULT_IDENTITY_MONITOR_QUERIES,
  deduplicateResults,
  fetchBraveWebSearchResults,
  filterFreshFindings,
  isOfficialSource,
  markFindingsReported,
  type IdentityMonitorState,
  type IdentitySearchResult,
} from "./identity-monitor";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface IdentityMonitorRunnerDependencies {
  fetchImpl?: FetchLike;
  now?: Date;
  notify?: (findings: readonly IdentitySearchResult[], officialSourceUrls: readonly string[], checkedAt: Date) => Promise<void>;
  readState?: (path: string) => Promise<IdentityMonitorState>;
  writeState?: (path: string, state: IdentityMonitorState) => Promise<void>;
}

export interface IdentityMonitorRunResult {
  status: "skipped" | "quiet" | "logged" | "sent";
  findings: IdentitySearchResult[];
}

async function readStateFile(path: string): Promise<IdentityMonitorState> {
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

async function writeStateFile(path: string, state: IdentityMonitorState): Promise<void> {
  await writeFile(path, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

export async function runIdentityMonitorOnce(
  env: NodeJS.ProcessEnv,
  dependencies: IdentityMonitorRunnerDependencies = {},
): Promise<IdentityMonitorRunResult> {
  const config = loadIdentityMonitorConfig(env);
  if (!config.braveSearchApiKey) {
    console.log("Identity monitor skipped: BRAVE_SEARCH_API_KEY is not configured");
    return { status: "skipped", findings: [] };
  }

  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const checkedAt = dependencies.now ?? new Date();
  const results: IdentitySearchResult[] = [];
  for (const query of DEFAULT_IDENTITY_MONITOR_QUERIES) {
    results.push(...await fetchBraveWebSearchResults(
      fetchImpl,
      config.braveSearchApiKey,
      query,
    ));
  }

  const externalResults = deduplicateResults(results)
    .filter((result) => !isOfficialSource(result.link, config.officialSourceUrls));
  const state = await (dependencies.readState ?? readStateFile)(config.statePath);
  const findings = filterFreshFindings(externalResults, state, checkedAt);

  if (findings.length === 0) {
    console.log("Identity monitor completed: no new external results");
    return { status: "quiet", findings: [] };
  }

  if (dependencies.notify) {
    await dependencies.notify(findings, config.officialSourceUrls, checkedAt);
  } else if (!config.smtpHost) {
    console.log(`Identity monitor found ${findings.length} new external result(s), but SMTP_HOST is not configured`);
    return { status: "logged", findings };
  } else {
    await createNotificationService(config).sendIdentityMonitorDigest(
      findings,
      config.officialSourceUrls,
      checkedAt,
    );
  }

  const nextState = markFindingsReported(state, findings, checkedAt);
  await (dependencies.writeState ?? writeStateFile)(config.statePath, nextState);
  console.log(`Identity monitor sent ${findings.length} new result(s)`);
  return { status: dependencies.notify || config.smtpHost ? "sent" : "logged", findings };
}

if (require.main === module) {
  void runIdentityMonitorOnce(process.env)
    .then((result) => console.log(`Identity monitor: ${result.status}`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : "Identity monitor failed");
      process.exitCode = 1;
    });
}
