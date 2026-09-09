#!/usr/bin/env python3
"""
ddgs-search wrapper: web-search-plus compatible JSON output.

Uses the ddgs Python API (ddgs >= 9.x). The original version shelled out to
the ddgs CLI with `-q`/`-b <engine>` options, which no longer exist in 9.x.

Output format: {"provider": "ddgs", "results": [{"title", "url", "snippet", "published_date"}]}
"""
import argparse
import json
import sys
from datetime import datetime


def search(query: str, max_results: int = 5, backend: str = "auto") -> dict:
    try:
        from ddgs import DDGS
    except ImportError:
        return {"provider": "ddgs", "results": [], "error": "ddgs not installed - run: pip3 install ddgs"}

    try:
        raw = DDGS().text(query, backend=backend, max_results=max_results)
    except Exception as e:
        return {"provider": "ddgs", "results": [], "error": f"{type(e).__name__}: {e}"}

    results = []
    for item in raw or []:
        results.append({
            "title": item.get("title", ""),
            "url": item.get("href") or item.get("url", ""),
            "snippet": item.get("body") or item.get("snippet", ""),
            "published_date": item.get("year") or datetime.now().isoformat()
        })

    return {"provider": "ddgs", "results": results}


def main():
    parser = argparse.ArgumentParser(description="ddgs search wrapper (web-search-plus compatible)")
    parser.add_argument("--query", "-q", required=True, help="Search query")
    parser.add_argument("--max-results", "-m", type=int, default=5, help="Max results")
    parser.add_argument("--backend", "-b", default="auto",
                        help="auto|html|lite|google|bing|brave|duckduckgo|yandex|mojeek|wikipedia (default: auto)")
    args = parser.parse_args()

    output = search(args.query, args.max_results, args.backend)
    json.dump(output, sys.stdout, ensure_ascii=False)
    print()


if __name__ == "__main__":
    main()
