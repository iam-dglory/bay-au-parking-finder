#!/usr/bin/env python3
"""Archive every fetched response with URL, UTC time, byte count and SHA-256.
Never overwrite a previous response. Re-run with a new destination filename.
Usage: python3 scripts/archive_dataset.py URL datasets/path.json
"""
import argparse
import datetime as dt
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'datasets' / 'manifest.json'

def archive(url, relative):
    dest = (ROOT / relative).resolve()
    if not dest.is_relative_to(ROOT / 'datasets'):
        raise ValueError('Dataset output must be under datasets/')
    if dest.exists():
        raise FileExistsError(f'Choose a new filename to preserve {relative}')
    dest.parent.mkdir(parents=True, exist_ok=True)
    part = dest.with_suffix(dest.suffix + '.part')
    result = subprocess.run(['curl', '-fLsS', '--retry', '2', '--max-time', '90', url, '-o', str(part)])
    if result.returncode:
        part.unlink(missing_ok=True)
        raise RuntimeError(f'Download failed for {url}')
    raw = part.read_bytes()
    if dest.suffix == '.json':
        json.loads(raw)  # Do not archive an error page as a dataset.
    part.rename(dest)
    entries = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else []
    entries.append({'path': str(dest.relative_to(ROOT)), 'source_url': url,
                    'fetched_at': dt.datetime.now(dt.timezone.utc).isoformat(),
                    'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()})
    MANIFEST.write_text(json.dumps(entries, indent=2) + '\n')
    print(f'Archived {relative}: {len(raw):,} bytes')

if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('url'); p.add_argument('output')
    args = p.parse_args(); archive(args.url, args.output)
