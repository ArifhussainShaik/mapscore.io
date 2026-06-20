# Home Page Redesign — Design Spec

**Date:** 2026-06-20
**Status:** Draft for review
**Scope:** `app/page.js` (public marketing home) + its directly-owned components (nav, hero, feature sections, pricing, footer). The dashboard/app shell is OUT of scope.

---

## 1. Problem

The current home page (`app/page.js`, written 2026-06-09) is "AI-slop" on three concrete levels:

1. **It violates the project's own design system.** `docs/DESIGN-GUIDELINES.md` (Phase 0, 2026-06-19) mandates *aggressive restraint*: indigo `#4F46E5` ("avoids default-blue"), tight radii ("avoid 16px+"), 1px borders over shadows, Inter, dense type. The page does the opposite — default `blue-600`, `rounded-2xl/3xl` (24px), `shadow-lg/xl` + `hover:-translate-y-1`, gradient corner accents, **emoji icons** (📋⭐📸🍝🦷), serif headings, `grain` texture. Every item is on the guidelines' "cheap/dated mistakes to avoid" list. The page predates the guidelines and was never reconciled.
2. **Visibly placeholder content.** Testimonials read "Owner name / Add a real customer quote here"; the founder video is a "coming soon" box.
3. **Wrong product, wrong audience.** It is branded **LocalScore** and pitches a *free consumer GBP audit*. The product pivoted to **Mapscore — a per-location agency platform** (grid tracking, white-label reports, prospecting, AI-visibility) for agencies/freelancers.

## 2. Goals

- Reposition the home page to sell the **Mapscore agency platform** to local-SEO **agencies and freelancers**.
- Replace the visual language with the `DESIGN-GUIDELINES.md` system (indigo/zinc/Inter, tight radii, 1px borders, no emoji/serif/grain).
- Lead with the differentiator — **geo-grid rank tracking** and the **closed loop (audit → fix → re-scan proves it)** — shown via in-page product visuals, not told.
- Surface honest **per-location pricing** sourced from `config.subscriptionTiers`.
- Keep a **free single-location audit** as a secondary lead-magnet CTA.
- Ship **no fake proof** — omit testimonials/metrics/logos until real ones exist.

## 3. Non-Goals

- Dashboard / app shell / in-app screen redesign.
- A multi-page marketing site (features/blog/for-agencies pages). Single page only.
- Real photography, logo design, or sourcing testimonials.
- Backend/billing changes. (Pricing is read-only display from existing config.)
- Full brand rename across the codebase (`config.appName`/`domainName`, metadata). Flagged as a related follow-up; this page uses the literal "Mapscore".

## 4. Locked Decisions

| Decision | Value |
|---|---|
| Positioning | Agency platform (Mapscore), audience = agencies/freelancers |
| Brand name on page | **Mapscore** |
| Visual system | `docs/DESIGN-GUIDELINES.md` (indigo `#4F46E5`, zinc, Inter, 6–8px radii, 1px borders) |
| Pricing | PRD per-location tiers via `config.subscriptionTiers`: Solo $29/1, Starter $50/3, Agency $99/10, Scale $199/25, + Enterprise "contact" |
| Free audit | Keep as a secondary lead-magnet CTA/section, not the page's spine |
| Proof | Pre-launch → omit testimonials/metrics/customer logos (no placeholders) |
| Product visuals | Clean in-page mock UI built from real design tokens + `libs/rankColor.js` ramp (no dependency on screenshots) |
| Icons | `lucide-react` (or inline SVG in that style). **No emoji.** |
| Logo | Typographic "Mapscore" wordmark + simple geometric grid/pin mark in code |

## 5. Information Architecture (top → bottom)

1. **Nav (sticky, 1px bottom border).** Mapscore wordmark + grid mark · links: Product, Pricing, Sign in · primary CTA **"Start free trial"** → `/dashboard` (signup/onboarding). No transparent-glass/glow treatment.
2. **Hero.** Agency-oriented headline (theme: *prove local-SEO results to every client, per location*) + subcopy on the closed loop. Primary CTA "Start free trial"; secondary "See a sample report" → `/r/[token]` sample or anchor. **Right/below: a geo-grid heatmap visual** rendered from `libs/rankColor.js` (the differentiator, shown). No pill-badge, no radial-glow blur.
3. **Closed-loop wedge.** Three tight steps — **Audit → Fix → Re-scan proves it** — lucide icons, 1px-bordered cards, no emoji. This is the core narrative.
4. **Core features (restrained bento).** Geo-grid tracking · White-label reports · Competitor & keyword gap · AI-visibility (GEO) · Prospecting & outreach. Each card: short value line + small true-to-app mock visual, 8px radius, 1px border, no gradient/heavy shadow.
5. **Honest-pricing differentiator.** Short block on the wedge: *flat per-location, no per-keyword games* (PRD §4.2), contrasted with the category. No competitor names needed.
6. **Pricing.** New marketing pricing section rendering `config.subscriptionTiers` (Solo/Starter/Agency/Scale) + an Enterprise "contact" card. Flat per-location framing; CTA per tier → `/dashboard` or checkout. Value-verb microcopy.
7. **Free-audit lead magnet.** Compact band: "Not ready to commit? Run a free single-location audit." Reuses `SearchBar` → existing audit flow.
8. **Final CTA.** One primary action ("Start free trial"). No fake-proof footer line.
9. **Footer.** Mapscore wordmark + tagline; Product / Pricing / Legal / Account columns; rebuilt to tokens (zinc-900 surface, zinc-400 text).

