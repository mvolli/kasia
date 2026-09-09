---
name: ddgs-search
description: Free multi-engine web search via ddgs CLI (DuckDuckGo, Google, Bing, Brave, Yandex, Yahoo, Wikipedia) + arXiv API search. No API keys required. Use when user needs web search, research paper discovery, or when other skills need a search backend. Drop-in replacement for web-search-plus.
metadata: {"openclaw":{"requires":{"bins":["python3"]}}}
---

# ddgs-search

## Why This Skill?

🆓 **Completely free** — no API keys, no subscriptions, no rate limits, no billing surprises.

🔍 **8 search engines in one** — Google, Bing, DuckDuckGo, Brave, Yandex, Yahoo, Wikipedia, and Mojeek. Switch engines with a single flag. Most search skills only support one.

🎓 **Built-in arXiv research search** — search academic papers directly via arXiv's free API. Returns authors, categories, abstracts, and publication dates. Perfect for researchers, students, and AI/ML practitioners.

🔌 **Drop-in replacement** — outputs web-search-plus compatible JSON, so it works with any skill or tool that expects that format. Zero config migration.

⚡ **Lightweight** — single pip package, no browser automation, no headless Chrome. Searches complete in 1-3 seconds.

## Install

```bash
pip3 install ddgs
```

(`scripts/install.py` fails on Ubuntu 24.04 PEP-668 "externally-managed-environment" — use plain `pip3 install ddgs`, which falls back to user-site-packages.)

## Web Search

### Python script (web-search-plus compatible JSON, recommended)

```bash
python3 scripts/search.py -q "your query" -m 5          # backend: auto (default)
python3 scripts/search.py -q "your query" -b brave      # other backends
python3 scripts/search.py -q "your query" -b lite -m 10
```

**Verified working backends (ddgs 9.12, this environment):** `auto`, `html`, `lite`, `bing`, `brave`, `yandex`.
**Do not use `duckduckgo` here** — `html.duckduckgo.com` is unreachable (ConnectError); `google`/`mojeek`/`wikipedia` returned no results. Stick with `auto` unless you need a specific engine.

Note: `scripts/search.py` was patched for ddgs 9.x — the original shelled out to the removed `-q`/`-b <engine>` CLI options.

Output (web-search-plus compatible JSON):
```json
{
  "provider": "ddgs",
  "results": [
    {"title": "...", "url": "...", "snippet": "...", "published_date": "..."}
  ]
}
```

## arXiv Search

```bash
# Search by topic
python3 scripts/arxiv_search.py -q "3D gaussian splatting" -m 10

# Field-specific search (title, abstract, category)
python3 scripts/arxiv_search.py -q "ti:transformer AND cat:cs.CV" -m 5

# Sort by relevance instead of date
python3 scripts/arxiv_search.py -q "reinforcement learning" --sort-by relevance
```

Returns authors, categories, abstracts — same JSON format.

## Direct CLI (ddgs 9.x)

> ⚠️ In ddgs 9.x the option is `-k/--keywords` (not `-q`), and `-b` only takes `auto|html|lite`. The raw CLI has a pagination bug in non-TTY contexts (`input()` → `Aborted!` + exit 1). Use `scripts/search.py` or `-o file.json`:

```bash
ddgs text -k "query" -m 5 -b auto -o /tmp/results.json
```

## Integration

Set `WEB_SEARCH_PLUS_PATH` to use as a search backend for other skills:
```bash
export WEB_SEARCH_PLUS_PATH="path/to/ddgs-search/scripts/search.py"
```
