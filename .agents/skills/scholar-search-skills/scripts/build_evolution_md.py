#!/usr/bin/env python3
"""处理检索结果，过滤 + 去重 + 排序，生成分类 markdown。"""
import json
import re
import time
import urllib.parse
import urllib.request
from collections import OrderedDict

API = "https://api.semanticscholar.org/graph/v1/paper/search/bulk"
FIELDS = "title,year,citationCount,venue,abstract,externalIds,openAccessPdf,url"
YEAR = "2023-2026"

EXTRA_E2E_QUERIES = [
    "Playwright web testing",
    "Selenium web test script repair",
    "Cypress end-to-end testing",
    "flaky test web UI detection",
    "page object end-to-end test maintenance",
    "web element locator test breakage",
]

# 每类的关键词过滤：标题+摘要需命中 must_any 的每一组（组内 OR，组间 AND）
# 收紧为领域强信号词，避免高引用但跑题的论文混入。
FILTERS = OrderedDict({
    "Code Diff / Impact Analysis": [
        ["regression test selection", "test selection", "test case selection",
         "test prioritization", "test case prioritization", "impact analysis",
         "change impact", "change-aware test", "code change", "co-evolution of test",
         "regression testing"],
        ["test", "regression"],
    ],
    "Test Generation": [
        ["test generation", "test case generation", "unit test generation",
         "generate unit test", "generating unit test", "generate test case",
         "generating test case", "test-case generation", "generate tests"],
    ],
    "Test Repair": [
        ["test repair", "repair test", "repairing test", "self-healing", "self healing",
         "broken test", "obsolete test", "test maintenance", "co-evolve",
         "fix the test", "fragile test", "healing test", "test breakage", "repair broken"],
        ["test"],
    ],
    "LLM for Testing": [
        ["llm", "large language model", "language model", "gpt", "chatgpt"],
        ["software testing", "unit test", "test generation", "test case", "test suite",
         "fuzzing", "gui testing", "mutation testing", "test oracle", "generating tests",
         "test automation", "regression test"],
    ],
    "Playwright/E2E Testing": [
        ["playwright", "selenium", "cypress", "end-to-end", "end to end", "e2e",
         "web ui test", "web test", "gui test", "ui test", "page object",
         "web application test", "web automation test"],
    ],
})

# 明显跨领域的负向词（命中即剔除）
NEGATIVE = [
    "dental", "overdenture", "dentist", "clinical trial", "elderly", "patients",
    "medical challenge", "disease", "cancer", "covid", "molecular", "protein",
    "downsizing", "ceo ", "vnf", "virtual network function", "5g network",
    "downsizing decisions",
]

# 标题必须命中其中之一（强约束，剔除摘要偶然命中的跑题高引论文）
TITLE_MUST = {
    "Code Diff / Impact Analysis": [
        "regression", "test selection", "test case selection", "prioritization",
        "impact analysis", "change impact", "change-aware", "test selec",
    ],
    "Test Generation": ["test", "testing", "unit test", "tdd"],
    "Test Repair": [
        "repair", "heal", "maintenance", "fix", "broken", "flaky", "fragil",
        "obsolete", "co-evolve", "breakage", "update", "evolv",
    ],
    "LLM for Testing": [
        "test", "testing", "fuzz", "oracle", "coverage", "assertion", "bug",
    ],
    "Playwright/E2E Testing": [
        "test", "e2e", "end-to-end", "end to end", "web", "ui", "playwright",
        "selenium", "cypress",
    ],
}

TARGET_PER_CAT = 10


def fetch(query, sort=True):
    params = {"query": query, "year": YEAR, "fields": FIELDS}
    if sort:
        params["sort"] = "citationCount:desc"
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": "scholar-search/1.0"})
    for attempt in range(5):
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.loads(resp.read().decode()).get("data", []) or []
        except Exception as e:
            time.sleep(4 * (attempt + 1))
    return []


def text_of(p):
    return ((p.get("title") or "") + " " + (p.get("abstract") or "")).lower()


