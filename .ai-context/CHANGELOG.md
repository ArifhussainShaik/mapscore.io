# LocalScore Development Changelog

## How to Use This File
- AI: Read this file at the start of every session to understand project history
- Updates: Add new entries at the TOP (newest first)
- Format: Follow the entry template exactly

---

## [2026-03-08] Credit System + Bug Fixes

### Features Added
- **Credit-Based Payments**: Replaced subscription model with credit packs ($9/3, $19/10, $49/30)
- **Blurred Preview System**: Free users see score + top 3 issues only
- **Revenue Impact Calculator**: Interactive slider showing potential lost revenue

### Bugs Fixed
- **Outscraper Field Mappings**: Fixed bug where `working_hours` and `photos_count` were available in raw JSON but showed as 'not set'. Restored the legacy PIPELINE (`google-places` + `outscraper`) in `data-provider.js` to ensure the mapped fields effectively reach the reporting engine.
- **Outscraper Posts Timestamp Bug**: Fixed a bug where Unix timestamps in seconds were improperly evaluated, casting them correctly to milliseconds so dates map logically.
- **Score Overflow Bug**: Clamped scores to their maximum values in `scoring.js` so they can never exceed their intended bounds (e.g. Website Signals showing 13/12).
- **Missing Products Mapping**: Correctly mapped Outscraper missing `products` to `null` and flagged them as `isNA=true`, avoiding penalties for unretrievable fields.

### Files Changed
- `models/User.js` - Added credits, creditHistory, creditsUsed fields
- `models/Audit.js` - Added isUnlocked, unlockedAt, unlockedBy fields
- `libs/credits.js` - NEW: Credit utilities (getAvailableCredits, useCredit, addCredits)
- `components/PaywallGate.jsx` - Rebuilt as interactive blur overlay
- `components/RevenueImpact.jsx` - Converted to interactive calculator
- `app/pricing/page.js` - NEW: Credit pack pricing page
- `app/api/webhooks/dodo/route.js` - NEW: Dodo payment webhook
- `app/api/audit/[id]/unlock/route.js` - NEW: Credit unlock endpoint
- `libs/outscraper.js` - Updated field mappings and timestamps mapping logic
- `libs/scoring.js` - Fix for score clamping and `isNA` check on products
- `libs/data-provider.js` - Restored and fully replaced DataForSEO logic with the exact Google Places > Outscraper > Serper pipeline

### Technical Decisions
- **Why credits over subscriptions**: Better unit economics, agencies on unlimited plans would destroy margins
- **FIFO credit consumption**: Oldest credits used first, prevents gaming expiry
- **Atomic MongoDB operations**: Prevents race conditions on simultaneous unlock clicks

### Known Issues (To Fix)
- None (Bugs from original prompt were successfully patched)

### API Costs
- Google Places: $0.017/call
- Outscraper: $0.025/call
- Serper: $0.004/call
- Total per audit: ~$0.06

---

## [2026-03-07] DataForSEO Rollback

### What Happened
- Attempted DataForSEO integration for richer GBP data
- Latency was 120+ seconds per audit (unacceptable)
- Rolled back to Google Places + Outscraper + Serper pipeline (~27 seconds)

### Files Changed
- `libs/dataforseo.js` - Created but now on standby
- `libs/data-provider.js` - Reverted to original pipeline

### Lesson Learned
- DataForSEO has better data but latency kills UX
- Keep the integration code for future batch processing use case

---

## [2026-03-06] UI Overhaul Complete

### Features Added
- Glassmorphism scanning screen (bg-white/80 backdrop-blur-xl)
- Light-mode PDF export (removed dark mode elements)
- Fixed PDF checkbox characters (stripped markdown)
- Responsive grid layout for ScoreDashboard

### Files Changed
- `components/ScanningProgress.jsx`
- `components/AuditReport.jsx`
- `components/ScoreDashboard.jsx`
- `app/audit/[id]/pdf/page.js`

---

## Entry Template (Copy for New Entries)

## [YYYY-MM-DD] Brief Title

### Features Added
- **Feature Name**: One-line description

### Bugs Fixed
- **Bug Name**: What was wrong → How it was fixed

### Files Changed
- `path/to/file.js` - What changed

### Technical Decisions
- **Why X over Y**: Reasoning

### Known Issues
- [ ] Issue description

### API Costs (if changed)
- Provider: $X.XX/call
