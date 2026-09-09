// LLM tutor: calls an Anthropic-compatible /v1/messages endpoint
// (here: local Qwen-27B proxy) and asks for strict JSON.
// Falls back to the offline demo tutor on any failure.
// Bidirectional: scenario.lang ("pl" | "de") picks the target language; the
// learner's native language is always the other one of the DE↔PL pair.

// Shared scenario + demo-tutor + prompt-contract modules live in app/
// (bundled into the APK too, and also used by the on-device Gemma path there)
import { getScenario } from "../app/scenarios.mjs";
import { demoOpen, demoTurn, demoReset, demoSummary } from "../app/demo-tutor.mjs";
import { tutorSystemPrompt as systemPrompt, summarySystemPrompt, parseTutorReply, parseSummaryReply } from "../app/prompts.mjs";

const BASE_URL = process.env.ANTHROPIC_BASE_URL;
const TOKEN = process.env.ANTHROPIC_AUTH_TOKEN;
const MODEL = process.env.ANTHROPIC_MODEL || process.env.ANTHROPIC_DEFAULT_SONNET_MODEL || "claude-sonnet-5";

export function tutorInfo() {
  const ai = Boolean(BASE_URL && TOKEN);
  return { mode: ai ? "ai" : "demo", model: ai ? MODEL : "demo-script" };
}

export function openConversation(scenarioId, _level, _goal, topic) {
  demoReset(scenarioId);
  const s = getScenario(scenarioId, { topic });
  return { reply: s.opener, hint: s.openerHint, correction: null, vocab: [], done: false };
}

export async function tutorTurn({ scenarioId, level, goal, topic, history, userText }) {
  try {
    const s = getScenario(scenarioId, { topic });
    const messages = [
      { role: "assistant", content: s.opener },
      ...history.map((h) => ({ role: h.role, content: h.text })),
      { role: "user", content: "MY_UTTERANCE: " + userText },
    ];
    const res = await fetch(String(BASE_URL).replace(/\/+$/, "") + "/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": TOKEN,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 700,
        system: systemPrompt({ scenarioId, level, goal, topic }),
        messages,
      }),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) throw new Error("tutor HTTP " + res.status);
    const data = await res.json();
    const raw = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    return parseTutorReply(raw, s.lang);
  } catch (err) {
    // fall back to offline script so the app always answers
    return demoTurn({ scenarioId, userText, topic });
  }
}

export async function tutorSummary({ scenarioId, level, goal, history, userTexts, topic }) {
  if (process.env.KASIA_FORCE_DEMO === "1") {
    return demoSummary({ scenarioId, turns: userTexts.length, userTexts, topic });
  }
  try {
    const utterances = userTexts.map((t, i) => `${i + 1}. ${t}`).join("\n");
    const res = await fetch(String(BASE_URL).replace(/\/+$/, "") + "/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": TOKEN,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 900,
        system: summarySystemPrompt({ scenarioId, topic }),
        messages: [{ role: "user", content: "LEARNER_UTTERANCES:\n" + utterances }],
      }),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) throw new Error("summary HTTP " + res.status);
    const data = await res.json();
    const raw = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("").trim();
    return parseSummaryReply(raw, userTexts.length);
  } catch {
    return demoSummary({ scenarioId, turns: userTexts.length, userTexts, topic });
  }
}
