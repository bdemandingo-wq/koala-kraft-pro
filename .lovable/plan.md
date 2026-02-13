
# Fix: Staff Home Address Geocoding for "West Palm Beach" and Similar Addresses

## Problem
The address "4380 RACHEL WAY WESTPALM BEACH, FL, 33406" fails to geocode because:
1. "WESTPALM BEACH" (no space) isn't recognized by the Nominatim geocoder
2. The address normalization function doesn't correct common city name misspellings
3. The candidate builder struggles with comma-separated formats like "CITY, ST, ZIP"

## Solution
Update the `geocode-address` Edge Function to:

1. **Add common city name corrections** - Map "westpalm" to "west palm", "fortlauderdale" to "fort lauderdale", etc.
2. **Improve comma-separated address parsing** - Better handle formats like "4380 RACHEL WAY WESTPALM BEACH, FL, 33406" where commas separate city, state, and zip
3. **Add a structured candidate** - Parse the comma-delimited input directly into "street, city, state zip" format before falling back to word-based heuristics

## Technical Details

### File: `supabase/functions/geocode-address/index.ts`

**Changes to `normalizeUSAddress()`:**
- Add a city name correction map for commonly concatenated names (westpalm -> west palm, fortlauderdale -> fort lauderdale, etc.)
- Apply corrections after initial normalization

**Changes to `buildCandidates()`:**
- Add a pre-check: if the original input contains commas, split on commas first to extract street/city/state/zip parts directly
- This handles "4380 RACHEL WAY WESTPALM BEACH, FL, 33406" by splitting into ["4380 RACHEL WAY WESTPALM BEACH", "FL", "33406"] and then combining with the corrected city name

**Expected result:** The address will be normalized to "4380 rachel way, west palm beach, FL 33406, usa" which Nominatim can resolve successfully.
