# Mapscore Agency Platform — Build Status & Session Handoff

**Last updated:** 2026-06-19
**Read this first when resuming in a new session.**

---

## What this is

Pivot of Mapscore (single-shot GBP audit tool) → multi-tenant **agency platform** for local-SEO agencies/freelancers, billed **flat per location**. Full vision in `docs/PRD-2026-agency-platform.md`.

## Current state

- **Existing app:** Next.js 15 + MongoDB (Mongoose) + NextAuth v4 + Dodo Payments. Audit engine (Pillar A) is built and mostly launch-ready. Billing is currently **credit-based** (to be replaced by per-location subscriptions in B2).
- **Planning: COMPLETE.** PRD + 8 phase plans written.
- **Build progress:** ✅ **Phase 0 + B1 + B2 + C1 + C2 DONE** — all merged to `main` (C2 merged 2026-06-20, 55 tests green). Next: **E (white-label reporting)**.
- **Test infra:** ✅ Vitest + mongodb-memory-server live (`npm test`, 22 tests green).

### Carry-overs before B2 / next session
- `npm run build` **compiles clean** but page-data collection fails: `MONGODB_URI` is **empty** in `.env.local` (pre-existing — trips `libs/mongo.js`). Set a real URI to finish `npm run build`, run the migration **dry-run** (`node scripts/migrate-to-orgs.js --dry-run`), and do the manual UI smoke (`/dashboard/locations`).
- Phase 0 Task 8 **dashboard activation checklist deferred to C1** (needs the `GridScan` model).
- `/dashboard` now wrapped in the sidebar `AppShell` — give it a visual pass against the existing audit page.

## Plans (all in `docs/plans/`)

| Order | Plan file | Pillar |
|---|---|---|
| 0 (∥) | `2026-06-19-phase0-UX-design-system.md` | Design system, app shell, rank-color, onboarding (run parallel to B1, before C1) |
| 1 | `2026-06-19-phase1-B1-multitenancy.md` | Org → Location, tenant scoping, quota, dashboard |
| 2 | `2026-06-19-phase1-B2-billing.md` | Per-location Dodo subscriptions + quota |
| 3 | `2026-06-19-phase2-C1-grid-tracking.md` | Geo-grid rank tracking + heatmap (headline) |
| 4 | `2026-06-19-phase2-C2-gap-competitor.md` | Competitor + keyword gap analysis |
| 5 | `2026-06-19-phase3-E-reporting.md` | White-label reports + share links |
| 6 | `2026-06-19-phase4-D-engagement.md` | AI posts + scheduler + reviews (GBP OAuth GATED) |
| 7 | `2026-06-19-phase5-F-prospecting.md` | Prospecting + compliant outreach |
| 8 | `2026-06-19-phase6-G-ai-visibility.md` | AI Recommendation Monitor (GEO) |

**Build order is forced** (everything hangs off the `Location` entity from B1): **Phase 0 (UX) ∥ B1** → B2 → C1 → C2 → E → D → F → G. Phase 0 has no B1 dependency (except its last task touches B1's LocationManager) and **must land before C1** so the heatmap + all screens use the shared design system and `libs/rankColor.js`.

## How to resume

1. Read the PRD, then this file.
2. Execute plans in order with `superpowers:executing-plans` or `superpowers:subagent-driven-development` (each plan names the required sub-skill in its header).
3. Start with **B1, Task 1** (Vitest harness).

## Key decisions already made

- **Pricing (recommended, baked into B2):** Solo $29/1, Starter $50/3, Agency $99/10, Scale $199/25, Enterprise custom. Flat per-location, no credits. *(Confirm exact numbers before B2 billing build.)*
- **Differentiation wedge:** honest flat per-location pricing + closed loop "audit → fix → re-scan proves it" + AI-visibility (GEO). Don't chase competitor feature breadth (vs localrank.so, BrightLocal).
- **Data provider for grid:** DataForSEO standard queue (margin). NOTE: current code wires Serper — DataForSEO integration still to build.
- **Managed vs prospect (PRD §5):** billing is per *active location*; `managed` (GBP OAuth) is a feature flag, not a billing tier.

## Open items / external dependencies

- **Apply for Google Business Profile API access NOW** — long-lead gate for Pillar D (posts/scheduler). D ships in draft mode until approved.
- **Confirm final pricing tier numbers** before B2.
- **UI/UX:** ✅ addressed — Phase 0 UX/design-system plan written (`2026-06-19-phase0-UX-design-system.md`) from 5-agent competitor + best-practice research. Includes tokens, custom DaisyUI theme, app shell, colorblind-safe rank ramp, white-label report structure, onboarding/CTA standards. Run it parallel to B1, before C1. A `docs/DESIGN-GUIDELINES.md` reference is its first task.
- Audit model field names referenced in C2/E (`reviewCount`, `averageRating`, etc.) must be reconciled against the real `models/Audit.js` at build.

## Uncommitted / TODO

- Plans are committed to `main`.
- Nothing else pending.
```
