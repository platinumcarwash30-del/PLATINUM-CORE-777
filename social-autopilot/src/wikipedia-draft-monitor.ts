import { createHash } from "node:crypto";
import type { PageMetadata } from "./types";

export const WIKIPEDIA_DRAFT_DAY_COUNT = 15;
const OFFICIAL_SITE_ORIGIN = "https://platinumcore777.com";
const MAX_SENTENCES_PER_SECTION = 3;
const MIN_SENTENCE_LENGTH = 30;
const MAX_SENTENCE_LENGTH = 360;
const PROMOTIONAL_PATTERN = /\b(click|buy|donate|contact us|book now|best|leading|revolutionary|ultimate|premium)\b/i;

export interface WikipediaSectionPlan {
  day: number;
  heading: string;
  keywords: readonly string[];
}

export interface WikipediaDraftSection {
  day: number;
  heading: string;
  status: "generated" | "skipped";
  text: string;
  sourceUrls: string[];
  sourceHashes: string[];
  generatedAt: string;
}

export interface WikipediaDraftState {
  currentDay: number;
  sourceHashes: Record<string, string>;
  sections: WikipediaDraftSection[];
  lastSuccessfulRun?: string;
}

export const WIKIPEDIA_SECTION_PLAN: readonly WikipediaSectionPlan[] = [
  { day: 1, heading: "Author and project responsibility", keywords: ["marko", "ćuka", "cuca", "author", "founder", "authored"] },
  { day: 2, heading: "Project origin and initial purpose", keywords: ["origin", "purpose", "created", "creation", "project"] },
  { day: 3, heading: "Early development story", keywords: ["development", "developed", "early", "started", "built"] },
  { day: 4, heading: "Core project concept", keywords: ["concept", "core", "system", "software", "technology"] },
  { day: 5, heading: "Main software system overview", keywords: ["software", "application", "desktop", "system", "platform"] },
  { day: 6, heading: "Document and business-software functions", keywords: ["document", "business", "license", "archive", "software"] },
  { day: 7, heading: "Core Review overview", keywords: ["core review", "review", "verified", "visit", "rating"] },
  { day: 8, heading: "License and client model", keywords: ["license", "client", "company", "business model"] },
  { day: 9, heading: "Public review and verification model", keywords: ["review", "verification", "verified", "public", "visit"] },
  { day: 10, heading: "Security and data-handling claims", keywords: ["security", "secure", "data", "privacy", "protection"] },
  { day: 11, heading: "Development milestones", keywords: ["milestone", "version", "update", "release", "phase"] },
  { day: 12, heading: "Test phase and public availability", keywords: ["test", "testing", "public", "available", "phase"] },
  { day: 13, heading: "Official project and company relationships", keywords: ["company", "platinum car wash", "platinum luxury spa", "relationship"] },
  { day: 14, heading: "Current status and limitations", keywords: ["current", "status", "available", "limitation", "planned"] },
  { day: 15, heading: "Consolidation and independent-review status", keywords: ["source", "official", "independent", "review", "pending"] },
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeSentence(value: string): string {
  return normalizeWhitespace(value).toLocaleLowerCase("en-US");
}

function splitSentences(value: string): string[] {
  return value
    .split(/(?<=[.!?])\s+|[\r\n]+/u)
    .map(normalizeWhitespace)
    .filter(Boolean);
}

function pageText(page: PageMetadata): string {
  return [page.title, page.description, page.text].filter(Boolean).join(". ");
}

function matchesPlan(sentence: string, plan: WikipediaSectionPlan): boolean {
  const lower = sentence.toLocaleLowerCase("en-US");
  return plan.keywords.some((keyword) => lower.includes(keyword.toLocaleLowerCase("en-US")));
}

function isEligibleSentence(sentence: string, plan: WikipediaSectionPlan): boolean {
  return sentence.length >= MIN_SENTENCE_LENGTH
    && sentence.length <= MAX_SENTENCE_LENGTH
    && matchesPlan(sentence, plan)
    && !PROMOTIONAL_PATTERN.test(sentence);
}

function sectionPlanForDay(day: number): WikipediaSectionPlan {
  return WIKIPEDIA_SECTION_PLAN.find((plan) => plan.day === day) ?? WIKIPEDIA_SECTION_PLAN[0]!;
}

export function isAllowedWikipediaSourceUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && url.origin === OFFICIAL_SITE_ORIGIN
      && !url.username
      && !url.password
      && !url.search
      && !url.hash;
  } catch {
    return false;
  }
}

