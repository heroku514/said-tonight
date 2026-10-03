export type Deck = "kids" | "family" | "seniors";

export const DECKS: Record<Deck, string[]> = {
  kids: [
    "What made you laugh today?",
    "Which animal would you be?",
    "What game should we play next?",
    "Who helped you today?",
    "What color feels happy?",
    "What snack should we invent?",
    "What was the best part of today?",
    "What should we draw later?",
  ],
  family: [
    "What should we cook next?",
    "Where should we walk this week?",
    "What family story should we retell?",
    "Who do we want to call?",
    "What should we thank someone for?",
    "What plan should we keep?",
    "What mess can we fix together?",
    "What song should we hum?",
  ],
  seniors: [
    "What job did you love?",
    "What song do you still know?",
    "What place do you miss?",
    "Who taught you something useful?",
    "What meal do you still make?",
    "What advice would you repeat?",
    "What made today easier?",
    "What name should we remember?",
  ],
};

export type Entry = {
  id: string;
  question: string;
  answer: string;
};

export type SavedBook = {
  deck: Deck;
  index: number;
  entries: Entry[];
  page: number;
};

export const EMPTY_BOOK: SavedBook = {
  deck: "kids",
  index: 0,
  entries: [],
  page: 0,
};

const DECK_NAMES: Deck[] = ["kids", "family", "seniors"];

export function questionAt(book: SavedBook): string {
  const deck = DECKS[book.deck];
  const index = book.index >= 0 && book.index < deck.length ? book.index : 0;
  return deck[index];
}

export function parseBook(raw: string | null): SavedBook {
  if (!raw) return EMPTY_BOOK;
  try {
    const data = JSON.parse(raw) as Partial<SavedBook>;
    const deck: Deck = DECK_NAMES.includes(data.deck as Deck) ? (data.deck as Deck) : "kids";
    const deckLength = DECKS[deck].length;
    const index = typeof data.index === "number" && data.index >= 0 && data.index < deckLength ? data.index : 0;
    const entries = Array.isArray(data.entries)
      ? data.entries.filter(
          (entry): entry is Entry =>
            !!entry && typeof entry.id === "string" && typeof entry.question === "string" && typeof entry.answer === "string",
        )
      : [];
    const page = entries.length === 0 ? 0 : typeof data.page === "number" && data.page >= 0 && data.page < entries.length ? data.page : 0;
    return { deck, index, entries, page };
  } catch {
    return EMPTY_BOOK;
  }
}

export function moveQuestion(book: SavedBook, delta: -1 | 1): { book: SavedBook; note: string } {
  const last = DECKS[book.deck].length - 1;
  if (delta < 0 && book.index === 0) return { book, note: "This is the first question." };
  if (delta > 0 && book.index === last) return { book, note: "This is the last question." };
  return { book: { ...book, index: book.index + delta }, note: "Another question." };
}

export function chooseDeck(book: SavedBook, deck: Deck): { book: SavedBook; note: string } {
  const label = deck === "kids" ? "Kids" : deck === "family" ? "Family" : "Seniors";
  return { book: { ...book, deck, index: 0 }, note: `${label} questions.` };
}

export function saveAnswer(book: SavedBook, rawAnswer: string, id: string): { book: SavedBook; note: string } {
  const answer = rawAnswer.trim().replace(/\s+/g, " ");
  if (!answer) return { book, note: "Type an answer first." };
  if (answer.length > 80) return { book, note: "Use a shorter answer." };
  const question = questionAt(book);
  const taken = book.entries.some(
    (entry) => entry.question === question && entry.answer.toLowerCase() === answer.toLowerCase(),
  );
  if (taken) return { book, note: "Already saved." };
  const entries = [...book.entries, { id, question, answer }];
  return { book: { ...book, entries, page: entries.length - 1 }, note: "Saved." };
}

export function movePage(book: SavedBook, delta: -1 | 1): { book: SavedBook; note: string } {
  if (book.entries.length === 0) return { book, note: "No answers yet." };
  if (delta < 0 && book.page === 0) return { book, note: "This is the first page." };
  if (delta > 0 && book.page === book.entries.length - 1) return { book, note: "This is the last page." };
  return { book: { ...book, page: book.page + delta }, note: "Another answer." };
}

export function removed(book: SavedBook): SavedBook {
  const entries = book.entries.filter((_, index) => index !== book.page);
  const page = entries.length === 0 ? 0 : Math.min(book.page, entries.length - 1);
  return { ...book, entries, page };
}
