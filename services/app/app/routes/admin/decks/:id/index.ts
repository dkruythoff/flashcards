import { Hono } from "hono";
import { layout } from "@/views/index.ts";
import { type DeckEnv } from "../types.ts";
import { default as cards } from "./cards.ts";
import { default as assignments } from "./assignments.ts";

const app = new Hono<DeckEnv>();

app.get("/", (c) => {
  const deck = c.get("deck");
  return c.html(
    layout({
      children: `Deck: ${deck.name}`,
      title: `Deck: ${deck.name}`,
      navigation: c.get("nav"),
      session: c.get("session"),
    }),
  );
});

app.route("/cards", cards);
app.route("/assignments", assignments);

export default app;
