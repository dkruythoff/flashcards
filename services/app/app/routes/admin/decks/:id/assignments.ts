import { Hono } from "hono";
import { layout } from "@/views/index.ts";
import { type DeckEnv } from "../types.ts";
import { html } from "hono/html";
import {
  assignToUser,
  getAssignments,
  isDeckAssignable,
  MIN_CARDS_FOR_ASSIGNMENT,
  type Deck,
  type DeckAssignment,
} from "@/db/decks.ts";
import { getUser } from "@/db/users.ts";

const app = new Hono<DeckEnv>();

app.get("/", (c) => {
  const deck = c.get("deck");
  const assignments = getAssignments(deck.id);

  return c.html(
    layout({
      children: viewDeckAssigments({
        assignments,
        deck,
        isDeckAssignable: isDeckAssignable(deck.id),
        minCards: MIN_CARDS_FOR_ASSIGNMENT,
      }),
      title: `Deck: ${deck.name}: Assignments`,
      navigation: c.get("nav"),
      session: c.get("session"),
    }),
  );
});

const assignOptions = ["0", "1"] as const;
app.post("/", async (c) => {
  const deck = c.get("deck");
  const body = await c.req.parseBody();
  const userId = Number(body.user);
  const assignInput = body.assign;
  const user = getUser(userId);

  if (
    user &&
    assignOptions.includes(assignInput as (typeof assignOptions)[number])
  ) {
    assignToUser(deck.id, userId, assignInput !== "0");
  }

  return c.redirect(c.req.path);
});

export default app;

const viewDeckAssigments = ({
  assignments,
  deck,
  isDeckAssignable,
  minCards,
}: {
  assignments: DeckAssignment[];
  deck: Deck;
  isDeckAssignable: boolean;
  minCards: number;
}) =>
  html`<h2>Admin: Deck '${deck.name}': Assignments</h2>
    <a href="/admin/decks">back to decks</a>
    ${isDeckAssignable
      ? html`<dl>
          ${assignments.map(
            (a) => html`
              <dt>${a.username}</dt>
              <dd>
                <form method="POST">
                  <input type="hidden" name="user" value="${a.user_id}" />
                  <button
                    name="assign"
                    value="1"
                    ${a.assigned ? " disabled" : ""}
                  >
                    assign
                  </button>
                  <button
                    name="assign"
                    value="0"
                    ${!a.assigned ? " disabled" : ""}
                  >
                    unassign
                  </button>
                </form>
              </dd>
            `,
          )}
        </dl>`
      : html`<p>
          This deck needs at least ${minCards} cards to be assigned.
        </p>`}`;
