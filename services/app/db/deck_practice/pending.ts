import { getCards, getExtraCardsPractice, type Card } from "@/db/cards.ts";
import type { PracticeQuizState } from "@/db/deck_practice/index.ts";
import { decorateOption } from "@/db/quiz.ts";

type PendingIds = { cardId: number; optionIds: number[] };

export const pendingParse = (
  pending: string,
  givenAnswerId = -1,
): PracticeQuizState => {
  const pendingIds = JSON.parse(pending) as PendingIds;

  const fetchedCards = new Map(
    getCards(...pendingIds.optionIds).map((c) => [c.id, c]),
  );
  const options = pendingIds.optionIds
    .map((id) => fetchedCards.get(id))
    .filter((c): c is Card => c !== undefined)
    .map((o) => decorateOption(o, pendingIds.cardId, givenAnswerId));
  const answer = options.find((o) => o.id === pendingIds.cardId) as Card;

  return { answer, options };
};

export const pendingSerialize = (pending: PracticeQuizState | null) => {
  if (!pending) return null;
  const payload = {
    cardId: pending.answer.id,
    optionIds: pending.options.map((o) => o.id),
  };
  return JSON.stringify(payload);
};

export const pendingGenerate = (
  deckId: number,
  cardId: number,
): PracticeQuizState => {
  const answer = getCards(cardId)[0];
  const wrongAnswers = getExtraCardsPractice(deckId, cardId);
  const options = [answer, ...wrongAnswers].sort(() => Math.random() - 0.5);
  return { answer, options };
};
