import { describe, expect, it } from "vitest";
import {
  WIKIPEDIA_SECTION_PLAN,
  buildWikipediaSection,
  createInitialWikipediaDraftState,
  hashWikipediaSource,
  isAllowedWikipediaSourceUrl,
  normalizeWikipediaDraftState,
  renderWikipediaDraft,
  renderWikipediaSources,
  advanceWikipediaDraftDay,
  selectWikipediaDraftDay,
  type WikipediaDraftState,
} from "../src/wikipedia-draft-monitor";

const page = (overrides: Partial<{
  url: string;
  title: string;
  description: string;
  text: string;
  contentHash: string;
}> = {}) => ({
  url: "https://platinumcore777.com/core-review.html",
  title: "Core Review",
  description: "A software project description.",
  text: "PLATINUM CORE 777 is a software project that provides document tools. Core Review presents information about verified business visits.",
  contentHash: "hash-1",
  ...overrides,
});

describe("Wikipedia draft monitor", () => {
  it("accepts only HTTPS pages on the official project origin", () => {
    expect(isAllowedWikipediaSourceUrl("https://platinumcore777.com/core-review.html")).toBe(true);
    expect(isAllowedWikipediaSourceUrl("http://platinumcore777.com/core-review.html")).toBe(false);
    expect(isAllowedWikipediaSourceUrl("https://example.com/platinum-core-777")).toBe(false);
    expect(isAllowedWikipediaSourceUrl("https://platinumcarwash30.com/")).toBe(false);
    expect(isAllowedWikipediaSourceUrl("https://platinumcore777.com/page?utm_source=test")).toBe(false);
  });

  it("defines exactly the 15 planned sections in order", () => {
    expect(WIKIPEDIA_SECTION_PLAN).toHaveLength(15);
    expect(WIKIPEDIA_SECTION_PLAN.map((item) => item.day)).toEqual(
      Array.from({ length: 15 }, (_, index) => index + 1),
    );
    expect(WIKIPEDIA_SECTION_PLAN[0]?.heading).toContain("Author");
    expect(WIKIPEDIA_SECTION_PLAN[14]?.heading).toContain("Consolidation");
  });

  it("hashes all source metadata deterministically", () => {
    const first = hashWikipediaSource(page());
    const second = hashWikipediaSource(page());
    const changed = hashWikipediaSource(page({ text: "A changed published page." }));

    expect(first).toBe(second);
    expect(first).not.toBe(changed);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });

  it("starts at day one and advances without exceeding day fifteen", () => {
    const initial = createInitialWikipediaDraftState();
    expect(selectWikipediaDraftDay(initial)).toBe(1);
    const dayTwo = advanceWikipediaDraftDay(initial, 1, "2026-09-21T08:00:00.000Z");
    expect(dayTwo.currentDay).toBe(2);
    const final = advanceWikipediaDraftDay(
      { ...dayTwo, currentDay: 15 },
      15,
      "2026-10-05T08:00:00.000Z",
    );
    expect(final.currentDay).toBe(15);
    expect(final.lastSuccessfulRun).toBe("2026-10-05T08:00:00.000Z");
  });

  it("normalizes malformed state without discarding valid sections", () => {
    const normalized = normalizeWikipediaDraftState({
      currentDay: 99,
      sourceHashes: { "https://platinumcore777.com/": "e96df88c66f025cb75a130e28032a70683688e5f72b70355667658376d941eab", bad: 4 },
      sections: [{
        day: 1,
        heading: "Author and project responsibility",
        status: "generated",
        text: "The official site states that Marko Ćuća authored the project.",
        sourceUrls: ["https://platinumcore777.com/"],
        sourceHashes: ["e96df88c66f025cb75a130e28032a70683688e5f72b70355667658376d941eab"],
        generatedAt: "2026-09-21T08:00:00.000Z",
      }, {
        day: 1,
        heading: "duplicate",
        status: "generated",
        text: "duplicate",
        sourceUrls: [],
        sourceHashes: [],
        generatedAt: "bad",
      }, {
        day: 16,
        heading: "invalid",
        status: "generated",
        text: "invalid",
        sourceUrls: [],
        sourceHashes: [],
        generatedAt: "2026-09-21T08:00:00.000Z",
      }],
    });

    expect(normalized.currentDay).toBe(15);
    expect(normalized.sourceHashes).toEqual({ "https://platinumcore777.com/": "e96df88c66f025cb75a130e28032a70683688e5f72b70355667658376d941eab" });
    expect(normalized.sections).toHaveLength(1);
    expect(normalized.sections[0]?.day).toBe(1);
  });

  it("skips source text that is promotional or already used", () => {
    const section = buildWikipediaSection(
      WIKIPEDIA_SECTION_PLAN[6]!,
      [page({
        description: "Book now for the best revolutionary solution.",
        text: "PLATINUM CORE 777 is a software project. Click here to contact us.\nPLATINUM CORE 777 is a software project.",
      })],
      new Set(["platinum core 777 is a software project."]),
      "2026-09-21T08:00:00.000Z",
    );

    expect(section.status).toBe("skipped");
    expect(section.text).toBe("");
    expect(section.sourceUrls).toEqual(["https://platinumcore777.com/core-review.html"]);
  });

  it("selects eligible sentences once and records their source", () => {
    const section = buildWikipediaSection(
      WIKIPEDIA_SECTION_PLAN[6]!,
      [page()],
      new Set(),
      "2026-09-21T08:00:00.000Z",
    );

    expect(section.status).toBe("generated");
    expect(section.text).toContain("Core Review presents information");
    expect(section.sourceUrls).toEqual(["https://platinumcore777.com/core-review.html"]);
    expect(section.sourceHashes).toEqual([hashWikipediaSource(page())]);
  });

  it("renders a pending draft with ordered sections and source notes", () => {
    const state: WikipediaDraftState = {
      ...createInitialWikipediaDraftState(),
      sections: [{
        day: 1,
        heading: "Author and project responsibility",
        status: "generated",
        text: "The official site states that Marko Ćuća authored the project.",
        sourceUrls: ["https://platinumcore777.com/"],
        sourceHashes: ["e96df88c66f025cb75a130e28032a70683688e5f72b70355667658376d941eab"],
        generatedAt: "2026-09-21T08:00:00.000Z",
      }],
    };
    const draft = renderWikipediaDraft(state, "https://platinumcore777.com/");
    const sources = renderWikipediaSources(state, "2026-09-21");

    expect(draft).toContain("PENDING WIKIPEDIA REVIEW");
    expect(draft).toContain("Author and project responsibility");
    expect(draft).toContain("https://platinumcore777.com/");
    expect(draft).not.toContain("wikipedia.org/api");
    expect(sources).toContain("2026-09-21");
    expect(sources).toContain("e96df88c66f025cb75a130e28032a70683688e5f72b70355667658376d941eab");
  });
});
