import { describe, expect, it } from "vitest";
import { createAuthManager, hashPassword } from "../src/auth";

describe("first-run admin password", () => {
  it("starts unconfigured and accepts a password after setup", () => {
    const auth = createAuthManager({
      adminUsername: "marko",
      sessionTtlMs: 60_000,
    });

    expect(auth.hasPassword()).toBe(false);
    expect(auth.authenticate("marko", "anything")).toBe(false);

    auth.setPasswordHash(hashPassword("test-password-123"));

    expect(auth.hasPassword()).toBe(true);
    expect(auth.authenticate("marko", "test-password-123")).toBe(true);
    expect(auth.authenticate("marko", "wrong-password")).toBe(false);
  });
});
