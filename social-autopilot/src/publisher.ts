import type { GeneratedPost, PlatformAdapter, PlatformName, PublishResult } from "./types";

export interface RetryOptions {
  delaysMs?: number[];
  platforms?: PlatformName[];
}

const DEFAULT_DELAYS = [1000, 5000, 15000];

function shouldRetry(result: PublishResult): boolean {
  return result.status === "failed" && (result.errorCode === "TEMPORARY" || result.errorCode === "RATE_LIMIT");
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function publishWithRetry(adapter: PlatformAdapter, post: GeneratedPost, options: RetryOptions): Promise<PublishResult> {
  const delays = options.delaysMs ?? DEFAULT_DELAYS;
  let result: PublishResult = { platform: adapter.platform, status: "failed", errorCode: "TEMPORARY", errorMessage: "No publish attempt made" };
  for (let attempt = 0; attempt < 3; attempt += 1) {
    result = await adapter.publish(post);
    if (!shouldRetry(result) || attempt === 2) return result;
    await sleep(delays[attempt] ?? DEFAULT_DELAYS[attempt]);
  }
  return result;
}

export async function publishToConnectedPlatforms(
  adapters: PlatformAdapter[],
  post: GeneratedPost,
  options: RetryOptions = {},
): Promise<PublishResult[]> {
  const selected = options.platforms
    ? adapters.filter((adapter) => options.platforms?.includes(adapter.platform))
    : adapters;
  return Promise.all(selected.map((adapter) => publishWithRetry(adapter, post, options)));
}
