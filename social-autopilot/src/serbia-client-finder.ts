import type { IdentitySearchResult } from "./identity-monitor";

export const SERBIA_CLIENT_FINDER_RETENTION_DAYS = 7;
export const SERBIA_CLIENT_FINDER_MAX_LEADS = 10;

export const SERBIA_CLIENT_FINDER_CITIES = [
  "Belgrade",
  "Novi Sad",
  "Nis",
  "Kragujevac",
  "Subotica",
  "Pancevo",
  "Cacak",
] as const;

export interface SerbiaClientFinderQuery {
  category: string;
  geography: string;
  query: string;
}

export interface SerbiaLeadCandidate {
  title: string;
  link: string;
  snippet: string;
  query: string;
  category: string;
  geography: string;
  publicContact?: string;
}

export interface ScoredSerbiaLead extends SerbiaLeadCandidate {
  score: number;
  reasons: string[];
  suggestedAngle: string;
  draftLanguage: "sr" | "en";
}

const CATEGORY_TERMS: Record<string, string> = {
  service: "auto perionica detailing car wash auto detailing service",
  "beauty-wellness": "salon lepote wellness spa beauty salon",
  "hospitality-retail": "restoran kafic prodavnica restaurant cafe retail",
  "professional-services": "knjigovodstvo nekretnine konsultant accounting real estate consulting",
  "referral-partners": "web dizajn IT marketing agencija web design IT marketing agency",
};

const QUERY_GEOGRAPHIES = ["Belgrade", "Novi Sad", "Serbia"] as const;

const QUERY_GEOGRAPHY_TERMS: Record<(typeof QUERY_GEOGRAPHIES)[number], string> = {
  Belgrade: "Belgrade",
  "Novi Sad": "Novi Sad",
  Serbia: `Serbia ${SERBIA_CLIENT_FINDER_CITIES.join(" ")}`,
};

export function buildSerbiaClientFinderQueries(): readonly SerbiaClientFinderQuery[] {
  return Object.entries(CATEGORY_TERMS).flatMap(([category, terms]) =>
    QUERY_GEOGRAPHIES.map((geography) => ({
      category,
      geography,
      query: `(${terms}) (${QUERY_GEOGRAPHY_TERMS[geography]}) (site:.rs OR site:instagram.com OR site:facebook.com)`,
    })),
  );
}

export function parsePublicContact(text: string): string | undefined {
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0];
}

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function canonicalLeadUrl(link: string): string {
  try {
    const url = new URL(link);
    url.hash = "";
    url.pathname = url.pathname.replace(/\/+$/, "") || "/";
    return url.toString();
  } catch {
    return link.trim();
  }
}

function mergeEvidence(left: string, right: string): string {
  const values = [...left.split(/\s*[,|]\s*/), ...right.split(/\s*[,|]\s*/)]
    .map((value) => value.trim())
    .filter(Boolean);
  return [...new Set(values)].join(", ");
}

export function normalizeSerbiaLead(
  result: IdentitySearchResult,
  query: SerbiaClientFinderQuery,
): SerbiaLeadCandidate | undefined {
  const title = asTrimmedString((result as Partial<IdentitySearchResult>).title);
  const link = asTrimmedString((result as Partial<IdentitySearchResult>).link);
  const snippet = asTrimmedString((result as Partial<IdentitySearchResult>).snippet);
  if (!title || !link || !snippet) return undefined;
  try {
    new URL(link);
  } catch {
    return undefined;
  }

  const publicContact = parsePublicContact(`${title} ${snippet}`);
  return {
    title,
    link,
    snippet,
    query: query.query,
    category: query.category,
    geography: query.geography,
    ...(publicContact ? { publicContact } : {}),
  };
}

