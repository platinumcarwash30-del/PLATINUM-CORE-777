import type { GeneratedPost, PublishResult } from "../types";

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export function postMessage(post: GeneratedPost): string {
  const hashtags = post.hashtags.join(" ");
  return post.text.includes(hashtags) ? post.text : `${post.text}\n\n${hashtags}`;
}

export function classifyHttpStatus(status: number): PublishResult["status"] | "error" {
  if (status === 401 || status === 403) return "error";
  if (status === 429) return "error";
  if (status >= 500) return "error";
  return "error";
}

export function errorCodeForStatus(status: number): string {
  if (status === 401 || status === 403) return "AUTH";
  if (status === 429) return "RATE_LIMIT";
  if (status >= 500) return "TEMPORARY";
  return "API";
}

export async function responseMessage(response: Response): Promise<string> {
  const body = await response.text();
  if (!body) return `HTTP ${response.status}`;
  try {
    const json = JSON.parse(body) as { error?: { message?: string }; message?: string };
    return json.error?.message ?? json.message ?? body.slice(0, 300);
  } catch {
    return body.slice(0, 300);
  }
}
