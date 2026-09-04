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

export type CardMetrics = {
  card_id: number;
  front: string;
  deck_id: number;
  deck_name: string;
  answered: number;
  correct: number;
  wrong: number;
  correct_pct: number;
  wrong_pct: number;
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

export const getNextCardDue = (userId: number) =>
  db
    .prepare(
      `
SELECT
    rs.due_at
FROM
    review_state AS rs
    JOIN cards AS c ON c.id = rs.card_id
    JOIN deck_assignments AS da ON da.deck_id = c.deck_id AND da.student_id = rs.user_id
WHERE
    rs.user_id = ?
ORDER BY
    rs.due_at
LIMIT
    1`,
    )
    .get<{ due_at: string }>(userId)?.due_at;

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

const getCardMetricsQuery = (cardWhere = false) => `
SELECT
    c.id AS card_id,
    c.front,
    c.deck_id,
    d.name AS deck_name,
    COUNT(a.card_id) AS answered,
    SUM(CASE WHEN a.card_id = a.answer_id THEN 1 ELSE 0 END) AS correct,
    SUM(CASE WHEN a.card_id != a.answer_id THEN 1 ELSE 0 END) AS wrong,
    ROUND(100.0 * SUM(CASE WHEN a.card_id = a.answer_id THEN 1 ELSE 0 END) / NULLIF(COUNT(a.card_id), 0), 0) AS correct_pct,
    ROUND(100.0 * SUM(CASE WHEN a.card_id != a.answer_id THEN 1 ELSE 0 END) / NULLIF(COUNT(a.card_id), 0), 0) AS wrong_pct
FROM
    cards AS c
    JOIN deck_assignments AS da ON da.deck_id = c.deck_id AND da.student_id = ?
    LEFT JOIN decks AS d ON d.id = c.deck_id
    LEFT JOIN answers AS a ON a.card_id = c.id AND a.user_id = da.student_id -- same as first JOIN, therefore reusable here
${
  cardWhere
    ? `WHERE
    c.id = ?
`
    : ""
}GROUP BY
    c.id
ORDER BY
    c.deck_id, c.id
`;

export const getCardMetricsForUser = (userId: number) =>
  db.prepare(getCardMetricsQuery()).all<CardMetrics>(userId);

export const getCardMetricsForUserCard = (userId: number, cardId: number) =>
  db.prepare(getCardMetricsQuery(true)).get<CardMetrics>(userId, cardId);
