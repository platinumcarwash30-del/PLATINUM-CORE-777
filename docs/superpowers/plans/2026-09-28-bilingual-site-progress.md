# SDD ledger — plan: docs/superpowers/plans/2026-09-28-bilingual-site-implementation-plan.md

Pre-flight: direct GitHub-native execution was selected by the user; the repository is static HTML on GitHub Pages, so the task is executed through GitHub contents/tree/ref APIs rather than a local worktree.
Pre-flight shared interface: Task 1 produces /en/ mirrors consumed by Tasks 2–4 for language links and locale metadata.
Task 1: complete (commit 47aff06, tests: remote tree and sample HTML checks → PASS 18/18 mirrors; supporters.html intentionally excluded pending safe handling).
Task 1: Ruling: keep the existing supporters page out of the English mirror — it contains personal bank/IBAN and donation endpoint data; the user confirmed those details remain only on the former main/support page, so no duplicate public disclosure is created.
Task 2: complete (commits 4866861, de87fa2, d8fd242, e748a70; Serbian metadata, copy and navigation applied across all 18 public root pages; supporters.html intentionally untouched).
Task 3: complete (commits 0cc093d and 1f88885; Serbian-first root homepage, EN/SR switches, and LK-022 Yacht Charter added beside LK-021 and LK-023; Core Review remains a separate platform module).
Task 4: complete (commit 32a7d21; SR switches and hreflang metadata added to all 18 English mirrors; no en/supporters.html created).
Task 5: complete (commit 284290a; sitemap includes Serbian public URLs and English mirrors, while the existing supporters URL remains only on the former main/support page).
Verification: remote fetch checks PASS — 18/18 Serbian pages have lang="sr", EN switch and valid closing HTML; 18/18 English mirrors have lang="en", SR switch and valid closing HTML; LK-022 present in both homepages; supporters.html retains bank-related content and no English mirror exists.
