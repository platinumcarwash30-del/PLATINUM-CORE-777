import type { GeneratedPost, PlatformAdapter, PublishResult } from "../types";
import { errorCodeForStatus, postMessage, responseMessage, type FetchLike } from "./common";

export interface FacebookPageConfig {
  pageId: string;
  accessToken: string;
  apiVersion?: string;
  fetchImpl?: FetchLike;
}

export class FacebookPageAdapter implements PlatformAdapter {
  readonly platform = "facebook" as const;
  private readonly fetchImpl: FetchLike;

  constructor(private readonly config: FacebookPageConfig) {
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async publish(post: GeneratedPost): Promise<PublishResult> {
    const endpoint = `https://graph.facebook.com/${this.config.apiVersion ?? "v22.0"}/${encodeURIComponent(this.config.pageId)}/feed`;
    try {
      const response = await this.fetchImpl(endpoint, {
        method: "POST",
        headers: { authorization: `Bearer ${this.config.accessToken}`, "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ message: postMessage(post) }),
      });
      if (!response.ok) {
        return { platform: this.platform, status: "failed", errorCode: errorCodeForStatus(response.status), errorMessage: await responseMessage(response) };
      }
      const body = await response.json() as { id?: string };
      if (!body.id) return { platform: this.platform, status: "failed", errorCode: "PROTOCOL", errorMessage: "Facebook did not return a post id" };
      return { platform: this.platform, status: "published", externalUrl: `https://www.facebook.com/${encodeURIComponent(body.id)}` };
    } catch (error) {
      return { platform: this.platform, status: "failed", errorCode: "TEMPORARY", errorMessage: error instanceof Error ? error.message : "Facebook request failed" };
    }
  }
}
