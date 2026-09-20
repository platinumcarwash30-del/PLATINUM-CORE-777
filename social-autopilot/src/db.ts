import { mkdirSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import initSqlJs, { type Database as SqlDatabase } from "sql.js";
import type { GeneratedPost, ManualPublishItem, PageMetadata, PlatformName, PublishResult, RunSummary } from "./types";

export interface CampaignRecord {
  id: string;
  pageUrl: string;
  contentHash: string;
}

export interface CampaignWorkItem {
  campaign: CampaignRecord;
  page: PageMetadata;
  post: GeneratedPost;
}

export interface RunRecord {
  id: string;
  startedAt: string;
  finishedAt?: string;
  status: RunSummary["status"] | "running";
  nextRunAt?: string;
  pagesSeen: number;
  campaignsCreated: number;
  results: PublishResult[];
  manualPosts: ManualPublishItem[];
  errors: string[];
}

export interface DatabaseStore {
  upsertPage(page: PageMetadata): void;
  findEligiblePages(): PageMetadata[];
  createCampaign(page: PageMetadata, post: GeneratedPost, executionId?: string): CampaignRecord;
  findRetryableCampaigns(): CampaignRecord[];
  getCampaignWorkItem(campaignId: string): CampaignWorkItem | undefined;
  claimPlatformPublish(campaignId: string, platform: PlatformName): boolean;
  recordPublishResult(campaignId: string, result: PublishResult): void;
  startRun(startedAt?: Date): RunRecord;
  finishRun(executionId: string, summary: RunSummary): void;
  listRuns(limit?: number): RunRecord[];
  isStopped(): boolean;
  setStopped(stopped: boolean): void;
  flush(): void;
  close(): void;
}

const schema = `
  CREATE TABLE IF NOT EXISTS pages (
    url TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    text TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS runs (
    id TEXT PRIMARY KEY,
    started_at TEXT NOT NULL,
    finished_at TEXT,
    status TEXT NOT NULL,
    next_run_at TEXT,
    pages_seen INTEGER NOT NULL DEFAULT 0,
    campaigns_created INTEGER NOT NULL DEFAULT 0,
    summary_json TEXT NOT NULL DEFAULT '{}',
    error_message TEXT
  );
  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    page_url TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    generated_text TEXT NOT NULL,
    hashtags_json TEXT NOT NULL,
    generated_by TEXT NOT NULL,
    execution_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    UNIQUE(page_url, content_hash)
  );
  CREATE TABLE IF NOT EXISTS platform_publications (
    campaign_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    status TEXT NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    external_url TEXT,
    error_code TEXT,
    error_message TEXT,
    locked_at TEXT,
    published_at TEXT,
    PRIMARY KEY(campaign_id, platform),
    FOREIGN KEY(campaign_id) REFERENCES campaigns(id)
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`;

function nowIso(): string {
  return new Date().toISOString();
}

function resultRows<T>(database: SqlDatabase, sql: string, params: Record<string, string | number | null> = {}): T[] {
  const result = database.exec(sql, params);
  if (result.length === 0) return [];
  return result[0].values.map((values) => {
    const row: Record<string, unknown> = {};
    result[0].columns.forEach((column, index) => { row[column] = values[index]; });
    return row as T;
  });
}

function one<T>(database: SqlDatabase, sql: string, params: Record<string, string | number | null> = {}): T | undefined {
  return resultRows<T>(database, sql, params)[0];
}

function toJson(value: unknown): string {
  return JSON.stringify(value);
}

export async function createDatabase(databasePath: string): Promise<DatabaseStore> {
  const SQL = await initSqlJs({ locateFile: () => require.resolve("sql.js/dist/sql-wasm.wasm") });
  const initialData = databasePath !== ":memory:" && existsSync(databasePath)
    ? readFileSync(databasePath)
    : undefined;
  const database = new SQL.Database(initialData);
  database.run(schema);

  const persist = (): void => {
    if (databasePath === ":memory:") return;
    mkdirSync(dirname(databasePath), { recursive: true });
    writeFileSync(databasePath, Buffer.from(database.export()));
  };

  const store: DatabaseStore = {
    upsertPage(page) {
      const timestamp = nowIso();
      database.run(
        `INSERT INTO pages (url, title, description, text, content_hash, updated_at, last_seen_at)
         VALUES ($url, $title, $description, $text, $hash, $timestamp, $timestamp)
         ON CONFLICT(url) DO UPDATE SET title=$title, description=$description, text=$text,
         content_hash=$hash, updated_at=$timestamp, last_seen_at=$timestamp`,
        { $url: page.url, $title: page.title, $description: page.description, $text: page.text, $hash: page.contentHash, $timestamp: timestamp },
      );
      persist();
    },

    findEligiblePages() {
      return resultRows<PageMetadata>(database, `
        SELECT p.url, p.title, p.description, p.text, p.content_hash AS contentHash
        FROM pages p
        WHERE NOT EXISTS (
          SELECT 1 FROM campaigns c WHERE c.page_url = p.url AND c.content_hash = p.content_hash
        )
        ORDER BY p.last_seen_at DESC
      `);
    },

    createCampaign(page, post, executionId = "manual") {
      const existing = one<{ id: string }>(database, `SELECT id FROM campaigns WHERE page_url=$url AND content_hash=$hash`, { $url: page.url, $hash: page.contentHash });
      if (existing) return { id: existing.id, pageUrl: page.url, contentHash: page.contentHash };

      const id = crypto.randomUUID();
      database.run(
        `INSERT INTO campaigns (id, page_url, content_hash, generated_text, hashtags_json, generated_by, execution_id, created_at)
         VALUES ($id, $url, $hash, $text, $hashtags, $generatedBy, $executionId, $createdAt)`,
        { $id: id, $url: page.url, $hash: page.contentHash, $text: post.text, $hashtags: toJson(post.hashtags), $generatedBy: post.generatedBy, $executionId: executionId, $createdAt: nowIso() },
      );
      database.run(
        `INSERT INTO platform_publications (campaign_id, platform, status) VALUES ($id, 'facebook', 'pending'), ($id, 'linkedin', 'pending')`,
        { $id: id },
      );
      persist();
      return { id, pageUrl: page.url, contentHash: page.contentHash };
    },

    findRetryableCampaigns() {
      return resultRows<CampaignRecord>(database, `
        SELECT DISTINCT c.id, c.page_url AS pageUrl, c.content_hash AS contentHash
        FROM campaigns c
        JOIN platform_publications p ON p.campaign_id = c.id
        WHERE p.status IN ('pending', 'failed', 'skipped') AND p.attempts < 3
        ORDER BY c.created_at ASC
      `);
    },

    getCampaignWorkItem(campaignId) {
      const row = one<{ id: string; pageUrl: string; contentHash: string; title: string; description: string; text: string; generatedText: string; hashtagsJson: string; generatedBy: "ai" | "fallback" }>(database, `
        SELECT c.id, c.page_url AS pageUrl, c.content_hash AS contentHash,
          p.title, p.description, p.text,
          c.generated_text AS generatedText, c.hashtags_json AS hashtagsJson, c.generated_by AS generatedBy
        FROM campaigns c JOIN pages p ON p.url = c.page_url
        WHERE c.id=$id
      `, { $id: campaignId });
      if (!row) return undefined;
      return {
        campaign: { id: row.id, pageUrl: row.pageUrl, contentHash: row.contentHash },
        page: { url: row.pageUrl, title: row.title, description: row.description, text: row.text, contentHash: row.contentHash },
        post: { pageUrl: row.pageUrl, text: row.generatedText, hashtags: JSON.parse(row.hashtagsJson) as string[], generatedBy: row.generatedBy },
      };
    },

    claimPlatformPublish(campaignId, platform) {
      database.run(
        `UPDATE platform_publications SET status='publishing', attempts=attempts+1, locked_at=$lockedAt
         WHERE campaign_id=$campaignId AND platform=$platform AND status IN ('pending', 'failed', 'skipped') AND attempts < 3`,
        { $lockedAt: nowIso(), $campaignId: campaignId, $platform: platform },
      );
      const claimed = database.getRowsModified() === 1;
      if (claimed) persist();
      return claimed;
    },

    recordPublishResult(campaignId, result) {
      database.run(
        `UPDATE platform_publications SET status=$status,
         attempts=CASE WHEN $status='skipped' THEN 0 ELSE attempts END,
         external_url=$externalUrl, error_code=$errorCode,
         error_message=$errorMessage, published_at=$publishedAt, locked_at=NULL
         WHERE campaign_id=$campaignId AND platform=$platform`,
        {
          $status: result.status,
          $externalUrl: result.externalUrl ?? null,
          $errorCode: result.errorCode ?? null,
          $errorMessage: result.errorMessage ?? null,
          $publishedAt: result.status === "published" ? nowIso() : null,
          $campaignId: campaignId,
          $platform: result.platform,
        },
      );
      persist();
    },

    startRun(startedAt = new Date()) {
      const id = crypto.randomUUID();
      const started = startedAt.toISOString();
      database.run(
        `INSERT INTO runs (id, started_at, status) VALUES ($id, $startedAt, 'running')`,
        { $id: id, $startedAt: started },
      );
      persist();
      return { id, startedAt: started, status: "running", pagesSeen: 0, campaignsCreated: 0, results: [], manualPosts: [], errors: [] };
    },

    finishRun(executionId, summary) {
      database.run(
        `UPDATE runs SET finished_at=$finishedAt, status=$status, next_run_at=$nextRunAt,
         pages_seen=$pagesSeen, campaigns_created=$campaignsCreated, summary_json=$summaryJson,
         error_message=$errorMessage WHERE id=$id`,
        {
          $finishedAt: summary.finishedAt ?? nowIso(),
          $status: summary.status,
          $nextRunAt: summary.nextRunAt ?? null,
          $pagesSeen: summary.pagesSeen,
          $campaignsCreated: summary.campaignsCreated,
          $summaryJson: toJson(summary),
          $errorMessage: summary.errors.join("; ") || null,
          $id: executionId,
        },
      );
      persist();
    },

    listRuns(limit = 25) {
      const rows = resultRows<{
        id: string; started_at: string; finished_at: string | null; status: RunRecord["status"];
        next_run_at: string | null; pages_seen: number; campaigns_created: number; summary_json: string;
      }>(database, `SELECT id, started_at, finished_at, status, next_run_at, pages_seen, campaigns_created, summary_json FROM runs ORDER BY started_at DESC LIMIT $limit`, { $limit: limit });
      return rows.map((row) => {
        const summary = JSON.parse(row.summary_json) as Partial<RunSummary>;
        return {
          id: row.id,
          startedAt: row.started_at,
          finishedAt: row.finished_at ?? undefined,
          status: row.status,
          nextRunAt: row.next_run_at ?? undefined,
          pagesSeen: row.pages_seen,
          campaignsCreated: row.campaigns_created,
          results: summary.results ?? [],
          manualPosts: summary.manualPosts ?? [],
          errors: summary.errors ?? [],
        };
      });
    },

    isStopped() {
      return one<{ value: string }>(database, `SELECT value FROM settings WHERE key='stopped'`)?.value === "true";
    },

    setStopped(stopped) {
      database.run(`INSERT INTO settings (key, value) VALUES ('stopped', $value) ON CONFLICT(key) DO UPDATE SET value=$value`, { $value: String(stopped) });
      persist();
    },

    flush: persist,
    close() { database.close(); },
  };

  persist();
  return store;
}
