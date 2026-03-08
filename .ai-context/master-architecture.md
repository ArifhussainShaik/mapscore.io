# LocalScore (Mapscore.io) — Master Architecture & Rules
**Version:** 1.1 Beta
**Last Updated:** March 2026

## 1. Project Vision
LocalScore is a Google Business Profile (GBP) audit SaaS designed for local SEO freelancers and agencies. It provides a 100-point scored report, prioritized fixes, and competitor comparisons in under 30 seconds.

## 2. Tech Stack & Infrastructure
* **Framework:** Next.js 15 (App Router)
* **Database:** MongoDB Atlas (Mongoose ODM)
* **Authentication:** NextAuth.js v5 (Google OAuth + Email)
* **Payments:** Dodo Payments (Credit-based, NOT subscription)
* **Styling:** Tailwind CSS 4 + DaisyUI 5
* **Queueing:** Fallback to synchronous execution is active (Redis/BullMQ is bypassed locally)

## 3. Data Pipeline (The Source of Truth)
The application relies on specific external APIs to build the 100-point score:

1. **Google Places API:** Primary business details (Place ID, basic info, review counts)
2. **Serper API:** Fetching top 3 competitors in the exact category
3. **Outscraper:** Deep GBP enrichment (services, descriptions, posts, hours, photos)
4. **Google PageSpeed Insights:** Website performance, HTTPS, and mobile-friendliness checks

**CRITICAL DATA MAPPING:**
Outscraper returns these field names that MUST be mapped correctly:
- `working_hours` → maps to hours data
- `photos_count` → maps to photo count
- `posts` (array) → maps to activity/post data
- `products` → NOT returned by Outscraper (treat as N/A)

**SCORING RULE:** If Outscraper returns null/empty for a field, treat it as N/A (neutral). Do NOT penalize businesses for API limitations.

*Note: DataForSEO integration exists in `libs/dataforseo.js` but is on standby due to 2+ minute latency.*

## 4. The 100-Point Scoring Engine
Any UI or logic modifications must respect this exact point distribution:

* **GBP Profile Signals (33 pts):** Primary category (8), services (6), description (4), hours (4), secondary categories (4), attributes (3), products (1), service descriptions (1)
* **Review Signals (25 pts):** Count vs competitors (8), recency (6), velocity (4), avg rating (4), response rate (3)
* **Website Signals (14 pts):** Linked (4), HTTPS (2), loads (2), NAP on homepage (2), mobile responsive (2), landing page type (2)
* **Visual Signals (13 pts):** Photo count (5), variety (3), logo (2), cover (2), recent (1)
* **Activity Signals (9 pts):** Post recency (5), frequency (3), Q&A readiness (1)
* **Competitive Position (8 pts):** Review gap (3), photo gap (3), rating gap (2)

**SCORING RULES:**
- A category score can NEVER exceed its maximum points (e.g., Website Signals max is 14, never 13/12)
- If data is unavailable from API, exclude those points from both earned AND possible totals
- Example: If products data is null, Profile Signals should show X/32, not X/33

## 5. Strict Security Constraints (DO NOT REGRESS)
1. **API Authentication:** `app/api/audit/[id]/route.js` and `/status/route.js` require NextAuth session validation
2. **Rate Limiting:** `app/api/audit/run/route.js` uses Upstash Redis rate limiting (with in-memory fallback)
3. **Input Validation:** All user inputs on `/api/audit/run` are validated using Zod schemas
4. **Security Headers:** `next.config.js` contains strict headers (HSTS, X-Frame-Options, XSS-Protection)

## 6. Credit-Based Payment System
**Model:** Pay-as-you-go credits, NOT monthly subscriptions

**Pricing Tiers:**
- Starter: $9 for 3 credits
- Growth: $19 for 10 credits
- Agency: $49 for 30 credits

**Credit Rules:**
- 1 credit = 1 full audit unlock
- Credits expire 1 year from purchase date
- FIFO consumption (oldest credits used first)
- Atomic MongoDB operations prevent race conditions

**Blurred Preview System:**
- All users can run audits for free
- Free preview shows: Score + Top 3 Issues only
- Full report (all issues, competitors, action plan, PDF) requires 1 credit
- `audit.isUnlocked` boolean tracks unlock status
- Double-unlock guard prevents accidental credit loss

**Key Files:**
- `libs/credits.js` - Credit utilities (getAvailableCredits, useCredit, addCredits)
- `app/api/audit/[id]/unlock/route.js` - Unlock endpoint
- `app/api/webhooks/dodo/route.js` - Payment webhook handler
- `components/PaywallGate.jsx` - Blur overlay component

## 7. UI Standards
* **Error Handling:** Use `react-hot-toast` for UI feedback
* **Loading States:** Always show spinners during async calls
* **Component Architecture:** Server Components by default. Use `"use client"` only when state/interactivity required
* **Design System:** Light-mode glassmorphism (bg-white, rounded-3xl, border-slate-100)
* **PDF Export:** Unified light theme, no dark mode elements, no empty pages