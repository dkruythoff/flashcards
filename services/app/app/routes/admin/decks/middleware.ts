import { createMiddleware } from "hono/factory";
import { type Deck, getDeck } from "@/db/decks.ts";

export const loadDeck = createMiddleware<{ Variables: { deck: Deck } }>(
  async (c, next) => {
    const deck = getDeck(Number(c.req.param("id")));
    if (!deck) return c.redirect("/admin/decks");
    c.set("deck", deck);
    await next();
  },
);
