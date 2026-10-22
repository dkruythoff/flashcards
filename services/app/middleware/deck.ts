import { createMiddleware } from "hono/factory";
import { getDeck, type Deck } from "@/db/decks.ts";

export const loadDeck = (redirect: string) =>
  createMiddleware<{ Variables: { deck: Deck } }>(async (c, next) => {
    const deck = getDeck(Number(c.req.param("id")));
    if (!deck) return c.redirect(redirect);
    c.set("deck", deck);
    await next();
  });
