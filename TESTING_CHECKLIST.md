# MapScore Testing Checklist

## Before Running Each Test Audit

- [ ] Dev server running (`npm run dev`)
- [ ] MongoDB connected (check `.env.local` has `MONGODB_URI`)
- [ ] NextAuth configured (should have `NEXTAUTH_SECRET`)
- [ ] API keys present:
  - [ ] `GOOGLE_PLACES_API_KEY` or `SERPER_API_KEY`
  - [ ] `OUTSCRAPER_API_KEY` (optional but recommended)
  - [ ] `PAGESPEED_API_KEY` (optional)

## Test Business Selection

Good test candidates:
1. ✅ **Past client you audited manually** - Best for accuracy comparison
2. ✅ **Well-known local business** - Easy to verify data (you can see their GBP)
3. ✅ **Business with many reviews** (50+) - Tests review scoring
4. ✅ **Business with services listed** - Tests services detection
5. ❌ Avoid brand new businesses (< 5 reviews, no data)

## What to Test

### 1. Search & Data Fetching
- [ ] Enter business name + city
- [ ] Click "Get Free Audit"
- [ ] Verify it finds the correct business (not a different location)
- [ ] Check scanning progress shows (15-30 seconds expected)
- [ ] Audit completes without errors

### 2. Score Accuracy
- [ ] Overall score (0-100) seems reasonable
- [ ] Grade (A-F) matches your manual assessment
- [ ] Section scores add up correctly:
  - [ ] Profile signals (max 32 pts)
  - [ ] Review signals (max 25 pts)
  - [ ] Visual signals (max 13 pts)
  - [ ] Activity signals (max 10 pts)
  - [ ] Website signals (max 12 pts)
  - [ ] Competitive position (max 8 pts)

### 3. Data Accuracy Checks

#### Profile Data
- [ ] Business name is correct
- [ ] Address is correct
- [ ] Primary category matches GBP
- [ ] Secondary categories match GBP (if visible)
- [ ] Description text matches (or shows "unable to verify")
- [ ] Phone number is correct
- [ ] Website URL is correct
- [ ] Hours are accurate

#### Review Data
- [ ] Review count matches Google
- [ ] Average rating matches Google
- [ ] Recent review date is recent (if available)

#### Visual Data
- [ ] Photo count is reasonable (check Google Photos tab)
- [ ] Logo detected (if business has one)
- [ ] Cover photo detected

#### Activity Data
- [ ] Recent post date (check GBP Updates tab)
- [ ] Post frequency seems right

#### Competitor Data
- [ ] Shows 2-3 competitors
- [ ] Competitors are in same category
- [ ] Competitor data (reviews, rating) looks accurate

### 4. Issues Detection
- [ ] Critical issues make sense
- [ ] Warnings are relevant
- [ ] "Looking Good" section shows actual strengths
- [ ] Each issue has:
  - [ ] Clear title
  - [ ] Specific finding
  - [ ] Data citation ("Why this matters")
  - [ ] Fix instructions
  - [ ] Time estimate

### 5. UI/UX Check
- [ ] Page loads without layout shift
- [ ] Score circle renders correctly
- [ ] Section breakdown chart shows
- [ ] Issue cards expand/collapse
- [ ] Competitor table shows (should be BLURRED for free tier)
- [ ] "Upgrade to Pro" button visible on blurred sections
- [ ] PDF download button shows (top right)
- [ ] "New Audit" button works (top left)

### 6. Free Tier Paywall
- [ ] Score dashboard: VISIBLE ✅
- [ ] Critical issues: VISIBLE ✅
- [ ] Warnings: VISIBLE ✅
- [ ] Looking Good: VISIBLE ✅
- [ ] Competitor stats widget: VISIBLE ✅
- [ ] Full competitor table: BLURRED 🔒
- [ ] Upgrade CTA shows on blurred sections

### 7. Performance Check
- [ ] Audit completes in < 45 seconds
- [ ] No console errors (check browser DevTools)
- [ ] Page is responsive on mobile view

## After Test: API Cost Check

Check your API provider dashboards:

**Google Places** (if used):
- Log in to Google Cloud Console
- Navigate to APIs & Services → Dashboard
- Check "Places API" usage
- Cost: ~$0.017 per request

**Serper** (if used):
- Log in to serper.dev dashboard
- Check "API Usage"
- Cost: ~$0.01 per search

**Outscraper** (if used):
- Log in to outscraper.com dashboard
- Check "Tasks" or "Usage"
- Cost: ~$0.025 per query

**Expected total: $0.05-0.10 per audit**

## After Test: Accuracy Validation

1. Open the business on Google Maps manually
2. Compare what you see vs what the audit shows:
   - [ ] Same review count? (±5 is OK)
   - [ ] Same rating? (exact match)
   - [ ] Same category?
   - [ ] Services showing? (Click "Services" tab on GBP)
   - [ ] Description showing? (Click "About" section)

3. Check scoring logic:
   - [ ] If business has 100 reviews and competitors have 50, should score 8/8 for review count
   - [ ] If business has no services listed, should flag as critical issue
   - [ ] If description is empty, should lose 4 points in profile section

## Red Flags to Watch For

❌ **STOP and fix if you see:**
- Audit crashes or shows error page
- Score is 0 or null
- Business name is completely wrong
- Competitor table shows businesses in different cities
- All sections show "0 points"
- Console shows API errors (401 unauthorized, 429 rate limit, 500 server error)
- Audit never completes (stuck on scanning for > 2 minutes)

⚠️ **Not ideal but OK to launch:**
- Services section empty (might be API limitation)
- Description empty (might not be public)
- Competitor count is 1-2 instead of 3
- Photo count is approximate (±10)
- Post activity not detected (some businesses don't post)

## Test Results Template

After each test, record:

```
Business Tested: [Name, City]
Date: [Date]
Audit ID: [from URL]

✅ PASSED:
- Score: [X]/100
- Grade: [A-F]
- Data accuracy: [Good/Fair/Poor]
- Issues relevant: [Yes/No]
- UI working: [Yes/No]

❌ ISSUES FOUND:
- [Issue 1]
- [Issue 2]

API COSTS:
- Google Places: $X
- Serper: $X
- Outscraper: $X
- Total: $X

NOTES:
[Any observations]
```

## Recommended Test Sequence

1. **Test 1:** Well-known chain (e.g., Starbucks)
   - Easy to verify data
   - Should have all fields populated
   - Good baseline

2. **Test 2:** Local small business with reviews
   - More realistic use case
   - Check if services/description work

3. **Test 3:** Past client you audited manually
   - Best accuracy check
   - Compare your manual findings vs tool output

4. **Test 4:** Business with low score
   - New business or poorly optimized
   - Check if critical issues make sense

5. **Test 5:** Business with high score
   - Well-optimized profile
   - Check if "Looking Good" section is accurate

## When to Stop Testing and Launch

✅ Launch when:
- 3 out of 5 tests show accurate scores (within ±10 points of your manual assessment)
- No critical bugs (crashes, errors)
- Data is 80%+ accurate
- Issues make sense to you (as a domain expert)
- API costs < $0.10 per audit

❌ Don't launch until:
- At least 2 successful test audits
- No server crashes
- Paywall works (competitor table is blurred)
