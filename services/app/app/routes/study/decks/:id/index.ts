import { Hono } from "hono";
import { layout, quizView } from "@/views/index.ts";
import type { DeckEnv } from "@/app/types.ts";
import { getPracticeState } from "@/db/deck_practice/index.ts";
import { assertSession } from "@/middleware/session.ts";
import { html } from "hono/html";

const app = new Hono<DeckEnv>();

app.get("/", (c) => {
  const session = c.get("session");
  assertSession(session);
  const deck = c.get("deck");
  const practiceState = getPracticeState(session, deck.id);
  return c.html(
    layout({
      children: html`
        <h2>Deck: ${deck.name}</h2>
        <a href="${c.req.path.replace(/\/[^/]+$/, "")}">Back to decks</a>
        ${"pending" in practiceState
          ? quizView({
              c,
              isForm: true,
              quizState: practiceState.pending,
            })
          : html`State: ${practiceState.status}`}
        <pre>${JSON.stringify(practiceState, undefined, 2)}</pre>
      `,
      title: `Deck: ${deck.name}`,
      navigation: c.get("nav"),
      session: c.get("session"),
    }),
  );
});

app.post("/", (c) => {
  const session = c.get("session");
  assertSession(session);
  const deck = c.get("deck");
});

export default app;
