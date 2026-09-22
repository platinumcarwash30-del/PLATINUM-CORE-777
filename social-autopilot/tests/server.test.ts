import { describe, expect, it } from "vitest";
import { hashPassword } from "../src/auth";
import { buildServer } from "../src/server";

function analyticsReport() {
  return {
    startDate: "2026-09-17",
    endDate: "2026-09-19",
    checkedAt: "2026-09-20T20:00:00.000Z",
    searchConsole: {
      status: "ok" as const,
      data: {
        property: "sc-domain:platinumcore777.com",
        startDate: "2026-09-17",
        endDate: "2026-09-19",
        checkedAt: "2026-09-20T20:00:00.000Z",
        rows: [{ query: "Core Review", clicks: 1, impressions: 4, ctr: 0.25, position: 8 }],
      },
    },
    analytics: {
      status: "ok" as const,
      data: {
        propertyId: "554126635",
        startDate: "2026-09-17",
        endDate: "2026-09-19",
        checkedAt: "2026-09-20T20:00:00.000Z",
        summary: { activeUsers: 16, sessions: 20, screenPageViews: 31 },
        topPages: [{ pagePath: "/", activeUsers: 16, sessions: 20, screenPageViews: 31 }],
      },
    },
  };
}

describe("private dashboard", () => {
  it("does not expose run history without a session", async () => {
    const app = await buildServer({
      config: { adminUsername: "marko", adminPasswordHash: "secret", adminSessionSecret: "test-session-secret-123456789012345678901234567890" } as never,
      db: { listRuns: () => [{ id: "private-run", status: "success" }] } as never,
    });
    const response = await app.inject({ method: "GET", url: "/dashboard" });
    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe("/login");
    expect(response.body).not.toContain("private-run");
  });

  it("reports a healthy process without exposing secrets", async () => {
    const app = await buildServer({ config: { adminSessionSecret: "test-session-secret-123456789012345678901234567890" } as never, db: {} as never });
    const response = await app.inject({ method: "GET", url: "/health" });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });
  });

  it("protects the analytics panel and does not call its provider for anonymous requests", async () => {
    let calls = 0;
    const app = await buildServer({
      config: {
        adminUsername: "marko",
        adminPasswordHash: hashPassword("panel-password"),
        adminSessionSecret: "test-session-secret-123456789012345678901234567890",
      } as never,
      db: {} as never,
      analyticsMonitor: async () => {
        calls += 1;
        return analyticsReport();
      },
    });

    const anonymousPage = await app.inject({ method: "GET", url: "/analytics-monitor" });
    const anonymousApi = await app.inject({ method: "GET", url: "/api/analytics-monitor" });
    expect(anonymousPage.statusCode).toBe(302);
    expect(anonymousPage.headers.location).toBe("/login");
    expect(anonymousApi.statusCode).toBe(302);
    expect(calls).toBe(0);
  });

  it("returns sanitized combined report data for an authenticated panel request", async () => {
    const app = await buildServer({
      config: {
        adminUsername: "marko",
        adminPasswordHash: hashPassword("panel-password"),
        adminSessionSecret: "test-session-secret-123456789012345678901234567890",
      } as never,
      db: {} as never,
      analyticsMonitor: async () => ({
        ...analyticsReport(),
        private_key: "must-not-leak",
        access_token: "must-not-leak",
        client_email: "must-not-leak@example.com",
      } as never),
    });

    const login = await app.inject({
      method: "POST",
      url: "/login",
      payload: "username=marko&password=panel-password",
      headers: { "content-type": "application/x-www-form-urlencoded" },
    });
    const setCookie = login.headers["set-cookie"];
    const cookie = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    expect(login.statusCode).toBe(302);
    expect(cookie).toBeTruthy();

    const page = await app.inject({
      method: "GET",
      url: "/analytics-monitor",
      headers: { cookie: String(cookie).split(";")[0] },
    });
    const api = await app.inject({
      method: "GET",
      url: "/api/analytics-monitor",
      headers: { cookie: String(cookie).split(";")[0] },
    });

    expect(page.statusCode).toBe(200);
    expect(page.body).toContain("PLATINUM CORE 777 Analytics Monitor");
    expect(page.body).toContain('data-view="overview"');
    expect(page.body).toContain('data-view="search-console"');
    expect(page.body).toContain('data-view="analytics"');
    expect(page.body).toContain('data-view="queries"');
    expect(page.body).toContain('data-view="pages"');
    expect(page.body).toContain('data-view="schedule"');
    expect(api.statusCode).toBe(200);
    expect(api.body).toContain("Core Review");
    expect(api.body).not.toContain("must-not-leak");
    expect(api.body).not.toContain("private_key");
    expect(api.body).not.toContain("access_token");
    expect(api.body).not.toContain("client_email");
  });
});
