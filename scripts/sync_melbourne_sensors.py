#!/usr/bin/env python3
"""
Refreshes Bay's copy of Melbourne's live on-street parking bay sensor feed
(data.melbourne.vic.gov.au: on-street-parking-bay-sensors -- a real,
council-installed in-ground sensor network, verified to actively update).

This script only stages the raw rows (via PostgREST, using the public anon
key -- same as any other client write). It does NOT do the spatial join
into spot_sensor_status itself, since that needs elevated privileges the
anon key doesn't have. After running this script, an operator (or the
scheduled task prompt that runs this) must also execute the SQL in
sync_melbourne_sensors.sql against the Supabase project to complete the
sync and clear the staging table.

Usage:
    export $(grep -v '^#' .env | xargs)
    python3 scripts/sync_melbourne_sensors.py
"""
import json
import os
import sys
import urllib.request

SUPABASE_URL = os.environ["VITE_SUPABASE_URL"]
ANON_KEY = os.environ["VITE_SUPABASE_ANON_KEY"]

STATUS_MAP = {"Present": "present", "Unoccupied": "unoccupied"}


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

    print("Fetching live sensor feed...", file=sys.stderr)
    sensors = http_json(
        "https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/on-street-parking-bay-sensors/exports/json"
    )
    print(f"  fetched {len(sensors)} sensor records", file=sys.stderr)

    rows = []
    for s in sensors:
        loc = s.get("location")
        status = STATUS_MAP.get(s.get("status_description"))
        ts = s.get("status_timestamp")
        lastupdated = s.get("lastupdated")
        kid = s.get("kerbsideid")
        if not loc or not status or not ts or not lastupdated or kid is None:
            continue
        rows.append(
            {
                "kerbside_id": kid,
                "status": status,
                "status_ts": ts,
                "last_confirmed_at": lastupdated,
                "lat": loc["lat"],
                "lng": loc["lon"],
            }
        )
    print(f"  {len(rows)} usable rows", file=sys.stderr)

    headers = {
        "apikey": ANON_KEY,
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    def batched(seq, n):
        for i in range(0, len(seq), n):
            yield seq[i : i + n]

    for i, batch in enumerate(batched(rows, 500)):
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/sensor_sync_staging",
            data=json.dumps(batch).encode(),
            method="POST",
            headers=headers,
        )
        with urllib.request.urlopen(req, timeout=60) as resp:
            resp.read()
        if i % 5 == 0:
            print(f"  batch {i} ({i*500}/{len(rows)})", file=sys.stderr)

    print(json.dumps({"staged": len(rows)}))


if __name__ == "__main__":
    main()
