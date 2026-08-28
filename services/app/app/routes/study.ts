import { Hono } from "hono";
import { type AppEnv } from "@/app/types.ts";
import { layout } from "@/views/index.ts";
import { html } from "hono/html";
import { assertSession } from "@/middleware/session.ts";
import { createQuizState, getQuizState } from "@/db/quiz.ts";

const app = new Hono<AppEnv>();

app.get("/", (c) => {
  const session = c.get("session");
  assertSession(session);

  const quizState = createQuizState(session);

  return c.html(
    layout({
      children: html`
        ${"error" in quizState
          ? html`<p>${quizState.error}</p>`
          : html`<p>${quizState.answer.front}</p>
              <form method="POST">
                <input type="hidden" name="token" value="${quizState.token}" />
                ${quizState.options.map(
                  (o) =>
                    html`<button name="answer" value="${o.id}">
                      ${o.back}
                    </button>`,
                )}
              </form>`}
      `,
      navigation: c.get("nav"),
      session: c.get("session"),
      title: "Study area",
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
        ${"error" in quizState
          ? html`<p>${quizState.error}</p>`
          : html`<p>${quizState.answer.front}</p>
              <div>
                ${quizState.options.map((o) => {
                  const classes = [
                    o.isAnswer ? "is-answer" : "",
                    o.isCorrect ? "is-correct" : "",
                    o.isWrong ? "is-wrong" : "",
                  ]
                    .filter((s) => !!s)
                    .join(" ");
                  return html`<p class="${classes}">
                    ${o.isAnswer && "✅ "} ${o.isWrong && "❌ "} ${o.back}
                  </p>`;
                })}
              </div>
              <p><a href=".">continue</a></p>`}
      `,
      navigation: c.get("nav"),
      session: c.get("session"),
      title: "Study area",
    }),
  );
});

export default app;
