import { randomBytes } from "node:crypto";
import { createWorkerRuntime } from "./runtime";

async function main(): Promise<void> {
  if (!process.env.ADMIN_SESSION_SECRET) {
    process.env.ADMIN_SESSION_SECRET = randomBytes(32).toString("hex");
  }

  const runtime = await createWorkerRuntime(process.env);
  try {
    const summary = await runtime.executeRun();
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    runtime.close();
  }
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Autopilot one-cycle run failed");
  process.exitCode = 1;
});
