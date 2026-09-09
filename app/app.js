// Kasia · M0 client. Flow:
// onboarding (3 steps) -> home (streak, daily limit, modes, scenarios)
// -> conversation (bubbles, mic, corrections, vocab, TTS) -> summary (5 axes)

// Offline-Demo-Tutor + Szenarien werden direkt mit ausgeliefert (APK webDir),
// damit die App ohne Server funktioniert. Ein Server wird nur genutzt,
// wenn TUTOR_URL gesetzt ist (window.KASIA_TUTOR_URL, z. B. via capacitor
// Server config oder in index.html).
import { SCENARIOS, getScenario, buildFreestyleScenario, SUMMARY_WORDS_PL, SUMMARY_WORDS_DE, VOCAB_PL, VOCAB_DE } from "./scenarios.mjs";
import { getBasics } from "./basics.mjs";
import { demoOpen, demoTurn, demoSummary } from "./demo-tutor.mjs";
import { newCard, review as srsReview, isDue, RATING } from "./srs.mjs";
import { tutorSystemPrompt, summarySystemPrompt, parseTutorReply, parseSummaryReply, formatUserTurn } from "./prompts.mjs";
import { t, translateUI, LANG_NAME_IN } from "./i18n.mjs";

const $ = (sel) => document.querySelector(sel);

// ---------------- light/dark theme ----------------
// null = follow system (prefers-color-scheme); "light"/"dark" = explicit
// learner choice, persisted so it survives app restarts.
function systemPrefersDark() {
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
}
function isDarkActive(theme) {
  return theme === "dark" || (theme !== "light" && systemPrefersDark());
}
function applyTheme(theme) {
  if (theme === "dark" || theme === "light") document.documentElement.setAttribute("data-theme", theme);
  else document.documentElement.removeAttribute("data-theme");
  const btn = $("#theme-toggle");
  if (btn) btn.textContent = isDarkActive(theme) ? "☀️" : "🌙";
}
function toggleTheme() {
  const current = store.get("kasia_theme", null);
  const next = isDarkActive(current) ? "light" : "dark";
  store.set("kasia_theme", next);
  applyTheme(next);
}
const IS_NATIVE = Boolean(window.Capacitor?.isNativePlatform?.());
// Web: same-origin node server by default (AI mode); native (APK): offline demo.
// Override any time with window.KASIA_TUTOR_URL (e.g. the LAN IP of a running server).
const TUTOR_URL = (window.KASIA_TUTOR_URL || (IS_NATIVE ? "" : window.location.origin)).replace(/\/+$/, "");
// Native VoiceBridge plugin (STT + TTS on Android); null on the web
const VoiceBridge = IS_NATIVE ? window.Capacitor.registerPlugin("VoiceBridge") : null;
// Native AiBridge plugin (on-device Gemma via LiteRT-LM); null on the web
const AiBridge = IS_NATIVE ? window.Capacitor.registerPlugin("AiBridge") : null;
let aiModelReady = false; // set once checkStatus()/downloadModel() confirm the model is on disk
let aiDownloadStarted = false;

// Checks whether the on-device model is present and, on first call, kicks off
// the (~2.4GB, Wi-Fi only in practice) download in the background so the app
// works standalone without a server. Safe to call repeatedly (e.g. every
// loadHome()) — the actual download only ever starts once per app session.
async function ensureAiModel() {
  if (!AiBridge) return;
  try {
    const { status } = await AiBridge.checkStatus();
    if (status === "downloaded") {
      aiModelReady = true;
      $("#tutor-badge").textContent = "Tutor: On-Device-KI (Gemma)";
      return;
    }
  } catch {
    return;
  }
  $("#tutor-badge").textContent = "Tutor: Modell wird geladen … 0%";
  if (aiDownloadStarted) return;
  aiDownloadStarted = true;
  try {
    await AiBridge.downloadModel();
    aiModelReady = true;
    $("#tutor-badge").textContent = "Tutor: On-Device-KI (Gemma)";
  } catch (e) {
    console.error("[AiBridge] model download failed:", e);
    $("#tutor-badge").textContent = "Tutor: Offline-Demo-Modus";
    aiDownloadStarted = false; // allow a retry on the next loadHome()
  }
}

AiBridge?.addListener?.("aiDownloadProgress", (e) => {
  const pct = e.bytesTotal ? Math.floor((100 * e.bytesDownloaded) / e.bytesTotal) : 0;
  const badge = $("#tutor-badge");
  if (badge && !aiModelReady) badge.textContent = `Tutor: Modell wird geladen … ${pct}%`;
});

// A stuck native call must not hang the UI forever ("ghosted" tutor) — race it
// against a hard timeout so a wedged on-device engine still falls back to the
// offline demo script within a bounded wait. The native call itself may keep
// running in the background after this rejects; harmless, nothing awaits it.
function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`${label}-timeout`)), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

// Runs one tutor turn fully on-device. Throws if AiBridge/model isn't ready so
// callers can fall back to the offline demo script, same as a server failure.
async function aiTutorTurn({ scenarioId, level, goal, topic, history, userText, inputLang, nativeName }) {
  // Don't gate on aiModelReady: it's set asynchronously by ensureAiModel() and can
  // still be false right after launch even though the model file is already on
  // disk (checkStatus() hasn't resolved yet). AiBridge.generate() does its own
  // synchronous file-existence check natively and rejects with a clear error if
  // the model truly isn't there yet — that's the correct source of truth.
  if (!AiBridge) throw new Error("no AiBridge (web build)");
  const { text } = await withTimeout(
    AiBridge.generate({
      systemPrompt: tutorSystemPrompt({ scenarioId, level, goal, topic }),
      userText: formatUserTurn(userText, inputLang, nativeName),
      history: history.map((h) => ({ role: h.role, text: h.text })),
    }),
    90000,
    "generate"
  );
  return parseTutorReply(text, getScenario(scenarioId, { topic }).lang);
}

async function aiTutorSummary({ scenarioId, topic, userTexts }) {
  if (!AiBridge) throw new Error("no AiBridge (web build)");
  // Same context-budget reasoning as aiTutorTurn: cap how much we feed the
  // small on-device model so a long conversation doesn't blow its input window.
  const utterances = userTexts.slice(-20).map((t, i) => `${i + 1}. ${t}`).join("\n");
  const { text } = await withTimeout(
    AiBridge.generate({
      systemPrompt: summarySystemPrompt({ scenarioId, topic }),
      userText: "LEARNER_UTTERANCES:\n" + utterances,
    }),
    90000,
    "generate"
  );
  return parseSummaryReply(text, userTexts.length);
}

// ---------------- bidirectional language model ----------------
// The whole product is one DE↔PL corridor: whichever language the learner
// picked to learn is the "target", the other one is their "native" language.
const LANG = {
  polish: { code: "pl", locale: "pl-PL", label: "Polish", other: "german" },
  german: { code: "de", locale: "de-DE", label: "German", other: "polish" },
};
// Language names shown to the user must always be in their NATIVE tongue
// (e.g. a German native reads "Polnisch"/"Deutsch", never "Polish"/"German")
// — nameIn() looks that up; LANG[key].label stays plain English, used only
// for LLM-prompt text (prompts.mjs), which is a machine-facing string.
function nameIn(langKey, nativeCode) {
  return (LANG_NAME_IN[langKey] && LANG_NAME_IN[langKey][nativeCode]) || LANG[langKey].label;
}
function langInfo(profile) {
  const targetKey = LANG[profile?.target] ? profile.target : "polish";
  const target = LANG[targetKey];
  const native = LANG[target.other];
  return { targetKey, target, nativeKey: target.other, native };
}
function currentLangInfo() {
  const profile = (conv && conv.profile) || store.get("kasia_profile", {});
  return langInfo(profile);
}

