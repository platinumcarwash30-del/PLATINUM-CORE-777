import { describe, expect, it } from "vitest";
import { buildServer } from "../src/server";

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
});
