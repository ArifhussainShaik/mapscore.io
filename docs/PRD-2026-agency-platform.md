# Mapscore — Agency Platform PRD

**Version:** 3.0 (Agency Platform pivot)
**Date:** 2026-06-19
**Author:** Shaik Arif Hussain
**Supersedes:** `docs/archive/gbp-audit-tool-mvp-spec-v2.md` (single-shot audit MVP)
**Status:** Draft — pending review

---

## 1. One-line vision

Mapscore is an all-in-one Google Business Profile (GBP) platform for local-SEO **agencies and freelancers** — audit, geo-grid rank tracking, AI-assisted GBP management, white-label reporting, and prospecting — billed **flat per location**, with no credit math.

The product evolves the existing single-shot audit tool into a multi-tenant platform where an agency manages many client locations from one dashboard and is billed by how many locations it actively manages.

---

## 2. The problem

Local-SEO freelancers and small agencies do the same repetitive work for every client, every month:

1. Audit each GBP for errors and ranking gaps.
2. Track how the business ranks across its service area (the map pack moves by neighborhood — a single "rank" number is meaningless locally).
3. Keep the profile active (posts, photos, review responses) or rankings decay.
4. Prove the work to the client with a report.
5. Find new clients by spotting unoptimized businesses.

Today this is stitched together across Local Falcon (grid tracking, confusing credits), BrightLocal (broad but gates features), spreadsheets, and manual outreach. It's expensive, fragmented, and hard to scale past a handful of clients.

**Mapscore collapses that workflow into one tool, priced so a freelancer can start at one location and an agency can scale to dozens without credit-math surprises.**

---

## 3. Who it's for

| Segment | Need | Revenue weight |
|---|---|---|
| **Local-SEO freelancers** (1–10 clients) | Affordable per-location tool that looks professional to clients | Primary |
| **Small agencies** (10–50 locations) | Multi-location dashboard, white-label, team access, automation | Primary |
| **Solo consultants / prospectors** | Audit + outreach to win clients | Secondary |
| **Multi-location SMB owners** | Self-manage a few of their own locations | Secondary |

Not targeting: enterprise/franchise (Yext/Uberall territory) or fully-managed-service buyers.

---

## 4. Competitive landscape & differentiation

### 4.1 The market (mid-2026)

| Tool | Model | Effective $/loc | Weakness we exploit |
|---|---|---|---|
| **Local Falcon** | Credit pool ($0.05/pin) | varies | Credit expiration, confusing pin math, tracking-only |
| **BrightLocal** | Per-location tiers | $10–30/loc | Gates review mgmt + white-label behind top tier; 20h cache |
| **Local Viking** | Per-listing | ~$6–39/loc | White-label gated; dated UX |
| **Whitespark** | Per-keyword | $3–12/loc | Geo-grid is a paid add-on |
| **Localo / Localith / GMBMantra** | Per-profile, AI-first | $9–39 | Thin grid depth; seat/profile caps |
| **localrank.so** | Per-loc + credits | **~$30/loc** ($297/10 loc) | Expensive, opaque credits, thin independent validation, marketing-heavy |

Market median for full management + grid: **~$10–15/location/month**. Standard keyword allowance: **5–15/location**. Geo-grid tracking is now **table stakes**.

### 4.2 Our differentiation (the wedge)

1. **Honest flat per-location pricing** — no credits, no expiration, predictable. Undercut localrank.so (~$30/loc) and BrightLocal at scale with $99/10-loc.
2. **The closed loop: audit → fix → re-scan that proves it worked.** Most tools diagnose *or* track. We tie a ranking change at a grid point back to the specific GBP/website fix that caused it, and show before/after. This is the founder's 5-year manual workflow, productized — and the #1 trust gap (competitors lean on inflated "156% improvement" claims with no proof).
3. **Bundle what rivals gate** — white-label reports + competitor analysis at *every* tier, no per-seat fees.
4. **Roadmap frontier: AI Recommendation Monitor (GEO)** — track whether ChatGPT / Gemini / Perplexity / Claude recommend a business. Genuinely new, cheap to build, and a fresh differentiator localrank.so only recently added.

**What we deliberately do NOT chase:** citation-builder networks, 15M-contact lead databases, LLM-citation micro-blog networks. Competing on feature breadth against funded players is a losing war. We win on price honesty, the proof-of-work loop, and focus.

