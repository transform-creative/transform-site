#!/usr/bin/env python3
"""
ACNC -> one clean CSV for Supabase (Transform Creative warm-lead radar)

Joins the ACNC Register with one or two years of AIS financial data on ABN,
keeps only the columns that matter, and adds fit flags + free triggers.

Usage:
    pip install pandas openpyxl
    python acnc_extract.py \
        --register datadotgov_main.csv \
        --ais datadotgov_ais24.xlsx \
        --ais-prev datadotgov_ais23.xlsx \
        --out orgs.csv \
        --snapshot-month 2026-10

Optional:
    --state SA        only keep charities whose address state is SA
                      (default: keep all of Australia and filter in Supabase)

Accepts .csv, .tsv or .xlsx for every input. Runs monthly via GitHub Actions
(see .github/workflows/acnc-monthly.yml); can also be run by hand.
"""

import argparse
import re
import sys
from datetime import date

import pandas as pd

# ---------------------------------------------------------------------------
# Tune these. Everything else follows from them.
# ---------------------------------------------------------------------------
JENNY_REVENUE_MIN = 1_000_000
JENNY_REVENUE_MAX = 10_000_000
JENNY_DONATIONS_MIN = 300_000
JENNY_MAX_GOV_SHARE = 0.70          # above this they're grant-funded, not donor-driven
PHIL_REVENUE_MIN = 1_000_000
PASS_THROUGH_SHARE = 0.60           # grants out / total expenses at or above this = pass-through
MILESTONES = [25, 50, 75, 100, 125, 150, 175, 200]  # 10th anniversaries rarely move budgets
ANNIVERSARY_WINDOW = (date.today().year, date.today().year + 2)
EXCLUDE_NAME_PATTERNS = [r"lutheran"]  # Isaac's friend works there - keep off lists
MIN_TOTAL_EXPENSES = 5_000             # drop rows we KNOW spend less than this. Blank = kept (BRCs, new charities)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def norm(s: str) -> str:
    """Normalise a header so 'Total Revenue', 'total revenue', 'total_revenue' all match."""
    return re.sub(r"[^a-z0-9]", "", str(s).lower())


def load(path: str) -> pd.DataFrame:
    if path.lower().endswith((".xlsx", ".xls")):
        df = pd.read_excel(path, dtype=str)
    else:
        # data.gov.au offers CSV and TSV; Excel exports can be either. Detect from the header row.
        with open(path, encoding="utf-8-sig", errors="replace") as fh:
            header = fh.readline()
        sep = "\t" if header.count("\t") > header.count(",") else ","
        df = pd.read_csv(path, sep=sep, dtype=str, encoding="utf-8-sig",
                         encoding_errors="replace", low_memory=False)
    df.columns = [str(c).strip() for c in df.columns]
    df = df.loc[:, [c and not c.startswith("Unnamed") for c in df.columns]]  # trailing empty columns
    return df


def pick(df: pd.DataFrame, *candidates: str, required: bool = False, label: str = ""):
    """Return the first column in df whose normalised name matches a candidate."""
    lookup = {norm(c): c for c in df.columns}
    for cand in candidates:
        if norm(cand) in lookup:
            return df[lookup[norm(cand)]]
    msg = f"  ! column not found: {candidates[0]}" + (f" ({label})" if label else "")
    if required:
        sys.exit(msg + " - required, stopping.")
    print(msg + " - leaving blank", file=sys.stderr)
    return pd.Series([None] * len(df), index=df.index)


def clean_abn(s: pd.Series) -> pd.Series:
    s = s.astype(str).str.replace(r"\.0$", "", regex=True).str.replace(r"\D", "", regex=True)
    return s.where(s.str.len() > 0).str.zfill(11)


def to_bool(s: pd.Series) -> pd.Series:
    v = s.astype(str).str.strip().str.lower()
    out = pd.Series(pd.NA, index=s.index, dtype="boolean")
    out[v.isin(["y", "yes", "true", "1", "t"])] = True
    out[v.isin(["n", "no", "false", "0", "f"])] = False
    return out


def flag(s: pd.Series) -> pd.Series:
    """Register purpose/beneficiary flags are 'Y' or blank - blank means False, not unknown."""
    return to_bool(s).fillna(False).astype(bool)


