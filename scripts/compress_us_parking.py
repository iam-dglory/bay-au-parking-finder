#!/usr/bin/env python3
"""Convert a completed legacy US tile batch to deterministic gzip tiles.

Run only after build_us_parking.py has finished. The state index retains tile
keys without extensions, so no geographic coverage or source record changes.
"""
import gzip
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / 'public/data/usa'


def main():
    files = sorted(ROOT.glob('*/*.json'))
    before = after = 0
    for path in files:
        payload = path.read_bytes()
        compressed = gzip.compress(payload, compresslevel=6, mtime=0)
        if gzip.decompress(compressed) != payload:
            raise ValueError(f'Round-trip failed: {path}')
        target = path.with_suffix('.json.gz')
        target.write_bytes(compressed)
        path.unlink()
        before += len(payload)
        after += len(compressed)
    print(f'Converted {len(files)} tiles: {before:,} → {after:,} bytes')


if __name__ == '__main__':
    main()
