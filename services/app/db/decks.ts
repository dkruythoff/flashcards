import { db } from "./index.ts";

export type Deck = { id: number; name: string; owner_id: number };
export type Card = { id: number; deck_id: number; front: string; back: string };

export const getDeck = (id: number) =>
  db.prepare("SELECT id, name, owner_id FROM decks WHERE id = ?").get(id) as
    | Deck
    | undefined;

export const getDecks = () =>
  (db.prepare("SELECT id, name, owner_id FROM decks").all() as
    | Deck[]
    | undefined) ?? [];

export const getDeckCards = (deckId: number) =>
  (db
    .prepare("SELECT id, deck_id, front, back FROM cards WHERE deck_id = ?")
    .all(deckId) as Card[] | undefined) ?? [];

export const createDeck = (name: string, ownerId: number) =>
  !!db.exec("INSERT INTO decks (name, owner_id) VALUES (?, ?)", name, ownerId);

export const insertCards = (
  deckId: number,
  cards: { front: string; back: string }[],
) => {
  if (cards.length === 0) return;

  const placeholders = cards.map(() => "(?, ?, ?)").join(", ");
  const values = cards.flatMap((c) => [deckId, c.front, c.back]);

  db.exec(
    `INSERT INTO cards (deck_id, front, back) VALUES ${placeholders}`,
    ...values,
  );
};