def to_num(s: pd.Series) -> pd.Series:
    cleaned = s.astype(str).str.replace(r"[,$\s]", "", regex=True).str.replace(r"^\((.*)\)$", r"-\1", regex=True)
    return pd.to_numeric(cleaned, errors="coerce")


def to_date(s: pd.Series) -> pd.Series:
    """ISO dates (1976-05-01) parsed as ISO; everything else Australian day-first (15/03/1927)."""
    s = s.astype(str).str.strip().str.slice(0, 19)
    iso = s.str.match(r"^\d{4}-\d{2}-\d{2}")
    out = pd.to_datetime(s.where(iso), errors="coerce", format="mixed")
    other = pd.to_datetime(s.where(~iso), errors="coerce", dayfirst=True, format="mixed")
    return out.fillna(other)


def safe_div(a: pd.Series, b: pd.Series) -> pd.Series:
    return (a / b.where(b > 0)).round(3)


# ---------------------------------------------------------------------------
# Extract
# ---------------------------------------------------------------------------
def extract_register(path: str) -> pd.DataFrame:
    print(f"Reading register: {path}")
    r = load(path)
    out = pd.DataFrame({
        "abn": clean_abn(pick(r, "ABN", required=True)),
        "name": pick(r, "Charity_Legal_Name", required=True),
        "other_names": pick(r, "Other_Organisation_Names"),
        "website": pick(r, "Charity_Website"),
        "town": pick(r, "Town_City"),
        "state": pick(r, "State").str.upper().str.strip(),
        "postcode": pick(r, "Postcode"),
        "operates_in_sa": flag(pick(r, "Operates_in_SA")),
        "charity_size": pick(r, "Charity_Size"),
        "established_date": to_date(pick(r, "Date_Organisation_Established")),
        "financial_year_end": pick(r, "Financial_Year_End"),
        "responsible_persons_count": to_num(pick(r, "Number_of_Responsible_Persons")).round().astype("Int64"),
        "pbi": flag(pick(r, "PBI")),
        "hpc": flag(pick(r, "HPC")),
        "advancing_religion": flag(pick(r, "Advancing_Religion")),
        "advancing_education": flag(pick(r, "Advancing_Education")),
        "advancing_welfare": flag(pick(r, "Advancing_social_or_public_welfare")),
        "advancing_health": flag(pick(r, "Advancing_Health")),
        "benefits_children": flag(pick(r, "Children")) | flag(pick(r, "Early_Childhood")),
        "benefits_youth": flag(pick(r, "Youth")),
    })
    out = out.dropna(subset=["abn"]).drop_duplicates("abn", keep="last")
    # A few hundred charities have their name withheld on the public register - fall back to an
    # other name, else drop them (orgs.name is NOT NULL, and there's no one to contact anyway).
    blank = out["name"].isna() | (out["name"].astype(str).str.strip() == "")
    out.loc[blank, "name"] = out.loc[blank, "other_names"]
    nameless = out["name"].isna() | (out["name"].astype(str).str.strip() == "")
    out = out[~nameless]
    print(f"  {len(out):,} charities (dropped {int(nameless.sum()):,} with no published name)")
    return out


def extract_ais(path: str, suffix: str = "") -> pd.DataFrame:
    print(f"Reading AIS: {path}")
    a = load(path)
    out = pd.DataFrame({
        "abn": clean_abn(pick(a, "abn", required=True)),
        f"revenue_total{suffix}": to_num(pick(a, "total revenue")),
        f"donations_bequests{suffix}": to_num(pick(a, "donations and bequests")),
    })
    if not suffix:  # extra detail only from the current year
        out = out.assign(
            revenue_gov=to_num(pick(a, "revenue from government")),
            net_surplus=to_num(pick(a, "net surplus/deficit", "net surplus deficit")),
            grants_made=to_num(pick(a, "grants and donations made for use in Australia")).fillna(0)
                        + to_num(pick(a, "grants and donations made for use outside Australia")).fillna(0),
            total_expenses=to_num(pick(a, "total expenses")),
            fte=to_num(pick(a, "total full time equivalent staff")),
            volunteers=to_num(pick(a, "staff - volunteers", "staff volunteers")),
            fundraising_online=to_bool(pick(a, "fundraising - online", "fundraising online")),
            fundraising_sa=to_bool(pick(a, "fundraising - sa", "fundraising sa")),
            basic_religious_charity=to_bool(pick(a, "basic religious charity")),
            consolidated_report=to_bool(pick(a, "report consolidated with more than one entity")),
            how_purposes_pursued=pick(a, "how purposes were pursued"),
            ais_period_end=to_date(pick(a, "fin report to")),
            charity_size_ais=pick(a, "charity size"),
        )
    out = out.dropna(subset=["abn"]).drop_duplicates("abn", keep="last")
    print(f"  {len(out):,} statements")
    return out