export function hashWikipediaSource(page: PageMetadata): string {
  return createHash("sha256")
    .update([page.url, page.title, page.description, page.text, page.contentHash].join("\n"), "utf8")
    .digest("hex");
}

export function createInitialWikipediaDraftState(): WikipediaDraftState {
  return {
    currentDay: 1,
    sourceHashes: {},
    sections: [],
  };
}

function normalizeSection(value: unknown): WikipediaDraftSection | undefined {
  if (!isPlainObject(value)) return undefined;
  const day = value.day;
  const heading = value.heading;
  const status = value.status;
  const text = value.text;
  const sourceUrls = value.sourceUrls;
  const sourceHashes = value.sourceHashes;
  const generatedAt = value.generatedAt;
  if (typeof day !== "number" || !Number.isInteger(day) || day < 1 || day > WIKIPEDIA_DRAFT_DAY_COUNT) return undefined;
  if (typeof heading !== "string" || !heading.trim()) return undefined;
  if (status !== "generated" && status !== "skipped") return undefined;
  if (typeof text !== "string") return undefined;
  if (!Array.isArray(sourceUrls) || !sourceUrls.every((url) => typeof url === "string" && isAllowedWikipediaSourceUrl(url))) return undefined;
  if (!Array.isArray(sourceHashes) || !sourceHashes.every((hash) => typeof hash === "string" && /^[a-f0-9]{64}$/u.test(hash))) return undefined;
  if (!isIsoDate(generatedAt)) return undefined;
  return {
    day,
    heading: heading.trim(),
    status,
    text: text.trim(),
    sourceUrls: [...new Set(sourceUrls)],
    sourceHashes: [...sourceHashes],
    generatedAt,
  };
}

export function normalizeWikipediaDraftState(value: unknown): WikipediaDraftState {
  if (!isPlainObject(value)) return createInitialWikipediaDraftState();

  const currentDay = typeof value.currentDay === "number" && Number.isFinite(value.currentDay)
    ? Math.min(WIKIPEDIA_DRAFT_DAY_COUNT, Math.max(1, Math.trunc(value.currentDay)))
    : 1;
  const rawSourceHashes = isPlainObject(value.sourceHashes) ? value.sourceHashes : {};
  const sourceHashes: Record<string, string> = {};
  for (const [url, hash] of Object.entries(rawSourceHashes)) {
    if (isAllowedWikipediaSourceUrl(url) && typeof hash === "string" && /^[a-f0-9]{64}$/u.test(hash)) {
      sourceHashes[url] = hash;
    }
  }

  const sections: WikipediaDraftSection[] = [];
  const seenDays = new Set<number>();
  if (Array.isArray(value.sections)) {
    for (const candidate of value.sections) {
      const section = normalizeSection(candidate);
      if (!section || seenDays.has(section.day)) continue;
      seenDays.add(section.day);
      sections.push(section);
    }
  }

  const lastSuccessfulRun = isIsoDate(value.lastSuccessfulRun) ? value.lastSuccessfulRun : undefined;
  return {
    currentDay,
    sourceHashes,
    sections: sections.sort((left, right) => left.day - right.day),
    ...(lastSuccessfulRun ? { lastSuccessfulRun } : {}),
  };
}

export function selectWikipediaDraftDay(state: WikipediaDraftState): number {
  const completed = new Set(state.sections.map((section) => section.day));
  if (!completed.has(state.currentDay)) return state.currentDay;
  for (let day = state.currentDay; day <= WIKIPEDIA_DRAFT_DAY_COUNT; day += 1) {
    if (!completed.has(day)) return day;
  }
  return WIKIPEDIA_DRAFT_DAY_COUNT;
}

