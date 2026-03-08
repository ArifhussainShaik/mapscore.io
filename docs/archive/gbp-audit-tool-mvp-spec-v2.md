# GBP AUDIT TOOL: MVP PRODUCT SPECIFICATION (v2)

## Updated: February 14, 2026
## Changes from v1: Stripe replaced with Dodo Payments. Supabase replaced with MongoDB. ShipFast boilerplate ($299) as foundation. Timeline compressed from 10 weeks to 3-4 weeks.

---

## Product Name Options
- LocalScore
- ProfileGrade
- GBP Grader
- MapScore
- LocalAudit

(Pick one. Keep it short, memorable, and available as a .com domain.)

---

## 1. WHAT THIS TOOL DOES (One Sentence)

Enter a business name and city. Get a scored GBP audit report with prioritized fixes, competitor comparison, and a downloadable PDF.

---

## 2. WHO THIS IS FOR

Primary users (80% of revenue):
- Local SEO freelancers who need a fast audit tool for client pitches
- Small agencies (1-5 people) who manually audit GBP profiles today
- Marketing consultants who want to look professional with PDF reports

Secondary users (20% of revenue):
- Local business owners who want to understand their GBP health
- Agencies evaluating new prospects before sending proposals

---

## 3. THE CORE PROBLEM

Manual GBP audits take 30-45 minutes per profile. Freelancers and agencies do this repeatedly for every prospect and client. The process is the same every time: check categories, check description, check services, check photos, check reviews, check hours, check attributes, compare to competitors.

This repetitive work is prime for automation.

---

## 4. PRICING MODEL

Free Tier:
- 3 audits per month
- Basic score and top 3 issues only
- No PDF export
- Email capture required

Pro Plan: $29/month
- Unlimited audits
- Full detailed report with all checks
- PDF export (white-label for agencies)
- Competitor comparison (top 3)
- Weekly re-scan alerts for saved profiles
- Priority action list with impact scores

Agency Plan: $79/month (Phase 2)
- Everything in Pro
- Bulk audit (up to 50 profiles)
- Custom branding on PDF reports
- Client-ready presentation format
- API access

---

## 5. MVP FEATURE SET (Phase 1)

### 5.1 Input: What the User Provides

Option A (preferred): Business name + city + state/country
Option B: Direct Google Maps URL

The tool searches Google Maps, finds the business, and pulls all publicly available data.

### 5.2 Data Collection Layer

Scrape or extract the following from the public GBP listing:

Profile Data:
- Business name
- Primary category
- Secondary categories (visible ones)
- Business description (first 750 chars shown publicly)
- Address (full or hidden for SABs)
- Phone number
- Website URL
- Hours of operation
- Special hours (if set)
- Opening date
- Service area (if SAB)

Visual Data:
- Total photo count
- Owner photo count vs. customer photo count
- Cover photo presence
- Logo presence
- Photo recency (last upload date if detectable)

Review Data:
- Total review count
- Average star rating
- Review recency (date of most recent review)
- Estimated monthly review velocity (last 3 months)
- Owner response count vs. total reviews (response rate)
- Average response time (if detectable)

Activity Data:
- Last post/update date (if visible)
- Post frequency (estimated from visible posts)

Attributes:
- All visible attributes
- Missing common attributes for the category

Competitor Data (top 3 in same area + category):
- Business name
- Category
- Review count
- Rating
- Photo count
- Post activity

### 5.3 The Scoring Algorithm

Total score: 0-100 points

Weights based on Whitespark 2026 Local Search Ranking Factors and Search Atlas ML Study.

```
SCORING BREAKDOWN (100 points total)

GBP PROFILE SIGNALS (32 points)
  Primary category relevance        8 pts
  Secondary categories (3-5 added)  4 pts
  Services section populated        6 pts
  Description quality/length        4 pts
  Hours accuracy and coverage       4 pts
  Attributes completion             3 pts
  Products section (if applicable)  3 pts

REVIEW SIGNALS (25 points)
  Review count vs. competitors      8 pts
  Average rating                    4 pts
  Review recency (last 30 days)     6 pts
  Review velocity (monthly avg)     4 pts
  Owner response rate               3 pts

VISUAL SIGNALS (13 points)
  Total photo count (target 50+)    5 pts
  Photo variety (categories)        3 pts
  Logo uploaded                     2 pts
  Cover photo set                   2 pts
  Recent photos (last 30 days)      1 pt

ACTIVITY SIGNALS (10 points)
  Post recency (within 7 days)      5 pts
  Post frequency                    3 pts
  Q&A / Ask Maps readiness          2 pts

WEBSITE SIGNALS (12 points)
  Website linked                    4 pts
  Website is HTTPS                  2 pts
  Website loads (not broken)        2 pts
  Has NAP on homepage               2 pts
  Mobile responsive                 2 pts

COMPETITIVE POSITION (8 points)
  Review count vs. top 3            3 pts
  Rating vs. top 3                  2 pts
  Photo count vs. top 3             3 pts
```

### 5.4 Scoring Rules Per Check

Primary Category (8 points)