def passes(p, groups, title_must=None):
    t = text_of(p)
    if any(neg in t for neg in NEGATIVE):
        return False
    title = (p.get("title") or "").lower()
    if title_must and not any(k in title for k in title_must):
        return False
    for grp in groups:
        if not any(k in t for k in grp):
            return False
    return True


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


def abstract_snippet(p, n=160):
    a = p.get("abstract")
    if not a:
        return "—"
    a = re.sub(r"\s+", " ", a).strip()
    return (a[:n] + " …") if len(a) > n else a


def main():
    with open("/tmp/evolution_tests_raw.json") as f:
        raw = json.load(f)

    # 补充 E2E 候选
    e2e = {p["paperId"]: p for p in raw["Playwright/E2E Testing"] if p.get("paperId")}
    for q in EXTRA_E2E_QUERIES:
        for p in fetch(q):
            pid = p.get("paperId")
            if pid and pid not in e2e:
                e2e[pid] = p
        time.sleep(1.2)
    raw["Playwright/E2E Testing"] = list(e2e.values())
    print(f"E2E enriched -> {len(e2e)}")

    selected = OrderedDict()
    used_ids = set()
    for cat, groups in FILTERS.items():
        cands = raw.get(cat, [])
        tmust = TITLE_MUST.get(cat)
        relevant = [p for p in cands
                    if passes(p, groups, tmust) and p.get("paperId") not in used_ids]
        relevant.sort(key=lambda x: (x.get("citationCount") or 0), reverse=True)
        chosen = relevant[:TARGET_PER_CAT]
        for p in chosen:
            used_ids.add(p["paperId"])
        selected[cat] = chosen
        print(f"{cat}: {len(relevant)} relevant -> picked {len(chosen)}")

    total = sum(len(v) for v in selected.values())

    lines = []
    lines.append("# 软件演化与测试维护 文献调研（2023–2026）")
    lines.append("")
    lines.append("> 主题：Software Evolution & Test Maintenance。数据来源：Semantic Scholar Graph API"
                 "（聚合 arXiv / ACM DL / IEEE / OpenAlex 等），按引用数降序，年份限定 2023–2026。"
                 "引用数为 Semantic Scholar 统计口径，可能低于 Google Scholar。跨分类已去重。")
    lines.append("")
    lines.append(f"**共收录 {total} 篇核心文献，分为 5 个分类。**")
    lines.append("")
    lines.append("## 目录")
    for i, cat in enumerate(selected, 1):
        anchor = cat.lower().replace(" / ", "--").replace("/", "").replace(" ", "-")
        lines.append(f"{i}. [{cat}](#{i}-{anchor}) — {len(selected[cat])} 篇")
    lines.append("")

    for i, (cat, papers) in enumerate(selected.items(), 1):
        anchor = cat.lower().replace(" / ", "--").replace("/", "").replace(" ", "-")
        lines.append(f"## {i}. {cat}")
        lines.append("")
        lines.append("| # | 题目 | 年份 | 引用数 | 期刊/会议 | 下载链接 | 摘要 |")
        lines.append("|---|------|------|--------|-----------|----------|------|")
        for j, p in enumerate(papers, 1):
            title = (p.get("title") or "").replace("|", "\\|").strip()
            year = p.get("year") or "—"
            cc = p.get("citationCount")
            cc = cc if cc is not None else "—"
            venue = (p.get("venue") or "—").replace("|", "\\|").strip() or "—"
            if len(venue) > 50:
                venue = venue[:48] + "…"
            link = pdf_link(p)
            link_md = f"[PDF/链接]({link})" if link else "—"
            snip = abstract_snippet(p).replace("|", "\\|")
            lines.append(f"| {j} | {title} | {year} | {cc} | {venue} | {link_md} | {snip} |")
        lines.append("")

    out = "/Users/DongbiaoGao/SourceCode/Paper/download_软件演化与测试维护_文献调研.md"
    with open(out, "w") as f:
        f.write("\n".join(lines))
    print(f"WROTE {out} ({total} papers)")


if __name__ == "__main__":
    main()