# ---------------------------------------------------------------------------
# Flags + triggers
# ---------------------------------------------------------------------------
def anniversary(est: pd.Series):
    years, labels = [], []
    lo, hi = ANNIVERSARY_WINDOW
    for d in est:
        hit = None
        if pd.notna(d):
            for m in MILESTONES:
                if lo <= d.year + m <= hi:
                    hit = (d.year + m, m)
                    break
        years.append(hit[0] if hit else None)
        labels.append(f"{hit[1]} years" if hit else None)
    return pd.Series(years, index=est.index, dtype="Int64"), pd.Series(labels, index=est.index)


def fy_end_month(s: pd.Series) -> pd.Series:
    months = {m.lower(): i for i, m in enumerate(
        ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], 1)}

    def parse(v):
        if pd.isna(v):
            return None
        v = str(v).strip().lower()
        for k, i in months.items():
            if k in v:
                return i
        m = re.match(r"^\d{1,2}[/-](\d{1,2})", v)  # e.g. 30/06
        return int(m.group(1)) if m else None

    return s.map(parse).astype("Int64")


def add_flags(df: pd.DataFrame) -> pd.DataFrame:
    # Register sometimes leaves size blank; AIS usually has it
    if "charity_size_ais" in df:
        blank = df["charity_size"].isna() | (df["charity_size"].astype(str).str.strip() == "")
        df.loc[blank, "charity_size"] = df.loc[blank, "charity_size_ais"]
    df["gov_share"] = safe_div(df["revenue_gov"], df["revenue_total"])
    df["donations_share"] = safe_div(df["donations_bequests"], df["revenue_total"])
    # Pass-through: most of the money goes straight back out as grants (mission agencies, foundations).
    # Revenue looks big, but there's little left to spend on their own tech. Flagged, not excluded.
    df["grants_share"] = safe_div(df["grants_made"], df["total_expenses"])
    df["pass_through"] = (df["grants_share"] >= PASS_THROUGH_SHARE).fillna(False)
    if "revenue_total_prev" in df:
        df["revenue_growth"] = safe_div(df["revenue_total"] - df["revenue_total_prev"], df["revenue_total_prev"])
        df["donations_growth"] = safe_div(df["donations_bequests"] - df["donations_bequests_prev"],
                                          df["donations_bequests_prev"])

    df["established_year"] = df["established_date"].dt.year.astype("Int64")
    df["anniversary_year"], df["anniversary_label"] = anniversary(df["established_date"])
    df["fy_end_month"] = fy_end_month(df["financial_year_end"])

    names = (df["name"].fillna("") + " " + df["other_names"].fillna("")).str.lower()
    by_name = names.str.contains("|".join(EXCLUDE_NAME_PATTERNS), regex=True)
    df["excluded"] = by_name
    df["excluded_reason"] = None
    df.loc[by_name, "excluded_reason"] = "name_pattern"

    rev, don = df["revenue_total"], df["donations_bequests"]
    gov_ok = df["gov_share"].isna() | (df["gov_share"] <= JENNY_MAX_GOV_SHARE)
    df["jenny_fit"] = (
        rev.between(JENNY_REVENUE_MIN, JENNY_REVENUE_MAX)
        & (don >= JENNY_DONATIONS_MIN)
        & gov_ok
        & ~df["excluded"]
    ).fillna(False)

    religion = df["advancing_religion"]
    df["phil_fit"] = (religion & (rev >= PHIL_REVENUE_MIN) & ~df["excluded"]).fillna(False)
    # Basic religious charities don't report financials - don't lose them, flag for a look
    df["phil_review"] = (
        religion
        & (df["basic_religious_charity"].fillna(False) | rev.isna())
        & df["charity_size"].fillna("").str.lower().isin(["medium", "large"])
        & ~df["excluded"]
        & ~df["phil_fit"]
    ).fillna(False)

    df["segment"] = None
    df.loc[df["jenny_fit"] & df["phil_fit"], "segment"] = "both"
    df.loc[df["jenny_fit"] & ~df["phil_fit"], "segment"] = "jenny"
    df.loc[~df["jenny_fit"] & df["phil_fit"], "segment"] = "phil"
    df.loc[df["segment"].isna() & df["phil_review"], "segment"] = "phil_review"
    return df


