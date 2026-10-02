import type { Session } from "@/middleware/index.ts";
import { cardBelongsToDeck, type Card } from "@/db/cards.ts";
import { getDeckCardIds, isDeckAssignedToUser } from "@/db/decks.ts";
import { logAnswer } from "@/db/answers.ts";
import { pendingGenerate, pendingParse } from "./pending.ts";
import {
  insertRecord,
  retrieveRecord,
  updateRecord,
  type PracticeRecordRaw,
} from "./record.ts";

type PracticeStatus =
  | { status: "new" }
  | {
      status: "active";
      remainingCardIds: number[];
      answerIds: number[];
      pending: { card: Card; options: Card[] };
    }
  | { status: "finished"; answerIds: number[] };

const classifyPracticeRecord = (
  record: PracticeRecordRaw | undefined,
): PracticeStatus => {
  if (!record) return { status: "new" };
  const remainingCardIds = JSON.parse(record.remaining_card_ids);
  const answerIds = JSON.parse(record.answer_ids);
  if (!record.pending) return { status: "finished", answerIds };
  return {
    status: "active",
    remainingCardIds,
    answerIds,
    pending: pendingParse(record.pending),
  };
};

type PracticeState = {
  remainingCardIds: number[];
  pending: { card: Card; options: Card[] };
  answerIds: number[];
};

export class AnswerNotInOptionsError extends Error {}
export class AnswerNotInDeckError extends Error {}
export class DeckNotAssignedError extends Error {}

export const getPracticeState = (
  session: Session,
  deckId: number,
  givenAnswerId: number = -1,
) => {
  if (!isDeckAssignedToUser(deckId, session.userId))
    throw new DeckNotAssignedError("Deck not assigned to user");

  if (givenAnswerId > -1 && !cardBelongsToDeck(givenAnswerId, deckId))
    throw new AnswerNotInDeckError("Given answer not within deck");

  const status = classifyPracticeRecord(retrieveRecord(session, deckId));
  switch (status.status) {
    case "new":
      return getPracticeStateNew(session, deckId); // NoRecord × GET
    case "active":
      return status; // Active × GET
    case "finished":
      return status; // Finished × GET
  }
};

export const submitPracticeAnswer = (
  session: Session,
  deckId: number,
  givenAnswerId: number,
) => {
  const status = classifyPracticeRecord(retrieveRecord(session, deckId));
  switch (status.status) {
    case "new":
    case "finished":
      return { redirect: true }; // nothing valid to grade, bounce to GET
    case "active":
      return gradeAndAdvance(session, deckId, status, givenAnswerId); // Active × POST
  }
};

const gradeAndAdvance = (
  session: Session,
  deckId: number,
  status: PracticeStatus,
  givenAnswerId: number,
) => {
  if (status.status !== "active") return status;
  if (!status.pending.options.map((o) => o.id).includes(givenAnswerId))
    throw new AnswerNotInOptionsError("Given answer not present in options.");

  const answerId = logAnswer(
    session.userId,
    status.pending.card.id,
    JSON.stringify(status.pending.options.map((o) => o.id)),
    givenAnswerId,
    "practice",
  );
  const answerIds = [...status.answerIds, answerId];

  if (status.remainingCardIds.length) {
    const remainingCardIds = [...status.remainingCardIds];
    const nextPending = pendingGenerate(
      deckId,
      remainingCardIds.pop() as number,
    );
    updateRecord(session, deckId, nextPending, remainingCardIds, answerIds);
    return { ...status, pending: status.pending, remainingCardIds, answerIds };
  }

  updateRecord(session, deckId, null, status.remainingCardIds, answerIds);
  return { status: "finished" as const, answerIds };
};

const getPracticeStateNew = (
  session: Session,
  deckId: number,
): PracticeState => {
  const remainingCardIds: PracticeState["remainingCardIds"] = getDeckCardIds(
    deckId,
  ).sort(() => Math.random() - 0.5);
  const pending = pendingGenerate(deckId, remainingCardIds.pop() as number);
  const answerIds: number[] = [];

  insertRecord(session, deckId, remainingCardIds, answerIds, pending);

  return {
    remainingCardIds,
    pending,
    answerIds,
  };
};
