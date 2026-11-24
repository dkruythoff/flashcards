import { Hono } from "hono";
import { layout, quizView } from "@/views/index.ts";
import type { DeckEnv } from "@/app/types.ts";
import {
  getPracticeState,
  submitPracticeAnswer,
} from "@/db/deck_practice/index.ts";
import { assertSession } from "@/middleware/session.ts";
import { html } from "hono/html";

const app = new Hono<DeckEnv>();

const title = (
  deckName: string,
  practiceState:
    | ReturnType<typeof getPracticeState>
    | ReturnType<typeof submitPracticeAnswer>,
) =>
  html`<h2>
    Deck:
    ${deckName}${"pending" in practiceState &&
    ` | Practice, ${practiceState.remainingCardIds.length} cards after this one`}
  </h2>`;

app.get("/", (c) => {
  const session = c.get("session");
  assertSession(session);
  const deck = c.get("deck");
  const practiceState = getPracticeState(session, deck.id);
  return c.html(
    layout({
      children: html`
        ${title(deck.name, practiceState)}
        <a href="${c.req.path.replace(/\/[^/]+$/, "")}">Back to decks</a>
        ${"pending" in practiceState
          ? quizView({
              c,
              isForm: true,
              quizState: practiceState.pending,
            })
          : html`State: ${practiceState.status}`}
      `,
      title: `Deck: ${deck.name}`,
      navigation: c.get("nav"),
      session: c.get("session"),
    }),
  );
});

app.post("/", async (c) => {
  const session = c.get("session");
  assertSession(session);
  const deck = c.get("deck");
  const body = await c.req.parseBody();
  const answer = Number(body.answer);
  const token = typeof body.token === "string" ? body.token : "";
  const practiceState = submitPracticeAnswer(session, deck.id, answer, token);

  if ("redirect" in practiceState) return c.redirect(c.req.path);

  return c.html(
    layout({
      children: html`
        ${title(deck.name, practiceState)}
        <a href="${c.req.path.replace(/\/[^/]+$/, "")}">Back to decks</a>
        ${"pending" in practiceState
          ? quizView({
              c,
              isForm: false,
              quizState: practiceState.pending,
            })
          : html`State: ${practiceState.status}`}
      `,
      title: `Deck: ${deck.name}`,
      navigation: c.get("nav"),
      session: c.get("session"),
    }),
  );
});

export default app;
