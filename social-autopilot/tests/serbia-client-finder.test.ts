import { describe, expect, it } from "vitest";
import {
  SERBIA_CLIENT_FINDER_CITIES,
  buildSerbiaClientFinderQueries,
  deduplicateSerbiaLeads,
  formatSerbiaClientFinderDigest,
  normalizeSerbiaLead,
  parsePublicContact,
  scoreSerbiaLead,
} from "../src/serbia-client-finder";
import type { IdentitySearchResult } from "../src/identity-monitor";

describe("Serbia client finder", () => {
  it("builds a bounded query pack for every required category and geography", () => {
    const queries = buildSerbiaClientFinderQueries();
    const categories = new Set(queries.map((query) => query.category));
    const geographies = new Set(queries.map((query) => query.geography));

    expect(queries.length).toBeLessThanOrEqual(15);
    expect(categories).toEqual(new Set([
      "service",
      "beauty-wellness",
      "hospitality-retail",
      "professional-services",
      "referral-partners",
    ]));
    expect(geographies).toEqual(new Set(["Belgrade", "Novi Sad", "Serbia"]));
    expect(SERBIA_CLIENT_FINDER_CITIES).toEqual([
      "Belgrade",
      "Novi Sad",
      "Nis",
      "Kragujevac",
      "Subotica",
      "Pancevo",
      "Cacak",
    ]);
    expect(SERBIA_CLIENT_FINDER_CITIES.every((city) => queries.some((query) => query.query.includes(city)))).toBe(true);
    expect(queries.every((query) => /Serbia|Belgrade|Novi Sad/i.test(query.query))).toBe(true);
  });

  it("extracts only visible public email addresses", () => {
    expect(parsePublicContact("Kontakt: hello@example.rs za rezervacije")).toBe("hello@example.rs");
    expect(parsePublicContact("No public contact listed here")).toBeUndefined();
  });

  it("ignores malformed public results without crashing", () => {
    expect(normalizeSerbiaLead(
      { title: "", link: "", snippet: "", query: "q" } as IdentitySearchResult,
      { category: "service", geography: "Serbia", query: "q" },
    )).toBeUndefined();
    expect(normalizeSerbiaLead(
      { title: "Public business", link: "https://example.rs", snippet: "", query: "q" },
      { category: "service", geography: "Serbia", query: "q" },
    )).toBeUndefined();
  });

  it("scores a normalized lead with reasons and a Core Review angle", () => {
    const candidate = normalizeSerbiaLead(
      { title: "Salon Example Belgrade", link: "https://example.rs", snippet: "Book online", query: "q" },
      { category: "beauty-wellness", geography: "Belgrade", query: "q" },
    );
    expect(candidate).toBeDefined();

    const scored = scoreSerbiaLead(candidate!);
    expect(scored.score).toBeGreaterThan(0);
    expect(scored.reasons.length).toBeGreaterThan(0);
    expect(scored.suggestedAngle).toContain("Core Review");
  });

  it("does not award a public city match from query metadata alone", () => {
    const candidate = normalizeSerbiaLead(
      { title: "Generic Business", link: "https://example.com", snippet: "Contact us", query: "q" },
      { category: "service", geography: "Serbia", query: "q" },
    );
    const scored = scoreSerbiaLead(candidate!);

    expect(scored.reasons).not.toContain("Serbia/city match (+25)");
  });

  it("keeps one URL while merging category and geography evidence", () => {
    const first = scoreSerbiaLead(normalizeSerbiaLead(
      { title: "Wash One", link: "https://example.rs/", snippet: "Belgrade auto detailing", query: "q1" },
      { category: "service", geography: "Belgrade", query: "q1" },
    )!);
    const second = scoreSerbiaLead(normalizeSerbiaLead(
      { title: "Wash One", link: "https://example.rs#about", snippet: "Novi Sad booking", query: "q2" },
      { category: "referral-partners", geography: "Novi Sad", query: "q2" },
    )!);

    const [merged] = deduplicateSerbiaLeads([first, second]);
    expect(deduplicateSerbiaLeads([first, second])).toHaveLength(1);
    expect(merged.category).toContain("service");
    expect(merged.category).toContain("referral-partners");
    expect(merged.geography).toContain("Belgrade");
    expect(merged.geography).toContain("Novi Sad");
    expect(new Set(merged.reasons).size).toBe(merged.reasons.length);
  });

  it("formats score, source URL, manual-contact warning, and a top-lead draft", () => {
    const lead = scoreSerbiaLead(normalizeSerbiaLead(
      {
        title: "Salon Example Belgrade",
        link: "https://example.rs",
        snippet: "Kontakt hello@example.rs; book online",
        query: "q",
      },
      { category: "beauty-wellness", geography: "Belgrade", query: "q" },
    )!);

    const digest = formatSerbiaClientFinderDigest([lead], new Date("2026-09-21T12:00:00.000Z"));
    expect(digest).toContain(`Score: ${lead.score}/100`);
    expect(digest).toContain("https://example.rs");
    expect(digest).toContain("manual");
    expect(digest).toContain("Core Review");
  });
});