---

## 5. Core architectural concept: managed vs prospect profiles

This single distinction governs the entire data model, feature gating, and build order.

| | **Prospect profile** | **Managed profile** |
|---|---|---|
| Access | Public data only (SERP/scrape) | Agency holds **OAuth** to the GBP |
| Permission | None needed | Owner must connect via Google Business Profile API |
| What we can do | Audit, geo-grid rank tracking, keyword gap analysis, competitor analysis, **cold outreach** | Everything above **+ post generation, post scheduling, review requests, full reporting** |
| Role in product | Lead-gen / top of funnel (Pillar F) | Recurring management value (Pillars D/E) — what they pay monthly for |

**Three states of a business in the system (billing depends on this):**

1. **Prospect** — in the agency's outreach pipeline; public audit only; **not billed**.
2. **Active location** — added to the account for tracking/audit/reporting; **this is the billing unit** (counts against the plan's location quota). Works on public data alone — GBP OAuth NOT required.
3. **Managed location** — an active location that is *also* OAuth-connected; unlocks the engagement features (posts, scheduling, review requests). Same price as any active location; `managed` is a capability flag, not a billing tier.

So billing is per **active location**, regardless of managed status. "Managed" gates *features*, not *billing*.

**Implication for build order:** posting, scheduling, and review features require Google Business Profile API access (an application to Google with lead time) + per-owner OAuth. Everything else works on public data with no external gate. Therefore the high-differentiation, no-gate work (rank tracking) ships first, while the Google API application runs in parallel from day one.

---

## 6. Pillars & features

| Pillar | Feature | Mode | Status | Build size |
|---|---|---|---|---|
| **A. Audit & Insights** | 100-pt GBP audit (errors, gaps, map-pack) | Public | ✅ Built | — |
| | Keyword gap analysis (you vs competitors) | Public | Build | Medium |
| | Competitor analysis (GBP + website) | Public | Partial | Medium |
| **B. Multi-tenant container + billing** | Org → Client → Location model; per-location billing; team access | — | Build | Large |
| **C. Geo-grid rank tracking** | Weekly grid scans, heatmap, local-pack vs organic, trends | Public | Build | Large |
| **D. Engagement (managed)** | Review request emails | Managed | Build | Small–Med |
| | AI GBP post generator (Claude) | Managed | Build | Small |
| | GBP post scheduler (auto-publish) | Managed | Build | Med–High |
| **E. Reporting** | White-label automated monthly reports | Managed | Partial | Medium |
| **F. Prospecting** | Bulk audit by name/area → assisted outreach | Public | Build | Medium |
| **G. GEO (frontier)** | AI Recommendation Monitor (ChatGPT/Gemini/Perplexity/Claude) | Public | Build | Medium |

### 6.1 Feature detail

**A — Keyword gap analysis.** For a location's tracked keywords + auto-discovered terms, compare the business's grid rankings and on-profile signals against the top 3 competitors. Output: keywords where competitors rank and the business doesn't, missing categories/services, and the specific gap. Data via DataForSEO (keyword data + grid) + competitor scrape.

**C — Geo-grid rank tracking.** For each location: a configurable grid (default 7×7 = 49 points, radius configurable in miles) is scanned weekly for each tracked keyword. Each point records the business's map-pack position. Aggregate metrics: ARP (Average Rank Position), ATRP, SoLV (Share of Local Voice). Visualized as a heatmap; trends week-over-week. **No Google permission needed** (public SERP via DataForSEO). Local-pack results are separated from organic. Scans run on the DataForSEO **standard queue** (latency irrelevant for a weekly cron).

**D — Review requests.** For managed locations, the owner/agency uploads or syncs customer contacts; Mapscore sends branded follow-up emails requesting a Google review with a direct review link. Throttled, opt-out compliant. (SMS deferred to later.)

**D — AI post generator.** Generate GBP posts (offers, promotions, updates, events) via Claude API (Haiku-class model for cheap bulk generation; higher-tier model for premium quality). Tone/brand configurable per client. Generation works instantly; *publishing* requires the managed-profile gate.

**D — Post scheduler.** Schedule generated/edited posts to auto-publish to the GBP via Google Business Profile API at chosen times. Requires API access approval + owner OAuth. **Interim fallback before approval:** generate + "copy to clipboard" / draft-to-owner email, so the feature delivers value before the API gate clears.

**E — White-label reporting.** Automated monthly (and on-demand) reports per location/client: score trend, grid rank movement (before/after), competitor position, work done (posts, reviews), recommendations. Agency branding (logo, colors, domain). Delivered as PDF + shareable URL, auto-emailed to the client.

**F — Prospecting.** Agency enters business names or a category + area; Mapscore bulk-pulls public profiles, runs audits, and surfaces unoptimized businesses ranked by opportunity. Assisted outreach: generate a personalized email referencing the prospect's specific gaps, sent from the **agency's own connected mailbox**, throttled, with opt-out. (See risk §11 — this is *assisted*, not a spray cannon, for legal + deliverability reasons.)

**G — AI Recommendation Monitor.** Periodically query LLMs ("best {category} in {city}") and detect whether the business is mentioned/recommended; track visibility per model over time. Differentiation play; cost-controlled by frequency.

---

## 7. Pricing & packaging

### 7.1 Recommended tiers (generous-undercut model)

Flat **per-location**, tiered by location count. No credits. Annual = 20% off.

| Tier | Locations | Monthly | $/loc | Worst-case margin |
|---|---|---|---|---|
| **Solo** | 1 | $29 | $29 | ~95% |
| **Starter** | up to 3 | $50 | $16.67 | ~92% |
| **Agency** | up to 10 | $99 | ~$9.90 | ~86% |
| **Scale** | up to 25 | $199 | ~$8 | ~83% |
| **Enterprise** | 25+ | custom (~$8/loc) | — | >85% |

Rationale: keeps the founder's $50/$99/$199 price points but widens location counts (since marginal cost is ~$1.34/loc, see §8). This undercuts localrank.so (~$30/loc) and BrightLocal-at-scale on value-per-dollar while keeping headline prices familiar. The Solo on-ramp beats $39 rivals for single-location freelancers.

### 7.2 Feature-by-tier matrix

| Feature | Solo | Starter | Agency | Scale |
|---|---|---|---|---|
| GBP audit + fix list | ✓ | ✓ | ✓ | ✓ |
| Geo-grid tracking (7×7, 10 kw/loc, weekly) | ✓ | ✓ | ✓ | ✓ |
| Competitor analysis (GBP + site) | ✓ | ✓ | ✓ | ✓ |
| Keyword gap analysis | ✓ | ✓ | ✓ | ✓ |
| White-label reports | ✓ | ✓ | ✓ | ✓ |
| Team members (no per-seat fee) | — | ✓ | ✓ | ✓ |
| AI post generation | — | 10/mo | unlimited* | unlimited* |
| Review requests | — | ✓ | ✓ | ✓ |
| Post scheduling (managed) | — | — | ✓ | ✓ |
| Prospecting / outreach | — | — | 200 lookups/mo | higher + API |
| AI Recommendation Monitor | — | — | add-on | ✓ |

\* Fair-use. Claude cost ≈ negligible per post (Haiku-class); even 500 posts/mo is single-digit dollars.

### 7.3 Billing mechanics

- **Model:** tiered subscription products in Dodo Payments, with **in-app location-quota enforcement** (adding location #11 on a 10-loc plan prompts an upgrade). Simpler and more predictable than usage-metered billing; matches the bucket mental model.
- **Add-ons:** prospecting/outreach credit packs and the AI Recommendation Monitor as expansion-revenue levers for heavy users.
- **Why not metered credits:** credit confusion is the #1 complaint against Local Falcon/localrank.so. Flat quotas are our differentiator — keep them.
- Reuse existing Dodo integration (`libs/` + webhooks); extend `User`/`Organization` with plan, location quota, and Dodo subscription fields.

### 7.4 Optional GTM: AppSumo lifetime deal

The indie/LTD lane has effectively one incumbent (Local Rank Tracker by Rating Captain). An AppSumo launch ($59/$119/$239-style tiers) is a viable customer-acquisition channel worth evaluating as a launch tactic — documented here as optional, not core to the subscription model.

---

## 8. Unit economics

Per-location loaded cost at default allowance (7×7 grid, 10 keywords, weekly scans, DataForSEO standard queue):

```
requests/loc/month = 49 points × 10 keywords × 4.3 weeks = 2,107
data cost          = 2,107 × $0.0006                     = $1.26
competitor analysis (piggybacks on grid; PageSpeed free)  ≈ $0.08
AI posts / emails                                          ≈ negligible
-----------------------------------------------------------------
fully-loaded cost/location/month                          ≈ $1.34
```

| Tier | Price | Max locs | Data cost | Margin |
|---|---|---|---|---|
| Solo ($29) | $29 | 1 | $1.34 | 95% |
| Starter ($50) | $50 | 3 | $4.02 | 92% |
| Agency ($99) | $99 | 10 | $13.40 | 86% |
| Scale ($199) | $199 | 25 | $33.50 | 83% |

Break-even on the $199 tier is ~148 locations — we are nowhere near cost-constrained. **Guardrails:** standard scan queue only for crons (Live is 3× cost); cache competitor data from grid responses; adaptive scan frequency for low-volatility keywords.

---

## 9. Technical architecture

### 9.1 Stack (extends existing)

| Layer | Tech | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) | Existing |
| DB | MongoDB Atlas (Mongoose) | Existing |
| Auth | NextAuth.js (Google + email) | Existing; extend with org/team + GBP OAuth scope |
| Payments | Dodo Payments | Existing; extend for per-location tiers |
| Public data | DataForSEO (grid + keywords), Serper, Outscraper, PageSpeed | DataForSEO is new for grid (stub exists in `libs/dataforseo.js`); **note: current code wires Serper, not DataForSEO** |
| Managed data | Google Business Profile API | New — OAuth + localPosts + reviews. **Apply early.** |
| AI | Claude API (Anthropic) | Post generation, fix suggestions, AI rec monitor. Haiku-class for bulk; confirm current model IDs/pricing at build time |
| Jobs/scheduler | Vercel Cron + durable queue (Upstash QStash or BullMQ) | New — weekly scans, scheduled posts, monthly reports. Current synchronous fallback is insufficient at multi-location scale |
| Email | Resend | Review requests, reports, outreach |
| PDF | Puppeteer / React-PDF | Existing pattern for reports |

### 9.2 Data model (new + extended collections)

```
Organization        # the agency/freelancer account (billing entity)
  ownerUserId, name, branding{logo,colors,domain}, members[{userId,role}]
  plan, locationQuota, dodo_subscription_id, subscription_status

Client              # the agency's customer (groups locations); optional
  orgId, name, notes

Location            # THE billing unit — one GBP/business location
  orgId, clientId, google_place_id, name, address, website
  managed: Boolean, gbp_oauth{tokens...}   # managed-profile gate
  tracking{ gridSize, radiusMiles, keywords[], frequency }
  status: active|paused

Keyword             # tracked term per location (quota-enforced)
  locationId, term, addedAt

GridScan            # one weekly scan result (the rank-tracking core)
  locationId, keywordId, scannedAt
  points[{lat,lng,rank}], metrics{arp,atrp,solv}

Audit               # extends existing Audit model; now tied to a Location
  locationId, ...existing fields..., recurring: Boolean

CompetitorSnapshot  # competitors per location, GBP + website signals
  locationId, capturedAt, competitors[{place_id,name,reviews,rating,photos,website_signals}]

Post                # AI-generated GBP post
  locationId, type, content, status: draft|scheduled|published
  scheduledFor, gbp_result

ReviewRequest       # review-ask campaign + sends
  locationId, recipient, channel:email, status, reviewLink, sentAt

Report              # generated white-label report
  orgId, locationId|clientId, period, branding, metricsSnapshot, pdfUrl, shareUrl

Prospect            # outreach lead (public, not billed)
  orgId, place_id, auditSnapshot, contact, outreachStatus

OutreachEmail       # assisted outreach send
  orgId, prospectId, fromMailbox, body, status, sentAt
```

Existing `User`, `Audit`, `SavedProfile`, `Lead`, `Benchmark` are reused/extended; `SavedProfile` is largely subsumed by `Location`.

### 9.3 Security (carry forward existing constraints, extend for multi-tenancy)

- **Tenant isolation:** every query scoped by `orgId`; users access only their org's data. Extend the existing per-user ownership checks (`app/api/audit/[id]`) to org-level row scoping.
- Preserve existing: NextAuth session validation, Upstash rate limiting, Zod input validation, strict security headers (`next.config.js`).
- GBP OAuth tokens encrypted at rest; least-scope requests.

---

## 10. Phased roadmap

Build order is **forced** by the managed/prospect architecture and the "everything hangs off a Location" dependency.

| Phase | Pillar | Scope | Gate |
|---|---|---|---|
| **0** | A | Stabilize existing audit tool | — |
| **1** | **B** | Org → Client → Location multi-tenancy; per-location billing (Dodo tiered + quota); team access; refactor audit to attach to Location; location dashboard | **Start Google Business Profile API application here (parallel)** |
| **2** | **C** | DataForSEO grid scanning; weekly cron + durable queue; rank heatmap UI; keyword gap analysis; competitor analysis. **Headline differentiator.** | None (public data) |
| **3** | **E** | White-label automated monthly reporting (builds on B+C data) | None |
| **4** | **D** | GBP API OAuth → AI post generation + scheduler + review requests | Google API approval + owner OAuth |
| **5** | **F** | Prospecting bulk-audit + assisted outreach | Email/legal compliance |
| **6** | **G** | AI Recommendation Monitor (GEO) | None |

**Recommended headline first feature (after B): Pillar C (geo-grid tracking)** — highest differentiation, no external gate, works on prospects too. *(This was deferred for final confirmation; documented as recommendation.)*

Each phase gets its own spec → implementation plan → build cycle. Phase 1 is the next writing-plans target.

---

## 11. Risks & mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| **Google Business Profile API approval lead time** | Blocks Pillar D | Apply at start of Phase 1 (parallel); interim copy-paste/draft fallback for posts |
| **Cold-email legal (CAN-SPAM/GDPR/CASL) + domain reputation** | Legal + deliverability | *Assisted* outreach only: send from agency's own connected mailbox, throttled, opt-out, no purchased EU lists, clear sender identity |
| **Scraping ToS / blocking** | Data outages | Use paid APIs (DataForSEO/Serper/Outscraper) that handle proxies; abstract data layer for swap |
| **Scan cost blowup** | Margin | Standard queue only; quota enforcement; caching; adaptive frequency |
| **Scheduler reliability at scale** | Missed scans/posts | Durable queue (QStash/BullMQ), not synchronous; retries + alerting |
| **Multi-tenant data leak** | Trust/legal | Strict `orgId` scoping; extend existing ownership checks; tests |
| **Feature-war with funded competitors** | Strategic | Don't match breadth; win on price honesty + proof-of-work loop + focus |
| **Per-location pricing cannibalized by cheap entrants (Localith $9)** | Pricing pressure | Differentiate on the closed loop + white-label depth, not lowest price |

---

## 12. Success metrics (first 90 days post-Phase-2)

| Metric | Target |
|---|---|
| Activation (orgs adding ≥1 location) | set at launch |
| Paid orgs | 30+ |
| Locations under management | 150+ |
| MRR | $3,000+ |
| Gross margin | >85% |
| Weekly scan reliability | >99% |
| Free→paid conversion | >5% |
| Logo/location churn | <8%/mo |

---

## 13. Open decisions (deferred)

1. **Headline first feature after Pillar B** — recommendation: Pillar C (geo-grid). Awaiting final confirmation.
2. **Exact tier boundaries** — generous-undercut proposed (1/3/10/25); confirm before billing build.
3. **AppSumo LTD** — evaluate as launch GTM channel (yes/no).
4. **AI Recommendation Monitor priority** — Phase 6 vs earlier as differentiator.
5. **Claude model selection + current API pricing** — confirm at Phase-4 build (Haiku-class for bulk generation).

---

## 14. Appendix — competitive pricing reference (mid-2026)

- Local Falcon: credit pool, $0.05/pin PAYG; $24.99–$199.99/mo.
- BrightLocal: Track $39 / Manage $49 / Grow $59 (1 loc); scales by location bucket; +5–10% Jul 2026.
- Local Viking: $39 (1 listing) → $99 (20 listings).
- Whitespark: Local Rank Tracker $14–$200; grids +$10/mo add-on.
- Localo: $39–$249/mo by profile count.
- localrank.so: $57 / $297 (10 loc) / $497 / $2,997 — per-loc + credits.
- DataForSEO Google Maps SERP: standard $0.0006/req, priority $0.0012, live $0.002.
- PageSpeed Insights API: free (25k/day).
