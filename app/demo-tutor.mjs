// Offline demo tutor: scripted scenario path + rule-based corrections.
// Same response shape as the LLM tutor: {reply, correction, vocab, done}.
// Lives in the APK too, so the app works fully standalone (no server).
// Bidirectional: every scenario carries its own `lang` ("pl" | "de"); rule/
// vocab pools are picked by that, so PL-target and DE-target scenarios (and
// the freestyle mode) all flow through the same functions.

import {
  getScenario,
  CORRECTION_RULES_PL,
  CORRECTION_RULES_DE,
  VOCAB_PL,
  VOCAB_DE,
} from "./scenarios.mjs";

const ENGLISH_WORDS = /\b(the|and|is|are|a|an|please|want|buy|cost|money|where|how|what|this|that|station|food|eat|drink)\b/gi;

const FREESTYLE_FOLLOWUPS = {
  pl: [
    "Ciekawe! Opowiedz mi więcej.",
    "A co o tym myślisz?",
    "Dlaczego tak jest?",
    "Co było dalej?",
    "Brzmi fajnie! A ty co lubisz robić w wolnym czasie?",
  ],
  de: [
    "Interessant! Erzähl mir mehr.",
    "Und was denkst du darüber?",
    "Warum ist das so?",
    "Was ist als Nächstes passiert?",
    "Klingt gut! Und was machst du gern in deiner Freizeit?",
  ],
};

const FAREWELL_RE = /\b(bye|goodbye|do widzenia|do zobaczenia|tschüss|tschuss|auf wiedersehen)\b/i;

export function demoTurn({ scenarioId, userText, topic }) {
  const s = getScenario(scenarioId, { topic });
  if (s.freestyle) return freestyleTurn(s, userText);

  const state = demoState(scenarioId, userText);
  const beat = s.beats[state.step];

  const advanced = (beat.advanceOn || []).some((k) => userText.toLowerCase().includes(k.toLowerCase()));
  let reply;
  let hint;
  if (advanced) {
    state.step += 1;
    const next = s.beats[state.step];
    if (next) {
      reply = next.text;
      hint = next.hint;
    } else {
      reply = s.byeText;
      hint = s.byeHint;
    }
    state.done = true;
    state.finished = !next;
  } else {
    reply = beat.nudge;
    hint = beat.nudgeHint;
  }

  return {
    reply,
    hint,
    correction: findCorrection(userText, s.lang),
    vocab: nextVocab(userText, s.lang),
    done: Boolean(state.finished),
  };
}

function freestyleTurn(s, userText) {
  const lang = s.lang;
  const farewell = FAREWELL_RE.test(userText);
  const pool = FREESTYLE_FOLLOWUPS[lang] || FREESTYLE_FOLLOWUPS.pl;
  const reply = farewell ? s.byeText : pool[Math.floor(Math.random() * pool.length)];
  return {
    reply,
    hint: farewell ? s.byeHint : undefined,
    correction: findCorrection(userText, lang),
    vocab: nextVocab(userText, lang),
    done: farewell,
  };
}

// state is kept in a module map keyed by scenario id (one live conversation per scenario)
const states = new Map();

function demoState(scenarioId, userText) {
  let st = states.get(scenarioId);
  if (!st) {
    st = { step: 0, finished: false };
    states.set(scenarioId, st);
  }
  return st;
}

export function demoReset(scenarioId) {
  states.delete(scenarioId);
}

export function demoOpen(scenarioId, topic) {
  demoReset(scenarioId);
  const s = getScenario(scenarioId, { topic });
  return { reply: s.opener, hint: s.openerHint, correction: null, vocab: [], done: false };
}

function findCorrection(text, lang) {
  const rules = lang === "de" ? CORRECTION_RULES_DE : CORRECTION_RULES_PL;
  for (const rule of rules) {
    if (rule.re.test(text)) {
      return {
        original: text.trim(),
        corrected: rule.corrected,
        noteNative: rule.noteNative,
      };
    }
  }
  return null;
}

function nextVocab(text, lang) {
  const lower = text.toLowerCase();
  const pool = lang === "de" ? VOCAB_DE : VOCAB_PL;
  const wordKey = lang === "de" ? "de" : "pl";
  const out = [];
  for (const v of pool) {
    if (lower.includes(String(v[wordKey]).toLowerCase()) && out.length < 2) out.push(v);
  }
  return out;
}

// 5-axis feedback (grammar/fluency/vocabulary/engagement/relevance), heuristic scoring for demo mode
export function demoSummary({ scenarioId, turns, userTexts, topic }) {
  const s = getScenario(scenarioId, { topic });
  const lang = s.lang;
  const words = userTexts.join(" ").toLowerCase();
  const english = [...words.matchAll(ENGLISH_WORDS)].length;
  const politeRe = lang === "de" ? /(bitte|dank)/g : /(prosz|dzięk|dziek)/g;
  const keywordRe =
    lang === "de" ? /(brötchen|hauptbahnhof|kostet|links|rechts|geradeaus)/g : /(pierog|dworzec|kosztuje|lewo|prosto)/g;
  const polite = (words.match(politeRe) || []).length;
  const length = userTexts.join(" ").trim().split(/\s+/).filter(Boolean).length;

  const clamp = (n) => Math.max(35, Math.min(96, Math.round(n)));
  const grammar = clamp(88 - english * 8 - Math.max(0, 2 - length / 8));
  const fluency = clamp(50 + Math.min(30, length / 3) + turns * 2);
  const vocabulary = clamp(55 + (words.match(keywordRe) || []).length * 6);
  const engagement = clamp(70 + turns * 4);
  const relevance = clamp(80 - english * 5);
  const grammarScore = clamp(grammar + polite * 2);

  // noteNative is always in the learner's NATIVE language: Polish for
  // German-target scenarios, German for Polish-target scenarios.
  const note =
    english > 3
      ? lang === "de"
        ? "Wskazówka: użyłeś/aś kilku angielskich słów. Spróbuj zostać całkowicie przy niemieckim."
        : "Hinweis: Du hast mehrere englische Wörter benutzt. Versuch es, komplett auf Polnisch zu bleiben."
      : lang === "de"
        ? "Dobra robota! Następnym razem zwróć uwagę na rodzajniki (der/die/das)."
        : "Gut gemacht! Achte beim nächsten Mal auf die polnischen Fälle (Kasuskas).";

  return {
    scores: { grammar: grammarScore, fluency, vocabulary, engagement, relevance },
    newWords: 3 + Math.min(5, turns),
    minutes: Math.max(1, Math.round(turns / 4)),
    noteNative: note,
  };
}
