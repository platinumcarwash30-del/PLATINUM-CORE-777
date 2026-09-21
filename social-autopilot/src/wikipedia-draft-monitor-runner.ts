import { readFile, writeFile } from "node:fs/promises";
import { loadWikipediaDraftConfig, type WikipediaDraftConfig } from "./config";
import { readSitePages } from "./site-reader";
import {
  advanceWikipediaDraftDay,
  buildWikipediaSection,
  getWikipediaSectionPlan,
  hashWikipediaSource,
  isAllowedWikipediaSourceUrl,
  normalizeWikipediaDraftState,
  renderWikipediaDraft,
  renderWikipediaSources,
  selectWikipediaDraftDay,
  type WikipediaDraftState,
} from "./wikipedia-draft-monitor";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface WikipediaDraftRunnerDependencies {
  fetchImpl?: FetchLike;
  now?: Date;
  readState?: (path: string) => Promise<unknown>;
  writeState?: (path: string, state: WikipediaDraftState) => Promise<void>;
  writeOutput?: (path: string, contents: string) => Promise<void>;
}

export interface WikipediaDraftRunResult {
  status: "generated" | "skipped";
  day: number;
  sectionStatus: "generated" | "skipped";
}

async function readStateFile(path: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as unknown;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return undefined;
    }
    if (error instanceof SyntaxError) return undefined;
    throw error;
  }
}

async function writeStateFile(path: string, state: WikipediaDraftState): Promise<void> {
  await writeFile(path, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

async function writeOutputFile(path: string, contents: string): Promise<void> {
  await writeFile(path, contents, "utf8");
}

function normalizeUsedSentence(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLocaleLowerCase("en-US");
}

function collectUsedSentences(state: WikipediaDraftState): Set<string> {
  const used = new Set<string>();
  for (const section of state.sections) {
    section.text
      .split(/(?<=[.!?])\s+|[\r\n]+/u)
      .map(normalizeUsedSentence)
      .filter(Boolean)
      .forEach((sentence) => used.add(sentence));
  }
  return used;
}

export async function runWikipediaDraftOnce(
  env: NodeJS.ProcessEnv,
  dependencies: WikipediaDraftRunnerDependencies = {},
): Promise<WikipediaDraftRunResult> {
  const config: WikipediaDraftConfig = loadWikipediaDraftConfig(env);
  const now = dependencies.now ?? new Date();
  const readState = dependencies.readState ?? readStateFile;
  const writeState = dependencies.writeState ?? writeStateFile;
  const writeOutput = dependencies.writeOutput ?? writeOutputFile;
  const state = normalizeWikipediaDraftState(await readState(config.statePath));
  const pages = await readSitePages(dependencies.fetchImpl ?? fetch, config.sitemapUrl);

  if (pages.some((page) => !isAllowedWikipediaSourceUrl(page.url))) {
    throw new Error("Wikipedia draft source validation failed: page is outside platinumcore777.com");
  }

  const day = selectWikipediaDraftDay(state);
  const plan = getWikipediaSectionPlan(day);
  const section = buildWikipediaSection(plan, pages, collectUsedSentences(state), now.toISOString());
  const nextState = advanceWikipediaDraftDay({
    ...state,
    sourceHashes: {
      ...state.sourceHashes,
      ...Object.fromEntries(pages.map((page) => [page.url, hashWikipediaSource(page)])),
    },
    sections: [
      ...state.sections.filter((candidate) => candidate.day !== section.day),
      section,
    ].sort((left, right) => left.day - right.day),
  }, day, now.toISOString());

  await writeOutput(config.draftPath, renderWikipediaDraft(nextState, config.siteUrl));
  await writeOutput(config.sourcesPath, renderWikipediaSources(nextState, now.toISOString().slice(0, 10)));
  await writeState(config.statePath, nextState);

  console.log(`Wikipedia draft monitor completed day ${day}: ${section.status}`);
  return {
    status: section.status,
    day,
    sectionStatus: section.status,
  };
}

if (require.main === module) {
  void runWikipediaDraftOnce(process.env)
    .then((result) => console.log(`Wikipedia draft monitor: ${result.status}`))
    .catch((error) => {
      console.error(error instanceof Error ? error.message : "Wikipedia draft monitor failed");
      process.exitCode = 1;
    });
}
