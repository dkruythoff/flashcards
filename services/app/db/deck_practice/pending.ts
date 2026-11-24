import { getCards, getExtraCardsPractice, type Card } from "@/db/cards.ts";
import { decorateOption } from "@/db/quiz.ts";

export type PracticePendingState = {
  answer: Card;
  options: Card[];
  token: string;
};
type PracticePendingRef = {
  cardId: number;
  optionIds: number[];
  token: string;
};

export const pendingParse = (
  pending: string,
  givenAnswerId = -1,
): PracticePendingState => {
  const pendingRef = JSON.parse(pending) as PracticePendingRef;

  const fetchedCards = new Map(
    getCards(...pendingRef.optionIds).map((c) => [c.id, c]),
  );
  const options = pendingRef.optionIds
    .map((id) => fetchedCards.get(id))
    .filter((c): c is Card => c !== undefined)
    .map((o) => decorateOption(o, pendingRef.cardId, givenAnswerId));
  const answer = options.find((o) => o.id === pendingRef.cardId) as Card;

  return { answer, options, token: pendingRef.token };
};

export const pendingSerialize = (pending: PracticePendingState | null) => {
  if (!pending) return null;
  const payload = {
    cardId: pending.answer.id,
    optionIds: pending.options.map((o) => o.id),
    token: pending.token,
  };
  return JSON.stringify(payload);
};

export const pendingGenerate = (
  deckId: number,
  cardId: number,
): PracticePendingState => {
  const answer = getCards(cardId)[0];
  const wrongAnswers = getExtraCardsPractice(deckId, cardId);
  const options = [answer, ...wrongAnswers].sort(() => Math.random() - 0.5);
  return { answer, options, token: crypto.randomUUID() };
};
