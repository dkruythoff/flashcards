import type { Session } from "@/middleware/session.ts";
import { db } from "@/db/index.ts";
import { pendingSerialize, type PracticeStatePending } from "./pending.ts";

export const updateRecord = (
  session: Session,
  deckId: number,
  pending: PracticeStatePending | null,
  remainingCardIds: number[],
  answerIds?: number[],
) =>
  db.exec(
    `
UPDATE
  deck_practice
SET
      pending = ?,
      remaining_card_ids = ?${
        answerIds
          ? `,
      answer_ids = ?`
          : ""
      }
WHERE
    session_token = ?
    AND deck_id = ?
`,
    ...(answerIds
      ? [
          pendingSerialize(pending),
          JSON.stringify(remainingCardIds),
          JSON.stringify(answerIds),
          session.token,
          deckId,
        ]
      : [
          pendingSerialize(pending),
          JSON.stringify(remainingCardIds),
          session.token,
          deckId,
        ]),
  );

export const insertRecord = (
  session: Session,
  deckId: number,
  remainingCardIds: number[],
  answerIds: number[],
  pending: PracticeStatePending,
) =>
  db.exec(
    `
  INSERT INTO
      deck_practice
          (session_token, deck_id, remaining_card_ids, answer_ids, pending)
      VALUES
          (?, ?, ?, ?, ?)
  `,
    session.token,
    deckId,
    JSON.stringify(remainingCardIds),
    JSON.stringify(answerIds),
    pendingSerialize(pending),
  );

export type PracticeRecordRaw = {
  remaining_card_ids: string;
  answer_ids: string;
  pending: string | null;
};
export const retrieveRecord = (session: Session, deckId: number) =>
  db
    .prepare(
      `
SELECT
    remaining_card_ids,
    answer_ids,
    pending
FROM
    deck_practice
WHERE
    session_token = ?
    AND deck_id = ?
  `,
    )
    .get<PracticeRecordRaw>(session.token, deckId);
