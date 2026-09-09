// Kasia (polish-trainer) driver — drives the running web app with Playwright.
//
// Usage (from repo root, server must be running on :4173):
//   node .claude/skills/run-polish-trainer/driver.mjs flow [--scenario food-market] [--out screenshots]
//       full user flow: onboarding -> home -> conversation (3 turns, 1 with errors)
//       -> summary. Saves one PNG per screen into --out.
//   node .claude/skills/run-polish-trainer/driver.mjs ss <name> [selector]
//       open the app, wait for <selector> (default: home screen), screenshot <name>.png
//   node .claude/skills/run-polish-trainer/driver.mjs smoke
//       API-only smoke test (no browser): hits /api/health, /api/scenarios, /api/open,
//       /api/tutor, /api/summary. Prints PASS/FAIL.
//
// Env: URL (default http://localhost:4173), OUT (default ./screenshots)

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const [cmd, ...args] = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf("--" + name);
  return i >= 0 ? args[i + 1] : dflt;
};
const URL = process.env.URL || "http://localhost:4173";
const OUT = process.env.OUT || flag("out", "screenshots");
const SCENARIO = flag("scenario", "food-market");

fs.mkdirSync(OUT, { recursive: true });
const shot = (page, name) => path.join(OUT, name + ".png");

async function launch() {
  const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
  const ctx = await browser.newContext({
    viewport: { width: 420, height: 860 },
    deviceScaleFactor: 2,
    // no TTS voices / no mic in headless: app tolerates both
    permissions: [],
  });
  const page = await ctx.newPage();
  page.on("dialog", (d) => d.accept()); // auto-accept confirm()
  page.on("console", (m) => m.type() === "error" && console.error("[page error]", m.text()));
  return { browser, page };
}

async function gotoApp(page) {
  await page.goto(URL, { waitUntil: "networkidle" });
  // fresh profile each run so onboarding shows
  await page.evaluate(() => localStorage.clear());
  await page.goto(URL, { waitUntil: "networkidle" });
}

async function flow() {
  const { browser, page } = await launch();
  const wait = (sel, ms = 15000) => page.waitForSelector(sel, { timeout: ms });

  // 1. onboarding (step 1: language, Polish preselected)
  await gotoApp(page);
  await wait("#screen-onboarding .ob-step[data-step='1']");
  await page.click("#ob-next"); // -> step 2
  await wait("#screen-onboarding .ob-step[data-step='2']:not(.hidden)");
  await page.click("#ob-level .ob-opt[data-value='beginner']");
  await page.click("#ob-next"); // -> step 3 (goal + Start free trial)
  await wait("#ob-start:not(.hidden)");
  await page.screenshot({ path: shot(page, "01-onboarding") });

  // 2. home
  await page.click("#ob-start");
  await wait("#screen-home:not(.hidden) .scenario-card");
  await page.waitForTimeout(400); // let bars settle
  await page.screenshot({ path: shot(page, "02-home") });

  // 3. conversation
  await page.click(`#scenario-list .scenario-card:has-text("${SCENARIO === "food-market" ? "Jarmark" : "Warszaw"}")`);
  await wait("#screen-chat:not(.hidden) #chat-log .tutor-row .bubble");
  await page.waitForTimeout(600);
  await page.screenshot({ path: shot(page, "03-chat-open") });

  const send = async (text) => {
    const before = await page.locator("#chat-log .tutor-row").count();
    await page.fill("#chat-text", text);
    await page.click("#btn-send");
    // local LLM can take up to ~60s per turn (server abort -> demo fallback); wait for a new tutor row
    await page.waitForFunction(
      (prev) => document.querySelectorAll("#chat-log .tutor-row").length > prev,
      before,
      { timeout: 120000, polling: 500 },
    );
    await page.waitForTimeout(500);
  };

  // turn 1: broken English -> expect an in-context correction card (AI mode) or a nudge (demo)
  await send("I want pierogi, how much cost?");
  const hasCorrection = await page.locator(".correction-card").first().isVisible().catch(() => false);
  await page.screenshot({ path: shot(page, "04-chat-turn1" + (hasCorrection ? "-correction" : "")) });

  // turn 2: polite Polish
  await send("Dziękuję, proszę. Ile to kosztuje?");
  await page.screenshot({ path: shot(page, "05-chat-turn2") });

  // turn 3: wrap it up (keyword advances the scripted path in demo mode)
  // the AI may set done=true itself, which jumps straight to the summary
  await send("Dziękuję, do widzenia!");
  await page.waitForTimeout(800);

  // 4. summary
  if (await page.locator("#screen-summary:not(.hidden)").count()) {
    // tutor already ended the scenario with done=true
  } else {
    await page.click("#btn-end");
  }
  await page.waitForSelector("#screen-summary:not(.hidden) #score-grammar .bar i", { timeout: 60000 });
  await page.waitForTimeout(1200); // bar-width transition
  await page.screenshot({ path: shot(page, "06-summary") });

  console.log("FLOW OK — screenshots in", path.resolve(OUT));
  for (const f of fs.readdirSync(OUT)) if (f.endsWith(".png")) console.log("  ", path.join(OUT, f));
  await browser.close();
}

