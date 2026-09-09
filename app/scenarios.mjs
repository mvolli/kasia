// M0/M1 scenario library. Bidirectional: Polish scenarios for German learners
// (lang: "pl") and German scenarios for Polish learners (lang: "de").
// Each scenario: id, lang, titles, learner goal, tutor persona + opening line,
// demo-mode beats (scripted path). Corrections/vocab live in per-language pools
// below and are picked by `lang`, so every scenario is fully bidirectional-ready.

export const SCENARIOS = [
  {
    id: "food-market",
    lang: "pl",
    title: "Food market in Kraków",
    titleTarget: "Jarmark w Krakowie",
    goal: "Order pierogi and ask the price.",
    goalTarget: "Zamów pierogi i zapytaj o cenę.",
    goalNative: "Bestelle Pierogi und frag nach dem Preis.",
    persona:
      "You play Pani Halina, a friendly market-stall owner in her 50s at a Kraków food market. " +
      "Keep replies short (1-3 sentences), simple Polish (A1/A2), warm and a little chatty.",
    tutorName: "Pani Halina",
    opener: "Dzień dobry! Co mogę pani/panu podać?",
    openerHint: "Guten Tag! Was kann ich Ihnen anbieten?",
    hints: [
      { pl: "zamawiać", de: "to order" },
      { pl: "ile to kosztuje?", de: "how much does it cost?" },
      { pl: "proszę", de: "please / here you go" },
      { pl: "pięć sztuk", de: "five pieces" },
    ],
    beats: [
      {
        text: "Dzień dobry! Co mogę pani/panu podać?",
        hint: "Guten Tag! Was kann ich Ihnen anbieten?",
        advanceOn: ["pierogi", "chci", "chcę", "chce", "proszę", "prosze"],
        nudge: "Może pierogi? Mamy ruskie — z ziemniakami i twarożkiem.",
        nudgeHint: "Wie wäre es mit Pierogi? Wir haben Ruskie – mit Kartoffeln und Quark.",
      },
      {
        text: "Świetny wybór! Ruskie czy z mięsem?",
        hint: "Tolle Wahl! Ruskie oder mit Fleisch?",
        advanceOn: ["ruskie", "mięsem", "miesem", "mięso", "z"],
        nudge: "Ruskie są z ziemniakami i twarożkiem. Lub z mięsem.",
        nudgeHint: "Ruskie haben Kartoffeln und Quark. Oder mit Fleisch.",
      },
      {
        text: "Bardzo dobrze! Ile sztuk pan/pani chce?",
        hint: "Sehr gut! Wie viele Stück möchten Sie?",
        advanceOn: ["pięć", "piec", "siedem", "trzy", "dwa", "osiem", "dziesięć", "sztuk"],
        nudge: "Może pięć sztuk?",
        nudgeHint: "Wie wäre es mit fünf Stück?",
      },
      {
        text: "Pięć sztuk, bardzo dobrze! To będzie dwadzieścia złotych. Płacimy gotówką?",
        hint: "Fünf Stück, sehr gut! Das sind zwanzig Złoty. Zahlen wir bar?",
        advanceOn: ["gotów", "gotow", "kartą", "karta", "tak", "proszę", "prosze"],
        nudge: "Może gotówką, dwadzieścia złotych.",
        nudgeHint: "Wie wäre es bar, zwanzig Złoty.",
      },
      {
        text: "Proszę bardzo! Smacznego! Do następnego!",
        hint: "Gern geschehen! Guten Appetit! Bis zum nächsten Mal!",
        advanceOn: ["dzięk", "dziek", "do", "smacznego", "super", "wspaniale"],
        nudge: "Dziękuję, do następnego!",
        nudgeHint: "Danke, bis zum nächsten Mal!",
        final: true,
      },
    ],
    byeText: "Dziękuję, do następnego!",
    byeHint: "Danke, bis zum nächsten Mal!",
  },
  {
    id: "directions-warsaw",
    lang: "pl",
    title: "Asking for directions in Warsaw",
    titleTarget: "Pytanie o drogę w Warszawie",
    goal: "Ask how to get to the central station.",
    goalTarget: "Zapytaj, jak dojść do dworca centralnego.",
    goalNative: "Frag nach dem Weg zum Hauptbahnhof.",
    persona:
      "You play Pan Marek, a casually helpful but busy passer-by in Warsaw. " +
      "Keep replies short (1-3 sentences), simple Polish (A1/A2).",
    tutorName: "Pan Marek",
    opener: "Dzień dobry. Mogę pomóc?",
    openerHint: "Guten Tag. Kann ich helfen?",
    hints: [
      { pl: "w lewo / w prawo", de: "left / right" },
      { pl: "prosto", de: "straight ahead" },
      { pl: "dworzec centralny", de: "central station" },
      { pl: "ile minut?", de: "how many minutes?" },
    ],
    beats: [
      {
        text: "Dzień dobry. Mogę pomóc?",
        hint: "Guten Tag. Kann ich helfen?",
        advanceOn: ["dworzec", "centralny", "station", "stacja", "jak", "dojdę", "dojde", "where"],
        nudge: "Może pyta pan/pani o dworzec centralny?",
        nudgeHint: "Meinen Sie den Centralbahnhof?",
      },
      {
        text: "Na dworzec centralny? Prosto, a potem w lewo przy kościele.",
        hint: "Zum Centralbahnhof? Geradeaus, dann links an der Kirche.",
        advanceOn: ["prosto", "lewo", "dalej", "right", "ile", "minut", "how long", "how far"],
        nudge: "Prosto, a potem w lewo.",
        nudgeHint: "Geradeaus, dann links.",
      },
      {
        text: "To jest dziesięć minut pieszo. Autobus jedzie co pięć minut.",
        hint: "Das sind zehn Minuten zu Fuß. Der Bus fährt alle fünf Minuten.",
        advanceOn: ["autob", "bus", "minut", "ok", "dobrze", "dzięki", "dzieki", "super"],
        nudge: "Autobus jedzie co pięć minut.",
        nudgeHint: "Der Bus fährt alle fünf Minuten.",
      },
      {
        text: "Mam nadzieję, że pomogłem. Miłego dnia!",
        hint: "Ich hoffe, ich konnte helfen. Schönen Tag noch!",
        advanceOn: ["dzięk", "dziek", "do", "fajnie", "super", "wspaniale"],
        nudge: "Do widzenia!",
        nudgeHint: "Auf Wiedersehen!",
        final: true,
      },
    ],
    byeText: "Do widzenia!",
    byeHint: "Auf Wiedersehen!",
  },
  {
    id: "bakery-berlin",
    lang: "de",
    title: "Bakery in Berlin",
    titleTarget: "Bäckerei in Berlin",
    goal: "Order bread rolls and pay.",
    goalTarget: "Bestelle Brötchen und bezahle.",
    goalNative: "Zamów bułki i zapłać.",
    persona:
      "You play Frau Schmidt, a friendly bakery seller in her 40s in Berlin. " +
      "Keep replies short (1-3 sentences), simple German (A1/A2), warm and a little chatty. " +
      "Use „Sie” (formal) with the customer.",
    tutorName: "Frau Schmidt",
    opener: "Guten Tag! Was darf es sein?",
    openerHint: "Dzień dobry! Co podać?",
    hints: [
      { de: "bestellen", pl: "zamawiać" },
      { de: "Was kostet das?", pl: "ile to kosztuje?" },
      { de: "bitte", pl: "proszę" },
      { de: "fünf Stück", pl: "pięć sztuk" },
    ],
    beats: [
      {
        text: "Guten Tag! Was darf es sein?",
        hint: "Dzień dobry! Co podać?",
        advanceOn: ["brötchen", "brotchen", "möchte", "mochte", "hätte", "hatte", "bitte"],
        nudge: "Vielleicht Brötchen? Wir haben frische Mohnbrötchen.",
        nudgeHint: "Może bułki? Mamy świeże bułki z makiem.",
      },
      {
        text: "Gerne! Mit Mohn oder Sesam?",
        hint: "Chętnie! Z makiem czy z sezamem?",
        advanceOn: ["mohn", "sesam", "mit", "und"],
        nudge: "Mohn oder Sesam — was möchten Sie?",
        nudgeHint: "Mak czy sezam — co pan/pani chce?",
      },
      {
        text: "Sehr gut! Wie viele Stück möchten Sie?",
        hint: "Bardzo dobrze! Ile sztuk pan/pani chce?",
        advanceOn: ["fünf", "funf", "sieben", "drei", "zwei", "acht", "zehn", "stück", "stuck"],
        nudge: "Vielleicht fünf Stück?",
        nudgeHint: "Może pięć sztuk?",
      },
      {
        text: "Fünf Stück, sehr gern! Das macht drei Euro fünfzig. Zahlen Sie bar oder mit Karte?",
        hint: "Pięć sztuk, bardzo chętnie! To będzie trzy euro pięćdziesiąt. Płaci pan/pani gotówką czy kartą?",
        advanceOn: ["bar", "karte", "karta", "ja", "bitte"],
        nudge: "Bar oder mit Karte, drei Euro fünfzig.",
        nudgeHint: "Gotówką czy kartą, trzy euro pięćdziesiąt.",
      },
      {
        text: "Bitte schön! Einen schönen Tag noch!",
        hint: "Proszę bardzo! Miłego dnia!",
        advanceOn: ["dank", "tschüss", "tschuss", "wiedersehen", "super", "toll"],
        nudge: "Danke schön, bis bald!",
        nudgeHint: "Dziękuję, do zobaczenia!",
        final: true,
      },
    ],
    byeText: "Danke schön, bis bald!",
    byeHint: "Dziękuję, do zobaczenia!",
  },
  {
    id: "directions-munich",
    lang: "de",
    title: "Asking for directions in Munich",
    titleTarget: "Nach dem Weg fragen in München",
    goal: "Ask how to get to the main train station.",
    goalTarget: "Frag nach dem Weg zum Hauptbahnhof.",
    goalNative: "Zapytaj, jak dojść do dworca głównego.",
    persona:
      "You play Herr Weber, a casually helpful but busy passer-by in Munich. " +
      "Keep replies short (1-3 sentences), simple German (A1/A2). Use „Sie” with strangers.",
    tutorName: "Herr Weber",
    opener: "Guten Tag. Kann ich Ihnen helfen?",
    openerHint: "Dzień dobry. Czy mogę pomóc?",
    hints: [
      { de: "links / rechts", pl: "w lewo / w prawo" },
      { de: "geradeaus", pl: "prosto" },
      { de: "der Hauptbahnhof", pl: "dworzec główny" },
      { de: "wie viele Minuten?", pl: "ile minut?" },
    ],
    beats: [
      {
        text: "Guten Tag. Kann ich Ihnen helfen?",
        hint: "Dzień dobry. Czy mogę pomóc?",
        advanceOn: ["hauptbahnhof", "bahnhof", "wie komme ich", "station", "wo ist"],
        nudge: "Suchen Sie vielleicht den Hauptbahnhof?",
        nudgeHint: "Szuka pan/pani dworca głównego?",
      },
      {
        text: "Zum Hauptbahnhof? Geradeaus, dann links bei der Kirche.",
        hint: "Do dworca głównego? Prosto, a potem w lewo przy kościele.",
        advanceOn: ["geradeaus", "links", "rechts", "weiter", "wie lange", "wie weit"],
        nudge: "Geradeaus, dann links.",
        nudgeHint: "Prosto, a potem w lewo.",
      },
      {
        text: "Das sind zehn Minuten zu Fuß. Der Bus fährt alle fünf Minuten.",
        hint: "To jest dziesięć minut pieszo. Autobus jedzie co pięć minut.",
        advanceOn: ["bus", "minuten", "ok", "gut", "danke", "super"],
        nudge: "Der Bus fährt alle fünf Minuten.",
        nudgeHint: "Autobus jedzie co pięć minut.",
      },
      {
        text: "Ich hoffe, ich konnte helfen. Schönen Tag noch!",
        hint: "Mam nadzieję, że pomogłem. Miłego dnia!",
        advanceOn: ["dank", "tschüss", "tschuss", "wiedersehen", "super", "toll"],
        nudge: "Auf Wiedersehen!",
        nudgeHint: "Do widzenia!",
        final: true,
      },
    ],
    byeText: "Auf Wiedersehen!",
    byeHint: "Do widzenia!",
  },
  {
    id: "doctor-visit",
    lang: "pl",
    title: "At the doctor's office",
    titleTarget: "Wizyta u lekarza",
    goal: "Describe your symptoms and get advice.",
    goalTarget: "Opisz objawy i uzyskaj poradę.",
    goalNative: "Beschreibe deine Beschwerden und hol dir Rat.",
    persona:
      "You play Dr. Nowak, a calm, professional general practitioner. " +
      "Keep replies short (1-3 sentences), simple Polish (A2).",
    tutorName: "Dr. Nowak",
    opener: "Dzień dobry! Co panu/pani dolega?",
    openerHint: "Guten Tag! Was fehlt Ihnen?",
    hints: [
      { pl: "boli mnie …", de: "… tut mir weh" },
      { pl: "recepta", de: "Rezept" },
      { pl: "gorączka", de: "Fieber" },
      { pl: "od kiedy?", de: "seit wann?" },
    ],
    beats: [
      {
        text: "Dzień dobry! Co panu/pani dolega?",
        hint: "Guten Tag! Was fehlt Ihnen?",
        advanceOn: ["boli", "głow", "gardło", "gorączk", "kaszl", "brzuch"],
        nudge: "Może boli pana/panią głowa albo gardło?",
        nudgeHint: "Haben Sie vielleicht Kopf- oder Halsschmerzen?",
      },
      {
        text: "Rozumiem. Od kiedy pan/pani się tak czuje?",
        hint: "Ich verstehe. Seit wann fühlen Sie sich so?",
        advanceOn: ["dzień", "dni", "tydzień", "wczoraj", "dzisiaj"],
        nudge: "Od jak dawna to trwa?",
        nudgeHint: "Seit wann ist das so?",
      },
      {
        text: "Rozumiem. Proszę dużo pić i odpocząć. Wypiszę receptę.",
        hint: "Ich verstehe. Bitte trinken Sie viel und ruhen Sie sich aus. Ich verschreibe Ihnen ein Rezept.",
        advanceOn: ["recept", "lek", "tabletk", "dziękuję", "dzięki"],
        nudge: "Potrzebuje pan/pani receptę na leki?",
        nudgeHint: "Brauchen Sie ein Rezept für Medikamente?",
      },
      {
        text: "Proszę bardzo, tu jest recepta. Niech pan/pani szybko wyzdrowieje!",
        hint: "Bitte schön, hier ist das Rezept. Gute Besserung!",
        advanceOn: ["dzięk", "do widzenia", "super"],
        nudge: "Do widzenia, niech pan/pani szybko wyzdrowieje!",
        nudgeHint: "Auf Wiedersehen, gute Besserung!",
        final: true,
      },
    ],
    byeText: "Do widzenia, niech pan/pani szybko wyzdrowieje!",
    byeHint: "Auf Wiedersehen, gute Besserung!",
  },
  {
    id: "renting-apartment",
    lang: "pl",
    title: "Renting an apartment",
    titleTarget: "Wynajem mieszkania",
    goal: "Ask about rent, deposit, and move-in date.",
    goalTarget: "Zapytaj o czynsz, kaucję i termin wprowadzki.",
    goalNative: "Frag nach Miete, Kaution und Einzugstermin.",
    persona:
      "You play Pani Kowalska, a businesslike but friendly landlady showing an apartment. " +
      "Keep replies short (1-3 sentences), simple Polish (A2/B1).",
    tutorName: "Pani Kowalska",
    opener: "Dzień dobry, interesuje pana/panią to mieszkanie?",
    openerHint: "Guten Tag, interessieren Sie sich für diese Wohnung?",
    hints: [
      { pl: "czynsz", de: "Miete" },
      { pl: "kaucja", de: "Kaution" },
      { pl: "umowa najmu", de: "Mietvertrag" },
      { pl: "wprowadzka", de: "Einzug" },
    ],
    beats: [
      {
        text: "Dzień dobry, interesuje pana/panią to mieszkanie?",
        hint: "Guten Tag, interessieren Sie sich für diese Wohnung?",
        advanceOn: ["czynsz", "ile", "kosztuje", "cena"],
        nudge: "Chce pan/pani zapytać o czynsz?",
        nudgeHint: "Möchten Sie nach der Miete fragen?",
      },
      {
        text: "Czynsz to tysiąc pięćset złotych miesięcznie plus media.",
        hint: "Die Miete beträgt tausendfünfhundert Złoty im Monat plus Nebenkosten.",
        advanceOn: ["kaucj", "depozyt", "zaliczk"],
        nudge: "Pyta pan/pani o kaucję?",
        nudgeHint: "Fragen Sie nach der Kaution?",
      },
      {
        text: "Kaucja to jeden czynsz, czyli tysiąc pięćset złotych.",
        hint: "Die Kaution beträgt eine Monatsmiete, also tausendfünfhundert Złoty.",
        advanceOn: ["kiedy", "wprowadzić", "termin"],
        nudge: "Chce pan/pani znać termin wprowadzki?",
        nudgeHint: "Möchten Sie den Einzugstermin wissen?",
      },
      {
        text: "Może się pan/pani wprowadzić od pierwszego przyszłego miesiąca. Świetnie! Przygotuję umowę najmu.",
        hint: "Sie können ab dem Ersten nächsten Monats einziehen. Sehr gut! Ich bereite den Mietvertrag vor.",
        advanceOn: ["dzięk", "biorę", "super", "umowa"],
        nudge: "Bierze pan/pani to mieszkanie?",
        nudgeHint: "Nehmen Sie diese Wohnung?",
        final: true,
      },
    ],
    byeText: "Dziękuję, do zobaczenia przy podpisaniu umowy!",
    byeHint: "Danke, bis zur Vertragsunterschrift!",
  },
  {
    id: "family-gathering",
    lang: "pl",
    title: "Family gathering small talk",
    titleTarget: "Spotkanie rodzinne",
    goal: "Make small talk about the weather and everyday life.",
    goalTarget: "Porozmawiaj o pogodzie i codziennym życiu.",
    goalNative: "Führe Smalltalk über das Wetter und den Alltag.",
    persona:
      "You play Ciocia Ania, a warm, chatty aunt at a family gathering. " +
      "Keep replies short (1-3 sentences), simple Polish (A1/A2).",
    tutorName: "Ciocia Ania",
    opener: "Cześć! Jak się masz? Piękna dzisiaj pogoda, prawda?",
    openerHint: "Hallo! Wie geht's dir? Heute ist schönes Wetter, nicht wahr?",
    hints: [
      { pl: "co słychać?", de: "was gibt's Neues?" },
      { pl: "pogoda", de: "Wetter" },
      { pl: "weekend", de: "Wochenende" },
      { pl: "miło było porozmawiać", de: "es war schön zu reden" },
    ],
    beats: [
      {
        text: "Cześć! Jak się masz? Piękna dzisiaj pogoda, prawda?",
        hint: "Hallo! Wie geht's dir? Heute ist schönes Wetter, nicht wahr?",
        advanceOn: ["dobrze", "świetnie", "pogoda", "słońce", "ciepło", "zimno"],
        nudge: "Podoba ci się dzisiejsza pogoda?",
        nudgeHint: "Gefällt dir das heutige Wetter?",
      },
      {
        text: "Cieszę się! A co słychać w pracy albo w szkole?",
        hint: "Freut mich! Und was gibt's Neues bei der Arbeit oder Schule?",
        advanceOn: ["praca", "szkoł", "dobrze", "ciężko", "fajnie"],
        nudge: "Opowiedz mi coś o pracy albo szkole.",
        nudgeHint: "Erzähl mir etwas über die Arbeit oder Schule.",
      },
      {
        text: "To brzmi ciekawie! Masz jakieś plany na weekend?",
        hint: "Das klingt interessant! Hast du Pläne fürs Wochenende?",
        advanceOn: ["weekend", "plan", "odpoczywam", "rodzina", "spacer"],
        nudge: "Co planujesz na weekend?",
        nudgeHint: "Was planst du fürs Wochenende?",
      },
      {
        text: "Super! Miło było porozmawiać.",
        hint: "Toll! Es war schön, mit dir zu reden.",
        advanceOn: ["dzięk", "do zobaczenia", "miło"],
        nudge: "Do zobaczenia, trzymaj się!",
        nudgeHint: "Bis bald, mach's gut!",
        final: true,
      },
    ],
    byeText: "Do zobaczenia, trzymaj się!",
    byeHint: "Bis bald, mach's gut!",
  },
  {
    id: "arzt-besuch",
    lang: "de",
    title: "At the doctor's office",
    titleTarget: "Beim Arzt",
    goal: "Describe your symptoms and get advice.",
    goalTarget: "Beschreibe deine Symptome und hol dir einen Rat.",
    goalNative: "Opisz swoje objawy i uzyskaj poradę.",
    persona:
      "You play Dr. Fischer, a calm, professional Hausarzt (GP). " +
      "Keep replies short (1-3 sentences), simple German (A2). Use „Sie” with the patient.",
    tutorName: "Dr. Fischer",
    opener: "Guten Tag! Was fehlt Ihnen?",
    openerHint: "Dzień dobry! Co panu/pani dolega?",
    hints: [
      { de: "es tut mir weh", pl: "boli mnie" },
      { de: "das Rezept", pl: "recepta" },
      { de: "das Fieber", pl: "gorączka" },
      { de: "seit wann?", pl: "od kiedy?" },
    ],
    beats: [
      {
        text: "Guten Tag! Was fehlt Ihnen?",
        hint: "Dzień dobry! Co panu/pani dolega?",
        advanceOn: ["kopf", "hals", "fieber", "husten", "bauch", "schmerz"],
        nudge: "Haben Sie vielleicht Kopf- oder Halsschmerzen?",
        nudgeHint: "Może boli pana/panią głowa albo gardło?",
      },
      {
        text: "Ich verstehe. Seit wann fühlen Sie sich so?",
        hint: "Rozumiem. Od kiedy pan/pani się tak czuje?",
        advanceOn: ["tag", "tage", "woche", "gestern", "heute"],
        nudge: "Seit wann ist das so?",
        nudgeHint: "Od jak dawna to trwa?",
      },
      {
        text: "Ich verstehe. Bitte trinken Sie viel und ruhen Sie sich aus. Ich verschreibe Ihnen ein Rezept.",
        hint: "Rozumiem. Proszę dużo pić i odpocząć. Wypiszę receptę.",
        advanceOn: ["rezept", "medikament", "tablette", "danke"],
        nudge: "Brauchen Sie ein Rezept für Medikamente?",
        nudgeHint: "Potrzebuje pan/pani receptę na leki?",
      },
      {
        text: "Bitte schön, hier ist das Rezept. Gute Besserung!",
        hint: "Proszę bardzo, tu jest recepta. Niech pan/pani szybko wyzdrowieje!",
        advanceOn: ["dank", "wiedersehen", "super"],
        nudge: "Auf Wiedersehen, gute Besserung!",
        nudgeHint: "Do widzenia, niech pan/pani szybko wyzdrowieje!",
        final: true,
      },
    ],
    byeText: "Auf Wiedersehen, gute Besserung!",
    byeHint: "Do widzenia, szybkiego powrotu do zdrowia!",
  },
  {
    id: "job-interview",
    lang: "de",
    title: "Job interview",
    titleTarget: "Vorstellungsgespräch",
    goal: "Introduce yourself and answer basic interview questions.",
    goalTarget: "Stell dich vor und beantworte einfache Fragen im Gespräch.",
    goalNative: "Przedstaw się i odpowiedz na podstawowe pytania rozmowy kwalifikacyjnej.",
    persona:
      "You play Frau Klein, a friendly but professional HR manager conducting a job interview. " +
      "Keep replies short (1-3 sentences), simple German (A2/B1). Use „Sie” with the candidate.",
    tutorName: "Frau Klein",
    opener: "Guten Tag, schön dass Sie da sind. Erzählen Sie mir etwas über sich.",
    openerHint: "Dzień dobry, miło że pan/pani jest. Proszę opowiedzieć coś o sobie.",
    hints: [
      { de: "die Erfahrung", pl: "doświadczenie" },
      { de: "die Stelle", pl: "stanowisko" },
      { de: "anfangen", pl: "zacząć" },
      { de: "das Vorstellungsgespräch", pl: "rozmowa kwalifikacyjna" },
    ],
    beats: [
      {
        text: "Guten Tag, schön dass Sie da sind. Erzählen Sie mir etwas über sich.",
        hint: "Dzień dobry, miło że pan/pani jest. Proszę opowiedzieć coś o sobie.",
        advanceOn: ["heiße", "bin", "komme", "arbeite", "jahre"],
        nudge: "Wie heißen Sie und woher kommen Sie?",
        nudgeHint: "Jak się pan/pani nazywa i skąd pan/pani pochodzi?",
      },
      {
        text: "Interessant! Warum möchten Sie bei uns arbeiten?",
        hint: "Ciekawe! Dlaczego chce pan/pani u nas pracować?",
        advanceOn: ["möchte", "interessiere", "erfahrung", "gerne"],
        nudge: "Warum interessiert Sie diese Stelle?",
        nudgeHint: "Dlaczego interesuje pana/panią ta posada?",
      },
      {
        text: "Sehr gut. Wann könnten Sie anfangen?",
        hint: "Bardzo dobrze. Kiedy mógłby/mogłaby pan/pani zacząć?",
        advanceOn: ["monat", "sofort", "wochen", "kann"],
        nudge: "Wann könnten Sie starten?",
        nudgeHint: "Kiedy mógłby/mogłaby pan/pani zacząć?",
      },
      {
        text: "Perfekt, wir melden uns bei Ihnen. Vielen Dank für das Gespräch!",
        hint: "Świetnie, odezwiemy się do pana/pani. Dziękuję za rozmowę!",
        advanceOn: ["dank", "wiedersehen", "freue"],
        nudge: "Vielen Dank für das Gespräch, auf Wiedersehen!",
        nudgeHint: "Dziękuję za rozmowę, do widzenia!",
        final: true,
      },
    ],
    byeText: "Vielen Dank für das Gespräch, auf Wiedersehen!",
    byeHint: "Dziękuję za rozmowę, do widzenia!",
  },
  {
    id: "renting-wohnung",
    lang: "de",
    title: "Renting an apartment",
    titleTarget: "Wohnung mieten",
    goal: "Ask about rent, deposit, and move-in date.",
    goalTarget: "Frag nach Miete, Kaution und Einzugstermin.",
    goalNative: "Zapytaj o czynsz, kaucję i termin wprowadzki.",
    persona:
      "You play Herr Braun, a businesslike but friendly landlord showing an apartment. " +
      "Keep replies short (1-3 sentences), simple German (A2/B1). Use „Sie” with the tenant.",
    tutorName: "Herr Braun",
    opener: "Guten Tag, interessieren Sie sich für die Wohnung?",
    openerHint: "Dzień dobry, interesuje pana/panią to mieszkanie?",
    hints: [
      { de: "die Miete", pl: "czynsz" },
      { de: "die Kaution", pl: "kaucja" },
      { de: "der Mietvertrag", pl: "umowa najmu" },
      { de: "der Einzug", pl: "wprowadzka" },
    ],
    beats: [
      {
        text: "Guten Tag, interessieren Sie sich für die Wohnung?",
        hint: "Dzień dobry, interesuje pana/panią to mieszkanie?",
        advanceOn: ["miete", "kostet", "wie viel"],
        nudge: "Möchten Sie nach der Miete fragen?",
        nudgeHint: "Chce pan/pani zapytać o czynsz?",
      },
      {
        text: "Die Miete beträgt sechshundert Euro im Monat plus Nebenkosten.",
        hint: "Czynsz to sześćset euro miesięcznie plus opłaty dodatkowe.",
        advanceOn: ["kaution", "depot"],
        nudge: "Fragen Sie nach der Kaution?",
        nudgeHint: "Pyta pan/pani o kaucję?",
      },
      {
        text: "Die Kaution beträgt eine Monatsmiete, also sechshundert Euro.",
        hint: "Kaucja to jeden czynsz, czyli sześćset euro.",
        advanceOn: ["wann", "einziehen", "termin"],
        nudge: "Möchten Sie den Einzugstermin wissen?",
        nudgeHint: "Chce pan/pani znać termin wprowadzki?",
      },
      {
        text: "Sie können ab dem Ersten nächsten Monats einziehen. Sehr gut! Ich bereite den Mietvertrag vor.",
        hint: "Może się pan/pani wprowadzić od pierwszego przyszłego miesiąca. Świetnie! Przygotuję umowę najmu.",
        advanceOn: ["dank", "nehme", "vertrag"],
        nudge: "Nehmen Sie diese Wohnung?",
        nudgeHint: "Bierze pan/pani to mieszkanie?",
        final: true,
      },
    ],
    byeText: "Danke, bis zur Vertragsunterschrift!",
    byeHint: "Dziękuję, do zobaczenia przy podpisaniu umowy!",
  },
];