| Condition | Score |
|-----------|-------|
| Category matches what top 3 competitors use for same business type | 8 |
| Category is valid but may not be optimal (different from competitors) | 5 |
| Category seems mismatched to actual business services | 2 |
| No category detected | 0 |

Data source: Whitespark 2026 ranks primary category as the #1 controllable ranking factor. Joy Hawkins documented a drop from #1 to #31 from a single category change.

Secondary Categories (4 points)

| Condition | Score |
|-----------|-------|
| 3-5 relevant secondary categories | 4 |
| 1-2 secondary categories | 2 |
| No secondary categories | 0 |

Services Section (6 points)

| Condition | Score |
|-----------|-------|
| 10+ services listed with descriptions | 6 |
| 5-9 services listed | 4 |
| 1-4 services listed | 2 |
| No services | 0 |

Data source: Sterling Sky 2022 retest confirmed services have ranking impact. Effects appear within 24-72 hours.

Description (4 points)

| Condition | Score |
|-----------|-------|
| 500-750 characters, includes service keywords and city | 4 |
| 250-499 characters with some keywords | 3 |
| Under 250 characters or no keywords | 1 |
| No description | 0 |

Hours (4 points)

| Condition | Score |
|-----------|-------|
| Hours set, 12+ hours per day, open weekends | 4 |
| Hours set, standard business hours | 3 |
| Hours set but limited | 2 |
| No hours or "temporarily closed" | 0 |

Data source: Joy Hawkins discovered business hours as a top-5 ranking factor (November 2023). Businesses vanish from local pack when closed.

Review Count vs. Competitors (8 points)

| Condition | Score |
|-----------|-------|
| More reviews than average of top 3 competitors | 8 |
| Within 25% of competitor average | 5 |
| 50-75% of competitor average | 3 |
| Under 50% of competitor average | 1 |
| Under 10 reviews total | 0 |

Data source: Search Atlas ML Study shows review count is 26% of ranking variance for top 10 positions.

Review Recency (6 points)

| Condition | Score |
|-----------|-------|
| Review received in last 7 days | 6 |
| Review received in last 14 days | 4 |
| Review received in last 30 days | 2 |
| No review in 30+ days | 0 |

Data source: Darren Shaw ranks review recency in his top 5 factors for 2025. "The moment you stop getting new reviews, you're going to see your local rankings start to slip."

Review Velocity (4 points)

| Condition | Score |
|-----------|-------|
| 4+ reviews per month average | 4 |
| 2-3 reviews per month | 3 |
| 1 review per month | 2 |
| Less than 1 per month | 0 |

Owner Response Rate (3 points)

| Condition | Score |
|-----------|-------|
| 80%+ reviews responded to | 3 |
| 50-79% responded | 2 |
| Under 50% responded | 1 |
| No responses | 0 |

Photo Count (5 points)

| Condition | Score |
|-----------|-------|
| 50+ photos | 5 |
| 20-49 photos | 3 |
| 5-19 photos | 1 |
| Under 5 photos | 0 |

Post Recency (5 points)

| Condition | Score |
|-----------|-------|
| Post within last 7 days | 5 |
| Post within last 14 days | 3 |
| Post within last 30 days | 1 |
| No recent posts or no posts visible | 0 |

Website Linked (4 points)

| Condition | Score |
|-----------|-------|
| Website linked, loads, HTTPS, mobile responsive | 4 |
| Website linked, loads, HTTPS | 3 |
| Website linked, loads | 2 |
| Website linked but broken | 1 |
| No website linked | 0 |

Data source: Whitespark 2026 ranks "Dedicated Page for Each Service" as #1 factor for local organic rankings.

### 5.5 Score Interpretation

| Score Range | Grade | Label |
|-------------|-------|-------|
| 85-100 | A | Excellent. Minor tweaks only. |
| 70-84 | B | Good. Key optimizations needed. |
| 55-69 | C | Average. Significant gaps. |
| 40-54 | D | Below average. Many issues. |
| 0-39 | F | Critical. Major overhaul needed. |

### 5.6 Output: What the User Gets

On-Screen Report:

Section 1: Score Dashboard
- Overall score (big number, color-coded)
- Grade letter
- Category breakdown (bar chart showing each section score)
- Comparison vs. competitors (side by side)

Section 2: Critical Issues (Red)
- Each issue with: what's wrong, why it matters (data citation), exact fix, estimated time to fix, impact level (high/medium/low)
- Sorted by impact: highest first

Section 3: Quick Wins (Green)
- Easy fixes that take under 15 minutes
- Same format as critical issues

Section 4: Detailed Audit (Expandable Sections)
- Profile completeness breakdown
- Review analysis with trend
- Visual content assessment
- Activity/posting analysis
- Website quick check
- Competitive position

Section 5: Priority Action Plan
- Week 1 actions (do today)
- Month 1 actions (this month)
- Ongoing actions (recurring)
- Each action has: description, estimated time, expected impact, data source

Section 6: Competitor Snapshot
- Side-by-side comparison table
- Where you win vs. where competitors win

