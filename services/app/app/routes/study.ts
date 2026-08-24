import { Hono } from "hono";
import { type AppEnv } from "@/app/types.ts";
import { layout } from "@/views/index.ts";
import { getQuizState } from "@/db/cards.ts";
import { html, raw } from "hono/html";
import { assertSession } from "@/middleware/session.ts";

const app = new Hono<AppEnv>();

app.get("/", (c) => {
  const session = c.get("session");
  assertSession(session);

  const quizState = getQuizState(session.userId, session.token);

  return c.html(
    layout({
      children: html`Next id:
        <pre>${raw(JSON.stringify(quizState, undefined, 2))}</pre>`,
      navigation: c.get("nav"),
      session: c.get("session"),
      title: "Study area",
    }),
  );
});

export default app;
