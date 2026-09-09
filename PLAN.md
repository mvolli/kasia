# Polish-Trainer — Recherche & Entwicklungsplan

Stand: 05.09.2026

## 1. Marktkontext

Es gibt bereits kommerzielle KI-Sprachlern-Apps mit einem konversationsbasierten Ansatz: Lernen primär über gesprochene Dialoge mit einem KI-Tutor (statt klassischer Tap-Drills), Onboarding mit Ziel/Niveau-Abfrage, Feedback direkt im Gespräch, Vokabel-Sammlung, Streak-Gamification. Eine grobe Sichtung öffentlicher Store-Bewertungen einer solchen App zeigte wiederkehrende Schwachstellen, die die Positionierung dieses Projekts beeinflusst haben:

| Beschwerde (Marktbeobachtung) | Chance für uns |
|---|---|
| Paywall zu hart: nur 1 kostenlose Lektion | Großzügigeres Gratis-Kontingent (1 ganze Konversation/Tag) |
| Roleplay wirkt halbfertig, überkorrigierend | Nach-Turn-Korrektur statt Unterbrechung; echter Freestyle-Modus; Coach-Modus ein-/ausschaltbar |
| ASR bricht bei manchen Sprachen weg | Fokussierung auf DE↔PL mit optimiertem ASR/TTS — beides gut unterstützte Sprachen |
| Gespeicherte Vokabeln verschwinden, kein Spaced Repetition | Persistente Vokabelliste + echtes Spaced-Repetition-System als Kernfeature |
| Abo-Storno umständlich, breite statt tiefe Sprachabdeckung | Enger, tiefer DE↔PL-Fokus statt vieler Sprachen auf Basis-Niveau |

## 2. Produkt: DE↔PL-Sprachtrainer

**Positionierung:** tief statt breit — statt vieler Sprachen auf Basis-Niveau **nur der deutsch-polnische Korridor auf muttersprachlicher Qualität**: beide Richtungen, authentische Szenarien (Kraków, Wrocław, Berlin, Visum-Ämter, Familienfeiern, Pendeln), kulturelle Nuancen, Prüfungsniveaus (CEFR, Goethe, CPE).

**Zielgruppen:**
1. Deutsche, die Polnisch lernen (Arbeit, Familie/Partner, Immobilien, Pendeln).
2. Polen, die Deutsch lernen (Arbeit in DE, Goethe/C1-Prüfung, Alltag).
3. (Sekundär) gemischt-sprachliche Paare & Familien.