PDF Export (Pro plan):
- Same content, formatted as a professional report
- Agency logo option (Agency plan)
- Executive summary on first page
- Branded header/footer
- Suitable for sending to clients or prospects

---

## 6. TECHNICAL ARCHITECTURE (UPDATED FOR SHIPFAST + DODO)

### 6.1 Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Boilerplate | ShipFast ($299, already purchased) | Production-ready auth, UI, email, DB, SEO out of the box |
| Frontend | Next.js 15 (App Router) | Comes with ShipFast. Vercel deploys in minutes. |
| Styling | Tailwind CSS 4 + DaisyUI 5 | ShipFast default. Fast to build. AI tools write it accurately. |
| Database | MongoDB (via Mongoose) | ShipFast default. Free tier via MongoDB Atlas (512 MB). |
| Auth | NextAuth.js | ShipFast default. Email + Google OAuth. |
| Payments | Dodo Payments | Merchant of Record. Handles global tax/VAT. No Stripe India waitlist. |
| PDF Generation | Puppeteer or React-PDF | Render HTML report as PDF. |
| Hosting | Vercel | Free hobby tier. Auto-deploys from Git. |
| Data Scraping | Outscraper + SerpAPI | Gets Google Maps data without getting blocked. |
| Website Checks | Lighthouse API / PageSpeed API | Free from Google. |
| Email | Resend (or SendGrid) | ShipFast supports both. Transactional emails. Free tiers available. |

### 6.2 Why ShipFast Saves 4-6 Weeks

ShipFast provides production-ready code for:
- NextAuth authentication (email, Google, magic links)
- MongoDB database models and connection
- DaisyUI components library
- SEO tags and meta handling
- Email templates with Resend/SendGrid
- Landing page components
- User dashboard layout
- API route patterns
- Middleware for auth protection

What you build on top of ShipFast:
- Business search flow (SerpAPI integration)
- Data extraction logic (Outscraper)
- Scoring algorithm engine
- Report UI components
- PDF export
- Dodo Payments integration (replacing Stripe)
- Free tier gating logic

### 6.3 Why Dodo Payments (Not Stripe)

Problem: Stripe India is invite-only as of 2024-2025. Indian founders face RBI/FEMA compliance issues collecting international payments. Setting up a US LLC or Stripe Atlas adds $500+ and weeks of paperwork.

Dodo Payments solves this:

| Feature | Dodo Payments | Stripe (if accessible) |
|---------|--------------|----------------------|
| Availability for Indian founders | Open signup | Invite-only in India |
| Merchant of Record | Yes (Dodo is legal seller) | No (you handle taxes) |
| Global tax compliance | Handled (VAT, GST, sales tax, 220+ countries) | You must configure |
| Indian payment methods | UPI, RuPay, local cards | Limited |
| Payouts to Indian banks | Local transfers (no SWIFT fees) | SWIFT with conversion fees |
| US entity required | No | No (but India limited) |
| W-8BEN complexity | Simple (Dodo as MoR handles withholding) | You manage |
| Affiliate program support | Built-in | Requires third-party |
| Automatic invoices | Tax-compliant, auto-generated | You configure |

Dodo Payments pricing:
- Standard: 4% + $0.40 per transaction (pay-as-you-go)
- India domestic (UPI/cards): 4% + INR 4 for one-time payments
- No monthly platform fees
- No hidden costs
- Enterprise: Custom pricing with dedicated support

### 6.4 Dodo Payments Integration

Install:
```
npm install dodopayments @dodopayments/nextjs standardwebhooks
```

Environment variables (.env.local):
```
DODO_PAYMENTS_API_KEY=your_api_key
DODO_WEBHOOK_SECRET=your_webhook_secret
DODO_PAYMENTS_ENVIRONMENT=test_mode
```

Test environment: https://test.dodopayments.com
Live environment: https://live.dodopayments.com
Reference boilerplate: https://github.com/dodopayments/dodo-nextjs-minimal-boilerplate

Step 1: Create products in Dodo Dashboard
- Pro Plan: $29/month (subscription)
- Agency Plan: $79/month (subscription, Phase 2)
- Copy product IDs to your config

Step 2: Create payment endpoint
- API route: /api/payments/create-subscription
- Creates a Dodo subscription for the user
- Returns a payment_link URL
- Redirect user to Dodo's hosted checkout

Step 3: Set up webhook endpoint
- API route: /api/webhooks/dodo
- Verify webhook signature using Standard Webhooks spec
- Process payment events

Step 4: Handle webhook events
- payment.succeeded: Update user credits/plan in MongoDB
- subscription.created: Activate Pro/Agency access
- subscription.cancelled: Downgrade to free tier
- subscription.payment_failed: Send dunning email via Resend

Step 5: Customer portal
- Dodo provides hosted customer portal URL
- Users manage billing, cancel, update payment method
- No custom billing UI needed for MVP

ShipFast migration notes:
- ShipFast has Stripe files in: libs/stripe.js, app/api/webhook/stripe/route.js
- Replace libs/stripe.js with libs/dodo.js
- Replace webhook route with Dodo webhook handler
- Update config.js payment plans with Dodo product IDs
- Update User model: stripe_customer_id becomes dodo_customer_id

