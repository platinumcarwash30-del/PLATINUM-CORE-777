import { createSign } from "node:crypto";

export interface GoogleServiceAccount {
  client_email: string;
  private_key: string;
}

const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const SEARCH_CONSOLE_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

function base64Url(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

export function createServiceAccountAssertion(account: GoogleServiceAccount, issuedAtSeconds: number): string {
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    iss: account.client_email,
    scope: SEARCH_CONSOLE_SCOPE,
    aud: TOKEN_ENDPOINT,
    iat: issuedAtSeconds,
    exp: issuedAtSeconds + 3600,
  }));
  const input = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(input);
  signer.end();
  return `${input}.${signer.sign(account.private_key).toString("base64url")}`;
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export async function requestGoogleAccessToken(
  fetchImpl: FetchLike,
  account: GoogleServiceAccount,
  nowSeconds = Math.floor(Date.now() / 1000),
): Promise<string> {
  const assertion = createServiceAccountAssertion(account, nowSeconds);
  const response = await fetchImpl(TOKEN_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }).toString(),
  });
  if (!response.ok) throw new Error(`Google OAuth token request failed: HTTP ${response.status}`);
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object" || typeof (payload as { access_token?: unknown }).access_token !== "string") {
    throw new Error("Google OAuth token response did not contain an access token");
  }
  return (payload as { access_token: string }).access_token;
}

export function parseGoogleServiceAccountJson(value: string): GoogleServiceAccount {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
  }
  if (!parsed || typeof parsed !== "object") throw new Error("Google service-account JSON is invalid");
  const account = parsed as Partial<GoogleServiceAccount>;
  if (!account.client_email || !account.private_key) throw new Error("Google service-account JSON is missing client_email or private_key");
  return { client_email: account.client_email, private_key: account.private_key };
}