// ---------------- storage (streak, daily limit, profile, vocab) ----------------
const store = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function daily() {
  let d = store.get("kasia_daily", null);
  if (!d || d.date !== todayKey()) {
    d = { date: todayKey(), used: 0 };
    store.set("kasia_daily", d);
  }
  return d;
}

function isPro() {
  return Boolean(store.get("kasia_profile", {}).pro);
}

function remainingToday() {
  // Personal build, no monetization: unlimited conversations, paywall never triggers.
  return Infinity;
}

function streak() {
  return store.get("kasia_streak", { count: 0, lastDate: null });
}

function bumpStreak() {
  const s = streak();
  const t = new Date();
  const tKey = t.toISOString().slice(0, 10);
  const yesterday = new Date(t.getTime() - 864e5).toISOString().slice(0, 10);
  let count;
  if (s.lastDate === tKey) {
    count = Math.max(1, s.count);
  } else if (s.lastDate === yesterday) {
    count = s.count + 1;
  } else {
    count = 1;
  }
  store.set("kasia_streak", { count, lastDate: tKey });
  return count;
}

function consumedToday() {
  const d = daily();
  d.used += 1;
  store.set("kasia_daily", d);
  return d.used;
}

// ---------------- vocabulary book (spaced repetition) ----------------
// Each entry: {word, gloss, lang, ...srs card fields (stability, difficulty,
// reps, lapses, due, last)}. Older installs stored bare word strings — those
// are migrated to full cards (assumed lang "pl", the only direction that
// existed before bidirectional support) the first time they're read.
const VOCAB_POOL = { pl: VOCAB_PL, de: VOCAB_DE };
function glossFor(word, langCode) {
  const pool = VOCAB_POOL[langCode] || [];
  const hit = pool.find((v) => String(v[langCode]).toLowerCase() === String(word).toLowerCase());
  return hit ? hit[langCode === "de" ? "pl" : "de"] : "";
}

function getVocab() {
  const raw = store.get("kasia_vocab", []);
  let migrated = false;
  const list = raw.map((w) => {
    if (typeof w === "string") {
      migrated = true;
      return { word: w, gloss: glossFor(w, "pl"), lang: "pl", ...newCard() };
    }
    return w;
  });
  if (migrated) store.set("kasia_vocab", list);
  return list;
}

function saveVocabWord(word, langCode) {
  const list = getVocab();
  if (list.some((w) => w.word === word && w.lang === langCode)) return false; // already saved
  list.push({ word, gloss: glossFor(word, langCode), lang: langCode, ...newCard() });
  store.set("kasia_vocab", list);
  return true;
}

// Like saveVocabWord, but for callers (Grundlagen lessons) that already know
// the exact translation and shouldn't rely on the VOCAB_POOL lookup table.
function saveVocabWordWithGloss(word, gloss, langCode) {
  const list = getVocab();
  if (list.some((w) => w.word === word && w.lang === langCode)) return false;
  list.push({ word, gloss, lang: langCode, ...newCard() });
  store.set("kasia_vocab", list);
  return true;
}

function dueVocab(langCode) {
  const now = Date.now();
  return getVocab().filter((w) => w.lang === langCode && isDue(w, now));
}

// ---------------- progress (session history, CEFR estimate, best scores) ----------------
function recordSession({ scenarioId, lang, scores, minutes }) {
  const list = store.get("kasia_sessions", []);
  list.push({ date: Date.now(), scenarioId, lang, scores, minutes });
  store.set("kasia_sessions", list.slice(-200)); // cap growth, keep most recent
}

// crude CEFR band from the rolling average of grammar+vocabulary over the
// learner's last sessions in this direction — a heuristic, not a real
// placement test (see PLAN.md "erweiterte Recherche" / M3 exam mode).
function estimateCefr(langCode) {
  const sessions = store.get("kasia_sessions", []).filter((s) => s.lang === langCode);
  if (sessions.length === 0) return null;
  const recent = sessions.slice(-10);
  const avg = recent.reduce((sum, s) => sum + ((s.scores?.grammar || 0) + (s.scores?.vocabulary || 0)) / 2, 0) / recent.length;
  if (avg < 40) return "A1";
  if (avg < 55) return "A2";
  if (avg < 70) return "B1";
  if (avg < 85) return "B2";
  return "C1";
}

// ---------------- memory across sessions (recurring-mistake tracking) ----------------
// Lightweight, local equivalent of PLAN.md's "Tutor erinnert sich an
// Schwächen" (§2 feature 6): count how often each correction fires per
// direction, and greet a returning learner with their most frequent one.
function recordWeakness(corrected, langCode) {
  if (!corrected) return;
  const map = store.get("kasia_weaknesses", {});
  const key = `${langCode}:${corrected}`;
  map[key] = (map[key] || 0) + 1;
  store.set("kasia_weaknesses", map);
}

function topWeakness(langCode) {
  const map = store.get("kasia_weaknesses", {});
  let best = null;
  for (const [key, count] of Object.entries(map)) {
    const [lang, ...rest] = key.split(":");
    if (lang !== langCode || count < 2) continue;
    if (!best || count > best.count) best = { corrected: rest.join(":"), count };
  }
  return best;
}

function scenarioBest(scenarioId) {
  const sessions = store.get("kasia_sessions", []).filter((s) => s.scenarioId === scenarioId);
  if (sessions.length === 0) return null;
  const axes = ["grammar", "fluency", "vocabulary", "engagement", "relevance"];
  return Math.max(...sessions.map((s) => Math.round(axes.reduce((sum, a) => sum + (s.scores?.[a] || 0), 0) / axes.length)));
}

// ---------------- screen switching ----------------
const SCREENS = ["screen-onboarding", "screen-home", "screen-chat", "screen-review", "screen-basics", "screen-basics-lesson", "screen-summary", "screen-paywall"];
function show(id) {
  for (const s of SCREENS) $(`#${s}`).classList.toggle("hidden", s !== id);
  window.scrollTo(0, 0);
}

// ---------------- TTS (German learners hear Polish) ----------------
let ttsRate = 1.0;
let lastTutorText = "";

function speak(text, rate) {
  const locale = currentLangInfo().target.locale;
  if (VoiceBridge) {
    // native Android TextToSpeech (good PL/DE voices, no cloud)
    VoiceBridge.speak({ text, locale, rate: rate ?? ttsRate }).catch(() => {});
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = locale;
    u.rate = rate ?? ttsRate;
    const voice = window.speechSynthesis.getVoices().find((v) => v.lang.startsWith(locale.slice(0, 2)));
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  } catch {
    /* headless / no TTS: ignore */
  }
}

