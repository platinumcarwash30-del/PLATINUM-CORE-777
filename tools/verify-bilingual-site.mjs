#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const pages = [
  "index.html",
  "business-license-website-app.html",
  "business-software.html",
  "child-safety-standards.html",
  "core-review.html",
  "delete-account.html",
  "digital-document-archiving.html",
  "independent-technology-project-innovation.html",
  "intellectual-property.html",
  "privacy-policy.html",
  "real-customer-reviews.html",
  "secure-business-software.html",
  "software-for-entrepreneurs.html",
  "sponsorship.html",
  "story.html",
  "trusted-business-directory.html",
  "useful-information.html",
  "verified-business-reviews.html"
];

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const fail = [];
const expect = (condition, message) => { if (!condition) fail.push(message); };

for (const page of pages) {
  const sr = read(page);
  const en = read(path.join("en", page));
  expect(/<html[^>]*lang="sr"/i.test(sr), `${page}: missing lang="sr"`);
  expect(/<html[^>]*lang="en"/i.test(en), `en/${page}: missing lang="en"`);
  expect(sr.includes(`href="en/${page}"`), `${page}: missing EN switch`);
  expect(en.includes(`href="../${page}"`), `en/${page}: missing SR switch`);
  expect(sr.includes(`hreflang="sr"`) && sr.includes(`hreflang="en"`), `${page}: missing Serbian hreflang`);
  expect(en.includes(`hreflang="sr"`) && en.includes(`hreflang="en"`), `en/${page}: missing English hreflang`);
  expect(/<\/html>\s*$/i.test(sr) && /<\/html>\s*$/i.test(en), `${page}: invalid closing HTML`);
  expect(!sr.includes("/en/en/") && !en.includes("/en/en/"), `${page}: duplicated /en/en/ path`);
}
const home = read("index.html");
const homeEn = read(path.join("en", "index.html"));
expect(home.includes("LK-022") && home.includes("Yacht Charter"), "index.html: LK-022 missing");
expect(homeEn.includes("LK-022") && homeEn.includes("Yacht Charter"), "en/index.html: LK-022 missing");
expect(!fs.existsSync(path.join(root, "en", "supporters.html")), "en/supporters.html must remain absent");

const sitemap = read("sitemap.xml");
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
expect(new Set(urls).size === urls.length, "sitemap.xml: duplicate URLs");
for (const page of pages) {
  expect(urls.includes(`https://platinumcore777.com/${page === "index.html" ? "" : page}`), `sitemap.xml: missing root ${page}`);
  expect(urls.includes(`https://platinumcore777.com/en/${page}`), `sitemap.xml: missing English ${page}`);
}
if (fail.length) {
  console.error("FAIL");
  console.error(fail.map((x) => `- ${x}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`PASS: ${pages.length} Serbian pages, ${pages.length} English mirrors, LK-022, reciprocal locale links and sitemap checks`);
}
