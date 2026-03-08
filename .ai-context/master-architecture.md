# LocalScore (Mapscore.io) — Master Architecture & Rules
**Version:** 1.0 Beta
**Last Updated:** March 2026

## 1. Project Vision
[cite_start]LocalScore is a Google Business Profile (GBP) audit SaaS designed for local SEO freelancers and agencies[cite: 1]. It provides a 100-point scored report, prioritized fixes, and competitor comparisons in under 30 seconds.

## 2. Tech Stack & Infrastructure
* [cite_start]**Framework:** Next.js 15 (App Router) [cite: 6]
* [cite_start]**Database:** MongoDB Atlas (Mongoose ODM) [cite: 6]
* [cite_start]**Authentication:** NextAuth.js v5 (Google OAuth + Email) [cite: 7]
* [cite_start]**Payments:** Dodo Payments (Handles global tax compliance/India limitations) [cite: 7]
* **Styling:** Tailwind CSS 4 + DaisyUI 5
* [cite_start]**Queueing:** Fallback to synchronous execution is active (Redis/BullMQ is bypassed locally)[cite: 8].

## 3. Data Pipeline (The Source of Truth)
The application relies on specific external APIs to build the 100-point score. The AI must use this exact pipeline:
1.  **Google Places API:** Primary business details (Place ID, basic info, review counts).
2.  [cite_start]**Serper API:** Fallback search and fetching top 3 competitors in the exact category[cite: 11].
3.  **Outscraper:** Deep GBP enrichment (services, detailed descriptions, posts). *Note: Handles empty data gracefully if Outscraper misses.*
4.  [cite_start]**Google PageSpeed Insights:** Website performance, HTTPS, and mobile-friendliness checks[cite: 11].
*Note: DataForSEO integration is built in `libs/dataforseo.js` but is currently on standby for Phase 2 optimization. Do not swap out the active pipeline.*

## 4. The 100-Point Scoring Engine
[cite_start]Any UI or logic modifications must respect this exact point distribution[cite: 27]:
* [cite_start]**GBP Profile Signals (33 pts):** Primary category (8) [cite: 29][cite_start], services (6) [cite: 29][cite_start], description (4) [cite: 29][cite_start], hours (4) [cite: 29][cite_start], secondary categories (4) [cite: 29][cite_start], attributes (3) [cite: 29][cite_start], products (1) [cite: 29][cite_start], service descriptions (1)[cite: 29].
* [cite_start]**Review Signals (25 pts):** Count vs competitors (8) [cite: 30][cite_start], recency (6) [cite: 30][cite_start], velocity (4) [cite: 30][cite_start], avg rating (4) [cite: 30][cite_start], response rate (3)[cite: 30].
* [cite_start]**Website Signals (14 pts):** Linked (4) [cite: 31][cite_start], HTTPS (2) [cite: 31][cite_start], loads (2) [cite: 31][cite_start], NAP on homepage (2) [cite: 31][cite_start], mobile responsive (2) [cite: 31][cite_start], landing page type (2)[cite: 31].
* [cite_start]**Visual Signals (13 pts):** Photo count (5) [cite: 32][cite_start], variety (3) [cite: 32][cite_start], logo (2) [cite: 32][cite_start], cover (2) [cite: 32][cite_start], recent (1)[cite: 32].
* [cite_start]**Activity Signals (9 pts):** Post recency (5) [cite: 33][cite_start], frequency (3) [cite: 33][cite_start], Q&A readiness (1)[cite: 33].
* [cite_start]**Competitive Position (8 pts):** Review gap (3) [cite: 34][cite_start], photo gap (3) [cite: 34][cite_start], rating gap (2)[cite: 34].

## 5. Strict Security Constraints (DO NOT REGRESS)
The following security implementations have been successfully built and MUST NOT be removed or overwritten by new code generation:
1.  **API Authentication:** `app/api/audit/[id]/route.js` and `/status/route.js` require NextAuth session validation. Users can only access their own audits.
2.  **Rate Limiting:** `app/api/audit/run/route.js` uses Upstash Redis rate limiting (with in-memory fallback).
3.  **Input Validation:** All user inputs on the `/api/audit/run` endpoint are validated strictly using Zod schemas.
4.  **Security Headers:** `next.config.js` contains strict headers (HSTS, X-Frame-Options, XSS-Protection). Do not alter these.

## 6. Development Rules & UI Standards
* **Paywall Logic:** Free tier provides 3 audits. The Competitor Table and PDF export are strictly blurred/locked behind the Dodo Payments Pro subscription.
* **Error Handling:** Use `react-hot-toast` for UI feedback. Always provide loading spinners during async calls.
* **Component Architecture:** Use Server Components by default. Use `"use client"` only when React state or interactivity is required.