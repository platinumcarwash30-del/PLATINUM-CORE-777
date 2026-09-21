import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import {
  createInitialWikipediaDraftState,
  type WikipediaDraftState,
} from "../src/wikipedia-draft-monitor";
import { runWikipediaDraftOnce } from "../src/wikipedia-draft-monitor-runner";

const sitemap = `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>https://platinumcore777.com/core-review.html</loc></url></urlset>`;
const pageHtml = (canonical = "https://platinumcore777.com/core-review.html") => `
  <html><head>
    <title>Core Review</title>
    <meta name="description" content="A software project description">
    <link rel="canonical" href="${canonical}">
  </head><body><main>
    The official site states that Marko Ćuća authored PLATINUM CORE 777 as a software project.
  </main></body></html>`;

function responseFor(fetchUrl: string, page = pageHtml()): Response {
  if (fetchUrl.endsWith("sitemap.xml")) return new Response(sitemap, { status: 200 });
  return new Response(page, { status: 200 });
}

describe("Wikipedia draft monitor runner", () => {
  it("writes the first daily section and advances state after successful output", async () => {
    const outputs = new Map<string, string>();
    const states: WikipediaDraftState[] = [];

    const result = await runWikipediaDraftOnce({}, {
      now: new Date("2026-09-21T08:00:00.000Z"),
      fetchImpl: async (input) => responseFor(input),
      readState: async () => createInitialWikipediaDraftState(),
      writeState: async (_path, state) => { states.push(state); },
      writeOutput: async (path, contents) => { outputs.set(path, contents); },
    });

    expect(result).toEqual({ status: "generated", day: 1, sectionStatus: "generated" });
    expect(outputs.get("../docs/wikipedia/PLATINUM-CORE-777-draft.md")).toContain("PENDING WIKIPEDIA REVIEW");
    expect(outputs.get("../docs/wikipedia/PLATINUM-CORE-777-sources.md")).toContain("core-review.html");
    expect(states).toHaveLength(1);
    expect(states[0]?.currentDay).toBe(2);
    expect(states[0]?.sections[0]?.day).toBe(1);
  });

  it("does not write or advance state when the sitemap fetch fails", async () => {
    const writes: string[] = [];

    await expect(runWikipediaDraftOnce({}, {
      fetchImpl: async () => new Response("unavailable", { status: 503 }),
      readState: async () => createInitialWikipediaDraftState(),
      writeState: async () => { writes.push("state"); },
      writeOutput: async () => { writes.push("output"); },
    })).rejects.toThrow("HTTP 503");

    expect(writes).toEqual([]);
  });

  it("rejects an external canonical page before writing output", async () => {
    const writes: string[] = [];

    await expect(runWikipediaDraftOnce({}, {
      fetchImpl: async (input) => responseFor(input, pageHtml("https://example.com/fake.html")),
      readState: async () => createInitialWikipediaDraftState(),
      writeState: async () => { writes.push("state"); },
      writeOutput: async () => { writes.push("output"); },
    })).rejects.toThrow("Canonical URL must be an HTTPS URL on platinumcore777.com");

    expect(writes).toEqual([]);
  });

  it("recovers from malformed cached JSON without touching the site", async () => {
    const directory = mkdtempSync(join(tmpdir(), "wikipedia-draft-state-"));
    const statePath = join(directory, "state.json");
    const states: WikipediaDraftState[] = [];
    writeFileSync(statePath, "not-json", "utf8");

    try {
      const result = await runWikipediaDraftOnce({ WIKIPEDIA_DRAFT_STATE_PATH: statePath }, {
        now: new Date("2026-09-21T08:00:00.000Z"),
        fetchImpl: async (input) => responseFor(input),
        writeState: async (_path, state) => { states.push(state); },
        writeOutput: async () => undefined,
      });

      expect(result.day).toBe(1);
      expect(states[0]?.currentDay).toBe(2);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
