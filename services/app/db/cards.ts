import { db } from "@/db/index.ts";
import { MIN_CARDS_FOR_ASSIGNMENT } from "@/db/decks.ts";

export type Card = {
  back: string;
  front: string;
  id: number;
  isAnswer?: boolean;
  isCorrect?: boolean;
  isWrong?: boolean;
};

export const getCards = (...cardIds: number[]) =>
  !cardIds.length
    ? []
    : db
        .prepare(
          `SELECT id, front, back FROM cards WHERE id IN (${cardIds.map(() => "?").join(", ")})`,
        )
        .all<Card>(...cardIds);

export const getNextCard = (userId: number) =>
  db
    .prepare(
      `
SELECT
    c.id,
    c.front,
    c.back
FROM
    cards c
    JOIN deck_assignments AS da ON da.deck_id = c.deck_id AND da.student_id = ?
    LEFT JOIN review_state AS rs ON rs.card_id = c.id AND rs.user_id = ?
WHERE
    rs.due_at IS NULL
    OR rs.due_at <= datetime('now')
ORDER BY
    COALESCE(rs.due_at, '0000-01-01') ASC
LIMIT
    1`,
    )
    .get<Card>(userId, userId);

export const getExtraCards = (userId: number, cardId: number) =>
  db
    .prepare(
      `
SELECT
  c.id,
  c.front,
  c.back
FROM
  cards AS c
  JOIN deck_assignments AS da ON da.deck_id = c.deck_id AND da.student_id = ?
WHERE
  id != ?
ORDER BY
  RANDOM()
LIMIT
  ?`,
    )
    .all<Card>(userId, cardId, MIN_CARDS_FOR_ASSIGNMENT - 1);

export const getDeckCards = (deckId: number) =>
  db
    .prepare("SELECT id, front, back FROM cards WHERE deck_id = ?")
    .all<Card>(deckId);
