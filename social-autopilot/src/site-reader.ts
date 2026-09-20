import { createHash } from "node:crypto";
import { DOMParser } from "@xmldom/xmldom";
import * as cheerio from "cheerio";
import type { PageMetadata } from "./types";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const SITE_ORIGIN = "https://platinumcore777.com";

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function ensureOk(response: Response, resource: string): void {
  if (!response.ok) {
    throw new Error(`Failed to fetch ${resource}: HTTP ${response.status}`);
  }
}

function assertSiteUrl(value: string, label: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${label} is not a valid URL`);
  }

  if (url.protocol !== "https:" || url.origin !== SITE_ORIGIN) {
    throw new Error(`${label} must be an HTTPS URL on platinumcore777.com`);
  }
  return url;
}

function parseSitemap(xml: string): string[] {
  const document = new DOMParser().parseFromString(xml, "application/xml");
  const root = document.documentElement;
  if (!root || root.localName !== "urlset") {
    throw new Error("Sitemap is not valid XML");
  }

  const urls: string[] = [];
  for (let index = 0; index < root.childNodes.length; index += 1) {
    const node = root.childNodes.item(index);
    if (node.nodeType !== 1 || (node as Element).localName !== "url") continue;
    for (let childIndex = 0; childIndex < node.childNodes.length; childIndex += 1) {
      const child = node.childNodes.item(childIndex);
      if (child.nodeType === 1 && (child as Element).localName === "loc") {
        const value = normalizeText(child.textContent ?? "");
        if (value) urls.push(value);
      }
    }
  }

  if (urls.length === 0) {
    throw new Error("Sitemap contains no URLs");
  }
  return urls;
}

async function readPage(fetchImpl: FetchLike, url: string): Promise<PageMetadata> {
  const response = await fetchImpl(url, { headers: { accept: "text/html" } });
  ensureOk(response, url);
  const html = await response.text();
  const $ = cheerio.load(html);
  $("script, style, nav, footer, header, noscript").remove();

  const canonical = normalizeText($("link[rel='canonical']").attr("href") ?? url);
  const canonicalUrl = assertSiteUrl(canonical, "Canonical URL");
  if (canonicalUrl.href !== new URL(url).href) {
    throw new Error(`Canonical URL does not match sitemap URL: ${url}`);
  }

  const title = normalizeText($("title").first().text()) || canonicalUrl.pathname;
  const description = normalizeText($("meta[name='description']").attr("content") ?? "");
  const main = $("main").first();
  const text = normalizeText((main.length > 0 ? main : $("body")).text());
  if (!text) throw new Error(`Page has no readable content: ${url}`);

  return {
    url: canonicalUrl.href,
    title,
    description,
    text,
    contentHash: hashPageContent(title, description, text),
  };
}

export function hashPageContent(title: string, description: string, text: string): string {
  const normalized = [title, description, text].map(normalizeText).join("\n");
  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

export async function readSitePages(
  fetchImpl: FetchLike,
  sitemapUrl: string,
): Promise<PageMetadata[]> {
  const sitemapResponse = await fetchImpl(sitemapUrl, { headers: { accept: "application/xml, text/xml" } });
  ensureOk(sitemapResponse, sitemapUrl);
  const urls = parseSitemap(await sitemapResponse.text());
  const pages: PageMetadata[] = [];

  for (const url of urls) {
    const siteUrl = assertSiteUrl(url, "Sitemap URL");
    pages.push(await readPage(fetchImpl, siteUrl.href));
  }

  return pages;
}
