#!/usr/bin/env python3
"""
One-off backfill: Melbourne's on-street-parking-bays dataset carries a
kerbsideid for ~17% of bays (the rest are null in the source). Since our
parking_spots coordinates came from this exact dataset originally, an exact
lat/lng match (not nearest-neighbour) is reliable here.

Usage:
    export $(grep -v '^#' .env | xargs)
    python3 scripts/backfill_kerbside_ids.py
"""
import json
import os
import sys
import urllib.request

SUPABASE_URL = os.environ["VITE_SUPABASE_URL"]
ANON_KEY = os.environ["VITE_SUPABASE_ANON_KEY"]


def http_json(url, method="GET", headers=None, body=None, timeout=60):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=headers or {})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read()
        return json.loads(raw) if raw else None


def sign_in_anonymously():
    res = http_json(
        f"{SUPABASE_URL}/auth/v1/signup",
        method="POST",
        headers={"apikey": ANON_KEY, "Content-Type": "application/json"},
        body={},
    )
    return res["access_token"]


def main():
    print("Signing in anonymously...", file=sys.stderr)
    token = sign_in_anonymously()

    print("Fetching bay dataset...", file=sys.stderr)
    bays = http_json(
        "https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/on-street-parking-bays/exports/json"
    )
    desc_by_coord = {}
    for b in bays:
        if not b.get("kerbsideid"):
            continue
        desc_by_coord[(b["latitude"], b["longitude"])] = b["kerbsideid"]
    print(f"  {len(desc_by_coord)} coordinates with a kerbside id", file=sys.stderr)

    auth_headers = {"apikey": ANON_KEY, "Authorization": f"Bearer {token}"}

    print("Fetching existing VIC spots...", file=sys.stderr)
    spots = []
    offset = 0
    page_size = 1000
    while True:
        url = f"{SUPABASE_URL}/rest/v1/parking_spots?state=eq.VIC&select=id,lat,lng&limit={page_size}&offset={offset}"
        page = http_json(url, headers=auth_headers)
        spots.extend(page)
        if len(page) < page_size:
            break
        offset += page_size
    print(f"  fetched {len(spots)} VIC spots", file=sys.stderr)

    patches = []
    for spot in spots:
        kid = desc_by_coord.get((spot["lat"], spot["lng"]))
        if kid:
            patches.append({"id": spot["id"], "kerbside_id": kid})
    print(f"  {len(patches)} spots matched a kerbside id", file=sys.stderr)

    insert_headers = {**auth_headers, "Content-Type": "application/json", "Prefer": "return=minimal"}

    def batched(seq, n):
        for i in range(0, len(seq), n):
            yield seq[i : i + n]

    for i, batch in enumerate(batched(patches, 500)):
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/kerbside_id_staging",
            data=json.dumps(batch).encode(),
            method="POST",
            headers=insert_headers,
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            resp.read()
        if i % 10 == 0:
            print(f"  batch {i} ({i*500}/{len(patches)})", file=sys.stderr)

    print(json.dumps({"total_vic_spots": len(spots), "matched": len(patches)}))


if __name__ == "__main__":
    main()
