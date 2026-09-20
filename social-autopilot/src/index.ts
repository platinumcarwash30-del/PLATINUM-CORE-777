import cron from "node-cron";
import { buildServer } from "./server";
import { createWorkerRuntime } from "./runtime";

async function main(): Promise<void> {
  const runtime = await createWorkerRuntime(process.env);
  const { config, db, executeRun } = runtime;

  const app = await buildServer({ config, db, runNow: executeRun });
  await app.listen({ port: config.port, host: "0.0.0.0" });
  cron.schedule("0 */2 * * *", () => { void executeRun(); });
  if (config.runOnStart) void executeRun();

  const close = () => runtime.close();
  process.once("SIGTERM", close);
  process.once("SIGINT", close);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Autopilot failed to start");
  process.exitCode = 1;
});