### 6.5 Data Flow

```
USER INPUT (business name + city)
         |
         v
GOOGLE MAPS SEARCH (via SerpAPI/proxy)
         |
         v
EXTRACT PUBLIC GBP DATA
  Profile info (name, category, description, hours)
  Review data (count, rating, recent reviews)
  Photo data (count, types visible)
  Post data (recent posts visible)
  Competitor data (top 3 nearby same category)
  Website URL
         |
         v
WEBSITE CHECK (if URL exists)
  HTTPS check
  Load test
  Mobile responsive check (Lighthouse API)
  NAP presence check (scrape homepage text)
         |
         v
SCORING ENGINE
  Apply scoring rules per check
  Calculate section scores
  Calculate total score
  Generate grade
  Build priority action list
  Compare vs. competitors
         |
         v
REPORT GENERATOR
  On-screen interactive report
  PDF export (Pro/Agency)
  Save to user dashboard
```

### 6.6 Data Scraping Approach

Option 1: SerpAPI ($50/month for 5,000 searches)
- Reliable. Legal. Returns structured Google Maps data.
- Good for MVP. Each audit requires 2-4 API calls (main business + competitors).
- 5,000 searches = roughly 1,250-2,500 audits per month.

Option 2: Outscraper ($25/month starter)
- Specifically built for Google Maps data extraction.
- Returns reviews, photos, hours, categories, attributes.
- More detailed data than SerpAPI for GBP specifically.

Option 3: Google Maps Platform APIs (Places API)
- Official Google API. Most reliable.
- Costs per request ($17 per 1,000 Place Details requests).
- Does NOT return all GBP data (no services, limited attributes).
- Use as supplement, not primary source.

Recommendation: Start with Outscraper for GBP-specific data. Add SerpAPI for competitor search. Total: $75/month for data.

### 6.7 Key Technical Decisions

Caching:
Cache each business audit result for 7 days. If user re-runs audit within 7 days, show cached result with "last scanned" date. This reduces API costs dramatically.

Rate Limiting:
Free tier: 3 audits per month (tracked by email + IP).
Pro tier: No limit, but queue requests to avoid overwhelming data providers.

Background Processing:
Audit should run as a background job. Show a "Scanning your profile..." screen with progress indicators. Estimated time: 15-30 seconds per audit.

---

## 7. DATABASE SCHEMA (MongoDB)

```javascript
// Users collection
// ShipFast default user model + custom fields for our tool
{
  _id: ObjectId,
  name: String,
  email: String,                    // unique
  image: String,                    // profile picture (NextAuth)
  emailVerified: Date,              // NextAuth
  plan: String,                     // "free" | "pro" | "agency" (default: "free")
  dodo_customer_id: String,         // Dodo Payments customer ID
  dodo_subscription_id: String,     // Active subscription ID
  subscription_status: String,      // "active" | "cancelled" | "past_due" | "none"
  agency_name: String,              // For agency plan white-label
  agency_logo_url: String,          // For agency plan white-label
  audits_this_month: Number,        // Counter for free tier limit (default: 0)
  audits_reset_date: Date,          // When counter resets
  created_at: Date,
  updated_at: Date
}

// Audits collection
{
  _id: ObjectId,
  user_id: ObjectId,                // ref: users
  business_name: String,
  business_address: String,
  google_place_id: String,
  primary_category: String,
  secondary_categories: [String],
  description: String,
  phone: String,
  website_url: String,
  hours: Object,                    // { monday: "9:00-17:00", ... }
  attributes: Object,               // { wheelchair: true, parking: "free street" }
  services: [Object],               // [{ name: "Service", description: "..." }]
  photo_count: Number,
  owner_photo_count: Number,
  has_logo: Boolean,
  has_cover_photo: Boolean,
  review_count: Number,
  average_rating: Number,           // Decimal (4.7)
  recent_review_date: Date,
  monthly_review_velocity: Number,  // Decimal
  response_rate: Number,            // Decimal (0.0 to 1.0)
  last_post_date: Date,
  post_frequency: String,           // "weekly" | "monthly" | "rarely" | "never"
  website_https: Boolean,
  website_loads: Boolean,
  website_mobile: Boolean,
  website_has_nap: Boolean,
  competitors: [Object],            // [{ name, category, reviews, rating, photos }]
  total_score: Number,              // 0-100
  grade: String,                    // A, B, C, D, F
  section_scores: Object,           // { profile: 28, reviews: 20, ... }
  issues: [Object],                 // [{ id, severity, section, title, description, fix, ... }]
  action_plan: [Object],            // [{ priority, action, time, impact, source }]
  raw_data: Object,                 // Full API response (for debugging)
  cached_until: Date,               // Cache expiry (7 days from creation)
  created_at: Date
}

// Saved Profiles collection (for monitoring alerts)
{
  _id: ObjectId,
  user_id: ObjectId,                // ref: users
  audit_id: ObjectId,               // ref: audits (most recent)
  business_name: String,
  google_place_id: String,
  alert_enabled: Boolean,           // default: true
  last_alert_sent: Date,
  created_at: Date
}
```

