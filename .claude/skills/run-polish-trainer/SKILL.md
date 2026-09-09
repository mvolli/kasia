---
name: run-polish-trainer
description: Run, start, drive, screenshot or smoke-test the Kasia polish-trainer web app (node server.mjs + Playwright driver). Use when asked to run the app, take a screenshot of it, or test the tutor API.
---

# Run Kasia (polish-trainer)

Polish/German conversation-practice web app: onboarding → home → live
conversation (corrections, vocab chips, TTS) → 5-axis summary. Plain Node
server, **no build step**. Driven headlessly by a committed Playwright driver.

- Server: `node server.mjs` → `http://localhost:4173` (env `PORT` to change)
- Driver: `.claude/skills/run-polish-trainer/driver.mjs` (Playwright, headless Chromium)
- All paths below are relative to the repo root.

## Prerequisites

```bash
npm install                      # playwright (dev) + ws
npx playwright install chromium  # skip if ~/.cache/ms-playwright already has chromium-XXXX
```

Node ≥ 18 (verified on v24).

## Start the server

```bash
npm start                        # = node server.mjs
curl -s localhost:4173/api/health
# → {"ok":true,"mode":"ai","model":"local","port":4173}
```

Tutor mode:
- **AI mode** when the shell has `ANTHROPIC_BASE_URL` + `ANTHROPIC_AUTH_TOKEN`
  (in this environment: local LLM proxy at `http://127.0.0.1:8080`, model
  `local`). Tutor turns can take 5–60 s.
- **Demo mode** otherwise (or on any LLM failure/timeout): scripted offline
  tutor, instant replies, rule-based corrections. The app is fully functional.

## Drive the app (agent path)

```bash
node .claude/skills/run-polish-trainer/driver.mjs flow
# → screenshots/01-onboarding.png … 06-summary.png
```

Commands:

| Command | What it does |
|---|---|
| `flow [--scenario food-market\|directions-warsaw] [--out dir]` | Full user journey: onboarding → home → 3 chat turns (turn 1 is deliberately broken English to trigger the red correction card) → summary. One PNG per screen; prints each path. |
| `ss <name> [selector]` | Single screenshot of one screen (default: onboarding). E.g. `ss home "#screen-home:not(.hidden) .scenario-card"` |
| `smoke` | API-only test (no browser): health, scenarios, open, tutor, summary → PASS/FAIL lines, exit code 0/1. |

Driver env: `URL` (default `http://localhost:4173`), `OUT` (default `./screenshots`).
The driver prints `[page error] …` for any page-console error — a clean run prints none.

## Poke the API directly

```bash
curl -s -X POST localhost:4173/api/tutor -H 'content-type: application/json' \
  -d '{"scenarioId":"food-market","level":"beginner","goal":"travel","history":[],"userText":"I want pierogi, how much cost?"}'
# → {"reply":"…","correction":{"corrected":"kosztuje","noteDe":"…"},"vocab":[…],"done":false}
```

Endpoints: `GET /api/health`, `GET /api/scenarios`, `POST /api/open`,
`POST /api/tutor`, `POST /api/summary`.

## Run (human path)

`npm start` → open `http://localhost:4173` in a browser → Ctrl-C.
Mic + Polish TTS only work in a real browser with those APIs; headless is fine.

## Gotchas

- The driver **clears localStorage on every run** so onboarding always shows.
  Streak/vocab are per-browser-context and do not survive driver runs.
- **AI mode is slow by design**: the driver waits up to 120 s per tutor turn.
  A `flow` run takes a few minutes; that is not a hang.
- On LLM timeout (60 s) the server falls back to the demo script **per turn** —
  `health` still says `mode: ai`, but a turn may be scripted. Both modes render
  the same UI (correction card, vocab chips).
- The LLM can set `done: true` before the 3rd scripted turn, so the app may jump
  to the summary early; the driver handles both branches (screenshot 05 may
  then show the summary screen).
- No `pl-PL` TTS voice and no mic in headless: Repeat/Slower/mic are no-ops
  there — the app tolerates it, no page errors.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Driver times out / "Server nicht erreichbar" | Server not running: `npm start`, then `curl -s localhost:4173/api/health` |
| `playwright: Executable doesn't exist … chromium-XXXX` | `npx playwright install chromium` |
| `EADDRINUSE: 4173` | `pgrep -af "node server.mjs"` → kill it, or start with `PORT=4200 npm start` and run the driver with `URL=http://localhost:4200` |
| Screenshot blank / wrong screen | Check the driver's `[page error]` lines; retake with `ss <name> "<exact selector>"` |
