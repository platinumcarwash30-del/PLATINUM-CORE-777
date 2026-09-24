import cron from "node-cron";
import { loadAnalyticsMonitorConfig } from "./config";
import { fetchAnalyticsMonitorReport } from "./analytics-monitor";
import { buildServer } from "./server";
import { createWorkerRuntime } from "./runtime";

async function main(): Promise<void> {
  const runtime = await createWorkerRuntime(process.env);
  const { config, db, executeRun } = runtime;

  const analyticsMonitor = () => fetchAnalyticsMonitorReport(loadAnalyticsMonitorConfig(process.env));
  const app = await buildServer({ config, db, runNow: executeRun, analyticsMonitor });
  await app.listen({ port: config.port, host: "0.0.0.0" });
  cron.schedule("0 6 * * *", () => { void executeRun(); }, { timezone: "Europe/Belgrade" });
  if (config.runOnStart) void executeRun();

  const close = () => runtime.close();
  process.once("SIGTERM", close);
  process.once("SIGINT", close);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Autopilot failed to start");
  process.exitCode = 1;
});
