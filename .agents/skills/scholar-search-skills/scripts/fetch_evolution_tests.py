#!/usr/bin/env python3
"""检索软件演化 / 测试维护方向论文 (2023-2026)，按五个分类输出 markdown。

数据源: Semantic Scholar Graph API (bulk search)。
分类:
  1. Code Diff / Impact Analysis
  2. Test Generation
  3. Test Repair
  4. LLM for Testing
  5. Playwright/E2E Testing
"""
import json
import time
import urllib.parse
import urllib.request
from collections import OrderedDict

API = "https://api.semanticscholar.org/graph/v1/paper/search/bulk"
FIELDS = "title,year,citationCount,venue,abstract,externalIds,openAccessPdf,url"
YEAR = "2023-2026"

# 每个分类对应若干检索 query（用 | 表示 OR，Semantic Scholar 支持布尔检索）
CATEGORIES = OrderedDict({
    "Code Diff / Impact Analysis": [
        '(code change | code diff | commit) (impact analysis | regression test selection)',
        'change impact analysis software testing',
        'regression test selection code change',
    ],
    "Test Generation": [
        'automated test generation unit test',
        'test case generation (LLM | search-based | coverage)',
    ],
    "Test Repair": [
        'test repair (broken | obsolete) test cases',
        'test maintenance test co-evolution repair',
        'self-healing test automation',
    ],
    "LLM for Testing": [
        'large language model software testing',
        'LLM test generation GPT',
    ],
    "Playwright/E2E Testing": [
        'end-to-end web test (Playwright | Selenium | Cypress)',
        'web UI test script flaky end-to-end',
        'GUI test automation web flakiness',
    ],
})


def fetch(query, limit=200):
    params = {
        "query": query,
        "year": YEAR,
        "fields": FIELDS,
        "sort": "citationCount:desc",
    }
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "scholar-search/1.0"})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode())
                return data.get("data", []) or []
        except Exception as e:
            wait = 5 * (attempt + 1)
            print(f"  [retry {attempt+1}] {query[:40]!r}: {e}; wait {wait}s")
            time.sleep(wait)
    return []


def pdf_link(p):
    oa = p.get("openAccessPdf") or {}
    if oa.get("url"):
        return oa["url"]
    ext = p.get("externalIds") or {}
    if ext.get("ArXiv"):
        return f"https://arxiv.org/pdf/{ext['ArXiv']}"
    if ext.get("DOI"):
        return f"https://doi.org/{ext['DOI']}"
    return p.get("url") or ""


def main():
    all_by_cat = OrderedDict()
    seen_global = set()
    for cat, queries in CATEGORIES.items():
        print(f"== {cat} ==")
        merged = {}
        for q in queries:
            results = fetch(q)
            print(f"  query {q[:50]!r} -> {len(results)}")
            for p in results:
                pid = p.get("paperId")
                if not pid:
                    continue
                if pid not in merged:
                    merged[pid] = p
            time.sleep(1.2)
        ranked = sorted(
            merged.values(),
            key=lambda x: (x.get("citationCount") or 0),
            reverse=True,
        )
        all_by_cat[cat] = ranked
        print(f"  -> merged {len(ranked)} unique")
    with open("/tmp/evolution_tests_raw.json", "w") as f:
        json.dump(all_by_cat, f, ensure_ascii=False)
    print("saved /tmp/evolution_tests_raw.json")


if __name__ == "__main__":
    main()
