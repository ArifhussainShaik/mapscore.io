# Current Session Log
**Date:** 2026-03-08
**Goal:** MapScore Report Enhancement — 6 Critical Fixes

## Changes Made This Session

### New Files Created
- `libs/schema-extractor.js` — Extracts JSON-LD (LocalBusiness/Organization) from website HTML for NAP consistency checking. Handles @graph pattern, business subtypes, PostalAddress formatting. Error-resilient with 8s timeout.
- `libs/neighborhood.js` — Weighted profile scoring (`getProfileScore`) and standing calculation (`calculateStanding`) for neighborhood rankings. Weights: reviews 30%, rating 20%, photos 15%, posts 15%, categories 10%, website 10%.

### Files Modified
- `libs/data-provider.js` — (1) Added Outscraper `primaryCategory` and `secondaryCategories` to merge block so real GBP names override Google Places machine types. (2) Added step 4: website schema NAP extraction via `extractSchemaMarkup()`.
- `issues-library.json` — Updated PROF-006, PROF-007, PROF-008: replaced generic "GMB Everywhere/PlePer" advice with data-driven `{competitor_category_list}`, `{user_category_summary}`, `{suggested_categories_list}`, and `{competitor_common_category}` placeholders.
- `libs/issues.js` — Added `{competitor_category_list}`, `{user_category_summary}`, `{suggested_categories_list}` to interpolation map. Enabled `howToFix` template interpolation (was previously passed raw).
- `components/CategoryInsights.jsx` — Replaced simple competitor category list with full Category Gap Analysis table (user vs competitor matrix with ✓/✗ indicators). Updated suggested section header.
- `libs/serper.js` — Replaced `getCompetitors()`: now uses `/search` endpoint (real map pack) instead of `/maps` (proximity). Builds 3 search queries, deduplicates by name with appearance counting, returns `{ competitors, searchQueries }`.
- `app/api/audit/run/route.js` — Added `calculateStanding` import. Destructures new competitor format `{ competitors, searchQueries }`. Computes and stores `neighborhoodStandings` in audit document.
- `components/CompetitorTable.jsx` — Shows real ordinal standing from `neighborhoodStandings`, competitor categories (not fake distances), and search queries used for ranking transparency.

### Decisions Made
- **Issue 3 (secondary categories):** Went with Option A (free, primary categories only from Serper). V2 can enrich via Outscraper if users request it.
- **Issue 5 (neighborhood standings):** Fully replaced old `getCompetitors()` instead of running alongside it. New algorithm uses 3 Serper `/search` calls (~$0.012/audit).
- **Issue 6 (NAP):** Schema extraction is error-resilient — never breaks the audit. If website fetch fails, `websiteNAP` is set to `null`.
- `howToFix` array items in issues are now interpolated (they weren't before), enabling data-driven fix instructions.

### Issues Discovered
- The old `getCompetitors()` used Serper `/maps` which returns businesses by physical proximity, NOT by search ranking. This gave misleading standings.
- `howToFix` steps in issues were NOT being interpolated — template placeholders like `{primary_category}` would render literally. Fixed by applying `interpolate()` to each step.
- `NAPChecker.jsx` and `nap-checker.js` were already fully implemented (326 + 222 lines) but not wired because `audit.websiteNAP` was never populated in the pipeline.

## End of Session Checklist
- [ ] Merge this into CHANGELOG.md
- [ ] Update master-architecture.md if needed
- [ ] Clear this file for next session
