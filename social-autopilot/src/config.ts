import { z } from "zod";

const optionalString = () =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(1).optional(),
  );

const optionalUrl = () =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().url().optional(),
  );

export interface AppConfig {
  nodeEnv: "development" | "test" | "production";
  port: number;
  databasePath: string;
  siteSitemapUrl: string;
  runIntervalMinutes: number;
  runOnStart: boolean;
  adminUsername: string;
  adminPasswordHash?: string;
  adminSessionSecret: string;
  notificationTo: string;
  smtpHost?: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFrom: string;
  openAiApiKey?: string;
  openAiModel?: string;
  facebookPageId?: string;
  facebookPageAccessToken?: string;
  linkedinOrganizationId?: string;
  linkedinAccessToken?: string;
  whyDonateUrl?: string;
  buyMeACoffeeUrl?: string;
  searchConsoleProperty: string;
  googleServiceAccountJson?: string;
}

export interface SearchConsoleConfig {
  nodeEnv: "development" | "test" | "production";
  notificationTo: string;
  smtpHost?: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFrom: string;
  searchConsoleProperty: string;
  googleServiceAccountJson?: string;
}


export interface IdentityMonitorConfig {
  notificationTo: string;
  smtpHost?: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFrom: string;
  braveSearchApiKey?: string;
  officialSourceUrls: string[];
  statePath: string;
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_PATH: z.string().min(1).default("./autopilot.sqlite"),
  SITE_SITEMAP_URL: z.string().url().default("https://platinumcore777.com/sitemap.xml"),
  RUN_INTERVAL_MINUTES: z.coerce.number().int().default(120),
  RUN_ON_START: z.enum(["true", "false"]).default("false"),
  ADMIN_USERNAME: z.string().min(1).default("marko"),
  ADMIN_PASSWORD_HASH: optionalString(),
  ADMIN_SESSION_SECRET: z.string().min(32),
  NOTIFICATION_TO: z.string().email(),
  SMTP_HOST: optionalString(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.enum(["true", "false"]).default("false"),
  SMTP_USER: optionalString(),
  SMTP_PASSWORD: optionalString(),
  SMTP_FROM: z
    .string()
    .min(1)
    .default("PLATINUM CORE 777 <contact@platinumcore777.com>"),
  OPENAI_API_KEY: optionalString(),
  OPENAI_MODEL: optionalString(),
  FACEBOOK_PAGE_ID: optionalString(),
  FACEBOOK_PAGE_ACCESS_TOKEN: optionalString(),
  LINKEDIN_ORGANIZATION_ID: optionalString(),
  LINKEDIN_ACCESS_TOKEN: optionalString(),
  WHYDONATE_URL: optionalUrl(),
  BUYMEACOFFEE_URL: optionalUrl(),
  SEARCH_CONSOLE_PROPERTY: z
    .string()
    .min(1)
    .default("sc-domain:platinumcore777.com"),
  GOOGLE_SERVICE_ACCOUNT_JSON: optionalString(),
});

const searchConsoleEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NOTIFICATION_TO: z.string().email(),
  SMTP_HOST: optionalString(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.enum(["true", "false"]).default("false"),
  SMTP_USER: optionalString(),
  SMTP_PASSWORD: optionalString(),
  SMTP_FROM: z
    .string()
    .min(1)
    .default("PLATINUM CORE 777 <contact@platinumcore777.com>"),
  SEARCH_CONSOLE_PROPERTY: z
    .string()
    .min(1)
    .default("sc-domain:platinumcore777.com"),
  GOOGLE_SERVICE_ACCOUNT_JSON: optionalString(),
});


