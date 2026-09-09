// "Grundlagen" — a short pre-A1 curriculum for a learner who has genuinely
// zero prior knowledge of the target language. Scenarios (scenarios.mjs)
// assume the learner can already form basic sentences; this fills the gap
// below that, so the first role-play conversation is actually reachable.
//
// Lesson order follows standard absolute-beginner sequencing (greetings,
// numbers, question words, pronouns + to-be/to-have, survival phrases, then
// broader everyday-life vocab) rather than alphabet/spelling, since Polish
// and German both already use the Latin alphabet familiar to a German/Polish
// native speaker — that step (needed e.g. for English/Japanese pairs)
// doesn't apply here. Each item: {word: target language, gloss: native
// language, emoji?: visual mnemonic}. `emoji` is only set for concrete,
// picturable words (colors, food, drinks, countries) — Dual-Coding Theory
// (Paivio): pairing a word with an image measurably helps recall versus text
// alone. It's deliberately left unset for abstract items (question words,
// pronouns) where a forced icon would just be noise, not a memory aid.
//
// `sentences` (optional, per lesson): {parts: string[] in correct order,
// gloss: string} for the tap-to-build word-order exercise. Written by hand,
// not derived from the flashcard items — several items carry "…"/"/" as
// formatting (e.g. "Chciałbym / Chciałabym…") that would produce nonsense
// chips if split on whitespace. Where an item genuinely already reads as a
// full sentence (e.g. "Ile to kosztuje?"), its exact wording is reused here
// deliberately, so the sentence-builder reinforces that same lesson item
// instead of introducing yet another string to learn.

