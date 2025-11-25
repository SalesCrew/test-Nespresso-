# Perfect Match Flow Improvements

## Overview
Enhanced the Perfect Match AI recommendation system to implement hard filtering before AI evaluation, with special priority for Stammpromotors.

## Changes Made to `/app/api/ai/recommend-promotors/route.ts`

### 1. **Matched Market & Stammpromotor Detection**
- Fetches the assignment's `matched_market_id` to get the linked market
- Retrieves market details including `stamm_promotor_id` and `cluster`
- Determines target cluster from matched market or falls back to assignment PLZ

### 2. **Hard Filter #1: Cluster Match (Lines ~60-75)**
- **Before AI:** Filters promotors to ONLY those in the same cluster as the assignment
- Uses matched market's cluster if available, otherwise determines from assignment PLZ
- Reduces promotor pool to cluster-matched candidates only
- **Result:** AI only sees promotors from the correct Bundesland/Cluster

### 3. **Hard Filter #2: Same-Day Availability (Lines ~100-145)**
- **Before AI:** Excludes promotors who are busy on the assignment day
- Checks for:
  - Other assignments on the same day
  - Krankenstand within 3 days
  - Urlaub/Zeitausgleich on the same day
- **Result:** AI only sees promotors who are actually available

### 4. **Hard Filter #3: Weekly Hours (Lines ~150-200)**
- **Before AI:** Calculates worked hours for the assignment's week
- Uses same logic as Auslastung route (9:30-18:30 = 8h with 1h break, 9:30-15:30 = 6h no break)
- Filters out promotors who have < 6 hours remaining in their contract
- **BACKUP SAFETY:** If ALL promotors are filtered out by weekly hours, disables ONLY this filter
- **Result:** AI only sees promotors with available weekly hours (or all if none available)

### 5. **Stammpromotor Priority (Lines ~210-230 & ~600-620)**
- Adds `is_stammpromotor: true` flag to promotor data if they match the market's Stammpromotor
- Updated AI prompt to ALWAYS rank Stammpromotor as #1 when available
- Post-AI enforcement: If Stammpromotor is in results but not rank 1, automatically moves to #1
- **Result:** Stammpromotor ALWAYS gets rank 1 recommendation (highest priority)

### 6. **Updated AI Prompt (Lines ~440-520)**
- Clarified that hard filters are pre-applied
- Emphasized Stammpromotor absolute priority
- Simplified reasoning structure since cluster/availability are pre-checked
- Removed redundant PLZ-to-Cluster rules (now handled in pre-filtering)

### 7. **Helper Function: `getClusterFromPLZ()` (Lines ~700-760)**
- Implements Austrian postal code to cluster mapping
- Handles all special ranges (OÖ islands in 5xxx, special Steiermark codes, etc.)
- Used for cluster determination when no matched market exists

## Filter Flow Summary

```
1. Assignment Selected by Admin
   ↓
2. Fetch Matched Market (if exists)
   ↓
3. Get Stammpromotor ID + Cluster
   ↓
4. HARD FILTER #1: Cluster Match
   - Only promotors in same cluster/Bundesland
   ↓
5. HARD FILTER #2: Same-Day Availability
   - Remove busy/krankenstand/urlaub promotors
   ↓
6. HARD FILTER #3: Weekly Hours
   - Remove promotors with full weekly hours
   - BACKUP: If ALL filtered, disable this filter only
   ↓
7. Check if Stammpromotor in filtered list
   ↓
8. AI Analysis (GPT-5-nano)
   - Receives only pre-filtered promotors
   - Ranks by proximity, experience, fair distribution
   - MUST put Stammpromotor at rank 1 if present
   ↓
9. Post-AI Enforcement
   - Verify Stammpromotor is rank 1
   - If not, automatically move to rank 1
   ↓
10. Return Top 6 Recommendations
```

## Key Benefits

1. **Performance:** AI processes fewer candidates (only cluster-matched)
2. **Accuracy:** Hard constraints guaranteed (not AI interpretation)
3. **Stammpromotor Priority:** 100% enforcement (pre-AI flag + post-AI correction)
4. **Safety:** Weekly hours backup prevents empty results
5. **Transparency:** Extensive logging for debugging

## Testing Notes

- Test with assignment that has matched market with Stammpromotor
- Test with no matched market (fallback to PLZ cluster)
- Test when Stammpromotor is not available (filtered out)
- Test when all promotors have full weekly hours (backup activates)
- Test cross-cluster scenarios (should filter correctly)

## Logging

Enhanced console logging shows:
- `🏪` Matched market detection
- `🎯` Target cluster determination
- `🔍 FILTER #1` Cluster filtering results
- `🔍 FILTER #2` Same-day availability results
- `🔍 FILTER #3` Weekly hours filtering results
- `⚠️ BACKUP ACTIVATED` When weekly hours filter disabled
- `✅ Stammpromotor` Availability and rank enforcement

