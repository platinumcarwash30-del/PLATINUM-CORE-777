import { generateKeyPairSync, createVerify } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createServiceAccountAssertion, requestGoogleAccessToken, type GoogleServiceAccount } from "../src/search-console-auth";

function serviceAccount(): { account: GoogleServiceAccount; publicKey: string } {
  const keys = generateKeyPairSync("rsa", { modulusLength: 2048 });
  return {
    account: {
      client_email: "search-console@example.iam.gserviceaccount.com",
      private_key: keys.privateKey.export({ format: "pem", type: "pkcs8" }).toString(),
    },
    publicKey: keys.publicKey.export({ format: "pem", type: "spki" }).toString(),
  };
}

describe("Google Search Console authentication", () => {
  it("creates a signed service-account assertion", () => {
    const { account, publicKey } = serviceAccount();
    const assertion = createServiceAccountAssertion(account, 1_700_000_000);
    const [encodedHeader, encodedPayload, encodedSignature] = assertion.split(".");
    const verify = createVerify("RSA-SHA256");
    verify.update(`${encodedHeader}.${encodedPayload}`);
    verify.end();

    expect(verify.verify(publicKey, Buffer.from(encodedSignature, "base64url"))).toBe(true);
    expect(JSON.parse(Buffer.from(encodedPayload, "base64url").toString())).toMatchObject({
      iss: account.client_email,
      scope: "https://www.googleapis.com/auth/webmasters.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: 1_700_000_000,
      exp: 1_700_003_600,
    });
  });

  it("supports the combined read-only Search Console and Analytics scopes", () => {
    const { account } = serviceAccount();
    const assertion = createServiceAccountAssertion(account, 1_700_000_000, [
      "https://www.googleapis.com/auth/webmasters.readonly",
      "https://www.googleapis.com/auth/analytics.readonly",
    ]);
    const [, encodedPayload] = assertion.split(".");
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString()) as { scope: string };

    expect(payload.scope.split(" ")).toEqual([
      "https://www.googleapis.com/auth/webmasters.readonly",
      "https://www.googleapis.com/auth/analytics.readonly",
    ]);
  });

  it("exchanges the assertion for a bearer token", async () => {
    const { account } = serviceAccount();
    let body = "";
    const fetchImpl = async (_input: string, init?: RequestInit): Promise<Response> => {
      body = String(init?.body ?? "");
      return new Response(JSON.stringify({ access_token: "access-token" }), { status: 200 });
    };

    await expect(requestGoogleAccessToken(fetchImpl, account, 1_700_000_000)).resolves.toBe("access-token");
    expect(body).toContain("grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer");
    expect(body).toContain("assertion=");
  });
});
