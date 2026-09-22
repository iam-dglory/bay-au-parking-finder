#!/usr/bin/env python3
"""
Imports City of Melbourne's off-street car park census (see
../datasets/melbourne-city-of-melbourne/off-street-car-parks-2024-commercial.json,
already filtered to 2024 Commercial-only) into offstreet_car_parks.
Idempotent via `on conflict (property_id) do nothing`.

Usage:
    export $(grep -v '^#' .env | xargs)
    python3 scripts/import_offstreet_car_parks.py
"""
import json
import os
import sys
import urllib.request

SUPABASE_URL = os.environ["VITE_SUPABASE_URL"]
ANON_KEY = os.environ["VITE_SUPABASE_ANON_KEY"]
DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "datasets", "melbourne-city-of-melbourne", "off-street-car-parks-2024-commercial.json")


def sign_in_anonymously():
    req = urllib.request.Request(
        f"{SUPABASE_URL}/auth/v1/signup",
        method="POST",
        headers={"apikey": ANON_KEY, "Content-Type": "application/json"},
        data=b"{}",
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read())["access_token"]


def main():
    with open(DATA_FILE) as f:
        rows = json.load(f)

    payload = [
        {
            "property_id": r["property_id"],
            "address_text": r["building_address"],
            "suburb": r["clue_small_area"],
            "lat": r["latitude"],
            "lng": r["longitude"],
            "capacity": r["parking_spaces"],
        }
        for r in rows
    ]

    print("Signing in anonymously...", file=sys.stderr)
    token = sign_in_anonymously()

    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/offstreet_car_parks?on_conflict=property_id",
        method="POST",
        headers={
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        data=json.dumps(payload).encode(),
    )
    # Note: offstreet_car_parks has no client insert policy (reference data,
    # written by an operator migration) -- this will 401/403 unless you also
    # add a temporary insert policy, same pattern as the other staging-table
    # workarounds in this repo. Kept here for documentation/reproducibility
    # rather than as a script meant to be re-run casually.
    with urllib.request.urlopen(req, timeout=60) as resp:
        resp.read()

    print(json.dumps({"imported": len(payload)}))


if __name__ == "__main__":
    main()
