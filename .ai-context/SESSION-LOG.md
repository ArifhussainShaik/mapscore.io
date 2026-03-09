# Current Session Log
**Date:** 2026-03-09
**Goal:** MapScore Report Issue Tracker — Fix 7 of 10 bugs (BUG-3 through BUG-10, excluding BUG-1/2/7 which require a live audit run)

---

## Previous Session (2026-03-08) — archived below
<details>
<summary>Expand previous session</summary>

**Goal:** MapScore Report Enhancement — 6 Critical Fixes

### New Files Created
- `libs/schema-extractor.js` — Extracts JSON-LD (LocalBusiness/Organization) from website HTML for NAP consistency checking.
- `libs/neighborhood.js` — Weighted profile scoring and standing calculation for neighborhood rankings.

### Files Modified
- `libs/data-provider.js` — Added Outscraper `primaryCategory`/`secondaryCategories` merge; added schema NAP extraction step.
- `issues-library.json` — Updated PROF-006/007/008 with data-driven template placeholders.
- `libs/issues.js` — Added placeholder interpolation for `howToFix` steps.
- `components/CategoryInsights.jsx` — Replaced category list with Category Gap Analysis table.
- `libs/serper.js` — Replaced `getCompetitors()` to use `/search` (map pack ranking) instead of `/maps` (proximity).
- `app/api/audit/run/route.js` — Added `calculateStanding`, destructures new competitor format, stores `neighborhoodStandings`.
- `components/CompetitorTable.jsx` — Shows real ordinal standing, competitor categories, search queries used.

### Decisions Made
- Issue 3: Option A — free, primary categories only from Serper.
- Issue 5: Fully replaced old `getCompetitors()`. Cost ~$0.012/audit.
- Issue 6: Schema extraction is error-resilient; `websiteNAP = null` on failure.
- `howToFix` array items now interpolated (were passing raw before).

</details>

---

## Changes Made This Session

### Files Modified

#### `libs/nap-checker.js`
- **BUG-3 (already fixed in staged changes):** Replaced the old `else if (!websiteData)` branch (which set `status='warning'` but kept `overallConsistency=100`) with a top-level guard: when no `websiteData` AND no `otherSources`, now sets `status='unverified'` and `overallConsistency=null`. Eliminates the contradictory "Needs Attention + 100% Consistency" display.

#### `components/NAPChecker.jsx`
- **BUG-3 (already fixed in staged changes):** Added `'unverified'` case to all status color/icon/label mappings. Score display now shows `"N/A"` when `consistencyScore` is null. Progress bar is conditionally hidden when score is null.

#### `components/RevenueImpact.jsx`
- **BUG-6:** Added early-return guard when `competitors` array is empty. Previously rendered "$0/year" and "Top Competitor Avg Reviews: 0" — now renders a neutral "Revenue Impact Unavailable — re-run the audit" card instead.

#### `app/api/audit/run/route.js`
- **BUG-4:** Fixed `postFrequency` never being assigned to `auditUpdate`. The old code only set `auditUpdate.postsPerMonth` from `rawData.postFrequency`, then validated `auditUpdate.postFrequency` (which was always `undefined`), so every audit got `"unknown"`. Now assigns `auditUpdate.postFrequency = rawData.postFrequency` (validated against allowlist). Businesses with no posts will now correctly show `"never"` (from `estimatePostFrequency(0)` in outscraper.js).

#### `components/ReviewSentiment.jsx`
- **BUG-5:** Added `isEstimated` state (boolean). Set to `true` when falling back to `estimateSentimentFromRating()`, `false` when analyzing real reviews. When `isEstimated`, an amber `"Estimated · {rating}★ avg"` badge appears next to the component title. No data is removed — just made transparent.

#### `components/AuditReport.jsx`
- **BUG-8:** Added `useState` import and a shared `isUnlocked` state initialized from `audit.isUnlocked`. Added `handleUnlock` callback. Both `PaywallGate` usages now receive `isUnlocked={isUnlocked}` and `onUnlock={handleUnlock}`. Unlocking either gate now instantly unlocks both in the same session — no page reload required.

#### `components/PaywallGate.jsx`
- **BUG-8:** Added `onUnlock` prop. Removed `localUnlocked` state — now reads directly from the `isUnlocked` prop (managed by parent). Calls `onUnlock()` on successful unlock instead of setting local state.

#### `app/pricing/page.js`
- **BUG-10:** Changed `|| "#"` fallback to `|| null` for all three `DODO_*_CHECKOUT_URL` vars. Each pricing card button now renders as disabled with "Coming Soon" label when its URL is not configured, instead of silently navigating to `#?sub=email@...`.

#### `.env.local`
- **BUG-10:** Added missing `DODO_STARTER_CHECKOUT_URL=`, `DODO_GROWTH_CHECKOUT_URL=`, `DODO_AGENCY_CHECKOUT_URL=` placeholders to the `# Payments` section.

---

## Decisions Made

- **BUG-5 approach:** Chose Option B (transparent labeling) over A (remove component) or C (fetch real reviews). Component stays but is clearly marked as estimated. Real review fetching can be added later via Outscraper.
- **BUG-8 approach:** Lifted unlock state to `AuditReport` parent rather than syncing between two `PaywallGate` siblings. Cleaner, avoids prop drilling or context for a simple boolean.
- **BUG-9:** Confirmed not an issue — `app/audit/[id]/pdf/page.js` exists and works via `window.print()`. Audit page has a "Download PDF" link. No action needed.

---

## Bugs Still Open (require live audit verification)

| Bug | Status | Blocker |
|-----|--------|---------|
| BUG-1 — Competitors return 0 results | Unverified | Need to run a live audit and confirm `audit.competitors` populates |
| BUG-2 — Category shows machine type | Unverified | Need to run a live audit and check `audit.primaryCategory` value |
| BUG-7 — Industry benchmarks wrong category | Unverified | Depends on BUG-2 being verified first |

---

## New Issues Discovered

- **`postFrequency` bug was silent for all existing audits** — every audit in MongoDB has `postFrequency: "unknown"` due to the missing assignment. Re-running audits will fix new ones; existing records are stale.
- **`PaywallGate` had a subtle state ownership problem** — two independent `localUnlocked` states meant the second gate stayed locked after the first was unlocked. The 1-credit-unlocks-all promise on the pricing page was technically broken within a session.

---

## End of Session Checklist
- [ ] Run a live audit to verify BUG-1 (competitors), BUG-2 (category name), BUG-7 (benchmarks)
- [ ] Add real `DODO_*_CHECKOUT_URL` values to `.env.local` and Vercel env vars
- [ ] Merge this into CHANGELOG.md
- [ ] Update master-architecture.md if needed
- [ ] Clear this file for next session