export function advanceWikipediaDraftDay(
  state: WikipediaDraftState,
  completedDay: number,
  completedAt: string,
): WikipediaDraftState {
  const nextDay = Math.min(WIKIPEDIA_DRAFT_DAY_COUNT, Math.max(1, completedDay + 1));
  return {
    ...state,
    currentDay: Math.max(state.currentDay, nextDay),
    lastSuccessfulRun: completedAt,
  };
}

export function buildWikipediaSection(
  plan: WikipediaSectionPlan,
  pages: readonly PageMetadata[],
  usedSentences: ReadonlySet<string>,
  generatedAt: string,
): WikipediaDraftSection {
  const inspectedPages = pages.filter((page) => isAllowedWikipediaSourceUrl(page.url));
  const selected: Array<{ sentence: string; page: PageMetadata }> = [];
  const selectedKeys = new Set<string>();

  for (const sourcePage of inspectedPages) {
    for (const sentence of splitSentences(pageText(sourcePage))) {
      const key = normalizeSentence(sentence);
      if (!isEligibleSentence(sentence, plan) || usedSentences.has(key) || selectedKeys.has(key)) continue;
      selected.push({ sentence, page: sourcePage });
      selectedKeys.add(key);
      if (selected.length >= MAX_SENTENCES_PER_SECTION) break;
    }
    if (selected.length >= MAX_SENTENCES_PER_SECTION) break;
  }

  const sourcePages = selected.length > 0
    ? [...new Map(selected.map(({ page: sourcePage }) => [sourcePage.url, sourcePage])).values()]
    : inspectedPages;
  const status = selected.length > 0 ? "generated" : "skipped";
  return {
    day: plan.day,
    heading: plan.heading,
    status,
    text: selected.map(({ sentence }) => sentence).join(" "),
    sourceUrls: sourcePages.map((sourcePage) => sourcePage.url),
    sourceHashes: sourcePages.map(hashWikipediaSource),
    generatedAt,
  };
}

export function renderWikipediaDraft(state: WikipediaDraftState, siteUrl: string): string {
  const sections = [...state.sections].sort((left, right) => left.day - right.day);
  const body = WIKIPEDIA_SECTION_PLAN.map((plan) => {
    const section = sections.find((candidate) => candidate.day === plan.day);
    const text = section?.status === "generated"
      ? section.text
      : "No eligible source passage was available on the official site for this section.";
    return [`## Day ${plan.day} — ${plan.heading}`, "", text, ""].join("\n");
  }).join("\n");

  return [
    "<!-- PENDING WIKIPEDIA REVIEW: do not publish automatically -->",
    "# PLATINUM CORE 777 (Wikipedia draft)",
    "",
    `Official source: ${siteUrl}`,
    "",
    "This is a working draft based only on statements published on the official site. It requires independent sources, neutrality review, and Wikipedia review before any publication decision.",
    "",
    body.trim(),
    "",
    "## Review status",
    "",
    "Pending Wikipedia review; no Wikipedia API or automatic publication was used.",
    "",
  ].join("\n");
}

export function renderWikipediaSources(state: WikipediaDraftState, extractionDate: string): string {
  const sources = new Map<string, string>();
  for (const section of state.sections) {
    section.sourceUrls.forEach((url, index) => {
      const hash = section.sourceHashes[index];
      if (hash) sources.set(url, hash);
    });
  }

  const lines = [...sources.entries()].sort(([left], [right]) => left.localeCompare(right))
    .map(([url, hash]) => `- ${url} — extracted ${extractionDate} — hash ${hash}`);
  return [
    "# PLATINUM CORE 777 Wikipedia draft sources",
    "",
    `Extraction date: ${extractionDate}`,
    "",
    ...(lines.length > 0 ? lines : ["- No eligible source pages were used."]),
    "",
  ].join("\n");
}

export function getWikipediaSectionPlan(day: number): WikipediaSectionPlan {
  return sectionPlanForDay(day);
}
