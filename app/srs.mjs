// Minimal FSRS-style spaced-repetition scheduler for the vocabulary book.
// Pure functions only (no DOM, no storage) — testable headlessly with plain
// `node`. Not the full FSRS algorithm (that's fitted from millions of real
// review logs); this is a deliberately small approximation of the same
// shape: stability (days to ~90% recall) + difficulty (1..10), adjusted by
// a 4-button grade, same UX as Anki/FSRS.

export const RATING = { AGAIN: 1, HARD: 2, GOOD: 3, EASY: 4 };

const DAY_MS = 86400000;

export function newCard(now = Date.now()) {
  return {
    stability: 1, // days until ~90% recall probability (approximation)
    difficulty: 5, // 1 (easiest) .. 10 (hardest)
    reps: 0,
    lapses: 0,
    due: now, // epoch ms — new cards are due immediately
    last: null,
  };
}

// growth factor per rating, tempered by current difficulty below
const GROWTH = { [RATING.HARD]: 1.2, [RATING.GOOD]: 2.5, [RATING.EASY]: 3.6 };

export function review(card, rating, now = Date.now()) {
  const c = { ...card };
  c.last = now;

  if (rating === RATING.AGAIN) {
    c.lapses += 1;
    c.stability = Math.max(1, c.stability * 0.5);
    c.difficulty = Math.min(10, c.difficulty + 2);
    c.due = now + DAY_MS; // relearn tomorrow
    return c;
  }

  c.reps += 1;
  if (rating === RATING.HARD) c.difficulty = Math.min(10, c.difficulty + 1);
  else if (rating === RATING.EASY) c.difficulty = Math.max(1, c.difficulty - 1);

  // harder cards grow their interval more slowly than easy ones
  const difficultyFactor = Math.max(0.4, 1 - (c.difficulty - 5) * 0.06);
  const growth = (GROWTH[rating] || GROWTH[RATING.GOOD]) * difficultyFactor;
  c.stability = Math.max(1, c.stability * growth);
  c.due = now + Math.round(c.stability) * DAY_MS;
  return c;
}

export function isDue(card, now = Date.now()) {
  return card.due <= now;
}