Mongoose model files to create:
- models/User.js (extend ShipFast default)
- models/Audit.js (new)
- models/SavedProfile.js (new)

---

## 8. USER FLOW (SCREENS)

### Screen 1: Landing Page
- Headline: "How healthy is your Google Business Profile? Find out in 30 seconds."
- Search bar: Business name + city
- "Get Free Audit" button
- Below fold: sample report screenshot, how it works (3 steps), pricing, testimonials

### Screen 2: Searching
- "Searching for [business name] in [city]..."
- Show map animation or loading bar
- If multiple matches: show list of businesses, user picks the right one

### Screen 3: Scanning
- "Analyzing [Business Name]..."
- Progress indicators showing each check:
  - Checking profile completeness...
  - Analyzing reviews...
  - Evaluating photos...
  - Scanning competitors...
  - Checking website...
  - Generating report...
- Estimated time: ~20 seconds

### Screen 4: Report (Free Tier)
- Score prominently displayed
- Top 3 critical issues visible
- Rest of report blurred/locked
- CTA: "Unlock full report with Pro plan" or "Sign up free to see 3 full reports"

### Screen 5: Report (Pro Tier)
- Full interactive report
- All sections expandable
- "Download PDF" button
- "Save and Monitor" button
- "Share Report" link option

### Screen 6: Dashboard (Logged In)
- List of saved audits
- Score change indicators (if re-scanned)
- Quick re-scan button per profile
- Alert settings per profile

### Screen 7: Billing (Dodo Customer Portal)
- Link to Dodo hosted customer portal
- Manage subscription, cancel, update payment method
- View invoices and receipts
- No custom billing UI needed for MVP

---

## 9. ISSUE TEMPLATES

Each detected issue follows this format in the report:

```
ISSUE: [Clear name]
SEVERITY: Critical / High / Medium / Low
SECTION: [Profile / Reviews / Photos / Activity / Website / Competitive]

WHAT WE FOUND:
[Specific finding. Example: "Your profile has no services listed."]

WHY THIS MATTERS:
[Data-backed explanation. Example: "Sterling Sky testing confirmed
that adding services has direct ranking impact. Effects appear
within 24-72 hours. Pre-defined services from Google have stronger
impact than custom services."]

HOW TO FIX:
[Step by step instructions]
1. Go to Google Search and type "my business"
2. Click "Edit Services"
3. Check all relevant pre-defined services Google suggests
4. Add custom services for anything not covered
5. Write a 300-character description for each service

TIME TO FIX: 30 minutes
EXPECTED IMPACT: High
TIME TO SEE RESULTS: 24-72 hours
```

### 9.1 Complete Issue Library (Build These Into the Tool)

PROFILE ISSUES:

1. No services listed
2. Few services listed (under 5)
3. No business description
4. Short description (under 250 characters)
5. Description missing city name
6. Description missing primary service keywords
7. No secondary categories
8. Only 1-2 secondary categories
9. Primary category may be suboptimal (differs from top competitors)
10. Hours not set
11. Limited hours (under 8 hours/day)
12. Closed on weekends (if competitors are open)
13. No special/holiday hours set
14. Missing common attributes for this category
15. No products listed (if applicable category)
16. No website linked
17. Website link is broken

REVIEW ISSUES:

18. Under 10 total reviews
19. Fewer reviews than competitors
20. No review in last 30 days
21. Low review velocity (under 1/month)
22. Review velocity lower than competitors
23. Owner has not responded to reviews
24. Low response rate (under 50%)
25. Rating below 4.0
26. Rating lower than competitor average

VISUAL ISSUES:

27. Under 5 photos total
28. Under 20 photos total
29. No logo uploaded
30. No cover photo set
31. No recent photos (last 60 days)
32. Fewer photos than competitors

ACTIVITY ISSUES:

33. No posts/updates visible
34. No post in last 30 days
35. No post in last 7 days
36. Competitors post more frequently

WEBSITE ISSUES:

37. No website linked to GBP
38. Website not HTTPS
39. Website not loading
40. Website not mobile responsive
41. No NAP found on homepage

COMPETITIVE ISSUES:

42. Review gap: X fewer reviews than top competitor
43. Rating gap: lower rating than market average
44. Photo gap: fewer photos than competitors
45. Activity gap: competitors post more frequently

---

## 10. MONETIZATION MATH (UPDATED FOR DODO PAYMENTS)

### 10.1 Revenue Targets

| Milestone | Monthly Revenue | Users Needed (at $29/mo) | Timeline |
|-----------|----------------|--------------------------|----------|
| Ramen profitable | $1,000 | 35 Pro users | Month 3-4 |
| Cover costs + salary | $3,000 | 104 Pro users | Month 6-8 |
| Healthy SaaS | $10,000 | 345 Pro users | Month 12-18 |

### 10.2 Cost Structure (Updated)

