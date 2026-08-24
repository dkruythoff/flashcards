import { db } from "@/db/index.ts";
import { MIN_CARDS_FOR_ASSIGNMENT } from "@/db/decks.ts";

export type QuizState = {
  answer: ReturnType<typeof getNextCard>;
  options: ReturnType<typeof getWrongAnswers>;
  token: string;
};
export const getQuizState = (userId: number, session_token: string) => {
  clearStaleQuizStates();

  const answer = getNextCard(userId);
  if (!answer) return { error: "No cards available." };

  const wrongAnswers = getWrongAnswers(userId, answer.id);
  if (!wrongAnswers?.length) return { error: "Not enough cards available." };

  const token = createQuizState(
    session_token,
    answer.id,
    JSON.stringify(wrongAnswers.map((op) => op.id)),
  );

  const options: QuizState["options"] = [
    { id: answer.id, back: answer.back },
    ...wrongAnswers,
  ].sort(() => Math.random() - 0.5);

  return {
    answer,
    options,
    token,
  } as QuizState;
};

const createQuizState = (
  session_token: string,
  card_id: number,
  option_card_ids: string,
) => {
  const question_token = crypto.randomUUID();
  const row = db
    .prepare(
      "INSERT INTO quiz_state (question_token, session_token, card_id, option_card_ids) VALUES (?, ?, ?, ?) RETURNING question_token",
    )
    .get(question_token, session_token, card_id, option_card_ids) as {
    question_token: string;
  };
  return row?.question_token;
};

const getNextCard = (userId: number) =>
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
    .get(userId, userId) as
    | { id: number; front: string; back: string }
    | undefined;

const getWrongAnswers = (
  userId: number,
  rightCardId: number,
  limit = MIN_CARDS_FOR_ASSIGNMENT - 1,
) =>
  db
    .prepare(
      `SELECT c.id, c.back
      FROM cards AS c
      JOIN deck_assignments AS da ON da.deck_id = c.deck_id AND da.student_id = ?
      WHERE id != ?
      ORDER BY RANDOM() LIMIT ?`,
    )
    .all(userId, rightCardId, limit) as
    | { id: number; back: string }[]
    | undefined;

const clearStaleQuizStates = () => {
  db.exec(
    "DELETE FROM quiz_state WHERE created_at < datetime('now', '-15 minutes')",
  );
};
