// Shared tutor prompt/response contract used by every backend that can play
// the AI tutor: the cloud LLM (lib/tutor.mjs, server-side), and the on-device
// Gemma model (app.js, via AiBridge/LiteRT-LM on Android). Keeping this in one
// place means all three backends (cloud / on-device / offline demo-script)
// agree on the same JSON shape.
import { getScenario } from "./scenarios.mjs";

const LANG_NAME = { pl: "Polish", de: "German" };

export function tutorSystemPrompt({ scenarioId, level, goal, topic }) {
  const s = getScenario(scenarioId, { topic });
  const targetName = LANG_NAME[s.lang] || "Polish";
  const nativeCode = s.lang === "de" ? "pl" : "de";
  const nativeName = LANG_NAME[nativeCode];

  if (s.freestyle) {
    return [
      `You are "${s.tutorName}", a friendly native ${targetName} conversation partner (not a strict teacher) for a ${nativeName} speaker practicing ${targetName} (level: ${level || "beginner"}).`,
      `This is an OPEN, free-form conversation — no fixed script. Topic (if any): ${s.goal}`,
      "Rules:",
      `- Reply in simple ${targetName} (1-3 short sentences), ask a follow-up question to keep the conversation going.`,
      "- Check the learner's last utterance: if it has errors (grammar, wrong word, English mixed in), give one correction.",
      `- The learner's message is prefixed to tell you what it is: "MY_UTTERANCE:" means it's their ${targetName} practice line (correct it via the normal correction mechanism if needed, even if it contains ${nativeName} words). "MY_QUESTION (asked in X):" means they stepped OUT of the roleplay to ask you something in language X — answer that question directly and mainly in X, like a teacher, then gently invite them back into ${targetName} practice.`,
      `- vocab: 0-2 new useful ${targetName} words for this turn, each as a {"word", "translation"} pair.`,
      "- Never repeat a question or request you already made earlier in this conversation (check the history). If the learner already answered something, even oddly, or says they already told you, acknowledge it briefly and move to a new topic — never re-ask the same thing again.",
      "- done: true only if the learner clearly says goodbye / wants to end.",
      `- replyNative: a plain-text translation of "reply" into ${nativeName}, shown to the learner alongside every single tutor line — always required, never empty.`,
      `Reply with ONLY this JSON, no markdown, no comments: {"reply": string, "replyNative": string, "correction": {"original": string, "corrected": string, "noteNative": string} | null, "vocab": [{"word": string, "translation": string}], "done": boolean}`,
      `"noteNative" and "replyNative" must be written in ${nativeName} (the learner's native language). "corrected" must be in ${targetName}.`,
      `CRITICAL: "replyNative" is a TRANSLATION, not a copy — it must be written in ${nativeName}, a completely different language from "reply". Never repeat the "reply" text (or minor spelling variants of it) as "replyNative". Example: reply "Cześć!" -> replyNative "Hallo!" (or vice versa) — always actually translated, never the same words.`,
      `CRITICAL: in "vocab", "word" is ALWAYS in ${targetName} and "translation" is ALWAYS in ${nativeName} — never English, never the same word in both, never a parenthetical gloss. Example: {"word": "Erfahrung", "translation": "${nativeCode === "pl" ? "doświadczenie" : "Erfahrung"}"} — a real ${nativeName} word, nothing else appended.`,
    ].join("\n");
  }

  return [
    `You are the AI tutor "${s.tutorName}" in a role-play scenario for a ${nativeName} speaker learning ${targetName} (level: ${level || "beginner"}, goal: ${goal || "daily conversation"}).`,
    `Scenario: ${s.title}. ${s.persona}`,
    "Learner goal: " + s.goal,
    "Rules:",
    `- You play the character and reply in simple ${targetName} (1-3 short sentences).`,
    "- Check the learner's last utterance: if it has errors (grammar, wrong word, English mixed in), give one correction.",
    `- The learner's message is prefixed to tell you what it is: "MY_UTTERANCE:" means it's their ${targetName} practice line (correct it via the normal correction mechanism if needed, even if it contains ${nativeName} words). "MY_QUESTION (asked in X):" means they stepped OUT of the roleplay to ask you something in language X — answer that question directly and mainly in X, like a teacher, then gently invite them back into the scene in ${targetName}.`,
    `- vocab: 0-2 new useful ${targetName} words for this scene, each as a {"word", "translation"} pair.`,
    "- Never repeat a question or request you already made earlier in this conversation (check the history). If the learner already answered something, even oddly, or says they already told you, acknowledge it briefly and move to a new aspect of the goal — never re-ask the same thing again.",
    "- done: true only if the scenario has naturally ended (farewell / payment done).",
    `- replyNative: a plain-text translation of "reply" into ${nativeName}, shown to the learner alongside every single tutor line — always required, never empty.`,
    `Reply with ONLY this JSON, no markdown, no comments: {"reply": string, "replyNative": string, "correction": {"original": string, "corrected": string, "noteNative": string} | null, "vocab": [{"word": string, "translation": string}], "done": boolean}`,
    `"noteNative" and "replyNative" must be written in ${nativeName} (the learner's native language). "corrected" must be in ${targetName}.`,
    `CRITICAL: "replyNative" is a TRANSLATION, not a copy — it must be written in ${nativeName}, a completely different language from "reply". Never repeat the "reply" text (or minor spelling variants of it) as "replyNative". Example: reply "Cześć!" -> replyNative "Hallo!" (or vice versa) — always actually translated, never the same words.`,
    `CRITICAL: in "vocab", "word" is ALWAYS in ${targetName} and "translation" is ALWAYS in ${nativeName} — never English, never the same word in both, never a parenthetical gloss. Example: {"word": "Erfahrung", "translation": "${nativeCode === "pl" ? "doświadczenie" : "Erfahrung"}"} — a real ${nativeName} word, nothing else appended.`,
  ].join("\n");
}

