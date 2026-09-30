# ACNC warm-lead radar

Monthly snapshot of the ACNC charity register + financials into Supabase,
flagged for Jenny (software) and Phil (video) fit.

## Setup (once, ~15 minutes)
1. Supabase SQL editor: run `orgs_table.sql`.
2. Get the workflow (`.github/workflows/acnc-monthly.yml` at the transform-site repo root) onto `main`.
3. Repo > Settings > Secrets and variables > Actions > add `SUPABASE_DB_URL`
   = the **Session pooler** connection string (Supabase > Project > Connect).
   Not the direct connection: that's IPv6-only and GitHub runners are IPv4.
4. Actions tab > "ACNC monthly snapshot" > Run workflow. Check the run summary.

After that it runs itself early on the 2nd of every month.

## Files
- `fetch_acnc.py` downloads the latest register + two newest AIS years from data.gov.au
- `acnc_extract.py` keeps the useful columns, drops charities spending under $5K, adds fit flags and triggers
- `load_supabase.py` loads one month; re-running a month replaces it cleanly
- `.github/workflows/acnc-monthly.yml` (repo root) the schedule

## Tuning
Thresholds and exclusions sit at the top of `acnc_extract.py`. Change, commit, re-run.

## Useful views
- `sa_shortlist` latest month, SA, fit orgs, best first
- `org_changes` what changed since last month (website, name, board size, new financials)
