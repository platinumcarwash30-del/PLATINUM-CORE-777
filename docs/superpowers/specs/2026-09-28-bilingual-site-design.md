# PLATINUM CORE 777 Bilingual Site Design

Date: 2026-09-28

## Goal

Make the public PLATINUM CORE 777 website Serbian-first, with a clear English switch on every public page, while preserving existing functionality, public links, branding and SEO.

## Audience and success criteria

The default audience is Serbian businesses and visitors, so the existing root URLs remain the Serbian canonical pages. International visitors can switch to complete English mirrors under /en/.

Success means:
- Serbian is the default language at every public root page.
- Every public page exposes an obvious EN or SR switch in the header and footer.
- English mirrors preserve the current English content and all current functionality.
- License selection, mailto forms, app/site links, social links, privacy and account-deletion links continue to work.
- Each locale has correct lang, title, description, canonical and hreflang metadata.
- The sitemap contains both Serbian canonical URLs and English alternate URLs.
- Internal automation/admin views are not exposed as public marketing pages and are not translated in this pass.
- Layout remains responsive on desktop and mobile.

## Existing public surface

Translate and mirror the public root pages:

index.html, business-license-website-app.html, business-software.html, child-safety-standards.html, core-review.html, delete-account.html, digital-document-archiving.html, independent-technology-project-innovation.html, intellectual-property.html, privacy-policy.html, real-customer-reviews.html, secure-business-software.html, software-for-entrepreneurs.html, sponsorship.html, story.html, supporters.html, trusted-business-directory.html, useful-information.html and verified-business-reviews.html.

Do not alter or expose automation-panel.html or social-autopilot/src/views/* as public-language pages.

## Architecture

Keep the current Serbian-first URLs at the root. Create a complete English mirror under /en/ with the same filenames. Root Serbian pages link to https://platinumcore777.com/en/<page>; English pages link back to the matching Serbian root URL.

Preserve the current English root source as the basis for the English mirror before translating the Serbian root. The expanded Master Licence and process copy stays in both locales, translated naturally.

Each page receives:
- html lang=sr or lang=en.
- Locale-specific title and meta description.
- Locale-specific canonical URL.
- Reciprocal hreflang=sr, hreflang=en and hreflang=x-default links.
- An EN/SR language switch using absolute HTTPS links.
- Translated visible navigation, headings, body text, buttons, forms, legal labels and footer text.

## Client solutions

Keep LK-021 Platinum Car Wash, LK-023 Pobedi izvršitelja and Core Review. Add LK-022 as a separate client solution for yacht charter / sailing services, describing the connected website, application and email reservation flow, reduced administrative time and client-specific digital workflow. Do not merge LK-022 with LK-021 or LK-023.

## SEO and indexing

Use Serbian canonical URLs for root pages, English canonical URLs for /en/ mirrors, and reciprocal language annotations. Keep one sitemap entry per locale URL. Preserve analytics, robots and structured-data behavior; update descriptions where translation requires it. Do not create query-parameter language variants.

## Functional constraints

Do not change domains, CNAME, hosting settings, application/site destinations, mailto targets, license price, package-selection behavior, privacy/delete-account flows, logo assets or registered branding.

All translated contact and form copy must continue to submit to the existing contact address.

## Verification

Check every public root page and representative English mirror for correct language switch destination, no missing links or accidental /en/en/ paths, correct canonical/hreflang values, working forms and external project links, valid HTML, mobile layout without horizontal overflow, and sitemap inclusion for both locales.