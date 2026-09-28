# Serbian-First Bilingual Website Implementation Plan

> For agentic workers: implement task-by-task and verify each task before continuing.

Goal: Convert the public PLATINUM CORE 777 static site to Serbian-first with complete English mirrors, a language switch on every public page, preserved functionality, and an SEO-safe LK-022 yacht-charter addition.

Architecture: Keep Serbian pages at the existing root URLs so current links remain valid. Copy the current English public pages into /en/ with matching filenames, then add reciprocal EN/SR switches, canonical/hreflang metadata, and a two-locale sitemap.

Tech Stack: Static HTML, inline page styles plus existing shared assets, GitHub Pages, existing mailto/forms and analytics.

Spec: docs/superpowers/specs/2026-09-28-bilingual-site-design.md

## Global Constraints

- Serbian is the default language at root URLs.
- English mirrors live under /en/ with matching filenames.
- Preserve current domains, CNAME, hosting, analytics, forms, mailto targets, app links, logo assets and registered branding.
- Do not expose or translate automation-panel.html or social-autopilot/src/views/*.
- Keep existing license price and package-selection behavior unchanged.
- Add LK-022 as a separate yacht-charter/sailing client solution; do not merge it with LK-021 or LK-023.
- No query-parameter language variants.

## Review Focus

- Existing deep links must still resolve to Serbian pages; verify representative article, legal, product and contact URLs.
- Every EN/SR switch must point to the matching locale without /en/en/ or missing-file paths.
- Canonical and hreflang values must be reciprocal and locale-specific.
- Mailto forms and external client/app links must remain unchanged.
- Long Serbian text must remain readable on mobile without horizontal overflow.

### Task 1: Freeze and mirror the current English public pages — COMPLETE (commit 47aff06; 18/18 safe public mirrors created; supporters intentionally excluded)

Files:
- Create: /en/index.html
- Create: /en/business-license-website-app.html
- Create: /en/business-software.html
- Create: /en/child-safety-standards.html
- Create: /en/core-review.html
- Create: /en/delete-account.html
- Create: /en/digital-document-archiving.html
- Create: /en/independent-technology-project-innovation.html
- Create: /en/intellectual-property.html
- Create: /en/privacy-policy.html
- Create: /en/real-customer-reviews.html
- Create: /en/secure-business-software.html
- Create: /en/software-for-entrepreneurs.html
- Create: /en/sponsorship.html
- Create: /en/story.html
- Do not create: /en/supporters.html (the existing supporters page remains Serbian-only because it contains bank/IBAN and donation endpoint information)
- Create: /en/trusted-business-directory.html
- Create: /en/useful-information.html
- Create: /en/verified-business-reviews.html

Copy the current English source before translating root pages. Preserve the recently expanded Master Licence and process section in /en/index.html, and add an EN switch back to each Serbian root counterpart.

Check: each English mirror exists, has valid HTML and retains all current forms, links and assets.

### Task 2: Convert the root public pages to Serbian-first — COMPLETE (commits 4866861, de87fa2, d8fd242, e748a70)

Files:
- Modify: the 19 public root HTML files listed in the spec.

Translate visible navigation, headings, body copy, buttons, forms, package labels, legal labels and footer text into natural Serbian Latin. Set html lang=sr. Keep each existing root filename and functionality. Add an EN link to the matching /en/ file and a reciprocal SR link in each English mirror.

Check: no internal/admin view is accidentally linked from public navigation and no functional URL is changed.

### Task 3: Add locale metadata and the LK-022 yacht-charter solution — COMPLETE (commits 0cc093d, 1f88885)

Files:
- Modify: index.html
- Modify: /en/index.html
- Modify: all locale page heads for canonical/hreflang metadata.

Add LK-022 as a separate client-solution card in both locales. Serbian copy must identify it as a yacht charter / sailing service solution with a website connected to an application and email reservation flow, reduced administrative time, and a client-specific workflow. Add the English equivalent. Keep LK-021, LK-023 and Core Review as separate cards.

Add locale-specific title and description, canonical URLs, hreflang sr/en/x-default, and EN/SR switches. Preserve analytics and structured-data behavior.

Check: metadata points to the correct root or /en/ URL and both language links resolve.

### Task 4: Update navigation and the two-locale sitemap — COMPLETE (commits 32a7d21, 284290a)

Files:
- Modify: every public HTML header/footer containing navigation.
- Modify: sitemap.xml.

Ensure the Serbian default navigation points to Serbian root pages and the English navigation points to /en/ mirrors. Add one sitemap URL per locale page, including the root and all public mirrors. Do not add internal admin URLs.

Check: sitemap is valid XML and contains no duplicate URLs.

### Task 5: Static verification and publication readiness — COMPLETE (verifier added in tools/verify-bilingual-site.mjs; remote checks PASS)

Files:
- Create: tools/verify-bilingual-site.mjs

Implement a no-dependency verifier that checks all expected root and /en/ files, language attributes, reciprocal language links, canonical/hreflang presence, sitemap entries, absence of /en/en/ links, and the required LK-022 text in both index files.

Run the verifier and inspect representative pages (home, licensing, Core Review, privacy, story and LK-022 section) at desktop and mobile widths. Fix any broken paths or overflow before publishing.

Final check: GitHub Pages serves the Serbian root homepage and the EN switch reaches the English mirror.