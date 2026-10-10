import { Hono } from "hono";
import { type AppEnv } from "@/app/types.ts";
import { layout, quizView } from "@/views/index.ts";
import { html } from "hono/html";
import { assertSession } from "@/middleware/session.ts";
import { createQuizState, getQuizState } from "@/db/quiz.ts";
import { getCardsDueCount } from "@/db/cards.ts";

const app = new Hono<AppEnv>();

app.get("/", (c) => {
  const session = c.get("session");
  assertSession(session);

  const quizState = createQuizState(session);

  return c.html(
    layout({
      children: html`
        <h2>Study all due cards (${getCardsDueCount(session.userId)})</h2>
        <a href="${c.req.path.replace(/\/[^/]+$/, "")}">Back to decks</a>
        ${"error" in quizState
          ? html`<p>${quizState.error}</p>`
          : quizView({
              answered: false,
              currentPath: c.req.path,
              quizState,
            })}
      `,
      navigation: c.get("nav"),
      session: c.get("session"),
      title: `Study area: Due cards${"answer" in quizState ? ` (${quizState.answer.front})` : ""}`,
    }),
  );
});

app.post("/", async (c) => {
  const session = c.get("session");
  const body = await c.req.parseBody();
  const question_token = body.token as string;
  const answer = Number(body.answer);

  assertSession(session);

  const quizState = getQuizState(session, question_token, answer);

  return c.html(
    layout({
      children: html`
        <h2>Study all due cards (${getCardsDueCount(session.userId)})</h2>
        <a href="${c.req.path.replace(/\/[^/]+$/, "")}">Back to decks</a>
        ${"error" in quizState
          ? html`<p>${quizState.error}</p>`
          : quizView({
              answered: true,
              currentPath: c.req.path,
              quizState,
            })}
      `,
      navigation: c.get("nav"),
      session: c.get("session"),
      title: "Study area",
    }),
  );
});

export default app;