export const BASICS_PL = [
  {
    id: "greetings",
    title: "Begrüßung & Höflichkeit",
    items: [
      { word: "Cześć", gloss: "Hallo" },
      { word: "Dzień dobry", gloss: "Guten Tag" },
      { word: "Dobry wieczór", gloss: "Guten Abend" },
      { word: "Do widzenia", gloss: "Auf Wiedersehen" },
      { word: "Proszę", gloss: "Bitte" },
      { word: "Dziękuję", gloss: "Danke" },
      { word: "Tak", gloss: "Ja" },
      { word: "Nie", gloss: "Nein" },
      { word: "Przepraszam", gloss: "Entschuldigung" },
    ],
  },
  {
    id: "numbers",
    title: "Zahlen 1–10",
    items: [
      { word: "jeden", gloss: "eins" },
      { word: "dwa", gloss: "zwei" },
      { word: "trzy", gloss: "drei" },
      { word: "cztery", gloss: "vier" },
      { word: "pięć", gloss: "fünf" },
      { word: "sześć", gloss: "sechs" },
      { word: "siedem", gloss: "sieben" },
      { word: "osiem", gloss: "acht" },
      { word: "dziewięć", gloss: "neun" },
      { word: "dziesięć", gloss: "zehn" },
    ],
  },
  {
    id: "questions",
    title: "Fragewörter",
    items: [
      { word: "Kto?", gloss: "Wer?" },
      { word: "Co?", gloss: "Was?" },
      { word: "Gdzie?", gloss: "Wo?" },
      { word: "Kiedy?", gloss: "Wann?" },
      { word: "Ile?", gloss: "Wie viel?" },
      { word: "Jak?", gloss: "Wie?" },
      { word: "Dlaczego?", gloss: "Warum?" },
    ],
  },
  {
    id: "pronouns",
    title: "Ich, du — sein und haben",
    items: [
      { word: "Ja jestem…", gloss: "Ich bin…" },
      { word: "Ty jesteś…", gloss: "Du bist…" },
      { word: "Ja mam…", gloss: "Ich habe…" },
      { word: "Ty masz…", gloss: "Du hast…" },
      { word: "Nazywam się…", gloss: "Ich heiße…" },
      { word: "Miło mi", gloss: "Freut mich" },
    ],
    sentences: [
      { parts: ["Ja", "jestem", "Anna"], gloss: "Ich bin Anna" },
      { parts: ["Ja", "mam", "psa"], gloss: "Ich habe einen Hund" },
      { parts: ["Miło", "mi", "cię", "poznać"], gloss: "Freut mich, dich kennenzulernen" },
    ],
  },
  {
    id: "survival",
    title: "Nützliche Sätze",
    items: [
      { word: "Nie rozumiem", gloss: "Ich verstehe nicht" },
      { word: "Czy mówi Pan/Pani po niemiecku?", gloss: "Sprechen Sie Deutsch?" },
      { word: "Jak to się mówi po polsku?", gloss: "Wie sagt man das auf Polnisch?" },
      { word: "Chciałbym / Chciałabym…", gloss: "Ich möchte…" },
      { word: "Gdzie jest…?", gloss: "Wo ist…?" },
      { word: "Ile to kosztuje?", gloss: "Wie viel kostet das?" },
    ],
    sentences: [
      { parts: ["Ile", "to", "kosztuje"], gloss: "Wie viel kostet das" },
      { parts: ["Gdzie", "jest", "dworzec"], gloss: "Wo ist der Bahnhof" },
      { parts: ["Nie", "rozumiem"], gloss: "Ich verstehe nicht" },
    ],
  },
  {
    id: "colors",
    title: "Farben",
    items: [
      { word: "czerwony", gloss: "rot", emoji: "🔴" },
      { word: "niebieski", gloss: "blau", emoji: "🔵" },
      { word: "zielony", gloss: "grün", emoji: "🟢" },
      { word: "żółty", gloss: "gelb", emoji: "🟡" },
      { word: "pomarańczowy", gloss: "orange", emoji: "🟠" },
      { word: "czarny", gloss: "schwarz", emoji: "⚫" },
      { word: "biały", gloss: "weiß", emoji: "⚪" },
      { word: "brązowy", gloss: "braun", emoji: "🟤" },
    ],
  },
  {
    id: "food-drink",
    title: "Obst und Getränke",
    items: [
      { word: "jabłko", gloss: "Apfel", emoji: "🍎" },
      { word: "banan", gloss: "Banane", emoji: "🍌" },
      { word: "pomarańcza", gloss: "Orange", emoji: "🍊" },
      { word: "truskawka", gloss: "Erdbeere", emoji: "🍓" },
      { word: "woda", gloss: "Wasser", emoji: "💧" },
      { word: "kawa", gloss: "Kaffee", emoji: "☕" },
      { word: "herbata", gloss: "Tee", emoji: "🍵" },
      { word: "sok", gloss: "Saft", emoji: "🧃" },
      { word: "mleko", gloss: "Milch", emoji: "🥛" },
      { word: "piwo", gloss: "Bier", emoji: "🍺" },
    ],
  },
  {
    id: "countries",
    title: "Länder und Nationalitäten",
    items: [
      { word: "Polska", gloss: "Polen", emoji: "🇵🇱" },
      { word: "Niemcy", gloss: "Deutschland", emoji: "🇩🇪" },
      { word: "Austria", gloss: "Österreich", emoji: "🇦🇹" },
      { word: "Szwajcaria", gloss: "Schweiz", emoji: "🇨🇭" },
      { word: "Francja", gloss: "Frankreich", emoji: "🇫🇷" },
      { word: "Włochy", gloss: "Italien", emoji: "🇮🇹" },
      { word: "Wielka Brytania", gloss: "Großbritannien", emoji: "🇬🇧" },
      { word: "Stany Zjednoczone", gloss: "USA", emoji: "🇺🇸" },
    ],
  },
  {
    id: "family",
    title: "Familie",
    items: [
      { word: "mama", gloss: "Mutter" },
      { word: "tata", gloss: "Vater" },
      { word: "brat", gloss: "Bruder" },
      { word: "siostra", gloss: "Schwester" },
      { word: "syn", gloss: "Sohn" },
      { word: "córka", gloss: "Tochter" },
      { word: "babcia", gloss: "Oma" },
      { word: "dziadek", gloss: "Opa" },
    ],
  },
  {
    id: "days-times",
    title: "Wochentage und Tageszeiten",
    items: [
      { word: "poniedziałek", gloss: "Montag" },
      { word: "wtorek", gloss: "Dienstag" },
      { word: "środa", gloss: "Mittwoch" },
      { word: "czwartek", gloss: "Donnerstag" },
      { word: "piątek", gloss: "Freitag" },
      { word: "sobota", gloss: "Samstag" },
      { word: "niedziela", gloss: "Sonntag" },
      { word: "rano", gloss: "morgens", emoji: "🌅" },
      { word: "południe", gloss: "Mittag", emoji: "☀️" },
      { word: "wieczór", gloss: "Abend", emoji: "🌆" },
      { word: "noc", gloss: "Nacht", emoji: "🌙" },
    ],
  },
  {
    id: "verbs",
    title: "Nützliche Verben",
    items: [
      { word: "chcę", gloss: "ich möchte" },
      { word: "idę", gloss: "ich gehe", emoji: "🚶" },
      { word: "jem", gloss: "ich esse", emoji: "🍽️" },
      { word: "piję", gloss: "ich trinke", emoji: "🥤" },
      { word: "mówię", gloss: "ich spreche", emoji: "💬" },
      { word: "widzę", gloss: "ich sehe", emoji: "👀" },
    ],
    sentences: [
      { parts: ["Ja", "jem", "jabłko"], gloss: "Ich esse einen Apfel" },
      { parts: ["Ja", "piję", "sok"], gloss: "Ich trinke Saft" },
      { parts: ["Ja", "idę", "do", "domu"], gloss: "Ich gehe nach Hause" },
    ],
  },
];

