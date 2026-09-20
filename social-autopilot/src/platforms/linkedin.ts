import type { GeneratedPost, PlatformAdapter, PublishResult } from "../types";
import { errorCodeForStatus, postMessage, responseMessage, type FetchLike } from "./common";

export interface LinkedInPageConfig {
  organizationId: string;
  accessToken: string;
  apiVersion?: string;
  fetchImpl?: FetchLike;
}

export class LinkedInPageAdapter implements PlatformAdapter {
  readonly platform = "linkedin" as const;
  private readonly fetchImpl: FetchLike;

  constructor(private readonly config: LinkedInPageConfig) {
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async publish(post: GeneratedPost): Promise<PublishResult> {
    const endpoint = "https://api.linkedin.com/rest/posts";
    const body = {
      author: `urn:li:organization:${this.config.organizationId}`,
      commentary: postMessage(post),
      visibility: "PUBLIC",
      distribution: { feedDistribution: "MAIN_FEED" },
      lifecycleState: "PUBLISHED",
      isReshareDisabled: false,
    };
    try {
      const response = await this.fetchImpl(endpoint, {
        method: "POST",
        headers: {
          authorization: `Bearer ${this.config.accessToken}`,
          "content-type": "application/json",
          "linkedin-version": this.config.apiVersion ?? "202504",
          "x-restli-protocol-version": "2.0.0",
        },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        return { platform: this.platform, status: "failed", errorCode: errorCodeForStatus(response.status), errorMessage: await responseMessage(response) };
      }
      const id = response.headers.get("x-restli-id") ?? response.headers.get("x-linkedin-id");
      if (!id) return { platform: this.platform, status: "failed", errorCode: "PROTOCOL", errorMessage: "LinkedIn did not return a post id" };
      return { platform: this.platform, status: "published", externalUrl: `https://www.linkedin.com/feed/update/${encodeURIComponent(id)}` };
    } catch (error) {
      return { platform: this.platform, status: "failed", errorCode: "TEMPORARY", errorMessage: error instanceof Error ? error.message : "LinkedIn request failed" };
    }
  }
}