// ---------------- speech recognition (mic) ----------------
function startMic() {
  const btn = $("#btn-mic");
  const input = $("#chat-text");
  const { target, native } = currentLangInfo();
  const locale = (inputLang === "native" ? native : target).locale;
  if (VoiceBridge) {
    // native Android SpeechRecognizer (on-device STT, PL or DE)
    btn.classList.add("recording");
    VoiceBridge.listen({ locale })
      .then(({ transcript }) => {
        if (transcript && transcript.trim()) {
          input.value = transcript.trim();
          sendTurn();
        } else {
          toast("Nichts erkannt. Nochmal versuchen?");
        }
      })
      .catch((err) => {
        if (err && String(err.message || err).includes("tts-speaking")) {
          toast("Moment, Kasia spricht noch…");
        } else {
          toast("Spracherkennung nicht verfügbar – bitte tippen.");
        }
      })
      .finally(() => btn.classList.remove("recording"));
    return;
  }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    toast("Spracherkennung nicht verfügbar – bitte tippen.");
    return;
  }
  const rec = new SR();
  rec.lang = locale;
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onstart = () => btn.classList.add("recording");
  rec.onresult = (e) => {
    const text = e.results[0][0].transcript;
    input.value = text;
    sendTurn();
  };
  rec.onerror = () => toast("Nichts erkannt. Nochmal versuchen?");
  rec.onend = () => btn.classList.remove("recording");
  rec.start();
}

