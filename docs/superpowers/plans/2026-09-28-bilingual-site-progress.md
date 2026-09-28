# SDD ledger — plan: docs/superpowers/plans/2026-09-28-bilingual-site-implementation-plan.md

Pre-flight: direct GitHub-native execution was selected by the user; the repository is static HTML on GitHub Pages, so the task is executed through GitHub contents/tree/ref APIs rather than a local worktree.
Pre-flight shared interface: Task 1 produces /en/ mirrors consumed by Tasks 2–4 for language links and locale metadata.
Task 1: complete (commit 47aff06, tests: remote tree and sample HTML checks → PASS 18/18 mirrors; supporters.html intentionally excluded pending safe handling).
Task 1: Ruling: keep the existing supporters page out of the English mirror — it contains personal bank/IBAN and donation endpoint data; the user confirmed those details remain only on the former main/support page, so no duplicate public disclosure is created.