// -------- free conversation (no fixed script) --------
// Built on demand from a target language + an optional user-supplied topic.
export function buildFreestyleScenario(lang, topic) {
  const isDe = lang === "de";
  const cleanTopic = topic && String(topic).trim() ? String(topic).trim().slice(0, 120) : "";
  return {
    id: isDe ? "freestyle-de" : "freestyle-pl",
    lang: isDe ? "de" : "pl",
    freestyle: true,
    title: "Free conversation",
    titleTarget: isDe ? "Freies Gespräch" : "Swobodna rozmowa",
    goal: cleanTopic || "Talk about anything you like.",
    goalTarget: cleanTopic || (isDe ? "Sprich über alles, was du willst." : "Porozmawiaj o czym chcesz."),
    goalNative: cleanTopic || (isDe ? "Porozmawiaj o czym chcesz." : "Sprich über alles, was du willst."),
    persona: isDe
      ? "You are Anna, a friendly, patient native German conversation partner (not a strict teacher). " +
        "Chat naturally about whatever the learner brings up, simple sentences (A2/B1), ask follow-up questions to keep it going. " +
        "Never refuse a topic; steer gently back to German if the learner drifts into English."
      : "You are Ania, a friendly, patient native Polish conversation partner (not a strict teacher). " +
        "Chat naturally about whatever the learner brings up, simple sentences (A2/B1), ask follow-up questions to keep it going. " +
        "Never refuse a topic; steer gently back to Polish if the learner drifts into English.",
    tutorName: isDe ? "Anna" : "Ania",
    opener: isDe ? "Hallo! Worüber möchtest du heute sprechen?" : "Cześć! O czym chcesz dzisiaj porozmawiać?",
    openerHint: isDe ? "Cześć! O czym chcesz dzisiaj porozmawiać?" : "Hallo! Worüber möchtest du heute sprechen?",
    hints: [],
    beats: [],
    byeText: isDe ? "Tschüss! Bis zum nächsten Mal." : "Do widzenia! Do następnego razu.",
    byeHint: isDe ? "Do widzenia! Do następnego razu." : "Tschüss! Bis zum nächsten Mal.",
  };
}