| Cost | Monthly |
|------|---------|
| Vercel hosting | $0-20 |
| MongoDB Atlas | $0-25 (free tier: 512 MB) |
| Data scraping (Outscraper + SerpAPI) | $75-150 |
| Domain | ~$1 |
| Email service (Resend) | $0-20 |
| Dodo Payments fees (4% + $0.40/txn) | Variable |
| ShipFast license | $0 (one-time $299, already paid) |
| Total fixed costs | ~$100-215/month |

Break-even: 4-8 Pro users at $29/month.

### 10.3 Unit Economics (Dodo Payments)

Pro Plan ($29/month):
- Revenue per user: $29.00
- Dodo fee: 4% + $0.40 = $1.56
- Net revenue per user: $27.44
- Data cost per audit: ~$0.03-0.06 (Outscraper pricing)
- Average audits per user per month: ~10-20
- Data cost per user per month: ~$0.30-1.20
- Gross margin per user: ~90-94%

Agency Plan ($79/month):
- Revenue per user: $79.00
- Dodo fee: 4% + $0.40 = $3.56
- Net revenue per user: $75.44
- Gross margin per user: ~93-95%

Comparison to Stripe:
- Stripe fee would be: 2.9% + $0.30 = $1.14 per $29 charge
- Dodo fee: $1.56 per $29 charge
- Difference: $0.42 per transaction
- At 100 Pro users: $42/month more with Dodo vs. Stripe
- Tradeoff is worth it: Dodo eliminates all tax compliance, entity setup, and India payment barriers

### 10.4 Tax Compliance for Indian Founder

Dodo acts as Merchant of Record. This means:
- Dodo is the legal seller on all customer invoices
- Dodo handles VAT, GST, and sales tax collection for all 220+ countries
- You receive payouts to your Indian bank account as a vendor of Dodo
- No US LLC or foreign entity needed
- No SWIFT fees on payouts (local Indian bank transfers)

What you still need to do:
- Submit W-8BEN form to Dodo (individual, not W-8BEN-E)
- PAN card required for KYC verification
- File Indian income tax on revenue received from Dodo
- GST registration optional unless exceeding INR 20 lakh threshold
- Keep records of all Dodo payouts for CA/tax filing

Important: Use W-8BEN (individual) not W-8BEN-E. W-8BEN-E is only for Pvt Ltd or LLP entities. Using the wrong form delays payouts.

---

## 11. GO-TO-MARKET (First 100 Users)

### 11.1 Launch Sequence

Week 1-2: Soft launch to network
- Message your 111+ Upwork clients: "I built a tool that does what I do manually. Try it free."
- Post on LinkedIn: Share the tool with a before/after comparison
- Offer lifetime Pro access to first 10 users who give feedback

Week 3-4: Content-driven acquisition
- Write "I audited 50 businesses and here's what I found" post on LinkedIn
- Share aggregate data (anonymized) showing common issues
- Each post includes CTA to try the free audit

Month 2: SEO and partnerships
- Create landing pages for "[city] Google Business Profile audit"
- Build 20-30 city-specific pages
- Reach out to other SEO freelancers: offer affiliate 20% commission
- Dodo Payments has built-in affiliate program support

Month 3: Paid acquisition testing
- Google Ads on "GBP audit tool" and "Google Business Profile audit"
- Test $5-10/day budget
- Target: under $50 customer acquisition cost

### 11.2 Free Audit as Lead Magnet

The free tier is your growth engine. Here's why:

1. Freelancer finds your tool
2. Runs free audit on their client's profile
3. Sees the score and top 3 issues (free)
4. Wants the full report to send to client
5. Upgrades to Pro for $29/month
6. Runs audits for every prospect moving forward

This is the exact workflow you follow on Upwork. You're productizing your own sales process.

### 11.3 Affiliate Program (Built Into Dodo)

Dodo Payments supports affiliate tracking natively.
- Set 20% recurring commission for affiliates
- Affiliates get unique referral links
- Dodo handles payout tracking and payment
- Target: SEO freelancers, agency owners, course creators
- This is free marketing. Other people sell your tool for a cut.

---

## 12. DEVELOPMENT TIMELINE (UPDATED: ShipFast + AI Code Tools)

### Week 1: Foundation (ShipFast Setup + Data Layer)
- Clone ShipFast repo, configure MongoDB Atlas
- Install Dodo Payments: npm install dodopayments @dodopayments/nextjs
- Create Dodo account, set up test products
- Set up NextAuth (ShipFast default)
- Build business search flow (SerpAPI integration)
- Build data extraction module (Outscraper integration)
- Create Audit and SavedProfile Mongoose models

### Week 2: Scoring Engine + Report UI
- Build scoring algorithm (all rules from Section 5.4)
- Generate issue list based on scores
- Build priority action plan generator
- Create competitor comparison logic
- Build the interactive report page (score dashboard, issue sections, action plan)
- Build competitor comparison table

### Week 3: Monetization + PDF + Polish
- Replace ShipFast Stripe files with Dodo Payments integration
- Set up Dodo webhook handler
- Implement free tier gating (blur/lock report sections)
- PDF export for Pro users (Puppeteer)
- User dashboard with saved audits
- Email notifications (welcome, weekly re-scan alerts)

