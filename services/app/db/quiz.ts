import {
  getCards,
  getExtraCards,
  getNextCard,
  getNextCardDue,
  type Card,
} from "@/db/cards.ts";
import { db } from "@/db/index.ts";
import type { Session } from "@/middleware/index.ts";
import { MIN_CARDS_FOR_ASSIGNMENT } from "@/db/decks.ts";

type QuizState = {
  answer: Card;
  options: Card[];
  token: string;
};
type QuizStateError = {
  error: string;
};
type QuizStateResponse = QuizState | QuizStateError;

const TIMEZONE = "Europe/Madrid"; // handles CET/CEST switching automatically

const formatDue = (nextDueUtc: string) => {
  // SQLite's string has no timezone marker at all — it IS UTC, but nothing
  // says so. Must mark it explicitly before parsing, or JS may guess wrong.
  const date = new Date(`${nextDueUtc.replace(" ", "T")}Z`);
  const now = new Date();

  const dayFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }); // en-CA => YYYY-MM-DD
  const today = dayFormatter.format(now);
  const tomorrow = dayFormatter.format(
    new Date(now.getTime() + 24 * 60 * 60 * 1000),
  );
  const dueDay = dayFormatter.format(date);

  const timeFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
  });

  const dayLabel =
    dueDay === today ? "today" : dueDay === tomorrow ? "tomorrow" : dueDay;
  return `${dayLabel} at ${timeFormatter.format(date)}`;
};

export const getNextCardDueMessage = (userId: number) => {
  const nextDue = getNextCardDue(userId);
  return nextDue
    ? `All done for now! Next card available ${formatDue(nextDue)}`
    : null;
};

export const createQuizState = (session: Session): QuizStateResponse => {
  // Clear stale quiz_state rows
  db.exec(`
    DELETE FROM
        quiz_state
    WHERE
        created_at < datetime('now', '-15 minutes')
  `);

  const answer = getNextCard(session.userId);
  if (!answer) {
    const nextDueMessage = getNextCardDueMessage(session.userId);
    if (nextDueMessage) {
      return {
        error: nextDueMessage,
      };
    }
    return { error: "No cards available." };
  }

  const wrongAnswers = getExtraCards(session.userId, answer.id);
  if (!wrongAnswers?.length) return { error: "Not enough cards available." };

  const options: QuizState["options"] = [answer, ...wrongAnswers].sort(
    () => Math.random() - 0.5,
  );

  const { question_token: token } =
    (db
      .prepare(
        `
        INSERT INTO 
            quiz_state (
                question_token,
                session_token,
                card_id,
                option_card_ids
            )
        VALUES
            (?, ?, ?, ?)
        RETURNING
            question_token`,
      )
      .get(
        crypto.randomUUID(),
        session.token,
        answer.id,
        JSON.stringify(options.map((op) => op.id)),
      ) as {
      question_token: string;
    }) || {};

  return {
    answer,
    options,
    token,
  } as QuizStateResponse;
};

export const getQuizState = (
  session: Session,
  question_token: string,
  givenAnswerId: number = -1,
): QuizStateResponse => {
  const quizStateRecord = db
    .prepare(
      `
      SELECT
        card_id,
        option_card_ids
      FROM
        quiz_state
      WHERE
        question_token = ?
        AND session_token = ?
        `,
    )
    .get<{
      card_id: number;
      option_card_ids: string;
    }>(question_token, session.token);

  if (!quizStateRecord) return { error: "Question not found." };

  const optionIds = JSON.parse(quizStateRecord.option_card_ids) as number[];

  if (givenAnswerId > -1 && !optionIds.includes(givenAnswerId))
    return { error: "Given answer not present in quiz." };

  const fetchedCards = new Map(getCards(...optionIds).map((c) => [c.id, c]));
  const options = optionIds
    .map((id) => fetchedCards.get(id))
    .filter((c): c is Card => c !== undefined)
    .map((o) => {
      const isAnswer = o.id === quizStateRecord.card_id;
      const isCorrect = isAnswer && givenAnswerId === o.id;
      const isWrong = !isAnswer && givenAnswerId === o.id;
      return Object.assign(o, { isAnswer, isCorrect, isWrong });
    });

  if (options.length !== MIN_CARDS_FOR_ASSIGNMENT)
    return { error: "Failed to retrieve cards." };

  const answer = options.find((o) => o.id === quizStateRecord.card_id);

  if (!answer) return { error: "Answer not found." };

  if (givenAnswerId > -1) {
    gradeAnswer(session.userId, answer.id, givenAnswerId === answer.id);
    logAnswer(
      session.userId,
      answer.id,
      quizStateRecord.option_card_ids,
      givenAnswerId,
    );
    db.exec("DELETE FROM quiz_state WHERE question_token = ?", question_token);
  }

  return {
    answer,
    options,
    token: question_token,
  };
};

const BOX_INTERVAL_STR = [
  "+0 seconds", // box 0 — due immediately
  "+1 days", // box 1 — 1 day
  "+3 days", // box 2 — 3 days
  "+7 days", // box 3 — 7 days
  "+14 days", // box 4 — 14 days
];

const WRONG_ANSWER_NUDGE_STR = "+5 minutes";

export const gradeAnswer = (
  userId: number,
  cardId: number,
  correct: boolean,
) => {
  const current = db
    .prepare("SELECT box FROM review_state WHERE user_id = ? AND card_id = ?")
    .get<{ box: number }>(userId, cardId);

  const currentBox = current?.box ?? 0;
  const nextBox = correct ? Math.min(currentBox + 1, 4) : 0;
  const delay = correct ? BOX_INTERVAL_STR[nextBox] : WRONG_ANSWER_NUDGE_STR;

  db.exec(
    `
    INSERT INTO
      review_state
        (user_id, card_id, box, due_at, last_reviewed_at)
      VALUES
        (?, ?, ?, datetime('now', ?), datetime('now'))
    ON CONFLICT (user_id, card_id) DO UPDATE SET
       box = excluded.box,
       due_at = excluded.due_at,
       last_reviewed_at = excluded.last_reviewed_at`,
    userId,
    cardId,
    nextBox,
    delay,
  );
};

export const logAnswer = (
  userId: number,
  cardId: number,
  options: string,
  answerId: number,
) =>
  db.exec(
    `
  INSERT INTO
    answers (user_id, card_id, option_card_ids, answer_id)
    VALUES (?, ?, ?, ?)
  `,
    userId,
    cardId,
    options,
    answerId,
  );
