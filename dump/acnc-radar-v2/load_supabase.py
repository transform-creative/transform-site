#!/usr/bin/env python3
"""
Load orgs.csv into Supabase as one monthly snapshot.

    SUPABASE_DB_URL=postgresql://... python load_supabase.py orgs.csv

Safe to re-run: it replaces that month's snapshot inside one transaction,
so a failed or repeated run never leaves half a month or a duplicate behind.

Use Supabase's *Session pooler* connection string (Project > Connect), not the
direct one: the direct host is IPv6-only and GitHub's runners are IPv4.
"""

import csv
import os
import sys

import psycopg


def main():
    if len(sys.argv) != 2:
        sys.exit("usage: python load_supabase.py orgs.csv")
    path = sys.argv[1]
    url = os.getenv("SUPABASE_DB_URL") or sys.exit("Set SUPABASE_DB_URL")

    with open(path, newline="", encoding="utf-8") as fh:
        reader = csv.reader(fh)
        header = next(reader)
        first = next(reader, None)
    if not first:
        sys.exit(f"{path} has no data rows - refusing to load an empty snapshot.")
    month = first[header.index("snapshot_month")]
    cols = ", ".join(f'"{c}"' for c in header)

    with psycopg.connect(url) as conn:  # commits on success, rolls back on any error
        with conn.cursor() as cur:
            cur.execute("delete from public.orgs where snapshot_month = %s", (month,))
            replaced = cur.rowcount
            with open(path, "rb") as fh, cur.copy(
                f"copy public.orgs ({cols}) from stdin with (format csv, header true)"
            ) as copy:
                while chunk := fh.read(1 << 20):
                    copy.write(chunk)
            cur.execute("select count(*) from public.orgs where snapshot_month = %s", (month,))
            loaded = cur.fetchone()[0]

    note = f" (replaced {replaced:,} existing rows)" if replaced else ""
    print(f"Loaded {loaded:,} rows for snapshot {month}{note}")


if __name__ == "__main__":
    main()