## 6. Components

| Component | Action | Notes |
|---|---|---|
| `app/page.js` | Rewrite | Server component composing the sections below; static. |
| `components/marketing/Nav.jsx` (new) | Create | Sticky nav, wordmark, CTA. May fold into page if trivial. |
| `components/marketing/Hero.jsx` (new) | Create | Headline/subcopy/CTAs + heatmap visual. |
| `components/marketing/HeatmapVisual.jsx` (new) | Create | Pure-presentational grid using `libs/rankColor.js` `rankBucket`/colors. Static demo data. Color + printed rank number (a11y, per guidelines). |
| `components/marketing/ClosedLoop.jsx` (new) | Create | 3-step wedge. |
| `components/marketing/FeatureBento.jsx` (new) | Create | 5 feature cards w/ mock mini-visuals. |
| `components/marketing/PricingTiers.jsx` (new) | Create | Renders `config.subscriptionTiers`; client only if interactive toggle needed, else server. |
| `components/marketing/FreeAuditBand.jsx` (new) | Create | Wraps `SearchBar`. |
| `components/marketing/Footer.jsx` (new) or restyle `Footer.js` | Create/Restyle | Tokens. |
| `components/Pricing.js` | Leave | Old credit pricing; no longer used by home. (Not deleted here — may be used elsewhere; out of scope to remove.) |
| `components/SearchBar.jsx` | Reuse | For the free-audit band. |
| `components/ButtonSignin.js` | Reuse | Sign-in link. |
| `app/globals.css` | Edit (scoped) | Ensure Inter + indigo tokens available to marketing; remove reliance on `grain`/serif for this page. Do not break app theme. |

Marketing components live under `components/marketing/` to keep the public site isolated from app components.

## 7. Visual System (applied)

- **Type:** Inter (`--font-sans`). Marketing may use larger display sizes than the dense app (e.g. hero 44–60px/700), but body stays restrained (16–18px max for marketing readability; the 14px dashboard rule is app-specific).
- **Color:** zinc neutrals; **indigo `#4F46E5`** single brand accent; semantic muted. **Rank green→red ramp reserved exclusively for the heatmap visual** (never decorative).
- **Radii:** 6px fields, 8px boxes, pill for badges. No 16px+ card radii.
- **Elevation:** 1px borders (`border-zinc-200`) as the default; real shadow only on overlays. No `hover:-translate-y`/`shadow-xl` card lifts.
- **Motion:** minimal — subtle fade/slide on first viewport entry is OK (reuse `ScrollReveal` sparingly), but drop the staggered cubic-bezier choreography and the radial-glow.
- **Icons:** lucide line icons. No emoji anywhere.
- **No:** grain texture, serif, gradient corner accents, default blue.

## 8. Copy Direction

- Audience = agency owner / freelancer who manages many clients' Google profiles.
- Lead with the job-to-be-done: *prove ranking improvements to clients, per location, on a flat price.*
- Value-verb CTAs ("Start free trial", "See a sample report", "Run a free audit") — never "Submit"/"Learn more".
- Honest framing (PRD wedge): flat per-location, closed-loop proof, AI-visibility. Don't claim numbers we don't have. (Use `ogilvy` skill principles during copy implementation.)

## 9. Accessibility

- Heatmap visual pairs color **with the printed rank number** (guidelines rule; colorblind-safe).
- Primary CTA ≥4.5:1 contrast; one primary per view.
- Semantic landmarks (`header`/`main`/`footer`/`nav`), alt text on any imagery, focus-visible states.

## 10. Verification

- `npm run build` succeeds; `/` static.
- No console errors; Lighthouse a11y/SEO sanity pass.
- Manual visual check at mobile/tablet/desktop breakpoints.
- Grep confirms: no emoji, no `blue-600`, no `rounded-3xl`, no `grain`/serif on the page.
- Brand reads "Mapscore" throughout; pricing matches `config.subscriptionTiers`.

## 11. Open Items (resolve at build, non-blocking)

- Reconcile the per-tier CTA target (direct Dodo checkout vs `/dashboard` onboarding) with the B2 flow in `app/api/billing/checkout` / `PlanPicker.jsx`.
- `config.appName`/`domainName` still say LocalScore/localscore.io — page uses literal "Mapscore"; full config/metadata rename is a separate follow-up.
- Sample-report link target for the hero secondary CTA (existing `/r/[token]` sample vs a built demo).

## 12. Out of Scope / Deferred

- Dashboard, app shell, report viewer redesign.
- Real logo asset, testimonials, customer logos, metrics (drop in when available).
- Multi-page marketing site.
- Deleting/retiring the old credit `Pricing.js` and consumer-audit framing elsewhere.
