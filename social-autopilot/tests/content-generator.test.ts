import { describe, expect, it, vi } from "vitest";
import { generatePost } from "../src/content-generator";

const page = {
  url: "https://platinumcore777.com/business-license-website-app.html",
  title: "Business License Website and Custom App",
  description: "A digital system built around real business needs.",
  text: "A website and application can support connected services and business workflows.",
  contentHash: "hash",
};

describe("content generator", () => {
  it("always includes the canonical URL and core hashtags", async () => {
    const post = await generatePost(page);
    expect(post.pageUrl).toBe(page.url);
    expect(post.text).toContain(page.url);
    expect(post.hashtags).toEqual(expect.arrayContaining([
      "#PLATINUMCORE777", "#CoreReview", "#FromBelgradeToTheWorld",
    ]));
    expect(post.generatedBy).toBe("fallback");
  });

  it("rejects unsupported claims from the AI output and uses fallback", async () => {
    const aiClient = { generate: vi.fn().mockResolvedValue({
      text: "PLATINUM CORE 777 has 10,000 users and a granted patent. https://platinumcore777.com/business-license-website-app.html",
      hashtags: ["#PLATINUMCORE777", "#crypto"],
    }) };
    const post = await generatePost(page, aiClient);
    expect(post.generatedBy).toBe("fallback");
    expect(post.text).not.toContain("10,000 users");
    expect(post.hashtags).not.toContain("#crypto");
  });
});