// -------- per-target-language correction rules (demo/offline mode) --------
// Field names are language-neutral: `corrected` is always in the TARGET
// language, `noteNative` is always in the learner's NATIVE language.
export const CORRECTION_RULES_PL = [
  {
    re: /\bchci\b/i,
    corrected: "Chciałbym",
    noteNative: "„Chciałbym …“ = I would like … (höflich). „Chci“ existiert so nicht im Polnischen.",
  },
  {
    re: /\bcost(s)?\b/i,
    corrected: "kosztuje",
    noteNative: "Polnisch: „Ile to kosztuje?“ (Wie viel kostet das?). „Cost“ ist Englisch.",
  },
  {
    re: /\b(price)\b/i,
    corrected: "cena",
    noteNative: "Polnisch: „cena“ (der Preis). „Ile to kosztuje?“ = wie viel kostet das?",
  },
  {
    re: /\b(thanks?|thank you|thank you very much)\b/i,
    corrected: "Dziękuję",
    noteNative: "Polnisch: „Dziękuję“ (danke). Mische nicht Englisch ein – bleibe im Polnischen.",
  },
  {
    re: /\bmoney\b/i,
    corrected: "pieniądze",
    noteNative: "Polnisch: „pieniądze“ (Geld).",
  },
  {
    re: /\b(good (morning|day|evening))\b/i,
    corrected: "Dzień dobry",
    noteNative: "Polnisch: „Dzień dobry“ (guten Tag) – die Standard-Begrüßung.",
  },
  {
    re: /\bwhere (is|are|do)\b/i,
    corrected: "Gdzie (jest)?",
    noteNative: "Polnisch: „Gdzie jest …?“ (Wo ist …?).",
  },
  {
    re: /\bhow (to|do) get\b/i,
    corrected: "Jak dojść do …?",
    noteNative: "Polnisch: „Jak dojść do …?“ (Wie komme ich zu …?).",
  },
  {
    re: /\b(bye|goodbye)\b/i,
    corrected: "Do widzenia",
    noteNative: "Polnisch: „Do widzenia“ (auf Wiedersehen) – oder locker „do zobaczenia“.",
  },
];

