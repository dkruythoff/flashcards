import { db } from "./index.ts";

export const MIN_CARDS_FOR_ASSIGNMENT = 4;

export type Deck = { id: number; name: string; owner_id: number };
export type DeckAssignment = {
  username: string;
  user_id: number;
  assigned: 0 | 1;
};

export const getDeck = (id: number) =>
  db.prepare("SELECT id, name, owner_id FROM decks WHERE id = ?").get(id) as
    | Deck
    | undefined;

export const getDecks = () =>
  (db.prepare("SELECT id, name, owner_id FROM decks").all() as
    | Deck[]
    | undefined) ?? [];

export const getDeckCardCount = (deckId: number) =>
  (
    db
      .prepare("SELECT COUNT(*) AS count FROM cards WHERE deck_id = ?")
      .get(deckId) as { count: number }
  ).count;

export const isDeckAssignable = (deckId: number) =>
  getDeckCardCount(deckId) >= MIN_CARDS_FOR_ASSIGNMENT;

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

export const getAssignments = (deckId: number) =>
  (db
    .prepare(
      `SELECT
        u.username,
        u.id AS user_id,
        CASE WHEN a.student_id IS NOT NULL THEN 1 ELSE 0 END AS assigned
      FROM
        users AS u
        LEFT JOIN deck_assignments AS a ON a.student_id = u.id AND a.deck_id = ?
        WHERE u.role = 'student'`,
    )
    .all(deckId) as DeckAssignment[] | undefined) ?? [];

export const assignToUser = (
  deckId: number,
  userId: number,
  assign: boolean,
) => {
  if (assign && !isDeckAssignable(deckId)) return;
  db.exec(
    assign
      ? "INSERT OR IGNORE INTO deck_assignments (deck_id, student_id) VALUES (?,?)"
      : "DELETE FROM deck_assignments WHERE deck_id = ? AND student_id = ?",
    deckId,
    userId,
  );
};