export function summarySystemPrompt({ scenarioId, topic }) {
  const s = getScenario(scenarioId, { topic });
  const targetName = LANG_NAME[s.lang] || "Polish";
  const nativeCode = s.lang === "de" ? "pl" : "de";
  const nativeName = LANG_NAME[nativeCode];
  return (
    `You are an encouraging ${targetName}-language coach for a ${nativeName} learner. ` +
    "Evaluate the learner's utterances from the scenario '" + s.title + "' " +
    "and grade on 5 axes (0-100): grammar, fluency, vocabulary, engagement, relevance. " +
    `"noteNative" must be written in ${nativeName}. ` +
    'Reply with ONLY this JSON: {"scores": {"grammar": n, "fluency": n, "vocabulary": n, "engagement": n, "relevance": n}, "newWords": n, "noteNative": string}'
  );
}

// The learner explicitly flags which language their message is in via a UI
// toggle (more reliable for a small on-device model than asking it to detect
// the language itself — see the replyNative prompt-hardening lesson above).
export function formatUserTurn(userText, inputLang, nativeName) {
  const marker = inputLang === "native"
    ? `MY_QUESTION (asked in ${nativeName}, not part of the roleplay): ${userText}`
    : "MY_UTTERANCE: " + userText;
  // Small on-device models drift out of the JSON format over a long
  // conversation; repeating the instruction right before generation (instead
  // of relying only on the system prompt set once at the start) measurably
  // helps them stay on task.
  return marker + "\n(Respond with ONLY the JSON object from the system prompt — no other text.)";
}

// A reply that is just the input marker echoed back is a model failure, not a
// usable (if slightly malformed) answer — never show that to the learner.
function looksLikeEcho(raw) {
  return /^\s*MY_(UTTERANCE|QUESTION)/i.test(raw);
}

// The model is asked for direction-neutral {word, translation} pairs (word =
// target language, translation = native language) because a fixed {pl, de}
// pair in the prompt gave the model no signal for which key means which
// language — it would hedge by repeating the target word in both, or by
// tacking an English gloss onto whichever key it wasn't sure about. Mapping
// back to {pl, de} here (where the direction IS known, from targetLang) keeps
// every downstream consumer (vocab chips, kasia_vocab, FSRS) unchanged.
function normalizeVocab(v, targetLang) {
  const word = String(v.word || (targetLang === "pl" ? v.pl : v.de) || "");
  const translation = String(v.translation || (targetLang === "pl" ? v.de : v.pl) || "");
  return targetLang === "pl" ? { pl: word, de: translation } : { pl: translation, de: word };
}

export function parseTutorReply(raw, targetLang) {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) {
    // Model broke out of JSON entirely. If it's still a real, on-topic plain
    // reply (not an echo of our own prompt marker), showing that beats a
    // generic offline fallback line that ignores what the learner just said.
    const text = raw.trim();
    if (!text || looksLikeEcho(text)) throw new Error("no usable text in tutor reply");
    return { reply: text.slice(0, 500), hint: undefined, correction: null, vocab: [], done: false, fallback: true };
  }
  const j = JSON.parse(m[0]);
  return {
    reply: String(j.reply || raw).slice(0, 500),
    hint: j.replyNative ? String(j.replyNative) : (j.hint ? String(j.hint) : undefined),
    correction:
      j.correction && j.correction.corrected
        ? {
            original: String(j.correction.original || ""),
            corrected: String(j.correction.corrected),
            noteNative: String(j.correction.noteNative || j.correction.noteDe || ""),
          }
        : null,
    vocab: Array.isArray(j.vocab) ? j.vocab.slice(0, 3).map((v) => normalizeVocab(v, targetLang)) : [],
    done: Boolean(j.done),
  };
}

export function parseSummaryReply(raw, turnCount) {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("no JSON in summary");
  const j = JSON.parse(m[0]);
  const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
  return {
    scores: {
      grammar: clamp(j.scores?.grammar),
      fluency: clamp(j.scores?.fluency),
      vocabulary: clamp(j.scores?.vocabulary),
      engagement: clamp(j.scores?.engagement),
      relevance: clamp(j.scores?.relevance),
    },
    newWords: clamp(j.newWords),
    minutes: Math.max(1, Math.round(turnCount / 4)),
    noteNative: String(j.noteNative || j.noteDe || ""),
  };
}
