#!/usr/bin/env python3
"""
Download the latest ACNC files from data.gov.au (public CKAN API, no key needed).

Writes into ./data/:
    register.<ext>   ACNC Register of Australian charities (updated weekly)
    ais.<ext>        the most recent Annual Information Statement year
    ais_prev.<ext>   the year before that (for growth columns)

and prints the three paths as KEY=path lines (the GitHub Action reads these).

If data.gov.au ever renames things, skip the lookup by setting any of:
    ACNC_REGISTER_URL, ACNC_AIS_URL, ACNC_AIS_PREV_URL
"""

import os
import sys
from datetime import date
from pathlib import Path

import requests

API = "https://data.gov.au/data/api/3/action"
REGISTER_DATASET = "acnc-register"
AIS_DATASET = "acnc-{year}-annual-information-statement-ais-data"
FORMAT_PREFERENCE = ["csv", "xlsx"]  # CSV first: smaller and faster to parse
HEADERS = {"User-Agent": "transform-creative-acnc-radar/1.0 (+https://transformcreative.com.au)"}
OUT = Path("data")


def package(name: str):
    r = requests.get(f"{API}/package_show", params={"id": name}, headers=HEADERS, timeout=60)
    if r.status_code == 404:
        return None
    r.raise_for_status()
    body = r.json()
    return body["result"] if body.get("success") else None


def best_resource(pkg: dict) -> str:
    resources = pkg.get("resources", [])
    for fmt in FORMAT_PREFERENCE:
        for res in resources:
            if (res.get("format") or "").lower() == fmt and res.get("url"):
                return res["url"]
    sys.exit(f"No CSV/XLSX resource in dataset {pkg.get('name')}: "
             f"{[(r.get('name'), r.get('format')) for r in resources]}")


def latest_ais_urls() -> list:
    """Newest two AIS years that exist. AIS data lags about 18 months, so search back from this year."""
    found = []
    for year in range(date.today().year, date.today().year - 6, -1):
        pkg = package(AIS_DATASET.format(year=year))
        if pkg:
            found.append((year, best_resource(pkg)))
        if len(found) == 2:
            break
    if not found:
        sys.exit("Couldn't find any ACNC AIS dataset on data.gov.au - set ACNC_AIS_URL manually.")
    return found


def download(url: str, stem: str) -> Path:
    ext = ".xlsx" if url.lower().split("?")[0].endswith((".xlsx", ".xls")) else ".csv"
    OUT.mkdir(exist_ok=True)
    path = OUT / f"{stem}{ext}"
    with requests.get(url, headers=HEADERS, stream=True, timeout=300) as r:
        r.raise_for_status()
        with open(path, "wb") as fh:
            for chunk in r.iter_content(1 << 20):
                fh.write(chunk)
    size_mb = path.stat().st_size / 1e6
    if size_mb < 0.1:
        sys.exit(f"{path} is only {size_mb:.2f} MB - looks like an error page, not data.")
    print(f"  {stem}: {size_mb:.1f} MB from {url}", file=sys.stderr)
    return path


def main():
    reg_url = os.getenv("ACNC_REGISTER_URL") or best_resource(package(REGISTER_DATASET) or
                                                             sys.exit("ACNC register dataset not found"))
    ais_url, ais_prev_url = os.getenv("ACNC_AIS_URL"), os.getenv("ACNC_AIS_PREV_URL")
    if not ais_url:
        found = latest_ais_urls()
        ais_url = found[0][1]
        ais_prev_url = ais_prev_url or (found[1][1] if len(found) > 1 else None)
        print(f"  AIS years found: {[y for y, _ in found]}", file=sys.stderr)

    print(f"REGISTER={download(reg_url, 'register')}")
    print(f"AIS={download(ais_url, 'ais')}")
    print(f"AIS_PREV={download(ais_prev_url, 'ais_prev') if ais_prev_url else ''}")


if __name__ == "__main__":
    main()