COLUMNS = [
    "snapshot_month", "abn", "name", "other_names", "website", "town", "state", "postcode", "operates_in_sa",
    "charity_size", "segment", "jenny_fit", "phil_fit", "phil_review", "excluded", "excluded_reason",
    "revenue_total", "donations_bequests", "revenue_gov", "total_expenses", "gov_share", "donations_share",
    "revenue_total_prev", "donations_bequests_prev", "revenue_growth", "donations_growth",
    "net_surplus", "grants_made", "grants_share", "pass_through", "fte", "volunteers", "fundraising_online", "fundraising_sa",
    "pbi", "hpc", "advancing_religion", "advancing_education", "advancing_welfare",
    "advancing_health", "benefits_children", "benefits_youth", "basic_religious_charity",
    "consolidated_report", "established_date", "established_year", "anniversary_year",
    "anniversary_label", "financial_year_end", "fy_end_month", "responsible_persons_count",
    "ais_period_end", "how_purposes_pursued",
]


def main():
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--register", required=True)
    p.add_argument("--ais", required=True, help="latest AIS year")
    p.add_argument("--ais-prev", help="previous AIS year (enables growth columns)")
    p.add_argument("--state", help="keep only this address state, e.g. SA")
    p.add_argument("--out", default="orgs.csv")
    p.add_argument("--snapshot-month", default=date.today().strftime("%Y-%m"),
                   help="which monthly snapshot this is, YYYY-MM (default: this month). Part of the table key.")
    args = p.parse_args()

    df = extract_register(args.register).merge(extract_ais(args.ais), on="abn", how="left")
    if args.ais_prev:
        df = df.merge(extract_ais(args.ais_prev, suffix="_prev"), on="abn", how="left")
    if args.state:
        df = df[df["state"] == args.state.upper()]

    if not re.fullmatch(r"\d{4}-\d{2}", args.snapshot_month):
        sys.exit("--snapshot-month must look like 2026-10")
    snapshot = f"{args.snapshot_month}-01"

    small = df["total_expenses"] < MIN_TOTAL_EXPENSES  # NaN compares False, so blanks are kept
    df = df[~small]
    print(f"dropped {int(small.sum()):,} charities spending under ${MIN_TOTAL_EXPENSES:,}/yr")

    df = add_flags(df)
    df["snapshot_month"] = snapshot
    for c in COLUMNS:
        if c not in df:
            df[c] = None
    df = df[COLUMNS]

    # Supabase-friendly output: ISO dates, true/false booleans, blanks for nulls
    for c in ["established_date", "ais_period_end"]:
        df[c] = df[c].dt.strftime("%Y-%m-%d")
    n_anniv = int(df["anniversary_year"].notna().sum())
    n_excl = df["excluded_reason"].value_counts().to_dict() or "none"
    for c in df.columns:  # Postgres-style lowercase true/false
        if str(df[c].dtype) in ("bool", "boolean"):
            df[c] = df[c].map({True: "true", False: "false"})
    df = df.sort_values(["segment", "donations_bequests"], ascending=[True, False], na_position="last")
    df.to_csv(args.out, index=False)

    print(f"\nWrote {len(df):,} rows to {args.out} (snapshot_month {snapshot})")
    counts = df["segment"].value_counts(dropna=True)
    print(counts.to_string() if len(counts) else "no orgs matched a segment - check thresholds")
    print(f"anniversaries {ANNIVERSARY_WINDOW[0]}-{ANNIVERSARY_WINDOW[1]}: {n_anniv:,}")
    print("excluded:", n_excl)


if __name__ == "__main__":
    main()