async function ss(name, selector) {
  const { browser, page } = await launch();
  await gotoApp(page);
  const sel = selector || "#screen-onboarding .ob-step:not(.hidden)";
  await page.waitForSelector(sel, { timeout: 15000 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: shot(page, name) });
  console.log("screenshot:", path.join(OUT, name + ".png"));
  await browser.close();
}

async function smoke() {
  let fails = 0;
  const check = (label, ok, extra = "") => {
    console.log(`${ok ? "PASS" : "FAIL"}  ${label}${extra ? "  " + extra : ""}`);
    if (!ok) fails++;
  };
  const get = async (p) => (await fetch(URL + p)).json();
  const post = async (p, body) =>
    (await fetch(URL + p, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })).json();

  const health = await get("/api/health");
  check("GET /api/health", health.ok, `mode=${health.mode}`);
  const sc = await get("/api/scenarios");
  check("GET /api/scenarios", Array.isArray(sc.scenarios) && sc.scenarios.length >= 2, `${sc.scenarios?.length} scenarios`);
  const open = await post("/api/open", { scenarioId: SCENARIO, level: "beginner", goal: "travel" });
  check("POST /api/open", typeof open.reply === "string" && open.reply.length > 0, `opener: ${String(open.reply).slice(0, 40)}…`);
  const turn = await post("/api/tutor", {
    scenarioId: SCENARIO, level: "beginner", goal: "travel",
    history: [{ role: "assistant", text: open.reply }],
    userText: "I want pierogi, how much cost?",
  });
  check("POST /api/tutor", typeof turn.reply === "string" && turn.reply.length > 0, `reply: ${String(turn.reply).slice(0, 40)}…`);
  const sum = await post("/api/summary", {
    scenarioId: SCENARIO, level: "beginner", goal: "travel",
    userTexts: ["I want pierogi, how much cost?", "Dziękuję, proszę. Ile to kosztuje?"],
  });
  const axes = ["grammar", "fluency", "vocabulary", "engagement", "relevance"];
  check("POST /api/summary", axes.every((a) => Number(sum.scores?.[a]) >= 0), `grammar=${sum.scores?.grammar}`);
  console.log(fails === 0 ? "SMOKE OK" : `SMOKE FAILED (${fails})`);
  process.exit(fails === 0 ? 0 : 1);
}

if (cmd === "flow") await flow();
else if (cmd === "ss") await ss(args[0], args[1]);
else if (cmd === "smoke") await smoke();
else {
  console.error("usage: driver.mjs flow [--scenario id] [--out dir] | ss <name> [selector] | smoke");
  process.exit(2);
}