### Week 4: Launch Prep
- Landing page optimization (use ShipFast components)
- 10 beta users for feedback
- Bug fixes and edge cases
- Write documentation / help content
- Set up analytics (PostHog or Plausible)
- Switch Dodo from test_mode to live_mode
- Deploy to Vercel production

Total: 3-4 weeks to launch-ready MVP

ShipFast saves 4-6 weeks by providing auth, database, email, UI components, and deployment infrastructure out of the box. Dodo Payments saves another week by eliminating tax compliance setup.

This timeline assumes 3-4 hours per day using AI code tools (Cursor, Bolt, or Lovable). If you go full-time, ship in 2 weeks.

---

## 13. WHAT TO BUILD AFTER MVP (Phase 2)

Only build these after proving demand with Phase 1:

1. Citation Audit Module ($39/month tier)
   - Check top 30 US directories for NAP consistency
   - Flag duplicates, inconsistencies, missing listings
   - Priority fix list

2. Weekly Re-scan with Change Detection
   - Auto re-run audit weekly
   - Alert user if score drops
   - Show what changed (new reviews, lost photos, etc.)

3. AI-Generated Fix Suggestions
   - Auto-write optimized business description
   - Auto-suggest services to add
   - Auto-generate review response templates
   - Uses Claude API in the backend

4. White-Label PDF Reports
   - Agency branding
   - Custom colors and logo
   - Client-ready format

5. Bulk Audit
   - Upload CSV of 50 businesses
   - Get all audits in one batch
   - Export comparison spreadsheet

6. Indian Market Expansion
   - UPI payments via Dodo (already supported)
   - Hindi/regional language reports
   - India-specific directory checks (JustDial, Sulekha, IndiaMart)

---

## 14. RISKS AND MITIGATIONS

| Risk | Impact | Mitigation |
|------|--------|------------|
| Google blocks scraping | High | Use paid API providers (SerpAPI, Outscraper). They handle proxies and rotation. |
| Google changes GBP public data structure | Medium | Monitor for changes weekly. Abstract data extraction into a single module for easy updates. |
| Low conversion from free to paid | High | Test different gates. Maybe show 5 issues free instead of 3. A/B test the paywall position. |
| Competitor copies the scoring idea | Low | Your 500+ audit experience is the moat. The scoring weights are informed by real results, not generic formulas. |
| Data accuracy concerns | Medium | Show "last scanned" date. Allow manual override. Be transparent about data source. |
| Users expect the tool to fix issues (not just report) | Medium | Clear messaging: "audit and prioritize" not "manage and fix." Phase 2 adds action features. |
| Dodo Payments downtime or issues | Low | Dodo has 99.9% uptime SLA. Worst case: users retry payment. Keep Stripe as future fallback. |
| Dodo fee higher than Stripe | Low | $0.42/txn difference at $29 plan. At 345 users = $145/month extra. Offset by zero tax compliance cost. |

---

## 15. SUCCESS METRICS (First 90 Days)

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Free audits run | 500+ | MongoDB audit count where plan = free |
| Email signups | 200+ | MongoDB user count |
| Pro conversions | 30+ | Dodo dashboard: active subscriptions |
| MRR | $870+ | Dodo dashboard: monthly recurring revenue |
| Churn rate | Under 10% | Monthly cancellations / total active |
| NPS score | 40+ | Survey after first audit |
| Average audits per Pro user | 10+/month | MongoDB aggregation query |
| Affiliate signups | 10+ | Dodo affiliate dashboard |

---

## 16. THE SCORING ALGORITHM IS YOUR MOAT

Most audit tools give generic pass/fail checks. Your tool is different because:

1. Weighted by real data. Every score weight comes from Whitespark 2026 (47 experts, 187 factors) and Search Atlas ML Study (7,718 businesses). You cite the source in each issue report.

2. Competitor-relative scoring. A business with 50 reviews scores differently in a market where competitors average 20 reviews vs. 200 reviews. Context matters.

3. Priority ordering matches real-world impact. You've done 500+ manual audits. You know that fixing primary category produces results in 72 hours while link building takes months. The action plan reflects real timelines.

4. Issues come with exact instructions. Not "optimize your description." Instead: "Go to Google Search, type 'my business', click Edit Profile, navigate to About tab, write a description using this template..." Step by step.

This is your 5 years of freelancing expertise, packaged as software.

---

## 17. FILES TO HAND TO AI CODE TOOLS

When you sit down with Cursor or Bolt, have these files ready:

