// M0 dev server: static app + tutor API. No build step.
//   GET  /api/health      -> {ok, mode, model, port}
//   GET  /api/scenarios   -> scenario list
//   POST /api/open        -> {scenarioId} -> tutor opener
//   POST /api/tutor       -> {scenarioId, level, goal, history[], userText} -> turn
//   POST /api/summary     -> {scenarioId, level, goal, history[], userTexts[]} -> 5-axis summary

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SCENARIOS, getScenario } from "./app/scenarios.mjs"; // shared with the APK (app/ is the webDir)
import { tutorInfo, openConversation, tutorTurn, tutorSummary } from "./lib/tutor.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 4173);
const PUBLIC_DIR = path.join(__dirname, "app");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      if (data.length > 1e6) {
        reject(new Error("body too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function serveStatic(req, res, urlPath) {
  let p = urlPath === "/" ? "/index.html" : urlPath;
  const file = path.normalize(path.join(PUBLIC_DIR, p));
  if (!file.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("forbidden");
  }
  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404, { "content-type": "text/plain" });
      return res.end("not found: " + urlPath);
    }
    res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" });
    res.end(buf);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (req.method === "GET" && url.pathname === "/api/health") {
      return json(res, 200, { ok: true, ...tutorInfo(), port: PORT });
    }
    if (req.method === "GET" && url.pathname === "/api/scenarios") {
      return json(res, 200, { scenarios: SCENARIOS.map(({ id, lang, title, titleTarget, goal, goalTarget, tutorName }) => ({ id, lang, title, titleTarget, goal, goalTarget, tutorName })) });
    }
    if (req.method === "POST" && url.pathname === "/api/open") {
      const b = await readBody(req);
      const s = getScenario(b.scenarioId, { topic: b.topic });
      return json(res, 200, { ...openConversation(s.id, b.level, b.goal, b.topic), tutorName: s.tutorName });
    }
    if (req.method === "POST" && url.pathname === "/api/tutor") {
      const b = await readBody(req);
      if (!b.userText || typeof b.userText !== "string") return json(res, 400, { error: "userText required" });
      const out = await tutorTurn({
        scenarioId: b.scenarioId,
        level: b.level,
        goal: b.goal,
        topic: b.topic,
        history: Array.isArray(b.history) ? b.history.slice(-12) : [],
        userText: b.userText.slice(0, 500),
      });
      return json(res, 200, out);
    }
    if (req.method === "POST" && url.pathname === "/api/summary") {
      const b = await readBody(req);
      const out = await tutorSummary({
        scenarioId: b.scenarioId,
        level: b.level,
        goal: b.goal,
        topic: b.topic,
        userTexts: (Array.isArray(b.userTexts) ? b.userTexts : []).map(String),
      });
      return json(res, 200, out);
    }
    if (url.pathname.startsWith("/api/")) {
      return json(res, 404, { error: "unknown api" });
    }
    if (req.method === "GET") {
      return serveStatic(req, res, url.pathname);
    }
    res.writeHead(405);
    res.end();
  } catch (err) {
    json(res, 500, { error: String(err.message || err) });
  }
});

server.listen(PORT, () => {
  const info = tutorInfo();
  console.log(`[polish-trainer] http://localhost:${PORT}  (tutor mode: ${info.mode}${info.mode === "ai" ? ", model: " + info.model : ""})`);
});
