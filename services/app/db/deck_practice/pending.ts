import { getCards, getExtraCardsPractice, type Card } from "@/db/cards.ts";

type PendingIds = { cardId: number; optionIds: number[] };
export type PracticeStatePending = {
  card: Card;
  options: Card[];
};

export const pendingParse = (
  pending: string,
  givenAnswerId = -1,
): PracticeStatePending => {
  const pendingIds = JSON.parse(pending) as PendingIds;

  const fetchedCards = new Map(
    getCards(...pendingIds.optionIds).map((c) => [c.id, c]),
  );
  const options = pendingIds.optionIds
    .map((id) => fetchedCards.get(id))
    .filter((c): c is Card => c !== undefined)
    .map((o) => {
      const isAnswer = o.id === pendingIds.cardId;
      const isCorrect = isAnswer && givenAnswerId === o.id;
      const isWrong = !isAnswer && givenAnswerId === o.id;
      return Object.assign(o, { isAnswer, isCorrect, isWrong });
    });
  const card = options.find((o) => o.id === pendingIds.cardId) as Card;

  return { card, options };
};

export const pendingSerialize = (pending: PracticeStatePending | null) => {
  if (!pending) return null;
  const payload = {
    cardId: pending.card.id,
    optionIds: pending.options.map((o) => o.id),
  };
  return JSON.stringify(payload);
};

export const pendingGenerate = (
  deckId: number,
  cardId: number,
): PracticeStatePending => {
  const card = getCards(cardId)[0];
  const wrongAnswers = getExtraCardsPractice(deckId, cardId);
  const options = [card, ...wrongAnswers].sort(() => Math.random() - 0.5);
  return { card, options };
};
