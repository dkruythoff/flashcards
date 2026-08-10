import { Hono } from "hono";
import { type AppEnv } from "@/app/types.ts";
import { layout } from "@/views/index.ts";
import { html, raw } from "hono/html";
import { createDeck, type Deck, getDecks } from "@/db/decks.ts";
import { default as detail } from "@/app/routes/admin/decks/:id/index.ts";
import { loadDeck } from "./middleware.ts";

const app = new Hono<AppEnv>();

app.get("/", (c) =>
  c.html(
    layout({
      children: viewDecks({ decks: getDecks(), viewPath: c.req.path }),
      navigation: c.get("nav"),
      session: c.get("session"),
      title: "Admin: Deck management",
    }),
  ),
);

app.post("/", async (c) => {
  const body = await c.req.parseBody();
  const userId = c.get("session")?.userId as number;
  const name = body.name as string;

  createDeck(name, userId);

  return c.redirect(c.req.path);
});

app.use("/:id/*", loadDeck);
app.route("/:id", detail);

export default app;

const viewDecks = ({
  decks,
  viewPath,
}: {
  decks: Deck[];
  viewPath: string;
}) => html`
  <h2>Decks</h2>
  ${raw(listDecks(decks, viewPath))}
  <hr />
  <h2>Create a deck</h2>
  <form method="post">
    <label>
      <span>name</span>
      <input type="text" name="name" required />
    </label>
    <br />
    <button type="submit">Save</button>
  </form>
`;

const listDecks = (decks: Deck[], viewPath: string) =>
  !decks.length
    ? html`<p>No decks yet</p>`
    : html`<ul>
        ${raw(
          decks
            .map(
              (deck) =>
                html`<li>
                  <a href="${viewPath}/${deck.id}">${deck.name}</a> (<a
                    href="${viewPath}/${deck.id}/cards"
                    >cards</a
                  >)
                </li>`,
            )
            .join("\n"),
        )}
      </ul>`;
