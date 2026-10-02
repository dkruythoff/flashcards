import { db } from "@/db/index.ts";

type AnswerType = "study" | "practice";

export const logAnswer = (
  userId: number,
  cardId: number,
  options: string,
  answerId: number,
  answerType: AnswerType = "study",
) =>
  db
    .prepare(
      `
  INSERT INTO
    answers (user_id, card_id, option_card_ids, answer_id, answer_type)
    VALUES (?, ?, ?, ?, ?)
  RETURNING
    id
  `,
    )
    .get<{ id: number }>(userId, cardId, options, answerId, answerType)
    ?.id as number;
