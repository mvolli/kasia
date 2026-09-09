// UI-chrome translations. The app's actual users only read German or
// Polish — English interface text (leftover from early scaffolding) is a
// real usability bug for them, not a cosmetic nit. Every string here is
// keyed once and shown in the learner's NATIVE language (the language they
// already speak), independent of which language they're currently learning
// — e.g. a German native learning Polish always sees German menus/buttons,
// even while the lesson content itself is in Polish.
//
// This only covers app-chrome (buttons, labels, tooltips). Learning content
// (scenario dialogue, tutor replies, vocab) is intentionally bilingual by
// design elsewhere (scenarios.mjs `goalNative`, prompts.mjs `replyNative`,
// etc.) and out of scope here. Text fed to the LLM as an instruction (e.g.
// "for a Polish speaker learning German") stays in English on purpose —
// that's a machine-facing string the model handles fine either way, and
// changing it isn't a user-facing localization issue.

export const LANG_NAME_IN = {
  polish: { de: "Polnisch", pl: "polski" },
  german: { de: "Deutsch", pl: "niemiecki" },
};

const UI = {
  de: {
    "onboarding.tagline": "Lerne Polnisch & Deutsch im Gespräch",
    "onboarding.q.level": "Wie ist dein Niveau?",
    "onboarding.level.beginner": "Anfänger",
    "onboarding.level.beginner.sub": "A0–A1 · fängt bei null an",
    "onboarding.level.intermediate": "Mittelstufe",
    "onboarding.level.intermediate.sub": "A2–B1 · kann sich unterhalten",
    "onboarding.level.advanced": "Fortgeschritten",
    "onboarding.level.advanced.sub": "B2+ · Feinschliff",
    "onboarding.q.goal": "Was ist dein Ziel?",
    "onboarding.goal.travel": "Reisen",
    "onboarding.goal.travel.sub": "Markt, Hotel, Wegbeschreibung",
    "onboarding.goal.work": "Arbeit",
    "onboarding.goal.work.sub": "Meetings, E-Mails, Telefonate",
    "onboarding.goal.daily": "Alltag",
    "onboarding.goal.daily.sub": "Freunde, Café, Smalltalk",
    "onboarding.continue": "Weiter",
    "onboarding.start": "Los geht's 🎉",
    "onboarding.fine": "Persönliche Version — unbegrenzt nutzbar, keine Werbung",
    "home.title": "Bereit zum Üben?",
    "home.roleplay.title": "Rollenspiel-Modus",
    "home.roleplay.desc": "Wähle eine Szene und sprich dich hindurch.",
    "home.freeconv.title": "Freies Gespräch",
    "home.freeconv.desc": "Kein Skript — rede über alles, wirst dabei korrigiert.",
    "home.todayScenario": "Heutiges Szenario",
    "home.chip.unlimited": "💬 Unbegrenzt",
    "home.chip.due": "📚 {n} fällig",
    "home.progress.level": "📈 Geschätztes Niveau: {cefr}",
    "home.progress.words": "📚 {n} Wort/Wörter im Vokabelheft",
    "chat.end": "Beenden",
    "chat.hints": "💡 Hinweise",
    "chat.hints.title": "{lang}-Hinweise ein-/ausblenden",
    "chat.coach.on": "🎯 Coach: An",
    "chat.coach.off": "🎯 Coach: Aus",
    "chat.repeat": "🔊 Wiederholen",
    "chat.slower": "🐢 Langsamer",
    "chat.placeholder": "Auf {lang} tippen (oder Mikro antippen) …",
    "chat.inputlang.target.title": "Du tippst auf {lang} zum Üben — antippen, um stattdessen auf {native} eine Frage zu stellen",
    "chat.inputlang.native.title": "Du stellst eine Frage auf {lang} — antippen, um zurück zum {target}-Üben zu wechseln",
    "review.title": "Vokabel-Wiederholung",
    "review.showAnswer": "Antwort zeigen",
    "review.empty": "🎉 Alles erledigt! Gerade nichts fällig.",
    "review.back": "Zurück",
    "review.noGloss": "(keine Übersetzung gespeichert — aus dem Gedächtnis bewerten)",
    "summary.complete": "Gespräch beendet",
    "summary.newWords": "neue Wörter",
    "summary.minutes": "Minuten",
    "summary.streak": "🔥 Tage-Serie",
    "summary.saveWords": "Neue Wörter — antippen, um sie im Vokabelheft zu speichern:",
    "summary.repeat": "Szene wiederholen",
    "summary.home": "Start",
  },
  pl: {
    "onboarding.tagline": "Ucz się polskiego i niemieckiego, rozmawiając",
    "onboarding.q.level": "Jaki jest Twój poziom?",
    "onboarding.level.beginner": "Początkujący",
    "onboarding.level.beginner.sub": "A0–A1 · zaczynam od zera",
    "onboarding.level.intermediate": "Średniozaawansowany",
    "onboarding.level.intermediate.sub": "A2–B1 · potrafię prowadzić rozmowę",
    "onboarding.level.advanced": "Zaawansowany",
    "onboarding.level.advanced.sub": "B2+ · dopracowanie szczegółów",
    "onboarding.q.goal": "Jaki jest Twój cel?",
    "onboarding.goal.travel": "Podróże",
    "onboarding.goal.travel.sub": "targ, hotel, wskazywanie drogi",
    "onboarding.goal.work": "Praca",
    "onboarding.goal.work.sub": "spotkania, e-maile, telefony",
    "onboarding.goal.daily": "Codzienność",
    "onboarding.goal.daily.sub": "znajomi, kawiarnia, small talk",
    "onboarding.continue": "Dalej",
    "onboarding.start": "Zaczynamy 🎉",
    "onboarding.fine": "Wersja osobista — bez ograniczeń, bez reklam",
    "home.title": "Gotowy/a do ćwiczeń?",
    "home.roleplay.title": "Tryb odgrywania scenek",
    "home.roleplay.desc": "Wybierz scenę i przejdź przez nią, mówiąc.",
    "home.freeconv.title": "Swobodna rozmowa",
    "home.freeconv.desc": "Bez scenariusza — rozmawiaj o czym chcesz, z bieżącą korektą.",
    "home.todayScenario": "Dzisiejszy scenariusz",
    "home.chip.unlimited": "💬 Bez limitu",
    "home.chip.due": "📚 {n} do powtórki",
    "home.progress.level": "📈 Szacowany poziom: {cefr}",
    "home.progress.words": "📚 {n} słów(o) w zeszycie słownictwa",
    "chat.end": "Zakończ",
    "chat.hints": "💡 Podpowiedzi",
    "chat.hints.title": "Pokaż/ukryj podpowiedzi ({lang})",
    "chat.coach.on": "🎯 Coach: Wł.",
    "chat.coach.off": "🎯 Coach: Wył.",
    "chat.repeat": "🔊 Powtórz",
    "chat.slower": "🐢 Wolniej",
    "chat.placeholder": "Wpisz odpowiedź ({lang}) lub dotknij mikrofonu …",
    "chat.inputlang.target.title": "Tryb ćwiczenia: {lang}. Dotknij, aby zamiast tego zadać pytanie ({native}).",
    "chat.inputlang.native.title": "Tryb pytania: {lang}. Dotknij, aby wrócić do ćwiczenia ({target}).",
    "review.title": "Powtórka słownictwa",
    "review.showAnswer": "Pokaż odpowiedź",
    "review.empty": "🎉 Wszystko zrobione! Nic teraz nie czeka na powtórkę.",
    "review.back": "Wróć",
    "review.noGloss": "(brak zapisanego tłumaczenia — oceń z pamięci)",
    "summary.complete": "Rozmowa zakończona",
    "summary.newWords": "nowych słów",
    "summary.minutes": "minut",
    "summary.streak": "🔥 dni z rzędu",
    "summary.saveWords": "Nowe słowa — dotknij, aby zapisać w zeszycie słownictwa:",
    "summary.repeat": "Powtórz scenę",
    "summary.home": "Start",
  },
};

export function t(nativeCode, key, vars) {
  const dict = UI[nativeCode] || UI.de;
  let s = dict[key] ?? UI.de[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
  return s;
}

// Sweeps every [data-i18n] element in the document and sets its text from
// the dictionary — called whenever the learner's native language is known
// or changes (onboarding language pick, the home language-direction switch).
export function translateUI(nativeCode) {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(nativeCode, el.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.title = t(nativeCode, el.dataset.i18nTitle);
  });
}
