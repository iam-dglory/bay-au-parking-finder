#!/usr/bin/env python3
"""Archive official station pages linked from the CMRL directory, not guessed URLs."""
import concurrent.futures,json,re
from pathlib import Path
from collect_coverage_expansion import archive,ROOT,DATE
source=ROOT/f'datasets/india/{DATE}/chennai-metro-station-directory.html'
urls=sorted(set(re.findall(r'https://chennaimetrorail.org/station-information/[^"<> ]+',source.read_text())))
def get(url):
 slug=url.rstrip('/').split('/')[-1];return archive(url,f'datasets/india/{DATE}/cmrl-stations/{slug}.html')
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool: results=list(pool.map(get,urls))
p=ROOT/'datasets/manifest.json';e=json.loads(p.read_text());e += [r for r in results if r and 'error' not in r];p.write_text(json.dumps(e,indent=2)+'\n')
print('Station pages',len(urls),'failed',[r for r in results if r and 'error' in r],flush=True)