1. This product spec (this document, v2)
2. scoring-rules.json (all scoring rules from Section 5.4 as structured data) [ALREADY CREATED]
3. issues-library.json (all 45 issue templates from Section 9.1 with full text) [ALREADY CREATED]
4. sample-audit-data.json (one real audit you've done, structured as the data model)
5. wireframes/ (simple hand-drawn or Figma screenshots of each screen)

Start with: "I have a ShipFast Next.js boilerplate with MongoDB and NextAuth already set up. Build me a GBP audit feature that takes a business name and city, fetches Google Maps data via SerpAPI/Outscraper, runs a scoring algorithm, and displays an interactive audit report. Replace the existing Stripe payment integration with Dodo Payments."

Then iterate screen by screen.

---

## 18. DODO PAYMENTS QUICK REFERENCE

### Files to Modify in ShipFast

| ShipFast File | Action | New File/Content |
|--------------|--------|-----------------|
| config.js | Update | Replace Stripe plan IDs with Dodo product IDs |
| libs/stripe.js | Delete | Replace with libs/dodo.js |
| app/api/webhook/stripe/route.js | Delete | Replace with app/api/webhook/dodo/route.js |
| components/ButtonCheckout.jsx | Update | Use Dodo payment link instead of Stripe Checkout |
| models/User.js | Update | Change stripe_customer_id to dodo_customer_id |
| .env.local | Update | Add DODO_PAYMENTS_API_KEY, DODO_WEBHOOK_SECRET, DODO_PAYMENTS_ENVIRONMENT |

### Dodo Config Example (config.js)

```javascript
const config = {
  // Dodo Payments
  dodo: {
    plans: [
      {
        name: "Pro",
        priceId: "prd_XXXXX",  // From Dodo dashboard
        price: 29,
        currency: "USD",
        interval: "month",
        features: [
          "Unlimited audits",
          "Full detailed reports",
          "PDF export",
          "Competitor comparison",
          "Weekly re-scan alerts"
        ]
      },
      {
        name: "Agency",
        priceId: "prd_YYYYY",  // Phase 2
        price: 79,
        currency: "USD",
        interval: "month",
        features: [
          "Everything in Pro",
          "Bulk audit (50 profiles)",
          "Custom branding on PDFs",
          "API access"
        ]
      }
    ]
  }
};
```

### Webhook Events to Handle

| Event | Action |
|-------|--------|
| payment.succeeded | Update user plan in MongoDB, send welcome email |
| subscription.created | Set subscription_status = "active" |
| subscription.cancelled | Downgrade to free at period end |
| subscription.payment_failed | Send dunning email, set status = "past_due" |
| subscription.active | Confirm active status |
| refund.succeeded | Downgrade plan, log refund |

### Key API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/payments/create-subscription | POST | Create Dodo subscription, return payment link |
| /api/webhooks/dodo | POST | Receive and process Dodo webhook events |
| /api/payments/portal | GET | Return Dodo customer portal URL |
| /api/payments/status | GET | Check current subscription status |

---

## 19. COMPLETE FILE STRUCTURE (ShipFast + Custom)

```
project-root/
  app/
    api/
      audit/
        search/route.js          # Business search (SerpAPI)
        run/route.js             # Run full audit (Outscraper + scoring)
        [id]/route.js            # Get specific audit
      payments/
        create-subscription/route.js  # Dodo checkout
        portal/route.js               # Dodo customer portal
        status/route.js               # Check subscription
      webhooks/
        dodo/route.js            # Dodo webhook handler
      auth/[...nextauth]/route.js  # ShipFast default
    dashboard/
      page.js                    # Saved audits list
    audit/
      [id]/page.js               # Full audit report view
    page.js                      # Landing page
    pricing/page.js              # Pricing page
  components/
    AuditReport.jsx              # Main report component
    ScoreDashboard.jsx           # Score circle + grade
    IssueCard.jsx                # Individual issue display
    CompetitorTable.jsx          # Side-by-side comparison
    ActionPlan.jsx               # Priority action list
    SearchBar.jsx                # Business name + city input
    ScanningProgress.jsx         # Loading/progress screen
    PaywallGate.jsx              # Free tier blur/lock
    ButtonCheckout.jsx           # Dodo checkout button (modified ShipFast)
  libs/
    dodo.js                      # Dodo Payments helper functions
    scoring.js                   # Scoring algorithm engine
    issues.js                    # Issue detection and template matching
    serpapi.js                   # SerpAPI integration
    outscraper.js                # Outscraper integration
    pdf.js                       # PDF generation (Puppeteer)
    mongoose.js                  # ShipFast default DB connection
  models/
    User.js                      # Extended ShipFast user model
    Audit.js                     # Audit results
    SavedProfile.js              # Monitoring profiles
  data/
    scoring-rules.json           # Scoring rules (already created)
    issues-library.json          # Issue templates (already created)
  public/
    ...                          # Static assets
```

---

## END OF MVP PRODUCT SPECIFICATION (v2)

Changes log from v1:
- Stripe replaced with Dodo Payments throughout
- Supabase (PostgreSQL) replaced with MongoDB (Mongoose)
- ShipFast boilerplate added as foundation
- Development timeline compressed from 10 weeks to 3-4 weeks
- Added Section 6.3: Why Dodo Payments
- Added Section 6.4: Dodo Payments Integration
- Added Section 10.4: Tax Compliance for Indian Founder
- Added Section 11.3: Affiliate Program
- Added Section 18: Dodo Payments Quick Reference
- Added Section 19: Complete File Structure
- Updated all Stripe references to Dodo in metrics and cost sections
- Database schema converted from SQL to MongoDB/Mongoose format
- Added Phase 2 item: Indian Market Expansion
