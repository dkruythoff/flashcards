import { Hono } from "hono";
import { type Deck, insertCards } from "@/db/decks.ts";
import { layout } from "@/views/index.ts";
import { html } from "hono/html";
import { type DeckEnv } from "../types.ts";
import { getDeckCards, type Card } from "@/db/cards.ts";

const app = new Hono<DeckEnv>();

app.get("/", (c) => {
  const deck = c.get("deck");

  return c.html(
    layout({
      children: viewDeckCards({ cards: getDeckCards(deck.id), deck }),
      title: `Deck: ${deck.name}: Cards`,
      navigation: c.get("nav"),
      session: c.get("session"),
    }),
  );
});

app.post("/", async (c) => {
  const deck = c.get("deck");
  const deckId = deck.id;
  const body = await c.req.parseBody();
  const cardsRaw = body.cards as string;
  const cardsParsed = parseCards(cardsRaw);

  if ("error" in cardsParsed) {
    return c.html(
      layout({
        children: enterDeckCards({ cards: cardsRaw, error: cardsParsed.error }),
        title: `Deck: ${deck.name}: Cards`,
        navigation: c.get("nav"),
        session: c.get("session"),
      }),
    );
  }

  try {
    insertCards(deckId, cardsParsed);
  } catch (err) {
    if (
      err instanceof Error &&
      err.message.includes("UNIQUE constraint failed")
    ) {
      return c.html(
        layout({
          children: enterDeckCards({
            cards: cardsRaw,
            error:
              "One or more of these words is already in this deck. No cards were added.",
          }),
          title: `Deck: ${deck.name}: Cards`,
          navigation: c.get("nav"),
          session: c.get("session"),
        }),
      );
    }
    throw err; // anything else is unexpected — let it 500 rather than swallow it
  }

  return c.redirect(`/admin/decks/${deckId}/cards`);
});

export default app;

function parseCards(
  text: string,
): { front: string; back: string }[] | { error: string } {
  if (!text) {
    return {
      error: `No input given.`,
    };
  }

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  const cards: { front: string; back: string }[] = [];
  const badLines: [number, string][] = [];

  lines.forEach((line, i) => {
    const sep = line.indexOf("|");
    const front = sep === -1 ? "" : line.slice(0, sep).trim();
    const back = sep === -1 ? "" : line.slice(sep + 1).trim();
    if (!front || !back) {
      badLines.push([i + 1, line]);
      return;
    }
    cards.push({ front, back });
  });

  if (badLines.length > 0) {
    return {
      error: `Line(s) ${badLines.map((bl) => `${bl[0]}(${bl[1]})`).join(", ")} aren't in "front|back" format.`,
    };
  }
  return cards;
}

const viewDeckCards = ({ cards, deck }: { cards: Card[]; deck: Deck }) =>
  html`<h2>Admin: Decks: ${deck.name}: cards</h2>
    <a href="/admin/decks">back to decks</a>
    ${cards?.length ? listDeckCards({ cards }) : enterDeckCards({ cards: "" })}`;

const listDeckCards = ({ cards }: { cards: Card[] }) =>
  html`<dl>
    ${cards.map(
      (card) =>
        html`<dt>${card.front}</dt>
          <dd>${card.back}</dd>`,
    )}
  </dl>`;

const enterDeckCards = ({ cards, error }: { cards: string; error?: string }) =>
  html`${error ? html`<p>${error}</p>` : ""}
    <form method="POST">
      <label>
        <span>Cards (1 per line, format: &lt;front&gt;|&lt;back&gt;)</span
        ><br />
        <textarea name="cards" rows="9" cols="40">${cards}</textarea>
      </label>
      <br />
      <button type="submit">Save</button>
    </form>`;