export const BASICS_DE = [
  {
    id: "greetings",
    title: "Powitania i uprzejmości",
    items: [
      { word: "Hallo", gloss: "Cześć" },
      { word: "Guten Tag", gloss: "Dzień dobry" },
      { word: "Guten Abend", gloss: "Dobry wieczór" },
      { word: "Auf Wiedersehen", gloss: "Do widzenia" },
      { word: "Bitte", gloss: "Proszę" },
      { word: "Danke", gloss: "Dziękuję" },
      { word: "Ja", gloss: "Tak" },
      { word: "Nein", gloss: "Nie" },
      { word: "Entschuldigung", gloss: "Przepraszam" },
    ],
  },
  {
    id: "numbers",
    title: "Liczby 1–10",
    items: [
      { word: "eins", gloss: "jeden" },
      { word: "zwei", gloss: "dwa" },
      { word: "drei", gloss: "trzy" },
      { word: "vier", gloss: "cztery" },
      { word: "fünf", gloss: "pięć" },
      { word: "sechs", gloss: "sześć" },
      { word: "sieben", gloss: "siedem" },
      { word: "acht", gloss: "osiem" },
      { word: "neun", gloss: "dziewięć" },
      { word: "zehn", gloss: "dziesięć" },
    ],
  },
  {
    id: "questions",
    title: "Pytania",
    items: [
      { word: "Wer?", gloss: "Kto?" },
      { word: "Was?", gloss: "Co?" },
      { word: "Wo?", gloss: "Gdzie?" },
      { word: "Wann?", gloss: "Kiedy?" },
      { word: "Wie viel?", gloss: "Ile?" },
      { word: "Wie?", gloss: "Jak?" },
      { word: "Warum?", gloss: "Dlaczego?" },
    ],
  },
  {
    id: "pronouns",
    title: "Ja, ty — być i mieć",
    items: [
      { word: "Ich bin…", gloss: "Ja jestem…" },
      { word: "Du bist…", gloss: "Ty jesteś…" },
      { word: "Ich habe…", gloss: "Ja mam…" },
      { word: "Du hast…", gloss: "Ty masz…" },
      { word: "Ich heiße…", gloss: "Nazywam się…" },
      { word: "Freut mich", gloss: "Miło mi" },
    ],
    sentences: [
      { parts: ["Ich", "bin", "Anna"], gloss: "Ja jestem Anna" },
      { parts: ["Ich", "habe", "einen", "Hund"], gloss: "Mam psa" },
      { parts: ["Freut", "mich", "dich", "kennenzulernen"], gloss: "Miło mi cię poznać" },
    ],
  },
  {
    id: "survival",
    title: "Przydatne zdania",
    items: [
      { word: "Ich verstehe nicht", gloss: "Nie rozumiem" },
      { word: "Sprechen Sie Polnisch?", gloss: "Czy mówi Pan/Pani po polsku?" },
      { word: "Wie sagt man das auf Deutsch?", gloss: "Jak to się mówi po niemiecku?" },
      { word: "Ich möchte…", gloss: "Chciałbym / Chciałabym…" },
      { word: "Wo ist…?", gloss: "Gdzie jest…?" },
      { word: "Was kostet das?", gloss: "Ile to kosztuje?" },
    ],
    sentences: [
      { parts: ["Was", "kostet", "das"], gloss: "Ile to kosztuje" },
      { parts: ["Wo", "ist", "der", "Bahnhof"], gloss: "Gdzie jest dworzec" },
      { parts: ["Ich", "verstehe", "nicht"], gloss: "Nie rozumiem" },
    ],
  },
  {
    id: "colors",
    title: "Kolory",
    items: [
      { word: "rot", gloss: "czerwony", emoji: "🔴" },
      { word: "blau", gloss: "niebieski", emoji: "🔵" },
      { word: "grün", gloss: "zielony", emoji: "🟢" },
      { word: "gelb", gloss: "żółty", emoji: "🟡" },
      { word: "orange", gloss: "pomarańczowy", emoji: "🟠" },
      { word: "schwarz", gloss: "czarny", emoji: "⚫" },
      { word: "weiß", gloss: "biały", emoji: "⚪" },
      { word: "braun", gloss: "brązowy", emoji: "🟤" },
    ],
  },
  {
    id: "food-drink",
    title: "Owoce i napoje",
    items: [
      { word: "Apfel", gloss: "jabłko", emoji: "🍎" },
      { word: "Banane", gloss: "banan", emoji: "🍌" },
      { word: "Orange", gloss: "pomarańcza", emoji: "🍊" },
      { word: "Erdbeere", gloss: "truskawka", emoji: "🍓" },
      { word: "Wasser", gloss: "woda", emoji: "💧" },
      { word: "Kaffee", gloss: "kawa", emoji: "☕" },
      { word: "Tee", gloss: "herbata", emoji: "🍵" },
      { word: "Saft", gloss: "sok", emoji: "🧃" },
      { word: "Milch", gloss: "mleko", emoji: "🥛" },
      { word: "Bier", gloss: "piwo", emoji: "🍺" },
    ],
  },
  {
    id: "countries",
    title: "Kraje i narodowości",
    items: [
      { word: "Polen", gloss: "Polska", emoji: "🇵🇱" },
      { word: "Deutschland", gloss: "Niemcy", emoji: "🇩🇪" },
      { word: "Österreich", gloss: "Austria", emoji: "🇦🇹" },
      { word: "Schweiz", gloss: "Szwajcaria", emoji: "🇨🇭" },
      { word: "Frankreich", gloss: "Francja", emoji: "🇫🇷" },
      { word: "Italien", gloss: "Włochy", emoji: "🇮🇹" },
      { word: "Großbritannien", gloss: "Wielka Brytania", emoji: "🇬🇧" },
      { word: "USA", gloss: "Stany Zjednoczone", emoji: "🇺🇸" },
    ],
  },
  {
    id: "family",
    title: "Rodzina",
    items: [
      { word: "Mutter", gloss: "mama" },
      { word: "Vater", gloss: "tata" },
      { word: "Bruder", gloss: "brat" },
      { word: "Schwester", gloss: "siostra" },
      { word: "Sohn", gloss: "syn" },
      { word: "Tochter", gloss: "córka" },
      { word: "Oma", gloss: "babcia" },
      { word: "Opa", gloss: "dziadek" },
    ],
  },
  {
    id: "days-times",
    title: "Dni tygodnia i pory dnia",
    items: [
      { word: "Montag", gloss: "poniedziałek" },
      { word: "Dienstag", gloss: "wtorek" },
      { word: "Mittwoch", gloss: "środa" },
      { word: "Donnerstag", gloss: "czwartek" },
      { word: "Freitag", gloss: "piątek" },
      { word: "Samstag", gloss: "sobota" },
      { word: "Sonntag", gloss: "niedziela" },
      { word: "morgens", gloss: "rano", emoji: "🌅" },
      { word: "Mittag", gloss: "południe", emoji: "☀️" },
      { word: "Abend", gloss: "wieczór", emoji: "🌆" },
      { word: "Nacht", gloss: "noc", emoji: "🌙" },
    ],
  },
  {
    id: "verbs",
    title: "Przydatne czasowniki",
    items: [
      { word: "ich möchte", gloss: "chcę" },
      { word: "ich gehe", gloss: "idę", emoji: "🚶" },
      { word: "ich esse", gloss: "jem", emoji: "🍽️" },
      { word: "ich trinke", gloss: "piję", emoji: "🥤" },
      { word: "ich spreche", gloss: "mówię", emoji: "💬" },
      { word: "ich sehe", gloss: "widzę", emoji: "👀" },
    ],
    sentences: [
      { parts: ["Ich", "esse", "einen", "Apfel"], gloss: "Jem jabłko" },
      { parts: ["Ich", "trinke", "Saft"], gloss: "Piję sok" },
      { parts: ["Ich", "gehe", "nach", "Hause"], gloss: "Idę do domu" },
    ],
  },
];

export function getBasics(langCode) {
  return langCode === "de" ? BASICS_DE : BASICS_PL;
}
