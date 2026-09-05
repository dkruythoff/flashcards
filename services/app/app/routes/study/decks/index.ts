import { Hono } from "hono";
import { type AppEnv } from "@/app/types.ts";
import all from "./all.ts";
import { layout } from "@/views/index.ts";
import { html } from "hono/html";
import { getAssignedDecksWithMetrics } from "@/db/decks.ts";
import { assertSession } from "@/middleware/index.ts";
import { getCardsDueCount } from "@/db/cards.ts";
import { getNextCardDueMessage } from "@/db/quiz.ts";

const app = new Hono<AppEnv>();

app.get("/", (c) => {
  const session = c.get("session");
  assertSession(session);
  const decks = getAssignedDecksWithMetrics(session.userId);
  const cardsDue = getCardsDueCount(session.userId);

  return c.html(
    layout({
      children: html`<h2>My decks</h2>
        ${!decks.length
          ? html`<p>No decks assigned.</p>`
          : html`<p>
                ${cardsDue === 0
                  ? (getNextCardDueMessage(session.userId) ?? "All caught up!")
                  : html`<a class="button dark" href="${c.req.path}/all">
                      Study all - ${cardsDue} due now (Leitner method)
                    </a>`}
              </p>
              <ul class="deck-list">
                ${decks.map(
                  (d) =>
                    html`<li class="deck">
                      <h3>${d.name}</h3>
                      <span class="count">
                        <i class="icon" aria-hidden="true"></i>
                        ${d.card_count}
                      </span>
                      ${d.answered === 0
                        ? html`<span>Not started yet.</span>`
                        : html`<span
                            class="meter"
                            style="--pct-g:${d.correct_pct}%;--pct-w:${d.wrong_pct}%"
                          >
                            <span class="g">${d.correct}</span>
                            <span class="w">${d.wrong}</span>
                          </span>`}
                    </li>`,
                )}
              </ul>`}`,
      navigation: c.get("nav"),
      session: c.get("session"),
      title: "Study area: My decks",
    }),
  );
});
app.route("/all", all);

export default app;
