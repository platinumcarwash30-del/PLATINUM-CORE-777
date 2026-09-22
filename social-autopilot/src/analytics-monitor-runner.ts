import cron from "node-cron";
import {
  fetchAnalyticsMonitorReport,
  formatAnalyticsMonitorReport,
  type AnalyticsMonitorDependencies,
  type AnalyticsMonitorReport,
} from "./analytics-monitor";
import { loadAnalyticsMonitorConfig } from "./config";
import { createNotificationService } from "./notifications";

export { formatAnalyticsMonitorReport } from "./analytics-monitor";

export const ANALYTICS_MONITOR_CRON = "0 8,15,21 * * *";
export const ANALYTICS_MONITOR_TIMEZONE = "Europe/Belgrade";

export interface AnalyticsMonitorRunnerDependencies extends AnalyticsMonitorDependencies {
  notify?: (report: AnalyticsMonitorReport, recipient: string) => Promise<void>;
}

export interface AnalyticsMonitorRunResult {
  status: "skipped" | "logged" | "sent";
  report?: AnalyticsMonitorReport;
}

export async function runAnalyticsMonitorOnce(
  env: NodeJS.ProcessEnv,
  dependencies: AnalyticsMonitorRunnerDependencies = {},
): Promise<AnalyticsMonitorRunResult> {
  const config = loadAnalyticsMonitorConfig(env);
  if (!config.googleServiceAccountJson && !config.googleServiceAccountJsonPath) {
    console.log("Analytics monitor skipped: Google service-account JSON is not configured");
    return { status: "skipped" };
  }

  const report = await fetchAnalyticsMonitorReport(config, dependencies);
  if (dependencies.notify) {
    await dependencies.notify(report, config.notificationTo);
    return { status: "sent", report };
  }

  const text = formatAnalyticsMonitorReport(report);
  if (!config.smtpHost) {
    console.log(text);
    console.log("Analytics monitor was logged only: SMTP_HOST is not configured");
    return { status: "logged", report };
  }

  await createNotificationService(config).sendAnalyticsMonitorReport(report);
  return { status: "sent", report };
}

export function startAnalyticsMonitorSchedule(
  env: NodeJS.ProcessEnv,
  dependencies: AnalyticsMonitorRunnerDependencies = {},
): ReturnType<typeof cron.schedule> {
  return cron.schedule(
    ANALYTICS_MONITOR_CRON,
    () => { void runAnalyticsMonitorOnce(env, dependencies); },
    { timezone: ANALYTICS_MONITOR_TIMEZONE },
  );
}

if (require.main === module) {
  if (process.argv.includes("--schedule")) {
    startAnalyticsMonitorSchedule(process.env);
    console.log(`Analytics monitor scheduled at ${ANALYTICS_MONITOR_CRON} (${ANALYTICS_MONITOR_TIMEZONE})`);
  } else {
    void runAnalyticsMonitorOnce(process.env)
      .then((result) => console.log(`Analytics monitor: ${result.status}`))
      .catch((error) => {
        console.error(error instanceof Error ? error.message : "Analytics monitor failed");
        process.exitCode = 1;
      });
  }
}
