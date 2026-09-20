import OpenAI from "openai";
import type { GeneratedPost, PageMetadata } from "./types";

export interface AiPostClient {
  generate(page: PageMetadata): Promise<{ text: string; hashtags: string[] }>;
}

const CORE_HASHTAGS = ["#PLATINUMCORE777", "#CoreReview", "#FromBelgradeToTheWorld"];
const OPTIONAL_HASHTAGS = [
  { tag: "#Software", terms: ["software", "application", "app"] },
  { tag: "#BusinessTechnology", terms: ["business", "technology", "digital"] },
  { tag: "#DigitalOrganization", terms: ["document", "organization", "workflow"] },
  { tag: "#Innovation", terms: ["innovation", "independent", "development"] },
  { tag: "#Belgrade", terms: ["belgrade", "beograd"] },
  { tag: "#Serbia", terms: ["serbia", "srbija"] },
];

const UNSUPPORTED_CLAIMS = [
  /\b\d[\d,]*\s+(?:users|customers|clients)\b/i,
  /(?:granted|approved)\s+patent/i,
  /patent\s+(?:has\s+been\s+)?granted/i,
  /guarantee(?:d)?\s+(?:results|success|growth)/i,
  /(?:official\s+)?sponsor(?:ed)?\s+by/i,
  /\b(?:revenue|profit|earnings)\b/i,
];

function relevantHashtags(page: PageMetadata): string[] {
  const source = `${page.title} ${page.description} ${page.text}`.toLowerCase();
  const tags = [...CORE_HASHTAGS];
  for (const candidate of OPTIONAL_HASHTAGS) {
    if (tags.length >= 6) break;
    if (candidate.terms.some((term) => source.includes(term))) tags.push(candidate.tag);
  }
  return tags;
}

function hasOnlyAllowedUrl(text: string, pageUrl: string): boolean {
  const urls = text.match(/https?:\/\/[^\s)]+/gi) ?? [];
  return urls.every((url) => url.replace(/[.,]+$/, "") === pageUrl);
}

function isSafePost(text: string, hashtags: string[], page: PageMetadata): boolean {
  if (!text.includes(page.url) || text.length > 500 || !hasOnlyAllowedUrl(text, page.url)) return false;
  if (UNSUPPORTED_CLAIMS.some((pattern) => pattern.test(text))) return false;
  if (hashtags.length === 0 || hashtags.length > 6) return false;
  if (hashtags.some((tag) => !/^#[A-Za-z0-9]+$/.test(tag))) return false;
  const allowed = new Set(relevantHashtags(page));
  return hashtags.every((tag) => allowed.has(tag)) && CORE_HASHTAGS.every((tag) => hashtags.includes(tag));
}

function fallbackPost(page: PageMetadata): GeneratedPost {
  const hashtags = relevantHashtags(page);
  const sentence = page.description || page.text.slice(0, 180);
  const text = `PLATINUM CORE 777 is exploring ${page.title.toLowerCase()} as part of an independent technology project developed from Belgrade. ${sentence} Read more: ${page.url}\n\n${hashtags.join(" ")}`.slice(0, 500);
  return { pageUrl: page.url, text, hashtags, generatedBy: "fallback" };
}

function createOpenAiClient(): AiPostClient | undefined {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return undefined;
  const client = new OpenAI({ apiKey });
  return {
    async generate(page) {
      const response = await client.responses.create({
        model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content: "Write one short factual social post for PLATINUM CORE 777. Use only supplied page facts. Never invent users, sponsors, revenue, approvals, or a granted patent. Include the supplied URL exactly once.",
          },
          { role: "user", content: JSON.stringify({ brand: "PLATINUM CORE 777 / CORE REVIEW", page }) },
        ],
        text: {
          format: {
            type: "json_schema",
            name: "social_post",
            strict: true,
            schema: {
              type: "object",
              additionalProperties: false,
              properties: { text: { type: "string" }, hashtags: { type: "array", items: { type: "string" } } },
              required: ["text", "hashtags"],
            },
          },
        },
      });
      const output = response.output_text;
      if (!output) throw new Error("AI returned no text");
      return JSON.parse(output) as { text: string; hashtags: string[] };
    },
  };
}

export async function generatePost(page: PageMetadata, aiClient?: AiPostClient): Promise<GeneratedPost> {
  const client = aiClient ?? createOpenAiClient();
  if (!client) return fallbackPost(page);

  try {
    const candidate = await client.generate(page);
    const hashtags = Array.from(new Set(candidate.hashtags));
    if (isSafePost(candidate.text, hashtags, page)) {
      const text = candidate.text.includes(hashtags.join(" "))
        ? candidate.text
        : `${candidate.text}\n\n${hashtags.join(" ")}`;
      return { pageUrl: page.url, text, hashtags, generatedBy: "ai" };
    }
  } catch {
    // A failed or unsafe AI result intentionally falls back to deterministic copy.
  }

  return fallbackPost(page);
}
