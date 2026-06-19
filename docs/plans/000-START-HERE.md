# Mapscore Agency Platform — Build Status & Session Handoff

**Last updated:** 2026-06-19
**Read this first when resuming in a new session.**

---

## What this is

Pivot of Mapscore (single-shot GBP audit tool) → multi-tenant **agency platform** for local-SEO agencies/freelancers, billed **flat per location**. Full vision in `docs/PRD-2026-agency-platform.md`.

## Current state

- **Existing app:** Next.js 15 + MongoDB (Mongoose) + NextAuth v4 + Dodo Payments. Audit engine (Pillar A) is built and mostly launch-ready. Billing is currently **credit-based** (to be replaced by per-location subscriptions in B2).
- **Planning: COMPLETE.** PRD + 8 phase plans written. **No implementation code written yet** for the new pillars.
- **Test infra:** none yet (Vitest + mongodb-memory-server is set up in B1 Task 1).

## Plans (all in `docs/plans/`)

| Order | Plan file | Pillar |
|---|---|---|
| 1 | `2026-06-19-phase1-B1-multitenancy.md` | Org → Location, tenant scoping, quota, dashboard |
| 2 | `2026-06-19-phase1-B2-billing.md` | Per-location Dodo subscriptions + quota |
| 3 | `2026-06-19-phase2-C1-grid-tracking.md` | Geo-grid rank tracking + heatmap (headline) |
| 4 | `2026-06-19-phase2-C2-gap-competitor.md` | Competitor + keyword gap analysis |
| 5 | `2026-06-19-phase3-E-reporting.md` | White-label reports + share links |
| 6 | `2026-06-19-phase4-D-engagement.md` | AI posts + scheduler + reviews (GBP OAuth GATED) |
| 7 | `2026-06-19-phase5-F-prospecting.md` | Prospecting + compliant outreach |
| 8 | `2026-06-19-phase6-G-ai-visibility.md` | AI Recommendation Monitor (GEO) |

**Build order is forced** (everything hangs off the `Location` entity from B1): B1 → B2 → C1 → C2 → E → D → F → G.

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
- **UI/UX:** plans include *functional* UI (DaisyUI dashboard pages/components) but there is **no dedicated UX/design-system/flows plan**. Consider adding one (frontend-design) before or alongside C1, since the heatmap + dashboards are the product's face.
- Audit model field names referenced in C2/E (`reviewCount`, `averageRating`, etc.) must be reconciled against the real `models/Audit.js` at build.

## Uncommitted / TODO

- Plans are committed to `main`.
- Nothing else pending.
```