// Common Polish-speaker slips when learning German: English creeping in, plus
// a few classic PL→DE beginner errors (formality, "möchte", articles).
export const CORRECTION_RULES_DE = [
  {
    re: /\bcost(s)?\b/i,
    corrected: "kostet",
    noteNative: "Po niemiecku: „Was kostet das?” (ile to kosztuje?). „Cost” to angielski słowo.",
  },
  {
    re: /\b(price)\b/i,
    corrected: "der Preis",
    noteNative: "Po niemiecku: „der Preis” (cena).",
  },
  {
    re: /\b(thanks?|thank you|thank you very much)\b/i,
    corrected: "Danke",
    noteNative: "Po niemiecku: „Danke” (dziękuję). Nie mieszaj angielskiego do niemieckiego zdania.",
  },
  {
    re: /\bmoney\b/i,
    corrected: "das Geld",
    noteNative: "Po niemiecku: „das Geld” (pieniądze).",
  },
  {
    re: /\b(good (morning|day|evening))\b/i,
    corrected: "Guten Tag",
    noteNative: "Po niemiecku: „Guten Tag” (dzień dobry) – standardowe powitanie.",
  },
  {
    re: /\bwhere (is|are|do)\b/i,
    corrected: "Wo ist…?",
    noteNative: "Po niemiecku: „Wo ist …?” (gdzie jest …?).",
  },
  {
    re: /\bhow (to|do) get\b/i,
    corrected: "Wie komme ich zu…?",
    noteNative: "Po niemiecku: „Wie komme ich zu …?” (jak dojść do …?).",
  },
  {
    re: /\b(bye|goodbye)\b/i,
    corrected: "Auf Wiedersehen",
    noteNative: "Po niemiecku: „Auf Wiedersehen” – w sklepie/na ulicy grzeczniej niż „Tschüss”.",
  },
  {
    re: /\b(chcę|chce|chcialbym|chciałbym)\b/i,
    corrected: "Ich möchte",
    noteNative: "„Ich möchte …” = chciałbym/chciałabym (grzecznie). Nie mieszaj polskiego do niemieckiego zdania.",
  },
  {
    re: /\bi (am|is)\b/i,
    corrected: "Ich bin",
    noteNative: "Po niemiecku: „Ich bin …” (jestem …).",
  },
];