function hasAny(text: string, patterns: readonly RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

export function scoreSerbiaLead(candidate: SerbiaLeadCandidate): ScoredSerbiaLead {
  const text = [candidate.title, candidate.link, candidate.snippet, candidate.category, candidate.geography]
    .join(" ")
    .toLowerCase();
  const publicText = [candidate.title, candidate.link, candidate.snippet].join(" ").toLowerCase();
  const reasons: string[] = [];
  let score = 0;

  if (hasAny(publicText, [/serbia/i, /belgrade/i, /novi sad/i, /nis/i, /kragujevac/i, /subotica/i, /pancevo/i, /cacak/i])) {
    score += 25;
    reasons.push("Serbia/city match (+25)");
  }

  if (Object.keys(CATEGORY_TERMS).some((category) => candidate.category.includes(category)) || hasAny(text, [
    /perionica|detailing|car wash|service/i,
    /salon|beauty|wellness|spa/i,
    /restoran|kafic|restaurant|cafe|retail/i,
    /knjigovod|accounting|nekretn|real estate|consult/i,
    /web|design|marketing|agenc/i,
  ])) {
    score += 20;
    reasons.push("Business category match (+20)");
  }

  if (hasAny(text, [
    /no website|without website|outdated|old website|facebook only|instagram only/i,
    /no online booking|not updated|website unavailable/i,
  ]) || /facebook\.com|instagram\.com/i.test(candidate.link)) {
    score += 20;
    reasons.push("Public signs of limited or outdated web presence (+20)");
  }

  if (hasAny(text, [/no reviews|few reviews|no booking|manual|call us|message us|reservation by phone/i])) {
    score += 15;
    reasons.push("Public trust, booking, or communication gap signal (+15)");
  }

  if (hasAny(text, [/book online|online booking|review|reviews|application|\bapp\b|website|directory|license|customer/i])) {
    score += 10;
    reasons.push("Observable fit for a licensed business profile or app (+10)");
  }

  if (candidate.publicContact || candidate.link) {
    score += 10;
    reasons.push("Public business page or contact evidence available (+10)");
  }

  const isSerbian = hasAny(text, [
    /perionica|lepote|knjigovod|nekretn|kafic|restoran|usluge|rezervac|agencij/i,
    /[čćšžđ]/i,
  ]);
  const suggestedAngle = candidate.category.includes("referral-partners")
    ? "Explore a referral partnership around PLATINUM CORE 777 and Core Review."
    : "Show how Core Review can combine a trusted business profile, reviews, and a clearer customer journey.";

  return {
    ...candidate,
    score: Math.min(100, score),
    reasons,
    suggestedAngle,
    draftLanguage: isSerbian ? "sr" : "en",
  };
}

export function deduplicateSerbiaLeads(leads: readonly ScoredSerbiaLead[]): ScoredSerbiaLead[] {
  const merged = new Map<string, ScoredSerbiaLead>();
  for (const lead of leads) {
    const key = canonicalLeadUrl(lead.link);
    const previous = merged.get(key);
    if (!previous) {
      merged.set(key, { ...lead, reasons: [...lead.reasons] });
      continue;
    }

    const candidate: SerbiaLeadCandidate = {
      title: previous.title,
      link: previous.link,
      snippet: mergeEvidence(previous.snippet, lead.snippet),
      query: mergeEvidence(previous.query, lead.query),
      category: mergeEvidence(previous.category, lead.category),
      geography: mergeEvidence(previous.geography, lead.geography),
      publicContact: previous.publicContact ?? lead.publicContact,
    };
    const rescored = scoreSerbiaLead(candidate);
    merged.set(key, {
      ...rescored,
      reasons: [...new Set([...previous.reasons, ...lead.reasons, ...rescored.reasons])],
      score: Math.max(previous.score, lead.score, rescored.score),
      suggestedAngle: previous.suggestedAngle,
      draftLanguage: previous.draftLanguage === "sr" || lead.draftLanguage === "sr" ? "sr" : "en",
    });
  }
  return [...merged.values()].sort((left, right) => right.score - left.score);
}

export function filterFreshSerbiaLeads(
  leads: readonly ScoredSerbiaLead[],
  state: Record<string, string>,
  now: Date,
  retentionDays = SERBIA_CLIENT_FINDER_RETENTION_DAYS,
): ScoredSerbiaLead[] {
  const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
  return leads.filter((lead) => {
    const key = canonicalLeadUrl(lead.link);
    const lastReportedAt = state[key] ?? state[lead.link];
    if (!lastReportedAt) return true;
    const parsed = Date.parse(lastReportedAt);
    return !Number.isFinite(parsed) || now.getTime() - parsed >= retentionMs;
  });
}

export function markSerbiaLeadsReported(
  state: Record<string, string>,
  leads: readonly ScoredSerbiaLead[],
  now: Date,
): Record<string, string> {
  const next = { ...state };
  const timestamp = now.toISOString();
  for (const lead of leads) next[canonicalLeadUrl(lead.link)] = timestamp;
  return next;
}

function formatManualDraft(lead: ScoredSerbiaLead): string {
  if (lead.draftLanguage === "sr") {
    return `Draft (manual only): Zdravo, videli smo javnu stranicu za ${lead.title}. Mozemo da pokazemo kako PLATINUM CORE 777 i Core Review mogu da pomognu oko poverenja, recenzija i kontakta sa klijentima. Ovo je samo predlog za rucni kontakt i ne salje se automatski.`;
  }
  return `Draft (manual only): Hello, we found the public page for ${lead.title}. We can show how PLATINUM CORE 777 and Core Review may help with trust, reviews, and customer contact. This is only a draft for manual review and is never sent automatically.`;
}

export function formatSerbiaClientFinderDigest(
  leads: readonly ScoredSerbiaLead[],
  checkedAt: Date,
): string {
  const lines = leads.map((lead, index) => [
    `${index + 1}. ${lead.title}`,
    `Category: ${lead.category}`,
    `Geography: ${lead.geography}`,
    `Score: ${lead.score}/100`,
    `Public URL: ${lead.link}`,
    `Public contact: ${lead.publicContact ?? "not visible in search result"}`,
    `Reasons: ${lead.reasons.join("; ") || "No additional public signal"}`,
    `Suggested angle: ${lead.suggestedAngle}`,
    `Source query: ${lead.query}`,
  ].join("\n"));

  const drafts = leads.slice(0, 5).map((lead, index) => `${index + 1}. ${formatManualDraft(lead)}`).join("\n\n");
  return [
    "PLATINUM CORE 777 Serbia client finder",
    `Checked: ${checkedAt.toISOString()}`,
    `New public leads: ${leads.length}`,
    "",
    ...(lines.length > 0 ? lines : ["No new public leads found."]),
    "",
    "Top-lead manual drafts:",
    drafts || "No drafts prepared.",
    "",
    "Manual contact only: this workflow does not send emails, messages, forms, comments, or social outreach.",
    "Verify every public signal and source URL before contacting a business.",
  ].join("\n");
}
