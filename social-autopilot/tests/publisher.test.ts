import { describe, expect, it, vi } from "vitest";
import { publishToConnectedPlatforms } from "../src/publisher";
import { FacebookPageAdapter } from "../src/platforms/facebook";
import { LinkedInPageAdapter } from "../src/platforms/linkedin";

describe("publisher", () => {
  it("publishes independently and preserves the successful result", async () => {
    const post = { pageUrl: "https://platinumcore777.com/a.html", text: "Post", hashtags: [], generatedBy: "fallback" as const };
    const facebook = { platform: "facebook" as const, publish: vi.fn().mockResolvedValue({ platform: "facebook", status: "failed", errorCode: "RATE_LIMIT", errorMessage: "retry" }) };
    const linkedin = { platform: "linkedin" as const, publish: vi.fn().mockResolvedValue({ platform: "linkedin", status: "published", externalUrl: "https://linkedin.example/post/1" }) };

    const results = await publishToConnectedPlatforms([facebook, linkedin], post, { delaysMs: [0, 0, 0] });
    expect(results).toHaveLength(2);
    expect(results.find((r) => r.platform === "linkedin")?.status).toBe("published");
  });

  it("retries a temporary failed adapter at most three times", async () => {
    const post = { pageUrl: "https://platinumcore777.com/a.html", text: "Post", hashtags: [], generatedBy: "fallback" as const };
    const adapter = {
      platform: "facebook" as const,
      publish: vi.fn().mockResolvedValue({ platform: "facebook", status: "failed", errorCode: "TEMPORARY", errorMessage: "down" }),
    };

    const [result] = await publishToConnectedPlatforms([adapter], post, { delaysMs: [0, 0, 0] });
    expect(adapter.publish).toHaveBeenCalledTimes(3);
    expect(result.errorCode).toBe("TEMPORARY");
  });

  it("publishes only through the configured Facebook Page endpoint", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "page_1" }), { status: 200 }));
    const adapter = new FacebookPageAdapter({ pageId: "page-1", accessToken: "secret", fetchImpl });
    const result = await adapter.publish({ pageUrl: "https://platinumcore777.com/a.html", text: "Post", hashtags: ["#PLATINUMCORE777"], generatedBy: "fallback" });
    expect(result.status).toBe("published");
    expect(fetchImpl).toHaveBeenCalledWith(expect.stringContaining("/page-1/feed"), expect.objectContaining({ method: "POST" }));
  });

  it("publishes only as the configured LinkedIn organization", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 201, headers: { "x-restli-id": "urn:li:share:1" } }));
    const adapter = new LinkedInPageAdapter({ organizationId: "123", accessToken: "secret", fetchImpl });
    const result = await adapter.publish({ pageUrl: "https://platinumcore777.com/a.html", text: "Post", hashtags: ["#PLATINUMCORE777"], generatedBy: "fallback" });
    expect(result.status).toBe("published");
    expect(fetchImpl).toHaveBeenCalledWith("https://api.linkedin.com/rest/posts", expect.objectContaining({ method: "POST" }));
    expect(String(fetchImpl.mock.calls[0]?.[1]?.body)).toContain("urn:li:organization:123");
  });
});
