#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Generate BibTeX (stable semantic keys) from papers.jsonl."""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent

def esc(s: str) -> str:
    repl = {"&": "\\&", "%": "\\%", "$": "\\$", "#": "\\#", "_": "\\_"}
    return "".join(repl.get(c, c) for c in (s or ""))

def main():
    out = ROOT.parent / "CodeDiff_Playwright_E2E_Repair.bib"
    entries = []
    with (ROOT / "papers.jsonl").open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            o = json.loads(line)
            typ = o["type"]
            etype = {"article": "article", "inproceedings": "inproceedings", "misc": "misc"}.get(typ, "misc")
            fields = [f"  title = {{{esc(o['title'])}}}"]
            authors = [a for a in o.get("authors", []) if a and a.lower() != "anonymous"]
            if authors:
                fields.append("  author = {" + " and ".join(esc(a) for a in authors) + "}")
            venue = o.get("venue", "")
            if venue and venue.lower() != "arxiv preprint":
                if etype == "inproceedings":
                    fields.append(f"  booktitle = {{{esc(venue)}}}")
                else:
                    fields.append(f"  journal = {{{esc(venue)}}}")
            elif etype == "misc":
                fields.append("  howpublished = {arXiv preprint}")
            if o.get("year"):
                fields.append(f"  year = {{{o['year']}}}")
            doi = o.get("doi", "")
            if doi and not doi.startswith("10.48550"):
                fields.append(f"  doi = {{{doi}}}")
            if o.get("url"):
                fields.append(f"  url = {{{o['url']}}}")
            entries.append(f"@{etype}{{{o['key']},\n" + ",\n".join(fields) + "\n}\n")
    out.write_text("% Generated reference library (stable semantic keys)\n\n" + "\n".join(entries), encoding="utf-8")
    print(f"bib written: {out} ({len(entries)} entries)")

if __name__ == "__main__":
    main()
