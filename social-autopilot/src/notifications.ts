import nodemailer from "nodemailer";
import type { AppConfig } from "./config";
import { formatIdentityMonitorDigest, type IdentitySearchResult } from "./identity-monitor";
import { formatSearchConsoleReport, type SearchConsoleReport } from "./search-console";
import { formatSerbiaClientFinderDigest, type ScoredSerbiaLead } from "./serbia-client-finder";
import type { RunSummary } from "./types";

export interface NotificationService {
  sendRunSummary(summary: RunSummary): Promise<void>;
  sendSearchConsoleReport(report: SearchConsoleReport): Promise<void>;
  sendIdentityMonitorDigest(findings: readonly IdentitySearchResult[], officialSourceUrls: readonly string[], checkedAt: Date): Promise<void>;
  sendSerbiaClientFinderDigest(leads: readonly ScoredSerbiaLead[], checkedAt: Date): Promise<void>;
}

function renderSummary(summary: RunSummary): string {
  const results = summary.results.length === 0
    ? "No platform publications were attempted."
    : summary.results.map((result) => {
      const target = result.externalUrl ? ` — ${result.externalUrl}` : "";
      const error = result.errorMessage ? ` — ${result.errorCode}: ${result.errorMessage}` : "";
      return `${result.platform}: ${result.status}${target}${error}`;
    }).join("\n");
  const manualPosts = summary.manualPosts.length === 0
    ? "No manual donation-platform copy prepared."
    : summary.manualPosts.map((post) => [
      `\n${post.platform} — copy and paste manually`,
      `Target page: ${post.targetUrl ?? "Configure the platform URL"}`,
      post.text,
    ].join("\n")).join("\n");
  return [
    "PLATINUM CORE 777 social autopilot run",
    `Execution ID: ${summary.executionId}`,
    `Status: ${summary.status}`,
    `Started: ${summary.startedAt}`,
    `Finished: ${summary.finishedAt ?? "-"}`,
    `Next run: ${summary.nextRunAt ?? "-"}`,
    `Pages seen: ${summary.pagesSeen}`,
    `Campaigns created: ${summary.campaignsCreated}`,
    "",
    results,
    "\nManual donation-platform posts:",
    manualPosts,
    summary.errors.length ? `\nErrors:\n${summary.errors.join("\n")}` : "",
  ].join("\n");
}

export function createNotificationService(config: Pick<AppConfig, "smtpHost" | "smtpPort" | "smtpSecure" | "smtpUser" | "smtpPassword" | "smtpFrom" | "notificationTo">): NotificationService {
  const createTransporter = () => {
    if (!config.smtpHost) throw new Error("SMTP_HOST is not configured");
    return nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: config.smtpUser && config.smtpPassword ? { user: config.smtpUser, pass: config.smtpPassword } : undefined,
    });
  };

  return {
    async sendRunSummary(summary) {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: config.smtpFrom,
        to: config.notificationTo,
        subject: `[PLATINUM CORE 777] Autopilot ${summary.status} — ${summary.executionId}`,
        text: renderSummary(summary),
      });
    },
    async sendSearchConsoleReport(report) {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: config.smtpFrom,
        to: config.notificationTo,
        subject: `[PLATINUM CORE 777] Search Console ${report.startDate} to ${report.endDate}`,
        text: formatSearchConsoleReport(report),
      });
    },
    async sendIdentityMonitorDigest(findings, officialSourceUrls, checkedAt) {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: config.smtpFrom,
        to: config.notificationTo,
        subject: `[PLATINUM CORE 777] Identity monitor — ${findings.length} new result${findings.length === 1 ? "" : "s"}`,
        text: formatIdentityMonitorDigest(findings, officialSourceUrls, checkedAt),
      });
    },
    async sendSerbiaClientFinderDigest(leads, checkedAt) {
      const transporter = createTransporter();
      await transporter.sendMail({
        from: config.smtpFrom,
        to: config.notificationTo,
        subject: `[PLATINUM CORE 777] Serbia client finder — ${leads.length} new lead${leads.length === 1 ? "" : "s"}`,
        text: formatSerbiaClientFinderDigest(leads, checkedAt),
      });
    },
  };
}
