export type PlatformName = "facebook" | "linkedin";

export interface PageMetadata {
  url: string;
  title: string;
  description: string;
  text: string;
  contentHash: string;
}

export interface GeneratedPost {
  pageUrl: string;
  text: string;
  hashtags: string[];
  generatedBy: "ai" | "fallback";
}

export interface PublishResult {
  platform: PlatformName;
  status: "published" | "skipped" | "failed";
  externalUrl?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface ManualPublishItem {
  platform: "whydonate" | "buymeacoffee";
  targetUrl?: string;
  text: string;
  hashtags: string[];
  status: "ready-to-copy";
}

export interface PlatformAdapter {
  readonly platform: PlatformName;
  publish(post: GeneratedPost): Promise<PublishResult>;
}

export interface RunSummary {
  executionId: string;
  status: "success" | "warning" | "failed" | "stopped";
  startedAt: string;
  finishedAt?: string;
  nextRunAt?: string;
  pagesSeen: number;
  campaignsCreated: number;
  results: PublishResult[];
  manualPosts: ManualPublishItem[];
  errors: string[];
}
