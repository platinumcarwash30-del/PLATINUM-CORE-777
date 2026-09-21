import { loadSearchConsoleConfig } from "./config";
import { createNotificationService } from "./notifications";
import {
  fetchSearchConsoleReport,
  formatSearchConsoleReport,
  previousCompleteDateWindow,
  SEARCH_CONSOLE_QUERIES,
  type SearchConsoleReport,
} from "./search-console";
import {
  parseGoogleServiceAccountJson,
  requestGoogleAccessToken,
} from "./search-console-auth";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface SearchConsoleRunnerDependencies {
  fetchImpl?: FetchLike;
  now?: Date;
  notify?: (report: SearchConsoleReport) => Promise<void>;
}

export interface SearchConsoleRunResult {
  status: "skipped" | "logged" | "sent";
  report?: SearchConsoleReport;
}

export async function runSearchConsoleOnce(
  env: NodeJS.ProcessEnv,
  dependencies: SearchConsoleRunnerDependencies = {},
): Promise<SearchConsoleRunResult> {
  const config = loadSearchConsoleConfig(env);

  if (!config.googleServiceAccountJson) {
    console.log(
      "Search Console monitor skipped: GOOGLE_SERVICE_ACCOUNT_JSON is not configured",
    );
    return { status: "skipped" };
  }

  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const account = parseGoogleServiceAccountJson(
    config.googleServiceAccountJson,
  );
  const accessToken = await requestGoogleAccessToken(fetchImpl, account);
  const window = previousCompleteDateWindow(dependencies.now ?? new Date());

  const report = await fetchSearchConsoleReport(
    fetchImpl,
    accessToken,
    config.searchConsoleProperty,
    SEARCH_CONSOLE_QUERIES,
    window.startDate,
    window.endDate,
  );

  if (dependencies.notify) {
    await dependencies.notify(report);
    return { status: "sent", report };
  }

  if (!config.smtpHost) {
    console.log(formatSearchConsoleReport(report));
    console.log(
      "Search Console report was logged only: SMTP_HOST is not configured",
    );
    return { status: "logged", report };
  }

  await createNotificationService(config).sendSearchConsoleReport(report);

  return { status: "sent", report };
}

if (require.main === module) {
  void runSearchConsoleOnce(process.env)
    .then((result) =>
      console.log(`Search Console monitor: ${result.status}`),
    )
    .catch((error) => {
      console.error(
        error instanceof Error
          ? error.message
          : "Search Console monitor failed",
      );
      process.exitCode = 1;
    });
}
