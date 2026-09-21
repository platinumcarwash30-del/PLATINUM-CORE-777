import { describe, expect, it } from "vitest";
import {
  DEFAULT_IDENTITY_MONITOR_QUERIES,
  fetchBraveWebSearchResults,
  filterFreshFindings,
  isOfficialSource,
  type IdentitySearchResult,
} from "../src/identity-monitor";
import { runIdentityMonitorOnce } from "../src/identity-monitor-runner";

const result = (overrides: Partial<IdentitySearchResult> = {}): IdentitySearchResult => ({
  title: "PLATINUM CORE 777 — founder Marko Cuca",
  link: "https://example.com/project",
  snippet: "PLATINUM CORE 777 was founded by another person.",
  query: '"PLATINUM CORE 777"',
  ...overrides,
});

describe("identity monitor", () => {
  it("includes the legal and no-diacritic identity variants and official businesses", () => {
    expect(DEFAULT_IDENTITY_MONITOR_QUERIES).toEqual(expect.arrayContaining([
      '"Marko Ćuća"',
      '"Marko Cuca"',
      '"Cuca" "PLATINUM CORE 777"',
      '"Platinum Car Wash"',
      '"Platinum Luxury Spa"',
      '"markoplatinum@icloud.com"',
      '"contact@platinumcore777.com"',
    ]));
  });

  it("recognises only configured official sources as official", () => {
    expect(isOfficialSource("https://platinumcore777.com/core-review.html", [
      "https://platinumcore777.com/",
    ])).toBe(true);
    expect(isOfficialSource("https://example.com/platinum-core-777", [
      "https://platinumcore777.com/",
    ])).toBe(false);
  });

  it("suppresses the same finding for seven days but allows it afterwards", () => {
    const now = new Date("2026-09-21T12:00:00.000Z");
    const finding = result();
    const state = {
      [finding.link]: "2026-09-13T12:00:00.000Z",
    };

    expect(filterFreshFindings([finding], state, now)).toHaveLength(1);
    expect(filterFreshFindings([finding], {
      [finding.link]: "2026-09-15T12:00:00.000Z",
    }, now)).toHaveLength(0);
  });

  it("does not flag an official result just because it contains project terms", () => {
    const official = result({
      link: "https://platinumcore777.com/",
      snippet: "PLATINUM CORE 777 was founded and authored by Marko Cuca.",
    });
    expect(isOfficialSource(official.link, ["https://platinumcore777.com/"])).toBe(true);
  });

  it("reads Brave web-search items through the JSON API", async () => {
    const fetchImpl = async () => new Response(JSON.stringify({
      web: { results: [{
        title: "Public result",
        url: "https://example.com/result",
        description: "PLATINUM CORE 777 result",
      }] },
    }), { status: 200 });

    const results = await fetchBraveWebSearchResults(fetchImpl, "key", '"PLATINUM CORE 777"');
    expect(results).toEqual([result({
      title: "Public result",
      link: "https://example.com/result",
      snippet: "PLATINUM CORE 777 result",
      query: '"PLATINUM CORE 777"',
    })]);
  });

  it("sends one digest for new external results and records their seven-day state", async () => {
    const stateWrites: Array<Record<string, string>> = [];
    const notified: IdentitySearchResult[][] = [];
    const fetchImpl = async () => new Response(JSON.stringify({
      web: { results: [{
        title: "External project result",
        url: "https://example.com/external",
        description: "PLATINUM CORE 777 founder information",
      }] },
    }), { status: 200 });

    const run = await runIdentityMonitorOnce({
      NODE_ENV: "test",
      NOTIFICATION_TO: "platinum303030@gmail.com",
      BRAVE_SEARCH_API_KEY: "key",
      IDENTITY_MONITOR_STATE_PATH: ":memory:",
    }, {
      now: new Date("2026-09-21T12:00:00.000Z"),
      fetchImpl,
      readState: async () => ({}),
      writeState: async (_path, state) => { stateWrites.push(state); },
      notify: async (findings) => { notified.push([...findings]); },
    });

    expect(run.status).toBe("sent");
    expect(run.findings).toHaveLength(1);
    expect(notified).toHaveLength(1);
    expect(stateWrites).toHaveLength(1);
    expect(stateWrites[0]["https://example.com/external"]).toBe("2026-09-21T12:00:00.000Z");
  });
});