### Kern-Features (MVP)
1. **Sprachliche Konversation** mit KI-Tutor: Szenario-basiert (Ziel: „Bestelle Pierogi auf dem Markt") + Freestyle-Chat.
2. **Onboarding → personalisierter Plan:** Zielsprache, CEFR-Niveau, Ziel (Reise/Arbeit/Familie/Prüfung), Interessen → Lerneinheit-Plan.
3. **Feedback in Kontext:**
   - Inline: korrigiertes Transkript + markierte Fehler (Grammatik, Wortwahl, Aussprache), Erklärung **auf der Muttersprache des Lernenden** (kurz, 1 Satz).
   - Nach-Turn statt Mid-Turn → Konversation fließt weiter.
   - Session-Ende: Zusammenfassung (Stärken, Top-3-Schwächen, „retry"-Liste, neue Wörter).
4. **Vokabeln:** Wörter, die gehakt haben, automatisch erfassen → **FSRS-Spaced-Repetition** (persistent, nie verloren).
5. **Fortschritt:** Streaks, geschätztes CEFR-Level, geübte Wörter, Szenario-Bestwert.
6. **Memory über Sessions:** Tutor erinnert sich an Schwächen, Ziele, Name, Kontext („last time you mixed up the cases when ordering coffee").
7. **Monetarisierung:** Free = 1 komplette Konversation/Tag + Vokabel-SRS; Pro (~9,99–14,99 €/Monat) = unbegrenzt, Custom-Themen, Prüfungsmode, Langzeit-Memory. In-App-Storno.

### DE/PL-spezifischer Content (der Moat)
- **Polnisch für Deutsche:** Kaskas im Kontext erklärt (nicht als Grammatik-Vorlesung), pan/pani, ó/ż/sz/ę/r-Laute mit Mikro-Drills, False Friends (*sympatyczny*, *aktualnie*, *ręka*), Idiom-Explainer (*nie ma czego chcieć* etc.), formelle/umgangssprachliche Register.
- **Deutsch für Polen:** Umlaute/ß, Modalverben, zweiwege Präpositionen, du/Sie-Kultur, Regionaldialekt-Hinweise (Bayerisch, Schlesisch), typische Aussprache-Fallen für PL-Sprecher (ich-Laut, „würde").
- **Szenario-Bibliothek:** ~30 Szenarien pro Richtung × CEFR (A2/B1/B2+): Foodmarkt, Bahnhof (PKP/DB), Arzt, Miete/Visum, Familie & Feiertage, Job-Interview, Nachbarschafts-Kleinkram, Smalltalk über Wetter/Sport.

## 3. Technische Architektur

```
Mic ──► Streaming ASR ──► Transcript ──► LLM-Tutor ──► TTS ──► Speaker
                              │                  │
                              ▼                  ▼
                      Feedback/Correction   Learner-Profile
                      (per word)            (Ziele, Schwächen,
                                              Vokabeln, CEFR-Trace)
```

### Bausteine (API-basiert für MVP-Geschwindigkeit)
| Baustein | Wahl | Begründung |
|---|---|---|
| ASR | **Deepgram Nova** (streaming, word timestamps) mit **OpenAI Whisper** als Fallback | PL/DE sind First-Class-Sprachen; Streaming nötig für Latenz |
| LLM-Tutor | **Claude (Sonnet)** mit striktem System-Prompt: Persona, CEFR-Kalibrierung, Korrektur-Policy (nach Turn), Kulturexpertise, Function-Call auf Learner-Profile | Beste natürliche Konversation + kontrollierbare Korrektur |
| TTS | **ElevenLabs** (PL-Muttersprachler-Stimme / DE-Stimme) oder OpenAI TTS | Expressive, natürliche Stimmen; PL-Qualität bei ElevenLabs gut |
| Aussprache-Bewertung | **MVP:** word-level ASR-Confidence + gezielte Mikro-Drills. **V1.1:** Phonem-Alignment (Montreal Forced Aligner) oder wav2vec2-Phonem-Klassifikation | Ehrlichster Plan: hartestes Problem gestaffelt lösen |
| Frontend MVP | **Next.js PWA** (WebRTC-Mic, VAD-basierte Turn-Detection) | In 2–3 Wochen lauffähig; kein App-Store-Gate |
| Mobile (Phase 2) | React Native (Expo) mit nativem Voice-Input, PWA-Code teils wiederverwendbar | Später iOS/Android |
| Backend | **FastAPI (Python)** + WebSocket für Streaming; Postgres (Supabase) | Python-Ökosystem für MFA/wav2vec2 später |
| SRS | FSRS-Bibliothek (z. B. `py-fsrs`) | Bewährte Spaced-Repetition-Logik |
| Auth/Payments | Supabase Auth (Email/Google) + **Stripe** (Web), später **RevenueCat** (Mobile) | Standard |
| Turn-Detection | Serverseitige VAD (Silero-VAD) → ASR-Segment → LLM | Verhindert Cut-offs bei Pausen |

### Latenz-Budget (Ziel: < 1,5 s vom Sprechende bis TTS-Start)
- ASR partial: ~200–400 ms · LLM time-to-first-token: ~400–700 ms · TTS streaming: ~200 ms.
- Während LLM "denkt": leiser Filler-Ton oder kurze "Hmm?" vom Tutor (fühlt sich menschlich an).

### Kosten pro ~10-Minuten-Session (grob)
ASR ~0,02 $ · LLM ~0,05–0,15 $ · TTS ~0,10–0,25 $ → **~0,15–0,40 $/Session**. 15 Sessions/Monat ≈ 2–6 $ → **komfortabler Marge bei 9,99–14,99 €/Monat**.

## 4. Roadmap

| Meilenstein | Zeitspanne | Inhalt |
|---|---|---|
| **M0: Spike** | Woche 1–2 | Voice-Loop im Browser (Mic→ASR→LLM→TTS) auf **Polnisch**; Latenz + ASR-Genauigkeit messen an realen PL-Sätzen; Tutor-Prompt v1; GO/NO-GO-Entscheidung |
| **M1: MVP** | Woche 3–6 | Onboarding, 10 Szenarien/Richtung, Feedback-UI, Vokabel-Erfassung + SRS, Progress, PWA; **Beta mit 10–20 DE/PL-Lernenden** |
| **M2: Monetarisierung** | Woche 7–10 | Free/Pro-Tiers, Stripe, Streaks, Memory-über-Sessions, 30 Szenarien, Aussprache-Hinweise |
| **M3: Mobile + Tiefe** | Monat 3+ | iOS/Android (Expo), Prüfungsmode (Goethe/CPE-Bank), Offline-SRS, A/B-Tests |

**Erfolgs-Metriken:** D7-Retention > 35 % · Ø Sessions/Woche aktiv > 4 · Conversion Free→Pro > 3–5 % · "Wort korrigiert → in SRS → beherrscht"-Rate.

## 5. Risiken & Gegenmaßnahmen
1. **PL-TTS/ASR-Qualität** → in M0 früh testen; DE und PL sind gut abgedeckt (im Gegensatz zu z. B. Arabisch) — Risiko moderat.
2. **Aussprache-Bewertung ist das schwerste technische Problem** → ehrlich stufen: erst Confidence + Drills, dann Phonem-Alignment. Nicht im MVP versprechen.
3. **LLM überkorrigiert und tötet den Flow** → Korrektur-Policy im Prompt: 1 Korrektur pro Turn max., Rest per Transkript/Ende; "Coach-Modus"-Toggle (strict / balanced / free).
4. **DE und PL werden bereits von größeren Sprachlern-Apps abgedeckt** → Moat = Tiefe (Kasus-Kontext, Kultur, Prüfung, Nischen-Szenarien), optimiertes DE/PL-ASR, großzügiges Free-Tier, bidirektional als ein Produkt.
5. **Scope Creep** → MVP bewusst auf 1 Sprachpaar, 2 Richtungen, 10–30 Szenarien; kein "50 Sprachen" ambitioniert.

## 6. Nächste Schritte
1. **Entscheidung:** nur DE→PL oder bidirektional? (beide ist im Architecture-Plan, Content-Aufwand verdoppelt)
2. Accounts/Keys: Deepgram (oder Whisper), ElevenLabs, Anthropic, Supabase, Stripe.
3. M0-Spike bauen: Voice-Loop-Demo im Browser (Polnisch).
4. Tutor-System-Prompt + 5 Pilot-Szenarien (DE→PL) schreiben.
5. Beta-Gruppe: 10–20 echte DE/PL-Lernenden (Familie, Communitys, r/Polen, r/language_exchange).

## 8. Android-Entscheidung (06.09.2026)

**Ziel (user goal):** volle Android-App mit konversationsbasiertem Lernansatz, Speech in + out, KI prüft jede Eingabe und reagiert accordingly, **installierbares APK**.

**Stack: Capacitor 6 + Vanilla-Web-App + eigenes Kotlin-Plugin `VoiceBridge`.**
- Web-App (kein Build-Step, ES-Modules) läuft identisch in Browser (Dev/Test) und im APK (WebView) → ein Codebase, zwei Targets.
- **VoiceBridge** (Custom Capacitor Plugin, Kotlin):
  - `listen(locale)` → natives Android `SpeechRecognizer` (Google on-device STT, Polnisch) → Transkript zurück ins JS.
  - `speak(text, locale)` → natives `TextToSpeech` (gute PL-Stimmen ohne Cloud).
  - Web-Fallback: Web Speech API (`webkitSpeechRecognition` / `speechSynthesis`) für Desktop-Browser.
- **Tutor:** Node-Dev-Server (`server.mjs`) ruft die lokale LLM-Proxy (Qwen-27B, Anthropic-kompatibel) ab → JSON `{reply, correction, vocab}`. APK hat **Offline-Demo-Mode** (scripted Szenarien + rule-based Checker) → APK läuft **standalone ohne Server**; mit `TUTOR_URL` läuft der echte LLM-Tutor.
- **APK-Build in Container:** JDK 17 + Android SDK (cmdline-tools, platform 34, build-tools) + `gradle assembleDebug` → `app-debug.apk`.
- **Verifikation:** Playwright für den Web-Flow (Screenshot) **und** Android-Emulator (KVM vorhanden!) → `adb install` + `adb exec-out screencap` = echtes On-Device-Screenshot.

**M0-Scope (dieser Build):** Screens Onboarding (3 Steps) → Home (Streak, Daily-Counter, 2 Modi) → Szenario-Auswahl → Conversation (Avatar, Bubbles, Mic, Typing-Fallback, Korrektur-Karten, TTS) → Summary (5-Achsen-Scores, neue Wörter). 2 Szenarien (DE→PL): "Food market in Kraków", "Directions in Warsaw". Free-Tier: 1 Conversation/Tag + Streak (device-local).

**Status (06.09.2026, Abend): M0 Android-Build verifiziert lauffähig — inkl. echtem Nachweis der nativen Voice-Bridge.**

Zwei getrennte Bugs gefunden und behoben, beide nur durch echtes On-Device-Verifizieren (nicht nur Build-Erfolg) aufgedeckt:

1. **APK enthielt eigenen Code gar nicht.** `VoiceBridge.kt`/`MainActivity.kt` nutzten eine nicht-existente Capacitor-Plugin-API (`@Method`, `@Implementation`, `PermissionStatus`, `RecognizerResult` — halluziniert), wodurch `compileDebugKotlin` fehlschlug und die alte APK ganz ohne eigenen Code (kein `MainActivity`, kein `VoiceBridge` in keiner `classes*.dex`) gepackt wurde → sofortiger `ClassNotFoundException`-Crash beim Start, nie bemerkt weil nie tatsächlich auf dem Emulator gestartet/gescreenshottet wurde (letzter Screenshot zeigte nur den Homescreen). Fix: beide Dateien auf die echte Capacitor-6-Java-API umgeschrieben (`@CapacitorPlugin(permissions=[Permission(...)])`, `@PluginMethod`, `getPermissionState`/`requestPermissionForAlias`, `SpeechRecognizer.isRecognitionAvailable(ctx)` statisch, `RESULTS_RECOGNITION`-StringArrayList), verifiziert per `javap` gegen `capacitor-android-debug.aar`.
2. **JS-Seite hat die native Bridge nie aufgerufen.** `app/app.js` nutzte `window.Capacitor.getPlugin(...)`, eine Methode, die im gebündelten `capacitor.js` gar nicht existiert (nur `getPluginHeader`). Dadurch war `VoiceBridge` in der APK immer `null`, obwohl das Plugin sauber registriert wurde — Mic/TTS liefen unbemerkt über die (nicht funktionierenden) Web-Fallbacks (`webkitSpeechRecognition`/`speechSynthesis`), der native Zweck der App war komplett tot. Fix: `IS_NATIVE ? window.Capacitor.registerPlugin("VoiceBridge") : null`. Nach `npx cap copy android` (Pflichtschritt — sonst bleibt die APK auf dem alten JS-Stand) per `adb logcat | grep capacitor` bestätigt: `speak`/`listen` erreichen jetzt tatsächlich `pl.kasia.trainer.VoiceBridge`.
3. **Folgebug beim ersten echten `listen()`-Aufruf:** `SpeechRecognizer.createSpeechRecognizer()` crashte mit `RuntimeException: SpeechRecognizer should be used only from the application's main thread` — Capacitor führt Plugin-Methoden auf einem Background-Handler-Thread aus. Fix: `listenImpl` in `activity.runOnUiThread { }` gewrappt.

**Bekannte Emulator-Grenze (kein Code-Bug):** Auf dem AVD `kasia` hat `SpeechRecognizer.listen()` nach dem Fix keinen Crash mehr, bleibt aber dauerhaft im "listening"-Zustand hängen, weil der Emulator kein virtuelles Mikrofon-Signal liefert (kein `onError`/`onResults` wird je gefeuert). App bleibt währenddessen voll bedienbar (Texteingabe-Fallback funktioniert parallel, kein Deadlock). Auf einem echten Gerät/AVD mit Host-Audio-Passthrough sollte `ERROR_SPEECH_TIMEOUT`/`ERROR_NO_MATCH` regulär nach wenigen Sekunden Stille feuern — das war auf diesem Setup nicht abschließend testbar. Sollte vor Beta-Rollout auf echtem Hardware-Gerät gegengeprüft werden; ggf. clientseitigen Timeout in `VoiceBridge.listen` ergänzen (z. B. `Handler.postDelayed { rec.stopListening() }`) als Sicherheitsnetz.

Nach beiden Fixes End-to-End auf dem AVD durchgeklickt: Onboarding (3 Schritte) → Home → Chat (Mic löst echten `RECORD_AUDIO`-Dialog + echten `SpeechRecognizer` aus, Repeat/Slower lösen echtes natives `TextToSpeech.speak()` mit korrektem `pl-PL`-Text aus, Texteingabe-Fallback funktioniert, Offline-Demo-Tutor antwortet) → Summary (5-Achsen-Scores, Streak, neue Wörter). Keine Crashes (nach Fix 3), keine Page-Errors. Screenshots in `screenshots/android-*.png`.

**Lektion fürs weitere Vorgehen:** "Build erfolgreich" und sogar "App startet ohne Crash" reichen nicht als Verifikation für Voice-Features — erst das gezielte, ungefilterte `adb logcat | grep -i capacitor` beim Antippen von Mic/Repeat zeigt, ob der native Call wirklich ankommt.

## M1-Slice (06.09.2026, Nacht): Bidirektional + freie Konversation

Auf Nutzerwunsch „komplett optimierte App … bidirektional/freie Konversationen/erweiterte Recherche" umgesetzt — als scharf geschnittene M1-Teilmenge, **nicht** die komplette M1/M2-Roadmap (siehe „Noch offen" unten).

**Datenmodell:** `kasia_profile.target` ∈ {`polish`,`german`}, native ist immer die andere Sprache des DE↔PL-Korridors (`app/app.js` `LANG`-Map). Alle Sprach-Artefakte sind jetzt aus dem Profil abgeleitet statt hartkodiert: TTS/STT-Locale (`pl-PL`/`de-DE`), Chat-Placeholder, Hints-Label, Home-Begrüßung, Szenario-Filter.

**Bidirektional:**
- `app/scenarios.mjs`: jedes Szenario trägt `lang: "pl"|"de"`. 2 neue Deutsch-Szenarien für polnische Lerner: „Bäckerei in Berlin" (`bakery-berlin`), „Nach dem Weg fragen in München" (`directions-munich`) — Struktur/Beats spiegelbildlich zu den bestehenden PL-Szenarien.
- Feld `titlePl`/`goalPl` (nahm fälschlich immer Polnisch an) umbenannt zu sprachneutral `titleTarget`/`goalTarget`, Werte für die DE-Szenarien korrekt auf Deutsch gesetzt (war beim ersten Entwurf versehentlich auf Polnisch gesetzt — beim Testen aufgefallen und korrigiert).
- Korrektur-Regeln getrennt: `CORRECTION_RULES_PL` (bestehend) + neue `CORRECTION_RULES_DE` mit typischen PL→DE-Anfängerfehlern (Englisch-Leakage, „Ich möchte" statt „chcę", „Ich bin"), Notizen auf Polnisch. Vokabel-Pools `VOCAB_PL`/`VOCAB_DE` analog. `noteDe` überall zu sprachneutralem `noteNative` umbenannt (Server-JSON-Contract, `lib/tutor.mjs`-Prompt, `demo-tutor.mjs`, `app.js`-Rendering).
- `lib/tutor.mjs`: System-Prompt jetzt richtungsabhängig (Zielsprache/Muttersprache-Namen dynamisch eingesetzt), gilt für Rollenspiel- und Freestyle-Modus.

**Freie Konversation:** „Tutor Mode"-Kachel → „Free Conversation" (`app/index.html`), fragt per `window.prompt()` nach einem optionalen Thema und startet ein synthetisches `freestyle-pl`/`freestyle-de`-Szenario (`buildFreestyleScenario()` in `scenarios.mjs`) ohne festes Skript. Server-API um `topic`-Feld erweitert (`/api/open`, `/api/tutor`, `/api/summary`), fließt in LLM-System-Prompt und in den Offline-Demo-Tutor (generische ermunternde Rückfragen + dieselbe Korrektur-/Vokabel-Erkennung wie im Rollenspiel, endet bei erkanntem Abschiedsgruß).

**Verifiziert (nicht nur "sollte funktionieren"):**
- Web (Playwright, beide Richtungen + Freestyle): deutsche Szenario-Karten erscheinen nur bei `target=german`, keine PL-Szenarien lecken rein; DE-Opener + PL-Hint korrekt; Englisch-Korrektur liefert deutsches `corrected` + polnische `noteNative`; DE-Summary-Notiz auf Polnisch; Freestyle-Thema landet korrekt im Goal-Feld und im Opener.
- Android-APK (`npx cap copy android` + Rebuild + echtes Gerät/AVD): Onboarding zeigt Deutsch-Option, Home zeigt „Bäckerei in Berlin"/„Nach dem Weg fragen in München" nach Auswahl, `adb logcat | grep capacitor` bestätigt nativen `VoiceBridge.speak()`-Call mit `{"text":"Guten Tag! Was darf es sein?","locale":"de-DE",...}` — die Locale wird also tatsächlich dynamisch bis auf Plugin-Ebene durchgereicht, nicht nur in der Web-Simulation.
- Regression: bestehender PL-Flow (`driver.mjs smoke`/`flow`) weiterhin grün, 5-Achsen-Summary/Streak/Vokabel-Speichern unverändert funktionsfähig.

**„Erweiterte Recherche":** bewusst nicht erneut recherchiert (Marktkontext bereits in §1 gut abgedeckt) — stattdessen die dort bereits dokumentierten PL→DE-Lernerfehler (Artikel, Modalverben, du/Sie, Ich-Laut, „würde") in konkrete Korrektur-Regeln und Szenario-Inhalte für die neue Richtung übersetzt.

**Noch offen (bewusst nicht in diesem Slice):**
- Nur 2 Szenarien pro Richtung (Ziel laut §2: ~30 pro Richtung × CEFR-Stufe).
- Freestyle-Modus im Offline-Demo ist nur ein generischer Rückfrage-Pool, keine echte Konversation — die volle Qualität kommt erst mit angebundenem LLM (AI-Modus).
- Memory über Sessions, Monetarisierung/Stripe, Prüfungsmodus (§2/§4 M2/M3) — nicht angefasst.
- Deutsche TTS/STT-Sprachqualität auf echtem Gerät nicht gehört/gemessen (Emulator liefert kein Audio-Feedback) — vor Beta-Test mit echtem Nutzer gegenprüfen.

## M1-Slice (06.09.2026, Nacht Teil 2): Vokabel-Spaced-Repetition (FSRS-artig)

Die in §1 dokumentierte Marktschwäche „gespeicherte Vokabeln verschwinden, kein Spaced Repetition" war der am stärksten durch die Recherche belegte Moat-Punkt — deshalb zuerst umgesetzt, vor Szenario-Volumen.

- **`app/srs.mjs`** (neu, reine Funktionen, kein DOM/Storage): `newCard()`, `review(card, rating, now)`, `isDue(card, now)`. FSRS-artige Approximation (Stability-in-Tagen + Difficulty 1–10, 4-Grade-Bewertung again/hard/good/easy) — nicht die volle, aus Millionen Reviews gefittete FSRS-Formel, aber gleiches UX-Modell wie Anki/FSRS. Headless mit `node -e` verifiziert: Intervall wächst bei wiederholtem "good" (1→39 Tage über 4 Wiederholungen), "again" halbiert Stability + schedult morgen, "easy" schedult weiter raus als "hard".
- **`kasia_vocab`-Storage** von flacher String-Liste auf volle Karten migriert: `{word, gloss, lang, stability, difficulty, reps, lapses, due, last}`. Alte Installationen mit bloßen Strings werden beim ersten Lesen automatisch migriert (angenommene Sprache: Polnisch, da es vor der Bidirektionalität die einzige war) — verifiziert per Playwright (String-Array in localStorage vorgelegt → nach Reload volle Karten-Objekte).
- Gloss-Lookup über die bestehenden `VOCAB_PL`/`VOCAB_DE`-Pools aus `scenarios.mjs`; unbekannte Wörter werden ohne Übersetzung gespeichert (Review zeigt dann einen Hinweis statt Gloss) statt den Save zu verweigern.
- **Neuer Screen `#screen-review`**: Zielwort → „Show answer" deckt Gloss + 4 Bewertungsbuttons auf → nächste Karte. Home-Screen zeigt einen `📚 N due`-Chip (nur sichtbar wenn >0, gefiltert auf die aktuelle Zielsprache — ein Deutschlerner sieht keine polnischen Fällig-Karten, auch wenn das Vokabelbuch weiterhin sprachübergreifend eine Liste ist).
- Verifiziert per Playwright End-to-End: Konversation zu Ende spielen → Vokabel-Chip speichern → Home-Chip zeigt „1 due" → Review öffnen → „Good" bewerten → Chip verschwindet, `due` in localStorage liegt nachweislich in der Zukunft, `reps` inkrementiert.

## M1-Slice (06.09.2026, Nacht Teil 3): Fortschrittsanzeige + Memory über Sessions

- **Fortschritt (§2 Feature 5):** `kasia_sessions` speichert jede abgeschlossene Konversation (`{date, scenarioId, lang, scores, minutes}`, Cap bei 200 Einträgen). Daraus abgeleitet: `estimateCefr(lang)` — grober Heuristik-Schätzwert (A1–C1) aus dem Rolling-Average von Grammar+Vocabulary der letzten 10 Sessions dieser Richtung (**kein echter Placement-Test**, das bleibt M3-Prüfungsmodus); `scenarioBest(scenarioId)` — Bestwert (Durchschnitt aller 5 Achsen) für die „Best N"-Badge auf der Szenario-Karte. Home-Screen zeigt zusätzlich eine Zeile „📈 Estimated level: B1 · 📚 12 words in your vocab book" (ausgeblendet, solange keine Sessions/Vokabeln vorhanden sind).
- **Memory über Sessions (§2 Feature 6, „Tutor erinnert sich an Schwächen"):** jede im Chat gezeigte Korrektur wird in `kasia_weaknesses` gezählt (Key `lang:corrected`). Ab der 2. Wiederholung desselben Fehlers zeigt der nächste Konversationsstart eine dezente Erinnerungs-Notiz („💭 Letztes Mal hat's gehakt bei: „kosztuje"") — in der Muttersprache des Lernenden, funktioniert unabhängig vom Tutor-Backend (Client-seitig, läuft also identisch im AI- und Offline-Demo-Modus). Verifiziert per Playwright: gleiche Korrektur zweimal in getrennten Sessions ausgelöst → dritte Session zeigt die Notiz mit korrektem Wort und korrekter Sprache.

## M1-Slice (06.09.2026, Nacht Teil 4): Szenario-Bibliothek erweitert + Free/Pro-Paywall-UI

- **6 neue Szenarien** (3 pro Richtung, jetzt 5/Richtung, 10 gesamt) direkt aus der in §2 skizzierten Themenliste: **Arzt** (`doctor-visit`/`arzt-besuch`), **Wohnung mieten** (`renting-apartment`/`renting-wohnung` — deckt „Immobilien"-Bedarf von Zielgruppe 1 ab), **Vorstellungsgespräch** (`job-interview` — deckt „Arbeit in DE"-Bedarf von Zielgruppe 2 ab) bzw. **Familientreffen/Smalltalk** (`family-gathering`). Gleiches Beat-Skript-Muster wie die bestehenden 4 Szenarien, mit eigenen Hints/Emoji. Per API und Web-Flow verifiziert (10/10 Szenarien laden, Beat-Advance funktioniert für die neuen Skripte). **Noch nicht** die vollen ~30/Richtung aus §2 — Rest ist mechanische Fleißarbeit nach demselben Muster, aufgeschoben zugunsten von Differenzierungs-Features (SRS, Memory) mit stärkerer Recherche-Rückendeckung.
- **Free/Pro-Paywall (§2 Feature 7, §4 M2):** neuer `#screen-paywall` erscheint an allen 3 Stellen, an denen bisher nur ein Toast das Tageslimit meldete (Szenario-Start, Free-Conversation, „Repeat scenario"). Zeigt Feature-Liste + Preis (9,99 €/Monat, aus §2 übernommen) + „Start 7-day trial". **Ausdrücklich als Dev-Vorschau gekennzeichnet** („Dev preview: no payment provider connected yet") — der Trial-Button setzt nur ein lokales `kasia_profile.pro`-Flag, es ist keine echte Zahlungsabwicklung angebunden. Grund: Stripe/RevenueCat brauchen ein echtes Geschäftskonto + API-Keys, die nur der Nutzer anlegen kann — das wurde bewusst nicht vorgetäuscht. `remainingToday()` gibt bei `pro:true` `Infinity` zurück, Daily-Chip zeigt „Unlimited (Pro)", ein „cancel Pro (dev)"-Button auf Home macht das Flag testbar rückgängig. Verifiziert per Playwright: Tageslimit erschöpft → Paywall statt Toast → Trial aktivieren → Konversation trotz erschöpftem Tageslimit startbar → Pro stornieren → Paywall erscheint wieder.

## M1-Slice (06.09.2026, Nacht Teil 5): Coach-Modus-Toggle (§5 Risiko 3)

- Neuer Button `🎯 Coach: On/Off` in den Chat-Tools (neben Repeat/Slower/Hints). Bei „Off" wird die Korrektur-Karte im Chat nicht mehr angezeigt (Gesprächsfluss bleibt ungestört, genau das im ursprünglichen Risiko-Abschnitt §5.3 geforderte Verhalten: „LLM überkorrigiert und tötet den Flow" → abschaltbar), **aber** die Korrektur wird weiterhin in `kasia_weaknesses` gezählt — das Memory-über-Sessions-Feature funktioniert also unverändert im Hintergrund weiter, auch wenn der Lernende die Unterbrechungen währenddessen ausblendet. Zustand persistiert in `kasia_profile.coachOff`. Verifiziert per Playwright: Toggle auf Off → fehlerhafte Eingabe löst keine sichtbare Korrektur-Karte aus, aber `kasia_weaknesses` zählt den Fehler trotzdem.
- Nach diesem Slice App-weit auf dem AVD final durchgeklickt (Onboarding → Home mit 5 Szenarien + Fortschrittszeile + Best-Badge → Paywall bei erschöpftem Tageslimit → Coach-Toggle), keine Crashes, `npx cap copy android` + Rebuild vor jedem Check durchgeführt.

## M1-Slice (06.09.2026, Umbau auf persönliche Nutzung): On-Device-KI statt Server, Gemini-Nano-Sackgasse, Paywall raus

**Kontext:** Ab hier Fokuswechsel — die App wird nicht mehr auf Store-Go-Live/Fremdnutzer optimiert, sondern auf **rein persönlichen Betrieb auf einem Samsung Galaxy S24 (Exynos 2400, `s5e9945`, One UI 8.5/Android 16)**, standalone ohne eigenen Server.

**Sackgasse Gemini Nano/AICore (dokumentiert, damit niemand das nochmal versucht):**
- ML-Kit-GenAI-Prompt-API (`com.google.mlkit:genai-prompt`) gegen Googles echte Sample-Quelle (`googlesamples/mlkit`) verifiziert integriert (`AiBridge.kt`, `checkStatus`/`download`/`generate`), Geräte-Enrollment (aicore-experimental-Gruppe + Play-Store-Beta + Modell-Download in der AICore-App) durchgeführt.
- **Ergebnis: `FEATURE_NOT_FOUND` (ErrorCode 606, Feature 636).** Root Cause per `adb shell dumpsys package com.google.android.aicore` gefunden: Das S24 (Exynos-Variante) fährt **Samsungs eigenen AICore-Fork** (`versionName=...samsungslsi.prod_aicore...`), nicht Googles Standard-AICore — der stellt die von der Prompt-API erwartete Feature-ID nicht bereit. Kein Timing-/Enrollment-Problem, sondern ein harter Hersteller-Fork-Blocker, der sich nicht von der App-Seite lösen lässt.
- **Konsequenz:** Kompletter Umstieg auf Weg 2 aus der ursprünglichen Recherche — gebündeltes Modell statt Systemdienst.

**On-Device-Gemma via LiteRT-LM (neuer Kern-Stack):**
- Modell: **Gemma 4 E2B** (`litert-community/gemma-4-E2B-it-litert-lm`, ungated Community-Mirror, 2,41 GB, generische CPU/GPU-Variante — keine Exynos-NPU-Optimierung verfügbar, läuft aber performant genug für Chat-Turnaround).
- Runtime: `com.google.ai.edge.litertlm:litertlm-android:0.17.0`, API-Signaturen **nicht aus der (teils veralteten) Doku übernommen, sondern per `javap` gegen das echte AAR verifiziert** (u. a. `Message.contents`/`Content.Text` statt der in der Doku behaupteten `Message.text`-Property — das hätte sonst wieder Stunden Fehlersuche gekostet, siehe Lektion aus den frühen Capacitor-Bugs).
- **16-KB-Page-Size-Absturz gefunden und behoben:** Android zeigte `PageSizeMismatchDialog` beim App-Start. Ursache per `readelf`/manueller ZIP-Offset-Berechnung verifiziert: `liblitertlm_jni.so` lag im APK auf einem nur 4-KB-, nicht 16-KB-ausgerichteten Offset. Fix: AGP 8.2.2 → **8.13.2** (+ Gradle-Wrapper → 8.13), das richtet uncompressed `.so`-Dateien seit AGP 8.5.1 automatisch 16-KB-aligned aus. Nach dem Fix per Byte-Offset-Rechnung verifiziert (`data_offset % 16384 == 0`) und auf dem echten Gerät bestätigt: Dialog verschwunden.
- `minSdkVersion` 22 → 31 (von LiteRT-LM vorausgesetzt) — unkritisch für ein Ein-Geräte-Projekt.
- **Download-Robustheit:** Erster Test schlug mit `HTTP 416` fehl — eine `.part`-Datei aus einem früheren, mehrfach überlappenden Download-Versuch war (2,72 GB) größer als die echte Datei (2,41 GB) und machte den Resume-Range-Request ungültig. Fix in `AiBridge.kt`: `downloadLock`-Mutex gegen parallele Downloads, automatischer Neustart-ohne-Range bei `IOException` (inkl. 416), Größenverifikation nach Abschluss vor dem `rename` auf den finalen Dateinamen.
- **End-to-End auf dem echten S24 verifiziert** (nicht im Emulator möglich, da AICore/Gemini-Nano-Weg entfällt und LiteRT-LM auch nur auf echter Hardware sinnvoll läuft): Download (2.588.147.712 Bytes, exakt Content-Length) → Engine-Init (~6,5 s) → `generate()` liefert korrekte, kohärente Antworten via `adb logcat`.

**Geteilter Prompt-Vertrag (`app/prompts.mjs`, neu):** `tutorSystemPrompt`/`summarySystemPrompt`/`parseTutorReply`/`parseSummaryReply` aus `lib/tutor.mjs` (Server) herausgezogen in ein gemeinsames Modul, das jetzt sowohl vom Server-Tutor als auch von `app.js` (On-Device-Pfad) importiert wird — ein JSON-Vertrag für Cloud-, On-Device- und Demo-Backend statt Code-Duplikat.

**Prompt-Iteration nach Live-Test (wichtig für künftige Prompt-Änderungen an diesem Modell):**
- `replyNative`-Feld ergänzt: jede Tutor-Zeile bekommt jetzt verpflichtend eine Übersetzung in die Muttersprache (zuvor gab es nur `hint` für Skript-Beats, im KI-Modus fehlte das komplett — von einer Nebeninstanz zurecht bemängelt, siehe Chat).
- **Erster Versuch scheiterte reproduzierbar:** Gemma E2B lieferte für `replyNative` einfach den `reply`-Text nochmal auf Deutsch statt einer polnischen Übersetzung — über mehrere Turns hinweg, kein Zufallstreffer. Behoben durch eine deutlich schärfere Instruktion mit explizitem Negativbeispiel („Never repeat the reply text — Example: reply 'Cześć!' -> replyNative 'Hallo!'"). Nach dem Fix per Live-Turn verifiziert (`adb logcat`): korrekte PL-Übersetzung bei DE-Zielsprache. **Lektion:** das kleine On-Device-Modell braucht konkrete Beispiele statt abstrakter Regeln — bei künftigen Prompt-Änderungen für dieses Modell immer mit einem Beispielpaar arbeiten, nicht nur beschreiben.
- Bleibt als bekannte, akzeptierte Schwäche: Vokabel-Chips liefern manchmal für PL/DE dasselbe Wort statt einer echten Übersetzung (kleineres Feld, nicht der Kern-Übersetzungspfad, keine Prompt-Härtung dafür vorgenommen).
- Regel für zweisprachige Zwischenfragen ergänzt: Lernende dürfen jederzeit auf Deutsch oder Polnisch eine Verständnisfrage stellen (statt in der Zielsprache zu antworten) — der Tutor erkennt das, beantwortet lehrerhaft in der Sprache der Frage und führt danach zurück ins Rollenspiel/Gespräch in der Zielsprache. Bewusst nicht als voll sprachagnostischer Tutor umgesetzt (permanentes Mischen beider Sprachen ohne Richtung) — das Risiko, dass das kleine Modell dabei durcheinanderkommt, wurde als zu hoch eingeschätzt; stattdessen bleibt die Zielsprache der Standard-Kanal, nur Meta-Fragen brechen kurz aus.
- **Sprachwahlschalter im Eingabebereich** (`#btn-input-lang`, 🗣️/❓): Statt vom Modell verlangen, die Sprache der Eingabe selbst zu erkennen, markiert der Lernende jede Nachricht explizit als Übungssatz (Zielsprache) oder Zwischenfrage (Muttersprache) — steuert sowohl den Prompt-Marker (`MY_UTTERANCE:` vs. `MY_QUESTION (asked in X):`, `formatUserTurn()` in `prompts.mjs`) als auch die STT-Locale beim Mikrofon. Setzt sich bei jedem neuen Gespräch auf Zielsprache zurück.
- **Format-Stabilität bei längeren Gesprächen (Review-Feedback, per Live-Test auf dem Gerät verifiziert):** Ab ca. 4-5 Turns brach das Modell reproduzierbar aus dem JSON-Format aus — teils reine Fließtext-Antworten, teils sogar ein wörtliches Echo des eigenen Prompt-Markers (`"MY_UTTERANCE: Akwen Station"` als "Antwort"). Ursache: der komplette Gesprächsverlauf wurde bei jedem Turn erneut als `initialMessages` mitgegeben, der Kontext wuchs unbegrenzt gegen das ~4000-Token-Limit des Modells. Behoben durch (a) Historie in `sendTurn()` auf die letzten 6 Einträge gekappt (`historyPair().slice(-6)`, ebenso `userTexts.slice(-20)` in der Zusammenfassung) und (b) eine Format-Erinnerung direkt am Ende jeder neuen Nutzernachricht statt nur einmal im System-Prompt (`formatUserTurn()`). Nach dem Fix: 6 aufeinanderfolgende Turns (inkl. bewusst unsinniger Eingaben zum Stresstest) alle valides JSON, korrekte Übersetzung, keine Format-Ausbrüche mehr. Zusätzliches Sicherheitsnetz in `parseTutorReply()`: bricht das Modell trotzdem aus dem JSON aus, wird der Fließtext als Antwort verwendet statt in den generischen Demo-Fallback zu wechseln — außer er ist erkennbar nur ein Echo des Prompt-Markers, das bleibt ein Fall für den Demo-Fallback. **Lektion:** bei kleinen On-Device-Modellen ist unbegrenzt wachsender Konversationskontext ein Zuverlässigkeitsrisiko, nicht nur ein Kostenfaktor wie bei großen Cloud-Modellen — Historie aktiv kappen.
- **Race Condition beim App-Start behoben (Review-Feedback):** `aiTutorTurn`/`aiTutorSummary` gingen ursprünglich synchron davon aus, dass `aiModelReady` (asynchron per `checkStatus()` gesetzt) den korrekten Zustand hat. Kurz nach App-Start war das Flag oft noch nicht gesetzt, obwohl das Modell längst auf der Festplatte lag → stiller Fallback in den Demo-Modus, ohne dass es in der UI sichtbar gewesen wäre. Fix: Der `aiModelReady`-Gate wurde aus dem Korrektheits-Pfad entfernt — `AiBridge.generate()` prüft ohnehin schon nativ und synchron per Datei-Existenz, ob das Modell da ist, das ist die korrekte einzige Quelle der Wahrheit. Das Flag bleibt nur noch für die kosmetische Badge-Anzeige auf Home.
- **Kontinuitäts-Gegenprobe zur History-Kappung (Review-Feedback):** Da die 6-Turn-Kappung selbst eine neue Fehlerquelle hätte sein können (Modell "vergisst" die Szene, fängt von vorne an), auf dem echten Gerät ein 9-Turn-Arztgespräch mit echten, kohärenten Antworten durchgespielt. Ergebnis: Die Szene progressiert sauber durch eine sinnvolle Anamnese (Ort des Schmerzes → Dauer → Charakter stechend/dumpf → Begleitsymptome Fieber/Blähungen → weitere Probleme) — kein Zurückspringen zur Eröffnungsfrage. Die zuvor beobachteten identischen Antworten waren also tatsächlich Folge von bewusst unsinniger Testeingabe (das Modell fragte berechtigt zweimal nach), nicht von Kontextverlust. Eine einzelne Übersetzungsungenauigkeit trat auf (`"Jak długo czujesz ten ból?"` → fälschlich `"Wieczorem czujesz ten ból?"` statt „Wie lange…") — Qualitätsrauschen, kein Strukturfehler.
- **Neuer Fund, noch offen — TTS/STT-Rückkopplung:** Beim Versuch, die App per `adb shell input`/`tap` fernzusteuern, landete ein Tap versehentlich auf dem Mikrofon-Button. Die Spracherkennung nahm daraufhin ein Fragment der eigenen, gerade abgespielten Tutor-TTS-Antwort auf und sendete es als vermeintliche Nutzereingabe zurück an das Modell (sichtbar im Chat: „Proszę opisać" als grüne Nutzer-Bubble — wortidentisch mit der TTS-Ausgabe kurz zuvor). Echtes Akustik-Rückkopplungsrisiko auf einem echten Gerät mit Lautsprecher+Mikrofon in Nähe zueinander, im Emulator nie aufgefallen (kein virtueller Mikrofoneingang dort). **Nicht behoben in dieser Session** — sinnvoller Fix wäre, `VoiceBridge.listen()` clientseitig zu sperren, solange `speak()` noch aktiv ist (TTS-`UtteranceProgressListener.onDone` als Signal, ähnlich der bestehenden `speakQueue`-Logik in `VoiceBridge.kt`), oder den Mic-Button während TTS-Wiedergabe zu deaktivieren.
- **Fallback-Text kann falsche Sprache/keine Übersetzung haben:** Bricht das Modell aus dem JSON aus und der rohe Text wird als Antwort verwendet (siehe oben), ist nicht garantiert, dass dieser Text tatsächlich in der Zielsprache ist — anders als bei validem JSON gibt es dann kein `replyNative`. Um zu vermeiden, dass z. B. deutscher Fließtext durch die polnische TTS-Stimme vorgelesen wird, spricht `addTutor()` diesen Fall (`noSpeak`-Flag, gesetzt über `parseTutorReply()`s `fallback: true`) jetzt nicht mehr laut vor — der Text wird nur noch angezeigt, nicht vorgelesen.

**Weitere Änderungen für den persönlichen Betrieb:**
- **Sprach-Umschalter auf Home** (`#chip-switch-lang`, 🇵🇱⇄🇩🇪): `profile.target` war zuvor eine reine Einmal-Entscheidung im Onboarding ohne jeden Weg, sie danach zu ändern — zu Recht als "komplett kontraproduktiv" bemängelt. Jetzt jederzeit mit einem Tap umschaltbar, `loadHome()` filtert Szenarien/TTS-Locale/Fortschritt sofort neu (keine Datenmigration nötig, da Vokabeln/Sessions/Weaknesses schon vorher korrekt per `lang`-Feld getrennt gespeichert wurden). Auf dem Gerät verifiziert.
- **Paywall + Tageslimit komplett entfernt:** `remainingToday()` gibt jetzt unbedingt `Infinity` zurück, `#screen-paywall` wird dadurch nie mehr erreicht (Screen/HTML bleibt im Code, ist aber unerreichbar), Daily-Chip zeigt fix „Unlimited". War in der vorigen Slice noch als Store-Vorbereitung sinnvoll, für den Ein-Personen-Betrieb aber nur Reibung ohne Nutzen.
- **Bug-Fix (Review-Feedback):** `recordSession()` lief bisher auch bei sofort abgebrochenen Konversationen (0 User-Turns) und verfälschte damit `estimateCefr()` (z. B. „B2" nach einer leeren Session). Jetzt nur noch bei `userTexts.length > 0`.

**Für echtes Go-Live (falls die App doch mal für Fremdnutzer gedacht wäre) weiterhin blockiert auf Zugänge, die nur der Nutzer beschaffen kann:**
- Cloud-ASR/TTS-Zugänge (Deepgram, ElevenLabs) falls die native On-Device-Sprachqualität für andere Nutzer/Geräte nicht ausreicht — für den persönlichen Betrieb auf dem S24 nicht relevant.
- Eine echte Beta-Gruppe für eine belastbare CEFR-Kalibrierung (aktuell nur eine grobe lokale Heuristik, kein Placement-Test).
- Prüfungsmodus (Goethe/CPE-Fragenbank) — braucht kuratierten Inhalt/Lizenzfragen, kein Code-Problem.
- Stripe/RevenueCat, Play-/App-Store-Account: **entfallen** für den persönlichen Betrieb, nur noch relevant, falls die App später doch veröffentlicht werden soll.

**Ghosting-Vorfall: hängender `generate()`-Aufruf, Ursache & Fix-Iteration:**
- Nutzer meldete „wir werden von der KI geghostet" — per `adb logcat` verifiziert: ein `generate()`-Aufruf kehrte nie zurück (`generate ->`/`generate failed` fehlten komplett im Log), während der Nutzer währenddessen mehrfach weitertippte. Kein Sende-Sperr-Mechanismus verhinderte das → mehrere `generate()`-Aufrufe liefen parallel gegen dieselbe (vermutlich nicht nebenläufigkeitssichere) LiteRT-LM-Engine.
- **Erster Fix:** `turnPending`-Flag in `sendTurn()` (sperrt `#btn-send` während eine Antwort aussteht), 25-s-Client-Timeout (`withTimeout()` in `app.js`) mit Fallback auf Demo-Tutor, sowie ein natives `generateBusy`-`AtomicBoolean` in `AiBridge.kt`, das einen zweiten `generate()`-Aufruf sofort ablehnt (`generate-busy`), statt ihn hinter einem evtl. nie zurückkehrenden Aufruf anzustellen.
- **Regression dadurch aufgedeckt:** In der nächsten Sitzung hing der *allererste* `generate()`-Aufruf nach App-Neustart (Kaltstart-Engine-Init). Da `generateBusy` nur im (nie erreichten) `finally` der hängenden Coroutine zurückgesetzt wird, blockierte **jeder** weitere Aufruf für den Rest der Prozesslaufzeit sofort mit `generate-busy` — inklusive der Zusammenfassung am Ende. Das gesamte Bäckerei-Testgespräch lief dadurch unbemerkt komplett auf dem Offline-Skript (`beats[]`-Text wortidentisch im Log wiedererkannt), obwohl der Nutzer eine echte KI-Antwort erwartete.
- **Fix v2:** Zeitbasierte Stale-Erkennung (`generateStartedAt`, `STALE_BUSY_MS = 90_000`) — hält die Sperre länger als 90 s, wird der alte Aufruf als aufgegeben behandelt (`engine = null` unter `engineLock`, **kein** `engine.close()`, da ein anderer Thread evtl. noch darin hängt und close-then-use nativ abstürzen könnte; das alte ~1 GB bleibt bis zum Prozessende geleakt), ein neuer `Engine` wird für den nächsten Versuch aufgebaut. Client-Timeout von 25 s auf 90 s angehoben (war unterhalb der beobachteten Normal-Latenz von 16–48 s). Zusätzlich sichtbares `🔌 Offline-Antwort`-Tag an jeder Demo-Fallback-Bubble (`addTutor()`s `offline`-Flag) — der Nutzer soll nie unbemerkt gegen das Skript statt die echte KI üben.
- **Live-Verifikation ohne UI/entsperrtes Gerät:** Da ADB-Texteingabe in die WebView unzuverlässig ist (siehe frühere Lektion) und das Gerät zum Testzeitpunkt gesperrt war, wurde ein Instrumentierungstest geschrieben (`android/app/src/androidTest/java/pl/kasia/trainer/AiBridgeGenerateTest.kt`), der die LiteRT-LM-Engine direkt anspricht — ganz ohne App-UI oder Bildschirmentsperrung (`./gradlew connectedAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=pl.kasia.trainer.AiBridgeGenerateTest`, `androidTestImplementation` der LiteRT-LM-AAR ergänzt). Ergebnis (zweimal reproduziert): `generate()` schließt zuverlässig in ~9 s ab, liefert korrektes JSON inkl. korrekt übersetztem `replyNative` und einem Vokabel-Paar `{"word": "Brötchen", "translation": "kanapki/małe bułeczki"}` — echtes Polnisch, kein Englisch, keine Dopplung. Der ursprüngliche Hänger war damit vermutlich ein einmaliges Kaltstart-/Speicherdruck-Problem (viele vorangegangene Force-Stops/Modell-Neuladungen in derselben Testsitzung), kein reproduzierbarer Dauer-Deadlock. **Lektion:** Bei gesperrtem/nicht verfügbarem Testgerät lässt sich der native On-Device-Pfad trotzdem verifizieren, indem man die Engine direkt aus einem Instrumentierungstest anspricht, statt auf UI-Interaktion angewiesen zu sein — deutlich zuverlässiger als ADB-UI-Automation.

**Vokabel-Richtungs-Bug (Englisch statt Polnisch) behoben:**
- Per Logcat aus einem echten Bewerbungsgespräch nachgewiesen: das feste Schema `{"pl": string, "de": string}` gab dem Modell kein Signal, welches Feld welche Sprache erwartet — Belege: `{"pl": "vollständig", "de": "vollständig"}` (Duplikat), `{"pl": "erfahrung", "de": "Erfahrung (experience)"}` (Englisch angehängt), `{"pl": "Kommunikation", "de": "Kommunikation (komunikacja)"}` (das korrekte polnische Wort steckte im *falschen* Feld — das Modell kannte die Übersetzung, konnte sie nur nicht der richtigen Schlüssel-Semantik zuordnen).
- Fix nach demselben Muster wie der `replyNative`-Fix: richtungsneutrales Schema `{"word": string, "translation": string}` im Prompt (`word` = Zielsprache, `translation` = Muttersprache), mit konkretem Beispielpaar und explizitem Verbot von Englisch/Klammer-Glossen/Dopplung. Rückmapping auf das intern erwartete `{pl, de}` passiert zentral in `parseTutorReply(raw, targetLang)` (neuer zweiter Parameter, von beiden Aufrufern — `lib/tutor.mjs` und `app.js`s `aiTutorTurn()` — mit `s.lang` bzw. `getScenario(...).lang` befüllt), rückwärtskompatibel falls ein Modell doch noch altes `{pl,de}` liefert. Per `AiBridgeGenerateTest` live verifiziert (s. o.).
- **Lektion:** Für zweisprachige Wortpaare in einem bidirektionalen Prompt nie feste Sprachcode-Schlüssel (`pl`/`de`) verwenden — das kleine Modell kann die Richtung aus einem opaken Feldnamen nicht zuverlässig ableiten. Richtungsneutrale Schlüssel (`word`/`translation`) + Beispiel, Rückmapping im Code, wo die Richtung bekannt ist.

**Wiederholungs-Fragen-Bug (geringer Lerneffekt) — Prompt-Regel ergänzt, noch nicht mehrturnig live verifiziert:**
- Im selben Bewerbungsgespräch-Log fragte der Tutor mehrfach fast wortgleich nach bereits beantworteten Dingen (Name dreimal, Fähigkeiten dreimal). Bewusst **nicht** mit einer aufwendigen Themen-Checkliste pro Szenario behoben (großer Autorenaufwand über alle Szenarien in `scenarios.mjs`, ohne Beleg, dass ein 2B-Modell einer Checkliste zuverlässiger folgt als einer einzelnen klaren Regel) — stattdessen eine knappe Anti-Wiederholungs-Regel im System-Prompt: nie eine bereits gestellte Frage wiederholen, bereits Gesagtes kurz anerkennen und zu einem neuen Aspekt übergehen.
- Wichtiger Vorbehalt: Die beobachteten Wiederholungen häuften sich exakt dort, wo der Lernende unkooperative/absurde Test-Eingaben gab (Wal-Rettungsgeschichte, „Captain Iglo") — das ist ein Modell-Fähigkeitslimit unter adversarialen Eingaben, nicht zwangsläufig ein generelles Problem bei normaler Nutzung.
- **Live verifiziert** (zweiter Test in `AiBridgeGenerateTest.kt`, `secondTurnDoesNotRepeatAlreadyAnsweredQuestion`): Zwei-Turn-Bewerbungsgespräch mit kooperativen Antworten — Turn 1 (Lernende nennt Namen + Stadt) → „Hallo Anna, schön dich kennenzulernen. Woher kommst du genau?"; Turn 2 (Lernende nennt Berufserfahrung) → „Das ist gut. Welche Produkte hast du verkauft?". Kein Wortlaut-Duplikat, keine erneute Namensfrage, klarer thematischer Fortschritt. Die Regel hält also im normalen, kooperativen Gebrauch — die ursprünglichen Wiederholungen waren tatsächlich auf den Stresstest mit absurden Eingaben beschränkt.

## "Grundlagen"-Kurs für Lernende ohne jede Vorkenntnis (neu)
- Annahme (explizit vom Nutzer vorgegeben): der Lernende hat null Vorwissen in der Zielsprache — die bisherigen Szenarien setzen aber schon voraus, dass einfache Sätze gebildet werden können. Recherche zu Standard-Reihenfolge für absolute Anfänger bestätigt die übliche Sequenz: Begrüßung → Zahlen → Fragewörter → Pronomen/„sein"+„haben" → allgemeine Überlebenssätze (Alphabet-Stufe entfällt hier, da Polnisch/Deutsch beide lateinische Schrift nutzen).
- Umsetzung: neue Datei `app/basics.mjs` (`BASICS_PL`/`BASICS_DE`, 5 Lektionen × 6–10 Einträge, bidirektional), zwei neue Screens (`#screen-basics` Lektionsliste, `#screen-basics-lesson` Karteikarten-Ablauf mit TTS), neue Home-Karte mit Fortschrittsbalken (`updateBasicsCard()`), Fortschritt in `kasia_basics_progress` (localStorage). Beim Abschluss einer Lektion wandern alle Wörter automatisch ins bestehende Vokabelheft/SRS (`saveVocabWordWithGloss()`), keine separate Speicherlogik nötig.
- Bewusste Content-Wahl: Lektion 1 (Begrüßung: proszę/dziękuję), 2 (Zahlen) und 5 (Überlebenssätze: „ile to kosztuje?") liefern exakt die Wörter, die die ersten Marktstand-/Bäckerei-Szenarien brauchen — nach dem Kurs ist das erste Rollenspiel-Gespräch tatsächlich machbar, nicht nur theoretisch vorbereitet.
- Nebenbei gefunden und behoben: `VOCAB_PL` in `scenarios.mjs` hatte englische statt deutsche Übersetzungen im `de`-Feld (Kopierfehler aus einer früheren Iteration) — korrigiert, während an derselben Vokabel-Infrastruktur gearbeitet wurde.
- **Live auf dem Gerät verifiziert:** Nutzer bestätigt „sichtbar, Lektion funktioniert" nach Neuinstallation — Grundlagen-Karte erscheint auf Home, Lektion „Begrüßung & Höflichkeit" lässt sich öffnen und durchklicken. Logcat währenddessen sauber (keine Fehler/Crashes, nur unabhängiges harmloses WebView-Chromium-Rauschen).
- **APK-Größe für Verteilung reduziert:** `android/app/build.gradle` `defaultConfig` um `ndk { abiFilters "arm64-v8a" }` ergänzt — die x86_64-Emulator-Variante wurde für ein Ein-Geräte-Projekt (nur das reale S24) unnötig mitgeschleppt und verdoppelte die APK-Größe fast (58 MB → 34 MB). Grund: Versuch, die App per E-Mail/Google Drive zu verteilen, scheiterte an harten Grenzen (Gmail-Anhang-Limit 25 MB; das verfügbare Google-Drive-Werkzeug kann Dateien nur als vollständig inline übergebenes Base64 hochladen, was für >30 MB ein technisch nicht handhabbares Vielfaches an Tokens bräuchte — keine Chunk-/Stream-Möglichkeit vorhanden). Lösung: Nutzer griff stattdessen direkt auf die bereits lokal liegende Datei zu bzw. nutzte das ohnehin per ADB direkt installierte Gerät.

## 9. Forschung & Roadmap: Interaktivität, Übungsformen, effizientes Sprachenlernen (07.09.2026)

Nutzer-Feedback: der Grundlagen-Kurs sei "noch nicht sehr interaktiv" — gewünscht sind Spracheingabe überall, eine Vokabelabfrage aus dem eigenen Wörterbuch, "erst hören, dann nachsprechen" bei neuen Wörtern, ein Lautsprecher-Symbol zum Wiederholen, ein aus anderen Sprachlern-Apps bekanntes Satz-Zusammenbauen (Wörter anklicken/verschieben) fürs Grammatik-/Wortverständnis, ggf. generierte Multiple-Choice-Abfragen, ein genereller UI/UX-Feinschliff, und ein spürbar erweiterter Grundlagen-Umfang (aktuell zu knapp). Zusätzlich: Recherche zu effizienten Sprachlernmethoden generell, um sie dauerhaft in die App-Philosophie einfließen zu lassen — nicht nur für diese eine Funktion.

### 9.1 Forschungsergebnisse: was in der Sprachlernforschung nachweislich wirkt

- **Retrieval Practice / aktives Abrufen statt passivem Wiederlesen:** Sich aktiv an ein Wort/eine Regel zu erinnern (statt es nur nochmal zu lesen) stärkt die Gedächtnisspur erheblich stärker als wiederholtes Anschauen — der Lerneffekt kommt vom *Versuch, sich zu erinnern*, nicht vom Wiedersehen. Das spricht dafür, Karteikarten möglichst schnell durch Abfrage-Formate (Multiple-Choice, Lückentext, freies Erinnern) zu ergänzen statt nur "anschauen und umdrehen".
- **Spaced Repetition / verteiltes Lernen:** Verteiltes Üben mit wachsenden Abständen verbessert die Langzeit-Behaltensleistung gegenüber gehäuftem Pauken um teils 200–400 % (mehrere 2025er Studien, u. a. zu EFL-Lernenden). **Bereits vorhanden** in dieser App über `srs.mjs` (FSRS-artig) — die Grundlagen-Wörter landen schon automatisch dort; das ist also strategisch schon richtig aufgestellt, nur (siehe 9.2) noch nicht mit variierenden Abfrage-*Formaten* verknüpft.
- **Verteiltes Abrufen kurz vor dem Vergessen** ist wirksamer als beides zu früh (zu leicht, kein Lerneffekt) oder zu spät (schon vergessen, wieder bei null) — Grund, warum ein reines "Karten in fester Lektionsreihenfolge durchklicken" pädagogisch schwächer ist als eine echte gemischte Abfrage über mehrere Lektionen hinweg (siehe 9.3, Punkt "durchmischte Wiederholung").
- **Sofortiges Feedback beim Sprechen (ASR-gestützt):** Studien zu Aussprache-Apps (z. B. ELSA Speak) zeigen einen echten Lerneffekt durch sofortiges Feedback nach dem Sprechversuch — aber mit einer wichtigen Einschränkung: Spracherkennung hat bekannte Schwächen bei Akzenten/Nicht-Muttersprachlern, ein ASR-Score sollte daher **ein Signal, nicht die Wahrheit** sein. Deckt sich mit der bereits getroffenen Entscheidung, das Nachsprechen in dieser App nie als Blockade/Pass-Fail zu werten, sondern nur als weiches Feedback (✅/🔁, "Weiter" bleibt immer verfügbar).
- **Gamification wirkt — aber nur bis zu einem Punkt:** Fortschrittsanzeigen, Belohnung bei Erfolg, Streaks und Abwechslung fördern nachweislich Engagement und Rückkehr-Motivation. Gleichzeitig zeigt Forschung zu "Gamification Misuse" auch das Risiko: wird das Punkte-/Streak-System selbst zum Fokus, lenkt es vom eigentlichen Lernen ab und schadet dem Ergebnis. Für eine Ein-Personen-App ohne Fremdnutzer-Monetarisierung heißt das: Fortschrittsanzeigen und Abwechslung ja (wirkt motivierend gegen Langeweile), aber keine künstlichen Drucksysteme (Herzen/Leben verlieren, aggressive Streak-Erinnerungen) — das wäre Reibung ohne Nutzen, wenn der einzige "Kunde" der Lerner selbst ist.
- **Abwechslung der Übungsform selbst ist ein Lernfaktor, nicht nur Motivation:** unterschiedliche Abfrageformate (erkennen vs. produzieren vs. anordnen) trainieren unterschiedliche Gedächtnis-/Sprachverarbeitungspfade — Multiple-Choice trainiert Wiedererkennung, Satzbau trainiert aktive Wortstellung/Grammatik, freies Nachsprechen trainiert Produktion. Ein guter Kurs kombiniert alle drei, nicht nur eine Form wiederholt.

### 9.2 Bereits umgesetzt (diese Session, Stand vor Nutzer-Feedback zum Live-Test ausstehend)

- Sprecher-Symbol (🔊) an Grundlagen-Karte **und** Vokabel-Wiederholung (`#screen-review`) — jederzeit erneut anhörbar, unabhängig vom automatischen Abspielen beim Karten-Wechsel.
- "Erst hören, dann nachsprechen": `nextBasicsCard()` spielt das Wort automatisch per TTS ab; ein neuer 🎤-„Nachsprechen"-Button ruft `captureRepeatAttempt()` (eigene, leichtgewichtige STT-Erfassung getrennt vom Chat-Mikrofon `startMic()`) auf und vergleicht das Ergebnis diakritika-/groß-klein-unempfindlich (`normalizeForCompare()`/`soundsLike()`) — zeigt „✅ Klingt gut!" oder „🔁 Nochmal?", blockiert aber **nie** das Weiterkommen (entspricht der 9.1-Erkenntnis zu ASR-Grenzen bei Akzenten).
- Berücksichtigt den heute schon vorhandenen `"tts-speaking"`-Schutz in `VoiceBridge.listen()` (aus dem Feedback-Loop-Fix von gestern) — das Nachsprechen nutzt denselben Mechanismus und zeigt denselben freundlichen Hinweis, statt eine zweite Sperr-Logik zu bauen.
- **Noch ausstehend:** Live-Bestätigung durch den Nutzer auf dem Gerät (angefragt, Antwort steht noch aus).

### 9.3 Geplante nächste Schritte — **Stand 08.09.2026: alle Punkte umgesetzt**

Ursprünglich als klein geschnittene Einzelschritte mit Nutzer-Bestätigung nach jedem Schritt geplant; per explizitem Nutzer-Goal („führe den vollständigen Plan aus … recherchiere, überprüfe, auditiere eigenständig") in einem Zug durchgezogen und selbst verifiziert (siehe 9.5), Live-Bestätigung durch den Nutzer für Punkt 1 lag vor, für 2–7 steht der interaktive Praxistest noch aus.

1. ✅ *(oben, 9.2, vom Nutzer bestätigt: „ja, sichtbar, Lektion funktioniert")* Sprecher-Symbol + Hören-dann-Nachsprechen.
2. ✅ **Multiple-Choice-Abfrage** (`showBasicsMcCard()`/`handleBasicsMcAnswer()` in `app.js`): gleiche Karten-Hülle, 4 Antwortoptionen (1 korrekt + 3 Distraktoren aus derselben Lektion, bei <4 Einträgen pro Sprache über `allBasicsItems()` aus allen Lektionen aufgefüllt — per Node-Audit verifiziert: in keiner der 11×2 Lektionen sind es je weniger als 3 verfügbare Distraktoren). Läuft nach der Lern-Runde automatisch als zweite Phase.
3. ✅ **Satzbau-Übung** (`showBasicsSentenceCard()`, Tippen-in-Reihenfolge statt Drag & Drop): **eigene, von Hand geschriebene Satz-Daten** pro Lektion (`sentences: [{parts, gloss}]` in `basics.mjs`) statt aus den Karteikarten-Strings abgeleitet — für Pronomen-, Überlebenssätze- und die neue Verben-Lektion (je 3 Sätze), teils bewusst identisch mit einem existierenden Lektions-Item formuliert (z. B. „Ile to kosztuje" exakt aus dem Survival-Item), teils lektionsübergreifend (Verben-Satz nutzt „jabłko" aus der Obst-Lektion) für zusätzliche Wiederholung.
4. ✅ **Durchmischte Wiederholung** (`openBasicsMixedReview()`, Button „🔀 Gemischte Wiederholung" auf der Lektionsliste, nur sichtbar sobald ≥1 Lektion abgeschlossen ist): Multiple-Choice-Runde (bis zu 15 Items) über alle bereits abgeschlossenen Lektionen gemischt, nicht nur die zuletzt gelernte.
5. ✅ **Inhalt erweitert:** von 5 auf **11 Lektionen** (neu: Kolory/Farben, Owoce i napoje/Obst+Getränke, Kraje i narodowości/Länder, Rodzina/Familie, Dni tygodnia i pory dnia/Wochentage+Tageszeiten, Przydatne czasowniki/Verben chcieć-iść-jeść-pić-mówić-widzieć), von ~38 auf **~89 Einträge pro Sprachrichtung**. Emoji-Feld (Nutzer-Vorschlag, Dual-Coding-Theorie) ergänzt für Farben/Obst/Getränke/Länder/Tageszeiten/einige Verben — bewusst nicht für abstrakte Lektionen (Fragewörter, Pronomen, Familie).
6. ✅ **UI/UX:** Fortschrittsanzeige „Schritt X/Y" *innerhalb* einer Lektion (über alle drei Phasen hinweg, nicht nur Lektionen gesamt), einheitliche Karten-Hülle für alle drei Übungsformen, Lautsprecher-Symbol an jeder Wort-Ansicht (Grundlagen-Karte, Multiple-Choice, Vokabel-Wiederholung). Zusätzlich (Nutzer-Wunsch, nicht ursprünglich geplant): **Light/Dark-Mode-Umschalter** (🌙/☀️-Chip auf Home, `kasia_theme` in localStorage, respektiert bei fehlender expliziter Wahl automatisch `prefers-color-scheme`).
7. ✅ **Bewusst NICHT umgesetzt:** aggressive Gamification-Elemente (Leben/Herzen, Streak-Drohungen, Wettbewerbs-Mechaniken) — laut 9.1-Recherche potenziell kontraproduktiv und für eine Ein-Personen-App ohne Publikum irrelevant. Fortschrittsanzeigen und Abwechslung ja, Druckmechanik nein.

### 9.4 Übertragbares Prinzip für die App insgesamt (nicht nur Grundlagen)

Die drei Übungsformen (Produktion/Nachsprechen, Wiedererkennung/Multiple-Choice, Anordnung/Satzbau) plus verteilte Wiederholung sind kein Grundlagen-spezifisches Feature, sondern ein allgemeines Prinzip für die ganze App: dieselbe Logik ließe sich später auch auf Szenario-Vokabular anwenden (aktuell landet Szenario-Vokabular schon im selben `kasia_vocab`-SRS-Pool, aber nur im Flip-und-Bewerten-Format von `#screen-review`). Langfristig sollte die Abfrage-Engine (Multiple-Choice-Distraktoren, Satzbau-Tokenizer) als gemeinsame Funktion gebaut werden, die sowohl Grundlagen- als auch Szenario-Vokabeln abfragen kann, statt zwei Parallel-Implementierungen zu pflegen.

## 10. UI-Sprache: Englische Reste durch DE/PL ersetzt (08.09.2026)

Nutzer-Feedback: „die Benutzer der App sprechen nur Deutsch bzw. Polnisch" — die App-Oberfläche (Menüs, Buttons, Tooltips) enthielt an vielen Stellen noch Englisch aus der frühen Scaffolding-Phase, komplett unabhängig von den zwei Sprachrichtungen, die die App eigentlich lehrt.

**Neues Modul `app/i18n.mjs`:** Wörterbuch für App-Chrome (Buttons/Labels/Tooltips) in `de`/`pl`, `t(nativeCode, key, vars)` mit `{platzhalter}`-Interpolation, `translateUI(nativeCode)` durchsucht alle `[data-i18n]`-Elemente im DOM und setzt den Text. **Prinzip:** UI-Chrome wird immer in der **Muttersprache** des Lernenden gezeigt (nicht in der Zielsprache) — ein Deutscher, der Polnisch lernt, sieht deutsche Menüs, auch während der Lerninhalt auf Polnisch läuft. Lerninhalte (Szenario-Dialoge, Tutor-Antworten, Vokabeln) bleiben bewusst außen vor, die sind an anderer Stelle schon korrekt zweisprachig (`goalNative`, `replyNative` usw.). An das LLM gerichteter Prompt-Text (z. B. „for a Polish speaker learning German") bleibt bewusst Englisch — das ist maschinenlesbarer Text, keine UI.

**`data-i18n`-Attribute** in `index.html` für alle statischen Strings (Onboarding-Fragen/Optionen, Home-Kacheln, Chat-Werkzeugleiste, Vokabel-Wiederholung, Zusammenfassung). Onboarding-Schritt 1 (Sprachrichtung wählen) bleibt bewusst **zweisprachig gleichzeitig** (DE+PL im selben Text), weil die Muttersprache erst nach dieser Auswahl feststeht — ab Schritt 2 übersetzt `obSelect()` sofort in die aus der Auswahl abgeleitete Muttersprache. `translateUI()` läuft zusätzlich bei jedem `loadHome()` (deckt auch den Sprach-Umschalter-Chip ab).

**Dynamisch erzeugte Strings direkt gefixt** (kein `data-i18n`, da sie Werte einsetzen): Chat-Placeholder, Hinweise-Tooltip, Eingabesprache-Umschalter-Text/Tooltip, Coach-Umschalter-Text, „X fällig"/„Unbegrenzt"-Chips, Fortschrittszeile (geschätztes Niveau/Wortanzahl), Freies-Gespräch-Themenabfrage (lief vorher fälschlich in der **Zielsprache** statt in der Muttersprache — ein Anfänger wurde also auf Polnisch gefragt, worüber er reden möchte, bevor er überhaupt Polnisch kann).

**Weitere echte Bugs beim Audit gefunden (nicht nur Englisch, sondern falsche Sprache generell):**
- `scenario.goal` (Englisch, nur für den LLM-Prompt gedacht) wurde versehentlich auch in der UI angezeigt — Home-Szenario-Karte und Chat-Kopfzeile zeigten z. B. „Order pierogi and ask the price." statt einer verständlichen Beschreibung. Fix: neues Feld `goalNative` (Muttersprache) in allen 10 Szenarien + Freestyle-Szenario ergänzt, UI zeigt jetzt `goalNative` statt `goal`.
- `$("#chat-scenario-title")` zeigte `scenario.title` (Englisch) statt `scenario.titleTarget` (Zielsprache, wie auf der Home-Karte) — korrigiert.
- **`app/basics.mjs`-Lektionstitel waren selbst inkonsistent gemischt:** In `BASICS_PL` (Zielsprache Polnisch, Muttersprache Deutsch sollte für die Titel gelten) waren 10 von 11 Lektionstiteln versehentlich auf Polnisch stehengeblieben (z. B. „Liczby 1–10" statt „Zahlen 1–10") — vermutlich beim Kopieren zwischen den beiden Arrays nicht übersetzt. Umgekehrt hatte `BASICS_DE`s Pronomen-Lektion einen sprachlich gemischten Titel („Ja, ty — sein i haben"). Beide behoben — jetzt konsequent: `BASICS_PL`-Titel komplett Deutsch, `BASICS_DE`-Titel komplett Polnisch.
- Polnische Tooltip-Texte, die ursprünglich `po {sprache}` (z. B. „po niemiecki") verwendeten, waren grammatikalisch falsch (Polnisch braucht hier die adverbiale Form „po niemiecku", nicht die Grundform) — umformuliert auf eine klammer-basierte, kasus-neutrale Form („Tryb ćwiczenia: {lang}. …"), da `title`-Tooltips auf einem Touch-Gerät ohnehin praktisch nie sichtbar werden (kein Hover) und die Grammatik-Perfektion hier niedrige Priorität hat.

**Bewusst nicht angefasst:** die „(dev)"-Buttons (reset day, cancel Pro, AI test) bleiben Englisch/Debug-Werkzeug, nicht Teil der eigentlichen Lernerfahrung. Die (bereits unerreichbare, seit der Paywall-Entfernung tote) Paywall-Sektion wurde trotzdem der Vollständigkeit halber ins Deutsche übersetzt, aber nicht aus dem Code entfernt (wäre ein separates Aufräumen, nicht Teil dieser Anfrage).

**Verifikation:** vollständiger Text-Scan von `index.html` und `app.js` nach der Änderung zeigt keine verbleibenden englischen UI-Strings in erreichbaren Nutzerpfaden mehr; App startet fehlerfrei auf dem Gerät (`i18n.mjs` lädt sauber neben den anderen Modulen, keine Konsolen-/JS-Fehler im Logcat).

**Regression durch dieselbe Änderung, vom Nutzer live gemeldet („das freie Gespräch hat bei meinem Test nicht mehr funktioniert"):** Im `#mode-tutor`-Klick-Handler wurde beim Umstellen der Themen-Abfrage auf die Muttersprache aus `const { target } = currentLangInfo();` versehentlich `const { native } = currentLangInfo();` gemacht — zwei Zeilen weiter griff `buildFreestyleScenario(target.code, topic)` aber weiterhin auf `target` zu, das dadurch nicht mehr im Scope war → `ReferenceError`, der Button-Klick brach lautlos ab, ohne dass ein Szenario startete. Gefunden durch gezielte Nachfrage + Re-Lesen der eigenen letzten Änderung; systematisch nach demselben Muster in allen anderen `currentLangInfo()`/`langInfo()`-Destrukturierungen der Datei gesucht (keine weiteren Fälle gefunden). Fix: `target` wieder mit in die Destrukturierung aufgenommen. Live auf dem Gerät nachgetestet (Logcat zeigte den korrekten `generate()`-Aufruf ans on-device Modell), vom Nutzer bestätigt: „ja, hat funktioniert". **Lektion:** Beim Umbenennen/Ändern einer bestehenden Destrukturierung immer den ganzen Funktions-Scope nach weiteren Verwendungen der alten Variablen absuchen, nicht nur die unmittelbar bearbeitete Zeile.

