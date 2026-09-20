import { describe, expect, it, vi } from "vitest";
import { hashPageContent, readSitePages } from "../src/site-reader";

describe("site reader", () => {
  it("reads sitemap URLs and extracts canonical page metadata", async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(
        `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://platinumcore777.com/business-license-website-app.html</loc></url></urlset>`,
        { status: 200 },
      ))
      .mockResolvedValueOnce(new Response(
        `<html><head><title>Business License Website and Custom App</title><meta name="description" content="A clear page description"><link rel="canonical" href="https://platinumcore777.com/business-license-website-app.html"></head><body><main>Custom software for real business needs.</main></body></html>`,
        { status: 200 },
      ));

    const pages = await readSitePages(fetchImpl, "https://platinumcore777.com/sitemap.xml");

    expect(pages).toHaveLength(1);
    expect(pages[0]).toMatchObject({
      url: "https://platinumcore777.com/business-license-website-app.html",
      title: "Business License Website and Custom App",
      description: "A clear page description",
      text: "Custom software for real business needs.",
    });
  });

  it("fails clearly when the sitemap is not XML", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("<html>not a sitemap</html>", { status: 200 }));
    await expect(readSitePages(fetchImpl, "https://example.com/sitemap.xml"))
      .rejects.toThrow("Sitemap is not valid XML");
  });

  it("changes the hash when page text changes", () => {
    expect(hashPageContent("Title", "Description", "A"))
      .not.toBe(hashPageContent("Title", "Description", "B"));
  });
});