// Loose "sounds about right" comparison for pronunciation practice — never a
// hard pass/fail gate (a beginner's first attempt at unfamiliar sounds will
// often not match STT exactly; this is feedback, not a test to fail).
function normalizeForCompare(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/ł/g, "l")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}
function soundsLike(a, b) {
  const na = normalizeForCompare(a);
  const nb = normalizeForCompare(b);
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

// Lightweight mic capture for "listen & repeat" practice (Grundlagen, review),
// separate from startMic() which is wired to the chat input/send flow.
async function captureRepeatAttempt(locale) {
  if (!VoiceBridge) {
    toast("Spracherkennung nur in der App verfügbar.");
    return null;
  }
  try {
    const { transcript } = await VoiceBridge.listen({ locale });
    return transcript || null;
  } catch (e) {
    if (e && String(e.message || e).includes("tts-speaking")) {
      toast("Moment, Kasia spricht noch…");
    } else {
      toast("Nichts erkannt. Nochmal versuchen?");
    }
    return null;
  }
}

// ---------------- chat ----------------
let conv = null; // {scenario, profile, history, userTexts, startedAt}
let lastScenarioId = null; // for "repeat scenario" (conv is cleared on summary)
// Which language the learner's next message is in — explicit toggle beats
// asking the (small, on-device) model to detect it itself. Resets to the
// target language at the start of every new conversation.
let inputLang = "target";

function updateInputLangBtn() {
  const { targetKey, nativeKey, native } = currentLangInfo();
  const btn = $("#btn-input-lang");
  if (!btn) return;
  const nc = native.code; // display language for tooltips/labels: always native
  const targetName = nameIn(targetKey, nc);
  const nativeName = nameIn(nativeKey, nc);
  const lang = inputLang === "native" ? nativeName : targetName;
  btn.textContent = inputLang === "native" ? `❓ ${lang}` : `🗣️ ${lang}`;
  btn.classList.toggle("native-mode", inputLang === "native");
  btn.title = inputLang === "native"
    ? t(nc, "chat.inputlang.native.title", { lang: nativeName, target: targetName })
    : t(nc, "chat.inputlang.target.title", { lang: targetName, native: nativeName });
}

function historyPair() {
  return (conv ? conv.history : []).map((h) => ({ role: h.role, text: h.text }));
}

function addTutor(text, hint, { correction, vocab, noSpeak, offline } = {}) {
  const log = $("#chat-log");
  const row = document.createElement("div");
  row.className = "tutor-row";
  row.innerHTML =
    `<div class="tutor-avatar">🧑‍🏫</div>
     <div class="bubble" data-speak>${escapeHtml(text)}
       ${hint ? `<span class="hint">💡 ${escapeHtml(hint)}</span>` : ""}
       ${offline ? `<span class="offline-tag" title="KI nicht erreichbar — Antwort aus dem Offline-Skript">🔌 Offline-Antwort</span>` : ""}
     </div>`;
  log.appendChild(row);
  lastTutorText = text;

  if (correction && correction.corrected) {
    // always tracked for cross-session memory, even with Coach mode off —
    // the correction just doesn't interrupt the chat visually (PLAN.md §5
    // risk 3: "Coach-Modus ein-/ausschaltbar" so corrections don't kill flow)
    recordWeakness(correction.corrected, currentLangInfo().target.code);
    if (!store.get("kasia_profile", {}).coachOff) {
      const c = document.createElement("div");
      c.className = "correction-card";
      const note = correction.noteNative || correction.noteDe;
      c.innerHTML =
        `<b>Korrektur</b>
         ${correction.original ? `<span>„${escapeHtml(correction.original)}“ → </span>` : ""}
         <span class="fix">${escapeHtml(correction.corrected)}</span>
         ${note ? `<span class="note">${escapeHtml(note)}</span>` : ""}`;
      log.appendChild(c);
    }
  }
  if (vocab && vocab.length) {
    const { target, nativeKey } = currentLangInfo();
    const tc = target.code;
    const nc = LANG[nativeKey].code;
    const v = document.createElement("div");
    v.className = "vocab-chips";
    v.innerHTML = vocab
      .map((w) => `<span class="vocab-chip" title="speaks word">${escapeHtml(w[tc] || w.pl || "")} <small>${escapeHtml(w[nc] || w.de || "")}</small></span>`)
      .join("");
    log.appendChild(v);
  }
  scrollChat();
  // A raw-text fallback reply (model broke out of JSON) isn't guaranteed to be
  // in the target language — reading it aloud through the target-language TTS
  // voice would be jarring if the model actually replied in the wrong language.
  if (!noSpeak) speak(text);
}

function addMemoryNote(text) {
  const log = $("#chat-log");
  const row = document.createElement("div");
  row.className = "memory-row";
  row.innerHTML = `<span class="memory-note">💭 ${escapeHtml(text)}</span>`;
  log.appendChild(row);
  scrollChat();
}

function addUser(text) {
  const log = $("#chat-log");
  const row = document.createElement("div");
  row.className = "user-row";
  row.innerHTML = `<div class="bubble user-bubble">${escapeHtml(text)}</div>`;
  log.appendChild(row);
  scrollChat();
}

function addThinking(on) {
  const log = $("#chat-log");
  let t = $("#thinking-bubble");
  if (on) {
    t = document.createElement("div");
    t.id = "thinking-bubble";
    t.className = "thinking";
    t.textContent = "…";
    log.appendChild(t);
    scrollChat();
  } else if (t) {
    t.remove();
  }
}

function scrollChat() {
  const log = $("#chat-log");
  log.scrollTop = log.scrollHeight;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function api(path, body) {
  if (!TUTOR_URL) throw new Error("offline (kein Server konfiguriert)");
  const res = await fetch(TUTOR_URL + path, {
    method: body ? "POST" : "GET",
    headers: { "content-type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${path} -> ${res.status}`);
  return res.json();
}

async function startScenario(scenario, topic) {
  if (remainingToday() <= 0) {
    show("screen-paywall");
    return;
  }
  lastScenarioId = scenario.id;
  const profile = store.get("kasia_profile", {});
  const { targetKey, target, nativeKey, native } = langInfo(profile);
  const nc = native.code;
  $("#chat-scenario-title").textContent = scenario.titleTarget;
  $("#chat-goal").textContent = scenario.goalNative;
  $("#chat-text").placeholder = t(nc, "chat.placeholder", { lang: nameIn(targetKey, nc) });
  $("#btn-hints").title = t(nc, "chat.hints.title", { lang: nameIn(nativeKey, nc) });
  inputLang = "target";
  updateInputLangBtn();
  const coachOff = Boolean(profile.coachOff);
  $("#btn-coach").textContent = t(nc, coachOff ? "chat.coach.off" : "chat.coach.on");
  $("#btn-coach").classList.toggle("active", !coachOff);
  $("#chat-log").innerHTML = "";
  conv = {
    scenario,
    profile,
    topic: topic || "",
    history: [],
    userTexts: [],
    startedAt: Date.now(),
  };
  consumedToday();
  updateHomeChips();
  show("screen-chat");

  try {
    const r = await api("/api/open", { scenarioId: scenario.id, level: profile.level, goal: profile.goal, topic: conv.topic });
    addTutor(r.reply, r.hint);
    conv.history.push({ role: "assistant", text: r.reply });
  } catch {
    // offline / no server: bundled demo tutor answers (also used when a
    // configured server is unreachable)
    const r = demoOpen(scenario.id, conv.topic);
    addTutor(r.reply, r.hint);
    conv.history.push({ role: "assistant", text: r.reply });
  }

  // memory across sessions: nudge the learner about their most frequent
  // recurring mistake in this direction, if any (PLAN.md §2 feature 6)
  const weak = topWeakness(target.code);
  if (weak) {
    addMemoryNote(
      target.code === "de"
        ? `Ostatnim razem ćwicz jeszcze: „${weak.corrected}”`
        : `Letztes Mal hat's gehakt bei: „${weak.corrected}“`
    );
  }
}

// Guards against firing a second generate() call while one is still pending —
// without this, a hung on-device call plus an impatient re-send piled up
// concurrent native calls on the same (possibly non-reentrant) LiteRT-LM
// engine, which could wedge it so every later turn hung forever ("ghosting").
let turnPending = false;
async function sendTurn() {
  if (!conv || turnPending) return;
  const input = $("#chat-text");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  addUser(text);
  conv.userTexts.push(text);
  conv.history.push({ role: "user", text });
  addThinking(true);
  turnPending = true;
  $("#btn-send").disabled = true;
  try {
    const r = await api("/api/tutor", {
      scenarioId: conv.scenario.id,
      level: conv.profile.level,
      goal: conv.profile.goal,
      topic: conv.topic,
      history: historyPair(),
      userText: text,
    });
    addThinking(false);
    addTutor(r.reply, r.hint, { correction: r.correction, vocab: r.vocab });
    conv.history.push({ role: "assistant", text: r.reply });
    if (r.done) endConversation();
  } catch {
    try {
      const { native } = currentLangInfo();
      const r = await aiTutorTurn({
        scenarioId: conv.scenario.id,
        level: conv.profile.level,
        goal: conv.profile.goal,
        topic: conv.topic,
        // Cap history for the on-device model: a small model's grip on the
        // JSON contract measurably degrades as the injected context grows —
        // the last few turns are enough to keep the conversation coherent.
        history: historyPair().slice(-6),
        userText: text,
        inputLang,
        nativeName: native.label,
      });
      addThinking(false);
      addTutor(r.reply, r.hint, { correction: r.correction, vocab: r.vocab, noSpeak: r.fallback });
      conv.history.push({ role: "assistant", text: r.reply });
      if (r.done) endConversation();
    } catch {
      // fully offline: demo tutor keeps the conversation going. Flagged
      // visibly in the chat — silently practicing against the scripted demo
      // while believing it's the real AI tutor is worse than an honest label.
      addThinking(false);
      const r = demoTurn({ scenarioId: conv.scenario.id, userText: text, topic: conv.topic });
      addTutor(r.reply, r.hint, { correction: r.correction, vocab: r.vocab, offline: true });
      conv.history.push({ role: "assistant", text: r.reply });
      if (r.done) endConversation();
    }
  } finally {
    turnPending = false;
    $("#btn-send").disabled = false;
  }
}

// ---------------- summary ----------------
async function endConversation() {
  if (!conv) return;
  show("screen-summary");
  $("#summary-title").textContent = "Gut gemacht! 🎉";
  const wordsCount = 0; // filled after summary
  const { target } = langInfo(conv.profile);
  let r;
  try {
    r = await api("/api/summary", {
      scenarioId: conv.scenario.id,
      level: conv.profile.level,
      goal: conv.profile.goal,
      topic: conv.topic,
      userTexts: conv.userTexts,
    });
  } catch {
    try {
      r = await aiTutorSummary({ scenarioId: conv.scenario.id, topic: conv.topic, userTexts: conv.userTexts });
    } catch {
      // fully offline: rule-based 5-axis summary from the demo tutor
      r = demoSummary({ scenarioId: conv.scenario.id, turns: conv.userTexts.length, userTexts: conv.userTexts, topic: conv.topic });
    }
  }
  // An empty conversation (quit immediately) has nothing to score — recording
  // it anyway would feed a meaningless data point into the CEFR estimate.
  if (conv.userTexts.length > 0) {
    recordSession({ scenarioId: conv.scenario.id, lang: target.code, scores: r.scores, minutes: r.minutes });
  }
  const axes = ["grammar", "fluency", "vocabulary", "engagement", "relevance"];
  for (const a of axes) {
    const rowEl = $("#score-" + a);
    const val = Math.max(0, Math.min(100, Number(r.scores?.[a]) || 0));
    rowEl.querySelector(".bar i").style.width = val + "%";
    rowEl.querySelector(".score-val").textContent = val;
  }
  $("#summary-note").textContent = r.noteNative || r.noteDe || "";
  $("#stat-words").textContent = r.newWords ?? 0;
  $("#stat-min").textContent = r.minutes ?? 1;
  $("#stat-streak").textContent = bumpStreak();
  const vocabWrap = $("#vocab-save");
  const chips = $("#vocab-chips");
  chips.innerHTML = "";
  const wordList = target.code === "de" ? SUMMARY_WORDS_DE : SUMMARY_WORDS_PL;
  const saved = new Set(getVocab().filter((w) => w.lang === target.code).map((w) => w.word));
  const fresh = [];
  for (const h of conv.history) {
    if (h.role !== "assistant") continue;
    for (const w of wordList) {
      if (h.text.toLowerCase().includes(w.toLowerCase()) && !saved.has(w)) {
        if (!fresh.some((f) => f === w)) fresh.push(w);
      }
    }
  }
  for (const w of fresh.slice(0, 8)) {
    const c = document.createElement("span");
    c.className = "vocab-chip";
    c.textContent = w;
    c.onclick = () => {
      saveVocabWord(w, target.code);
      c.classList.add("saved");
      toast(`„${w}“ gespeichert 📚`);
      updateHomeChips();
    };
    chips.appendChild(c);
  }
  if (fresh.length) vocabWrap.classList.remove("hidden");
  else vocabWrap.classList.add("hidden");
  conv = null;
}

// ---------------- home ----------------
const SCENARIO_EMOJI = {
  "food-market": "🥟",
  "directions-warsaw": "🧭",
  "doctor-visit": "🩺",
  "renting-apartment": "🏠",
  "family-gathering": "☕",
  "bakery-berlin": "🥖",
  "directions-munich": "🧭",
  "arzt-besuch": "🩺",
  "job-interview": "💼",
  "renting-wohnung": "🏠",
};

async function loadHome() {
  const profile = store.get("kasia_profile", null);
  if (!profile) {
    show("screen-onboarding");
    return;
  }
  const { targetKey, target, native } = langInfo(profile);
  const nc = native.code;
  translateUI(nc);
  $(".hello").textContent = targetKey === "german" ? "Guten Tag! 👋" : "Dzień dobry! 👋";
  updateHomeChips();
  updateBasicsCard();
  $("#chip-switch-lang").textContent = targetKey === "german" ? "🇩🇪→🇵🇱" : "🇵🇱→🇩🇪";
  const cefr = estimateCefr(target.code);
  const wordsLearned = getVocab().filter((w) => w.lang === target.code).length;
  const progressLine = $("#progress-line");
  if (cefr || wordsLearned > 0) {
    const parts = [];
    if (cefr) parts.push(t(nc, "home.progress.level", { cefr }));
    parts.push(t(nc, "home.progress.words", { n: wordsLearned }));
    progressLine.textContent = parts.join("  ·  ");
    progressLine.classList.remove("hidden");
  } else {
    progressLine.classList.add("hidden");
  }
  $("#tutor-badge").textContent = TUTOR_URL ? "Tutor: lade …" : "Tutor: Offline-Demo-Modus";
  if (TUTOR_URL) {
    try {
      const h = await api("/api/health");
      $("#tutor-badge").textContent =
        h.mode === "ai" ? `Tutor: KI (${h.model})` : "Tutor: Offline-Demo-Modus";
    } catch {
      $("#tutor-badge").textContent = "Tutor: offline (Demo-Modus)";
    }
  } else {
    ensureAiModel(); // native: kick off / check the on-device Gemma model in the background
  }
  let scenarios = SCENARIOS; // bundled with the app (works in the APK without a server)
  if (TUTOR_URL) {
    try {
      ({ scenarios } = await api("/api/scenarios"));
    } catch {
      /* fall back to the bundled list */
    }
  }
  scenarios = scenarios.filter((s) => s.lang === target.code);
  const list = $("#scenario-list");
  list.innerHTML = "";
  for (const s of scenarios) {
    const best = scenarioBest(s.id);
    const b = document.createElement("button");
    b.className = "scenario-card";
    b.innerHTML =
      `<span class="s-emoji">${SCENARIO_EMOJI[s.id] || "💬"}</span>
       <span><b>${escapeHtml(s.titleTarget)}</b><small>${escapeHtml(s.goalNative)}</small></span>
       ${best !== null ? `<span class="s-best">Best ${best}</span>` : ""}`;
    b.onclick = () => startScenario(s);
    list.appendChild(b);
  }
  show("screen-home");
}

function updateHomeChips() {
  $("#chip-streak").textContent = `🔥 ${streak().count}`;
  const { target, native } = currentLangInfo();
  const nc = native.code;
  $("#chip-daily").textContent = t(nc, "home.chip.unlimited");
  const due = dueVocab(target.code).length;
  const reviewChip = $("#chip-review");
  reviewChip.classList.toggle("hidden", due === 0);
  if (due > 0) reviewChip.textContent = t(nc, "home.chip.due", { n: due });
}

// ---------------- Grundlagen (absolute-beginner curriculum) ----------------
// A learner with zero prior knowledge can't just be dropped into a role-play
// scenario — scenarios assume the learner can already form basic sentences.
// This is the step below that: greetings, numbers, question words,
// pronouns+to-be/to-have, then survival phrases (see basics.mjs for the full
// rationale). Progress + completed lessons feed straight into the existing
// SRS vocab book, so the words get reinforced the same way scenario vocab does.
function basicsProgressAll() {
  return store.get("kasia_basics_progress", {});
}
function basicsProgress(langCode) {
  return basicsProgressAll()[langCode] || {};
}
function markBasicsLessonDone(langCode, lessonId) {
  const all = basicsProgressAll();
  all[langCode] = { ...(all[langCode] || {}), [lessonId]: true };
  store.set("kasia_basics_progress", all);
}
function basicsDoneCount(langCode) {
  const done = basicsProgress(langCode);
  return getBasics(langCode).filter((l) => done[l.id]).length;
}

function updateBasicsCard() {
  const card = $("#basics-card");
  if (!card) return;
  const { target } = currentLangInfo();
  const lessons = getBasics(target.code);
  const doneCount = basicsDoneCount(target.code);
  card.classList.remove("hidden");
  $("#basics-progress-text").textContent = `${doneCount}/${lessons.length}`;
  $("#basics-progress-fill").style.width = `${Math.round((100 * doneCount) / lessons.length)}%`;
  $("#basics-card-sub").textContent =
    doneCount === 0
      ? "Noch keine Vorkenntnisse? Fang hier an."
      : doneCount === lessons.length
        ? "Abgeschlossen — bereit fürs erste Gespräch!"
        : "Weiter üben, damit das erste Gespräch klappt.";
}

function allBasicsItems(langCode) {
  return getBasics(langCode).flatMap((l) => l.items);
}

// Fisher-Yates — used to randomize card order and multiple-choice options so
// repeating a lesson doesn't just replay the same fixed sequence.
function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function setEmoji(sel, emoji) {
  const el = $(sel);
  if (!el) return;
  if (emoji) {
    el.textContent = emoji;
    el.classList.remove("hidden");
  } else {
    el.textContent = "";
    el.classList.add("hidden");
  }
}

function loadBasicsList() {
  const { target } = currentLangInfo();
  const lessons = getBasics(target.code);
  const done = basicsProgress(target.code);
  const list = $("#basics-lesson-list");
  list.innerHTML = "";
  lessons.forEach((lesson, i) => {
    const b = document.createElement("button");
    b.className = "scenario-card";
    b.innerHTML =
      `<span class="s-emoji">${done[lesson.id] ? "✅" : "📘"}</span>
       <span><b>${i + 1}. ${escapeHtml(lesson.title)}</b><small>${lesson.items.length} Wörter/Sätze</small></span>`;
    b.onclick = () => openBasicsLesson(lesson.id);
    list.appendChild(b);
  });
  $("#basics-lessons-sub").textContent = `${basicsDoneCount(target.code)}/${lessons.length} Lektionen abgeschlossen`;
  const mixedBtn = $("#btn-basics-mixed");
  if (mixedBtn) mixedBtn.classList.toggle("hidden", basicsDoneCount(target.code) === 0);
  show("screen-basics");
}

// ---- lesson runner state: three phases per lesson (present -> recognize ->
// produce), each a well-established distinct memory pathway (see PLAN.md
// §9.1/§9.4) rather than repeating the same flashcard format three times. ----
let basicsPhase = "learn"; // "learn" | "mc" | "sentence" | "done"
let basicsLearnQueue = [];
let basicsMcQueue = [];
let basicsSentenceQueue = [];
let basicsLessonItems = []; // distractor pool for multiple choice
let basicsCurrent = null;
let basicsLessonId = null; // null while running the cross-lesson mixed review
let basicsStepDone = 0;
let basicsStepTotal = 1;

function updateBasicsStepProgress() {
  $("#basics-lesson-progress").textContent = `Schritt ${Math.min(basicsStepDone, basicsStepTotal)}/${basicsStepTotal}`;
}

function openBasicsLesson(lessonId) {
  const { target } = currentLangInfo();
  const lesson = getBasics(target.code).find((l) => l.id === lessonId);
  if (!lesson) return;
  basicsLessonId = lessonId;
  basicsLessonItems = lesson.items;
  basicsLearnQueue = [...lesson.items];
  basicsMcQueue = shuffled(lesson.items);
  basicsSentenceQueue = shuffled(lesson.sentences || []);
  basicsStepDone = 0;
  basicsStepTotal = basicsLearnQueue.length + basicsMcQueue.length + basicsSentenceQueue.length;
  basicsPhase = "learn";
  $("#basics-lesson-title").textContent = lesson.title;
  show("screen-basics-lesson");
  nextBasicsStep();
}

// A shorter, mc-only pass over every item from already-completed lessons —
// interleaved retrieval across lessons is more effective than only ever
// drilling a lesson in isolation right after learning it (PLAN.md §9.1).
function openBasicsMixedReview() {
  const { target } = currentLangInfo();
  const done = basicsProgress(target.code);
  const doneLessons = getBasics(target.code).filter((l) => done[l.id]);
  const pool = shuffled(doneLessons.flatMap((l) => l.items)).slice(0, 15);
  if (pool.length < 4) {
    toast("Schließe zuerst mehr Lektionen ab, um gemischt zu üben.");
    return;
  }
  basicsLessonId = null;
  basicsLessonItems = pool;
  basicsLearnQueue = [];
  basicsMcQueue = pool;
  basicsSentenceQueue = [];
  basicsStepDone = 0;
  basicsStepTotal = basicsMcQueue.length;
  basicsPhase = "learn";
  $("#basics-lesson-title").textContent = "🔀 Gemischte Wiederholung";
  show("screen-basics-lesson");
  nextBasicsStep();
}

function nextBasicsStep() {
  basicsStepDone += 1;
  if (basicsPhase === "learn") {
    if (basicsLearnQueue.length > 0) {
      updateBasicsStepProgress();
      showBasicsLearnCard();
      return;
    }
    basicsPhase = "mc";
  }
  if (basicsPhase === "mc") {
    if (basicsMcQueue.length > 0) {
      updateBasicsStepProgress();
      showBasicsMcCard();
      return;
    }
    basicsPhase = "sentence";
  }
  if (basicsPhase === "sentence") {
    if (basicsSentenceQueue.length > 0) {
      updateBasicsStepProgress();
      showBasicsSentenceCard();
      return;
    }
    basicsPhase = "done";
  }
  finishBasicsLesson();
}

function hideAllBasicsViews() {
  $("#basics-card-view").classList.add("hidden");
  $("#basics-mc-view").classList.add("hidden");
  $("#basics-sentence-view").classList.add("hidden");
  $("#basics-lesson-done").classList.add("hidden");
}

// ---- phase 1: present (listen, optionally repeat aloud) ----
function showBasicsLearnCard() {
  hideAllBasicsViews();
  $("#basics-card-view").classList.remove("hidden");
  $("#basics-gloss").classList.add("hidden");
  $("#btn-basics-next").classList.add("hidden");
  $("#btn-basics-show").classList.remove("hidden");
  $("#basics-repeat-feedback").textContent = "";
  $("#basics-repeat-feedback").className = "repeat-feedback";
  basicsCurrent = basicsLearnQueue.shift();
  $("#basics-word").textContent = basicsCurrent.word;
  $("#basics-gloss").textContent = basicsCurrent.gloss;
  setEmoji("#basics-emoji", basicsCurrent.emoji);
  speak(basicsCurrent.word, 0.9);
}

async function repeatBasicsWord() {
  if (!basicsCurrent) return;
  const { target } = currentLangInfo();
  const fb = $("#basics-repeat-feedback");
  fb.textContent = "🎤 …";
  fb.className = "repeat-feedback";
  const transcript = await captureRepeatAttempt(target.locale);
  if (transcript === null) {
    fb.textContent = "";
    return;
  }
  if (soundsLike(transcript, basicsCurrent.word)) {
    fb.textContent = "✅ Klingt gut!";
    fb.className = "repeat-feedback good";
  } else {
    fb.textContent = `🔁 Nochmal? Gehört: „${transcript}“`;
    fb.className = "repeat-feedback retry";
  }
}

// ---- phase 2: recognize (multiple choice) ----
function showBasicsMcCard() {
  hideAllBasicsViews();
  $("#basics-mc-view").classList.remove("hidden");
  $("#btn-basics-mc-next").classList.add("hidden");
  basicsCurrent = basicsMcQueue.shift();
  $("#basics-mc-word").textContent = basicsCurrent.word;
  setEmoji("#basics-mc-emoji", basicsCurrent.emoji);
  const { target } = currentLangInfo();
  const pool = basicsLessonItems.length >= 4 ? basicsLessonItems : allBasicsItems(target.code);
  const distractors = shuffled(pool.filter((it) => it.gloss !== basicsCurrent.gloss)).slice(0, 3);
  const options = shuffled([basicsCurrent, ...distractors]);
  const box = $("#basics-mc-options");
  box.innerHTML = "";
  options.forEach((opt) => {
    const b = document.createElement("button");
    b.className = "mc-option";
    b.textContent = opt.gloss;
    b.onclick = () => handleBasicsMcAnswer(b, opt === basicsCurrent);
    box.appendChild(b);
  });
}

function handleBasicsMcAnswer(btn, correct) {
  const box = $("#basics-mc-options");
  [...box.children].forEach((b) => (b.disabled = true));
  btn.classList.add(correct ? "mc-correct" : "mc-wrong");
  if (!correct) {
    const correctBtn = [...box.children].find((b) => b.textContent === basicsCurrent.gloss);
    if (correctBtn) correctBtn.classList.add("mc-correct");
  }
  $("#btn-basics-mc-next").classList.remove("hidden");
}

// ---- phase 3: produce (tap words into the right order) ----
let sentenceAnswer = null;
let sentenceBank = [];
let sentenceTarget = [];

function showBasicsSentenceCard() {
  hideAllBasicsViews();
  $("#basics-sentence-view").classList.remove("hidden");
  $("#btn-basics-sentence-next").classList.add("hidden");
  sentenceAnswer = basicsSentenceQueue.shift();
  sentenceTarget = [];
  sentenceBank = shuffled(sentenceAnswer.parts.map((text, i) => ({ text, id: `${i}-${Math.random()}` })));
  $("#basics-sentence-gloss").textContent = sentenceAnswer.gloss;
  $("#basics-sentence-feedback").textContent = "";
  $("#basics-sentence-feedback").className = "repeat-feedback";
  renderSentenceChips();
}

function renderSentenceChips() {
  const targetEl = $("#basics-sentence-target");
  const bankEl = $("#basics-sentence-bank");
  targetEl.innerHTML = sentenceTarget.length
    ? sentenceTarget.map((w) => `<button class="chip-word" data-id="${w.id}">${escapeHtml(w.text)}</button>`).join("")
    : '<span class="sentence-placeholder">Tippe die Wörter in der richtigen Reihenfolge …</span>';
  bankEl.innerHTML = sentenceBank.map((w) => `<button class="chip-word" data-id="${w.id}">${escapeHtml(w.text)}</button>`).join("");
}

function checkSentenceIfComplete() {
  if (sentenceBank.length > 0) return;
  const correct = sentenceTarget.map((w) => w.text).join(" ") === sentenceAnswer.parts.join(" ");
  const fb = $("#basics-sentence-feedback");
  if (correct) {
    fb.textContent = "✅ Richtig!";
    fb.className = "repeat-feedback good";
  } else {
    fb.textContent = `🔁 Nicht ganz — richtig wäre: „${sentenceAnswer.parts.join(" ")}“`;
    fb.className = "repeat-feedback retry";
  }
  $("#btn-basics-sentence-next").classList.remove("hidden");
}

function resetSentenceAttempt() {
  if (!sentenceAnswer) return;
  sentenceBank = shuffled([...sentenceBank, ...sentenceTarget]);
  sentenceTarget = [];
  $("#basics-sentence-feedback").textContent = "";
  $("#btn-basics-sentence-next").classList.add("hidden");
  renderSentenceChips();
}

function finishBasicsLesson() {
  hideAllBasicsViews();
  $("#basics-lesson-done").classList.remove("hidden");
  $("#basics-lesson-progress").textContent = "";
  if (basicsLessonId) {
    const { target } = currentLangInfo();
    const lesson = getBasics(target.code).find((l) => l.id === basicsLessonId);
    if (lesson) {
      for (const item of lesson.items) saveVocabWordWithGloss(item.word, item.gloss, target.code);
      markBasicsLessonDone(target.code, basicsLessonId);
    }
    $("#basics-lesson-done-msg").textContent = "🎉 Lektion abgeschlossen! Die Wörter wandern jetzt in dein Vokabelheft.";
  } else {
    $("#basics-lesson-done-msg").textContent = "🎉 Gemischte Wiederholung abgeschlossen!";
  }
  updateBasicsCard();
}

// ---------------- vocabulary review screen ----------------
let reviewQueue = [];
let reviewCurrent = null;

function loadReview() {
  const { target } = currentLangInfo();
  reviewQueue = dueVocab(target.code);
  show("screen-review");
  nextReviewCard();
}

function nextReviewCard() {
  $("#review-gloss").classList.add("hidden");
  $("#review-ratings").classList.add("hidden");
  $("#btn-review-show").classList.remove("hidden");
  if (reviewQueue.length === 0) {
    $("#review-card").classList.add("hidden");
    $("#review-empty").classList.remove("hidden");
    $("#review-progress").textContent = "";
    reviewCurrent = null;
    return;
  }
  $("#review-card").classList.remove("hidden");
  $("#review-empty").classList.add("hidden");
  reviewCurrent = reviewQueue[0];
  const nc = currentLangInfo().native.code;
  $("#review-word").textContent = reviewCurrent.word;
  $("#review-gloss").textContent = reviewCurrent.gloss || t(nc, "review.noGloss");
  $("#review-progress").textContent = t(nc, "home.chip.due", { n: reviewQueue.length });
}

function rateCurrentCard(rating) {
  if (!reviewCurrent) return;
  const list = getVocab();
  const idx = list.findIndex((w) => w.word === reviewCurrent.word && w.lang === reviewCurrent.lang);
  if (idx >= 0) {
    list[idx] = srsReview(list[idx], rating);
    store.set("kasia_vocab", list);
  }
  reviewQueue.shift();
  nextReviewCard();
}

// ---------------- onboarding ----------------
let obStep = 1;
function obOptions() {
  const map = { 1: "ob-lang", 2: "ob-level", 3: "ob-goal" };
  return $(`#${map[obStep]}`);
}

// Native language isn't known from a saved profile yet during onboarding —
// derived instead from the tentative step-1 pick (defaults to "polish"
// selected in the HTML, i.e. native German, matching the default markup).
function obNativeCode() {
  const targetVal = $("#ob-lang .selected")?.dataset.value || "polish";
  return targetVal === "german" ? "pl" : "de";
}

function obSelect(value) {
  obOptions().querySelectorAll(".ob-opt").forEach((b) => {
    b.classList.toggle("selected", b.dataset.value === value);
  });
  if (obStep === 1) translateUI(value === "german" ? "pl" : "de");
}

function obContinue() {
  if (obStep < 3) {
    obStep += 1;
    document.querySelectorAll("#screen-onboarding .ob-step").forEach((el) => {
      el.classList.toggle("hidden", Number(el.dataset.step) !== obStep);
    });
    $("#ob-next").textContent = t(obNativeCode(), "onboarding.continue");
    $("#ob-start").classList.add("hidden");
    if (obStep === 3) {
      $("#ob-next").classList.add("hidden");
      $("#ob-start").classList.remove("hidden");
    }
  } else {
    const profile = {
      target: $(`#ob-lang .selected`)?.dataset.value || "polish",
      level: $(`#ob-level .selected`)?.dataset.value || "beginner",
      goal: $(`#ob-goal .selected`)?.dataset.value || "travel",
    };
    store.set("kasia_profile", profile);
    loadHome();
  }
}

// ---------------- toast ----------------
let toastTimer = null;
function toast(msg) {
  let t = $("#toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    Object.assign(t.style, {
      position: "fixed", bottom: "84px", left: "50%", transform: "translateX(-50%)",
      background: "#23201c", color: "#fff", padding: "10px 16px", borderRadius: "999px",
      fontSize: "13.5px", zIndex: 99, maxWidth: "88%", textAlign: "center",
      boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
    });
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.add("hidden"), 2600);
}

// ---------------- wiring ----------------
document.addEventListener("DOMContentLoaded", () => {
  applyTheme(store.get("kasia_theme", null));
  $("#theme-toggle").onclick = toggleTheme;

  // onboarding
  $("#ob-next").onclick = obContinue;
  for (const [id, attr] of [["ob-lang", "lang"], ["ob-level", "level"], ["ob-goal", "goal"]]) {
    $(`#${id}`).addEventListener("click", (e) => {
      const b = e.target.closest(".ob-opt");
      if (b && !b.disabled) obSelect(b.dataset.value);
    });
  }
  $("#ob-start").onclick = obContinue;

  // home
  $("#btn-reset-day").onclick = () => {
    store.set("kasia_daily", { date: todayKey(), used: 0 });
    updateHomeChips();
    toast("Tageslimit zurückgesetzt.");
  };
  $("#btn-manage-pro").onclick = () => {
    const profile = store.get("kasia_profile", {});
    profile.pro = false;
    store.set("kasia_profile", profile);
    toast("Pro deaktiviert (Dev).");
    updateHomeChips();
  };
  $("#chip-switch-lang").onclick = () => {
    const profile = store.get("kasia_profile", {});
    const { targetKey } = langInfo(profile);
    profile.target = targetKey === "german" ? "polish" : "german";
    store.set("kasia_profile", profile);
    toast(profile.target === "german" ? "Umgeschaltet: Deutsch lernen" : "Umgeschaltet: Polnisch lernen");
    loadHome();
  };
  if (AiBridge) {
    $("#btn-ai-test").classList.remove("hidden");
    $("#btn-ai-test").onclick = async () => {
      console.log("[ai-test] checkStatus …");
      toast("AiBridge: prüfe Status …");
      try {
        const { status } = await AiBridge.checkStatus();
        console.log("[ai-test] status:", status);
        if (status !== "downloaded") {
          toast("Modell fehlt — lade herunter (siehe Logcat für Fortschritt) …");
          await AiBridge.downloadModel();
          toast("Download fertig — initialisiere Engine …");
        }
        toast("Generiere (erster Start kann bis zu 10s dauern) …");
        const { text } = await AiBridge.generate({
          systemPrompt: "You are a concise assistant. Answer in one short sentence.",
          userText: "Say hello in Polish and German.",
        });
        console.log("[ai-test] generate result:", text);
        toast(`AI: ${text}`);
      } catch (e) {
        console.error("[ai-test] error:", e);
        toast(`AiBridge-Fehler: ${e?.message || e}`);
      }
    };
  }

  // paywall
  $("#btn-paywall-trial").onclick = () => {
    const profile = store.get("kasia_profile", {});
    profile.pro = true;
    store.set("kasia_profile", profile);
    toast("🚀 Pro aktiviert (Dev-Vorschau) — echte Zahlungsanbindung folgt.");
    loadHome();
  };
  $("#btn-paywall-close").onclick = loadHome;
  $("#chip-review").onclick = loadReview;
  $("#mode-roleplay").onclick = () => $("#scenario-list").scrollIntoView({ behavior: "smooth" });
  $("#mode-tutor").onclick = () => {
    if (remainingToday() <= 0) {
      show("screen-paywall");
      return;
    }
    const { target, native } = currentLangInfo();
    // Asked in the learner's NATIVE language, not the target — picking a
    // free-conversation topic is a meta/setup step, not target-language
    // practice, so it should be as easy to understand as possible.
    const promptText =
      native.code === "de"
        ? "Worüber möchtest du sprechen? (optional, Enter für 'egal')"
        : "O czym chcesz porozmawiać? (opcjonalnie, Enter = 'wszystko jedno')";
    const topic = window.prompt(promptText);
    if (topic === null) return; // user cancelled — don't spend the daily conversation
    const scenario = buildFreestyleScenario(target.code, topic);
    startScenario(scenario, topic);
  };

  // chat
  $("#btn-input-lang").onclick = () => {
    inputLang = inputLang === "native" ? "target" : "native";
    updateInputLangBtn();
  };
  $("#btn-mic").onclick = startMic;
  $("#btn-send").onclick = sendTurn;
  $("#chat-text").addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendTurn();
  });
  $("#btn-repeat").onclick = () => lastTutorText && speak(lastTutorText, 1.0);
  $("#btn-slower").onclick = () => {
    ttsRate = 0.7;
    if (lastTutorText) speak(lastTutorText, 0.7);
    toast("🐢 Langsamer abgespielt.");
  };
  $("#btn-hints").onclick = (e) => {
    const off = document.body.classList.toggle("no-hints");
    e.target.classList.toggle("active", !off);
  };
  $("#btn-coach").onclick = (e) => {
    const profile = store.get("kasia_profile", {});
    profile.coachOff = !profile.coachOff;
    store.set("kasia_profile", profile);
    const nc = currentLangInfo().native.code;
    e.target.textContent = t(nc, profile.coachOff ? "chat.coach.off" : "chat.coach.on");
    e.target.classList.toggle("active", !profile.coachOff);
    toast(profile.coachOff ? "Korrekturen ausgeblendet — merkt sich Fehler trotzdem für später." : "Korrekturen wieder eingeblendet.");
  };
  $("#btn-quit").onclick = () => {
    if (confirm("Unterhaltung beenden und Ergebnis ansehen?")) endConversation();
  };
  $("#btn-end").onclick = () => endConversation();

  // vocab review
  $("#btn-review-quit").onclick = loadHome;
  $("#btn-review-done").onclick = loadHome;
  $("#btn-review-show").onclick = () => {
    $("#review-gloss").classList.remove("hidden");
    $("#review-ratings").classList.remove("hidden");
    $("#btn-review-show").classList.add("hidden");
  };
  $("#review-ratings").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-rating]");
    if (b) rateCurrentCard(Number(b.dataset.rating));
  });

  // Grundlagen
  $("#basics-card").onclick = loadBasicsList;
  $("#btn-basics-mixed").onclick = openBasicsMixedReview;
  $("#btn-basics-quit").onclick = loadHome;
  $("#btn-basics-lesson-quit").onclick = loadBasicsList;
  $("#btn-basics-lesson-back").onclick = loadBasicsList;
  $("#btn-basics-show").onclick = () => {
    $("#basics-gloss").classList.remove("hidden");
    $("#btn-basics-next").classList.remove("hidden");
    $("#btn-basics-show").classList.add("hidden");
  };
  $("#btn-basics-next").onclick = nextBasicsStep;
  $("#btn-basics-speak").onclick = () => basicsCurrent && speak(basicsCurrent.word, 0.9);
  $("#btn-basics-repeat").onclick = repeatBasicsWord;
  $("#btn-basics-mc-speak").onclick = () => basicsCurrent && speak(basicsCurrent.word, 0.9);
  $("#btn-basics-mc-next").onclick = nextBasicsStep;
  $("#btn-basics-sentence-next").onclick = nextBasicsStep;
  $("#btn-basics-sentence-clear").onclick = resetSentenceAttempt;
  $("#basics-sentence-target").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-id]");
    if (!b) return;
    const idx = sentenceTarget.findIndex((w) => w.id === b.dataset.id);
    if (idx < 0) return;
    const [w] = sentenceTarget.splice(idx, 1);
    sentenceBank.push(w);
    renderSentenceChips();
  });
  $("#basics-sentence-bank").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-id]");
    if (!b) return;
    const idx = sentenceBank.findIndex((w) => w.id === b.dataset.id);
    if (idx < 0) return;
    const [w] = sentenceBank.splice(idx, 1);
    sentenceTarget.push(w);
    renderSentenceChips();
    checkSentenceIfComplete();
  });
  $("#btn-review-speak").onclick = () => {
    // reviewCurrent is always from dueVocab(currentLangInfo().target.code),
    // so its lang already matches the active TTS locale — no override needed.
    if (reviewCurrent) speak(reviewCurrent.word, 0.9);
  };

  // summary
  $("#btn-go-home").onclick = loadHome;
  $("#btn-repeat-scenario").onclick = () => {
    if (!lastScenarioId) return;
    loadHome().then(() => {
      const sc = getScenario(lastScenarioId);
      if (!sc) return;
      if (remainingToday() > 0) startScenario(sc);
      else show("screen-paywall");
    });
  };

  loadHome();
});
