import { html } from "hono/html";
import type { NavItem, Session } from "@/middleware/index.ts";

export const layout = (props: {
  children?: unknown;
  navigation?: NavItem[];
  session?: Session | null;
  title: string;
}) =>
  html`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${props.title}</title>
        <link rel="stylesheet" href="/style.css" />
      </head>
      <body>
        <header>
          ${props.session ? logoutForm({ session: props.session }) : ""}
          ${props.navigation?.length
            ? navigation({
                session: props.session,
                navigation: props.navigation,
              })
            : ""}
        </header>
        <main>${props.children}</main>
      </body>
    </html>`;

export const navigation = (props: {
  navigation?: NavItem[];
  session?: Session | null;
}) =>
  !props?.session || !props.navigation?.length || props.navigation.length < 2
    ? ""
    : html`<nav>
        <ul>
          ${props.navigation.map(
            (navItem) =>
              html`<li>
                ${navItem.active
                  ? html`<span>${navItem.label}</span>`
                  : html`<a href="${navItem.href}">${navItem.label}</a>`}
              </li>`,
          )}
        </ul>
      </nav>`;

const logoutForm = (params?: { error?: string; session?: Session }) =>
  html`<form action="/logout" method="POST" class="form-logout">
    <span>Logged in as ${params?.session?.username}</span>
    <button type="submit" class="button">Log out</button>
  </form>`;