// -------- per-target-language vocab pools (demo/offline mode) --------
// Every entry always carries both `pl` and `de` — the app picks the target
// word to show/speak and the native word as the gloss based on the learner's
// chosen direction, so the same shape works for both scenario families.
export const VOCAB_PL = [
  { pl: "ile to kosztuje?", de: "was kostet das?" },
  { pl: "proszę", de: "bitte" },
  { pl: "dziękuję", de: "danke" },
  { pl: "w lewo / w prawo", de: "links / rechts" },
  { pl: "prosto", de: "geradeaus" },
  { pl: "dworzec centralny", de: "der Hauptbahnhof" },
];

export const VOCAB_DE = [
  { de: "was kostet das?", pl: "ile to kosztuje?" },
  { de: "bitte", pl: "proszę" },
  { de: "danke", pl: "dziękuję" },
  { de: "links / rechts", pl: "w lewo / w prawo" },
  { de: "geradeaus", pl: "prosto" },
  { de: "der Hauptbahnhof", pl: "dworzec główny" },
];

// Scene words the summary screen offers to save (target-language forms —
// matched against the tutor's own replies during the conversation).
export const SUMMARY_WORDS_PL = [
  "pierogi", "ile to kosztuje", "dzisiejszy", "wędzone", "słone", "smakuje",
  "dworzec centralny", "autobus", "w lewo", "w prawo", "prosto", "dziękuję", "proszę",
];

export const SUMMARY_WORDS_DE = [
  "brötchen", "was kostet das", "mohn", "sesam", "stück", "schmeckt",
  "hauptbahnhof", "bus", "links", "rechts", "geradeaus", "danke", "bitte",
];

export function getScenario(id, opts = {}) {
  if (id === "freestyle-pl" || id === "freestyle-de") {
    return buildFreestyleScenario(id === "freestyle-de" ? "de" : "pl", opts.topic);
  }
  return SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0];
}

export function scenariosForLang(lang) {
  return SCENARIOS.filter((s) => s.lang === lang);
}
