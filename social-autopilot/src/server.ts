import { readFileSync } from "node:fs";
import { join } from "node:path";
import cookie from "@fastify/cookie";
import formbody from "@fastify/formbody";
import Fastify, { type FastifyInstance, type FastifyReply, type FastifyRequest } from "fastify";
import type { AppConfig } from "./config";
import { createAuthManager, type AuthManager } from "./auth";
import type { AnalyticsMonitorReport } from "./analytics-monitor";
import type { DatabaseStore } from "./db";
import type { RunSummary } from "./types";

export interface ServerDependencies {
  config: Pick<AppConfig, "adminUsername" | "adminPasswordHash" | "adminSessionSecret">;
  db: Pick<DatabaseStore, "listRuns" | "setStopped">;
  runNow?: () => Promise<RunSummary>;
  analyticsMonitor?: () => Promise<AnalyticsMonitorReport>;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

function sessionFrom(request: FastifyRequest, auth: AuthManager) {
  const signed = request.unsignCookie(request.cookies.session ?? "");
  return signed.valid && signed.value ? auth.getSession(signed.value) : undefined;
}

function unauthorized(reply: FastifyReply): void {
  reply.code(302).header("location", "/login").send();
}

function csrfBody(request: FastifyRequest): string {
  const body = (request.body ?? {}) as { csrf?: string };
  return body.csrf ?? "";
}

function loginPage(message = ""): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Autopilot login</title></head><body><main><h1>PLATINUM CORE 777 Autopilot</h1>${message ? `<p>${escapeHtml(message)}</p>` : ""}<form method="post" action="/login"><label>Username <input name="username" autocomplete="username"></label><label>Password <input name="password" type="password" autocomplete="current-password"></label><button type="submit">Log in</button></form></main></body></html>`;
}

function renderRuns(runs: ReturnType<DatabaseStore["listRuns"]>): string {
  if (!runs.length) return "<p>No runs yet.</p>";
  return `<ul>${runs.map((run) => `<li><strong>${escapeHtml(run.status)}</strong> — ${escapeHtml(run.startedAt)} — pages: ${run.pagesSeen}, campaigns: ${run.campaignsCreated}<pre>${escapeHtml(JSON.stringify(run.results, null, 2))}</pre><h3>Copy manually to WhyDonate / Buy Me a Coffee</h3>${run.manualPosts.map((post) => `<article><p><strong>${escapeHtml(post.platform)}</strong> — ${escapeHtml(post.targetUrl ?? "URL not configured")}</p><textarea rows="8" cols="80" readonly>${escapeHtml(post.text)}</textarea></article>`).join("")}${run.errors.length ? `<p>${escapeHtml(run.errors.join("; "))}</p>` : ""}</li>`).join("")}</ul>`;
}

function publicAnalyticsMonitorReport(report: AnalyticsMonitorReport): object {
  const source = <T extends object>(value: { status: "ok" | "error"; data?: T; error?: string }) => value.status === "ok"
    ? { status: "ok", data: value.data }
    : { status: "error", error: value.error ?? "Analytics source failed" };

  return {
    startDate: report.startDate,
    endDate: report.endDate,
    checkedAt: report.checkedAt,
    searchConsole: source(report.searchConsole.data
      ? { status: report.searchConsole.status, data: {
        property: report.searchConsole.data.property,
        startDate: report.searchConsole.data.startDate,
        endDate: report.searchConsole.data.endDate,
        checkedAt: report.searchConsole.data.checkedAt,
        rows: report.searchConsole.data.rows.map((row) => ({
          query: row.query,
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: row.position,
        })),
      }, error: report.searchConsole.error } : report.searchConsole),
    analytics: source(report.analytics.data
      ? { status: report.analytics.status, data: {
        propertyId: report.analytics.data.propertyId,
        startDate: report.analytics.data.startDate,
        endDate: report.analytics.data.endDate,
        checkedAt: report.analytics.data.checkedAt,
        summary: { ...report.analytics.data.summary },
        topPages: report.analytics.data.topPages.map((page) => ({ ...page })),
      }, error: report.analytics.error } : report.analytics),
  };
}

export async function buildServer(deps: ServerDependencies): Promise<FastifyInstance> {
  const sessionSecret = deps.config.adminSessionSecret;
  if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error("ADMIN_SESSION_SECRET must be configured with at least 32 characters");
  }
  const app = Fastify({ logger: false });
  const auth = createAuthManager({ adminUsername: deps.config.adminUsername ?? "marko", adminPasswordHash: deps.config.adminPasswordHash });
  await app.register(cookie, { secret: sessionSecret });
  await app.register(formbody);

  app.get("/health", async () => ({ ok: true }));

  app.get("/analytics-monitor.css", async (_request, reply) => {
    const css = readFileSync(join(__dirname, "views", "analytics-monitor.css"), "utf8");
    return reply.type("text/css").send(css);
  });

  app.get("/analytics-monitor.js", async (_request, reply) => {
    const javascript = readFileSync(join(__dirname, "views", "analytics-monitor.js"), "utf8");
    return reply.type("application/javascript").send(javascript);
  });

  app.get("/manifest.webmanifest", async (_request, reply) => {
    const manifest = readFileSync(join(__dirname, "views", "manifest.webmanifest"), "utf8");
    return reply.type("application/manifest+json").send(manifest);
  });

  app.get("/login", async (_request, reply) => reply.type("text/html").send(loginPage()));

  app.post("/login", async (request, reply) => {
    const body = (request.body ?? {}) as { username?: string; password?: string };
    if (!auth.authenticate(body.username ?? "", body.password ?? "")) return reply.code(401).type("text/html").send(loginPage("Invalid login."));
    const session = auth.createSession();
    return reply.setCookie("session", session.id, { signed: true, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" }).redirect("/dashboard");
  });

  app.get("/dashboard", async (request, reply) => {
    const session = sessionFrom(request, auth);
    if (!session) return unauthorized(reply);
    const template = readFileSync(join(__dirname, "views", "dashboard.html"), "utf8");
    const html = template.replace("{{csrf}}", escapeHtml(session.csrfToken)).replace("{{runs}}", renderRuns(deps.db.listRuns(25)));
    return reply.type("text/html").send(html);
  });

  app.get("/analytics-monitor", async (request, reply) => {
    const session = sessionFrom(request, auth);
    if (!session) return unauthorized(reply);
    const html = readFileSync(join(__dirname, "views", "analytics-monitor.html"), "utf8");
    return reply.type("text/html").send(html);
  });

  app.get("/api/analytics-monitor", async (request, reply) => {
    const session = sessionFrom(request, auth);
    if (!session) return unauthorized(reply);
    if (!deps.analyticsMonitor) return reply.code(503).send({ error: "Analytics monitor is not configured" });
    const report = await deps.analyticsMonitor();
    return reply.send(publicAnalyticsMonitorReport(report));
  });

  app.post("/logout", async (request, reply) => {
    const session = sessionFrom(request, auth);
    if (!session || !auth.checkCsrf(session, csrfBody(request))) return reply.code(403).send({ error: "Invalid session or CSRF token" });
    auth.destroySession(session.id);
    return reply.clearCookie("session", { path: "/" }).redirect("/login");
  });

  app.post("/run-now", async (request, reply) => {
    const session = sessionFrom(request, auth);
    if (!session || !auth.checkCsrf(session, csrfBody(request))) return reply.code(403).send({ error: "Invalid session or CSRF token" });
    if (!deps.runNow) return reply.code(503).send({ error: "Runner is not configured" });
    await deps.runNow();
    return reply.redirect("/dashboard");
  });

  app.post("/stop-autopilot", async (request, reply) => {
    const session = sessionFrom(request, auth);
    if (!session || !auth.checkCsrf(session, csrfBody(request))) return reply.code(403).send({ error: "Invalid session or CSRF token" });
    deps.db.setStopped(true);
    return reply.redirect("/dashboard");
  });

  return app;
}
