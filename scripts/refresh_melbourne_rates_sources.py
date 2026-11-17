#!/usr/bin/env python3
"""Re-download the City of Melbourne datasets that street-rates.json is built
from, after sanity checks, and record the fetch in datasets/manifest.json.

Used by .github/workflows/council-data-refresh.yml (GitHub's runners can reach
data.melbourne.vic.gov.au). A download is rejected (exit 1, nothing written)
if it isn't a JSON list or has under 80% of the rows of the current copy, so
an outage or a truncated export can never wipe out the app's rates.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FILES = [
    "on-street-parking-bays.json",
    "pay-stay-parking-restrictions.json",
    "pay-stay-zones-linked-to-street-segments.json",
    "parking-zones-linked-to-street-segments.json",
    "sign-plates-located-in-each-parking-zone.json",
]
BASE = "https://data.melbourne.vic.gov.au/api/explore/v2.1/catalog/datasets/{}/exports/json"


def main() -> int:
    manifest_path = ROOT / "datasets" / "manifest.json"
    manifest = json.loads(manifest_path.read_text())
    fetched_at = dt.datetime.now(dt.timezone.utc).isoformat()
    staged: list[tuple[Path, bytes, str]] = []
    for name in FILES:
        path = ROOT / "datasets" / "melbourne-city-of-melbourne" / name
        url = BASE.format(name.removesuffix(".json"))
        with urllib.request.urlopen(url, timeout=120) as resp:
            body = resp.read()
        rows = json.loads(body)
        old = json.loads(path.read_text())
        if not isinstance(rows, list) or len(rows) < 0.8 * len(old):
            print(f"{name}: got {len(rows) if isinstance(rows, list) else type(rows).__name__} rows, had {len(old)}; refusing", file=sys.stderr)
            return 1
        print(f"{name}: {len(old)} -> {len(rows)} rows")
        staged.append((path, json.dumps(rows, ensure_ascii=False).encode(), url))
    for path, body, url in staged:
        path.write_bytes(body)
        rel = path.relative_to(ROOT).as_posix()
        for entry in manifest:
            if entry.get("path") == rel:
                entry.update(source_url=url, fetched_at=fetched_at, bytes=len(body), sha256=hashlib.sha256(body).hexdigest())
                entry.pop("provenance_note", None)
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
