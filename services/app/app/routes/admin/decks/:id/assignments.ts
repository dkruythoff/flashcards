import { Hono } from "hono";
import { layout } from "@/views/index.ts";
import { type DeckEnv } from "../types.ts";
import { html } from "hono/html";
import {
  assignToUser,
  getAssignments,
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
  const assign = body.assign as (typeof assignOptions)[number];
  const user = getUser(userId);

  if (user && assignOptions.includes(assign)) {
    assignToUser(deck.id, userId, assign !== "0");
  }

  return c.redirect(c.req.path);
});

export default app;

const viewDeckAssigments = ({
  assignments,
  deck,
}: {
  assignments: DeckAssignment[];
  deck: Deck;
}) =>
  html`<h2>Admin: Deck '${deck.name}': Assignments</h2>
    <a href="/admin/decks">back to decks</a>
    <dl>
      ${assignments.map(
        (a) => html`
          <dt>${a.username}</dt>
          <dd>
            <form method="POST">
              <input type="hidden" name="user" value="${a.user_id}" />
              <button name="assign" value="1" ${a.assigned ? " disabled" : ""}>
                assign
              </button>
              <button name="assign" value="0" ${!a.assigned ? " disabled" : ""}>
                unassign
              </button>
            </form>
          </dd>
        `,
      )}
    </dl>`;