const identityMonitorEnvSchema = z.object({
  NOTIFICATION_TO: z.string().email(),
  SMTP_HOST: optionalString(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.enum(["true", "false"]).default("false"),
  SMTP_USER: optionalString(),
  SMTP_PASSWORD: optionalString(),
  SMTP_FROM: z
    .string()
    .min(1)
    .default("PLATINUM CORE 777 <contact@platinumcore777.com>"),
  BRAVE_SEARCH_API_KEY: optionalString(),
  OFFICIAL_SOURCE_URLS: z
    .string()
    .default([
      "https://platinumcore777.com/",
      "https://github.com/platinumcarwash30-del/PLATINUM-CORE-777",
    ].join(",")),
  IDENTITY_MONITOR_STATE_PATH: z
    .string()
    .min(1)
    .default("./identity-monitor-state.json"),
});

export function loadConfig(env: NodeJS.ProcessEnv): AppConfig {
  const rawInterval = env.RUN_INTERVAL_MINUTES;

  if (rawInterval !== undefined && Number(rawInterval) < 120) {
    throw new Error("RUN_INTERVAL_MINUTES must be at least 120");
  }

  const parsed = envSchema.parse(env);

  return {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    databasePath: parsed.DATABASE_PATH,
    siteSitemapUrl: parsed.SITE_SITEMAP_URL,
    runIntervalMinutes: parsed.RUN_INTERVAL_MINUTES,
    runOnStart: parsed.RUN_ON_START === "true",
    adminUsername: parsed.ADMIN_USERNAME,
    adminPasswordHash: parsed.ADMIN_PASSWORD_HASH,
    adminSessionSecret: parsed.ADMIN_SESSION_SECRET,
    notificationTo: parsed.NOTIFICATION_TO,
    smtpHost: parsed.SMTP_HOST,
    smtpPort: parsed.SMTP_PORT,
    smtpSecure: parsed.SMTP_SECURE === "true",
    smtpUser: parsed.SMTP_USER,
    smtpPassword: parsed.SMTP_PASSWORD,
    smtpFrom: parsed.SMTP_FROM,
    openAiApiKey: parsed.OPENAI_API_KEY,
    openAiModel: parsed.OPENAI_MODEL,
    facebookPageId: parsed.FACEBOOK_PAGE_ID,
    facebookPageAccessToken: parsed.FACEBOOK_PAGE_ACCESS_TOKEN,
    linkedinOrganizationId: parsed.LINKEDIN_ORGANIZATION_ID,
    linkedinAccessToken: parsed.LINKEDIN_ACCESS_TOKEN,
    whyDonateUrl: parsed.WHYDONATE_URL,
    buyMeACoffeeUrl: parsed.BUYMEACOFFEE_URL,
    searchConsoleProperty: parsed.SEARCH_CONSOLE_PROPERTY,
    googleServiceAccountJson: parsed.GOOGLE_SERVICE_ACCOUNT_JSON,
  };
}

export function loadSearchConsoleConfig(
  env: NodeJS.ProcessEnv,
): SearchConsoleConfig {
  const parsed = searchConsoleEnvSchema.parse(env);

  return {
    nodeEnv: parsed.NODE_ENV,
    notificationTo: parsed.NOTIFICATION_TO,
    smtpHost: parsed.SMTP_HOST,
    smtpPort: parsed.SMTP_PORT,
    smtpSecure: parsed.SMTP_SECURE === "true",
    smtpUser: parsed.SMTP_USER,
    smtpPassword: parsed.SMTP_PASSWORD,
    smtpFrom: parsed.SMTP_FROM,
    searchConsoleProperty: parsed.SEARCH_CONSOLE_PROPERTY,
    googleServiceAccountJson: parsed.GOOGLE_SERVICE_ACCOUNT_JSON,
  };
}

export function loadIdentityMonitorConfig(
  env: NodeJS.ProcessEnv,
): IdentityMonitorConfig {
  const parsed = identityMonitorEnvSchema.parse(env);

  return {
    notificationTo: parsed.NOTIFICATION_TO,
    smtpHost: parsed.SMTP_HOST,
    smtpPort: parsed.SMTP_PORT,
    smtpSecure: parsed.SMTP_SECURE === "true",
    smtpUser: parsed.SMTP_USER,
    smtpPassword: parsed.SMTP_PASSWORD,
    smtpFrom: parsed.SMTP_FROM,
    braveSearchApiKey: parsed.BRAVE_SEARCH_API_KEY,
    officialSourceUrls: parsed.OFFICIAL_SOURCE_URLS
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
    statePath: parsed.IDENTITY_MONITOR_STATE_PATH,
  };
}

