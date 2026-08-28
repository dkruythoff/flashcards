import { html } from "hono/html";
import type { NavItem, Session } from "@/middleware/index.ts";

export const layout = (props: {
  children?: unknown;
  navigation?: NavItem[];
  session?: Session | null;
  title: string;
}) =>
  html`<!DOCTYPE html>
    <html>
      <head>
        <title>${props.title}</title>
      </head>
      <body>
        <header>
          ${props.navigation?.length
            ? navigation({
                session: props.session,
                navigation: props.navigation,
              })
            : ""}
        </header>
        ${props.children}
      </body>
    </html>`;

export const navigation = (props: {
  navigation?: NavItem[];
  session?: Session | null;
}) =>
  !props?.session || !props.navigation?.length || props.navigation.length < 2
    ? ""
    : html`<nav>
        ${logoutForm({
          session: props.session,
        })}
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
  html`${params?.error ? html`<div>${params.error}</div>` : ""}
    <form action="/logout" method="POST">
      <p>
        logged in as ${params?.session?.username}<br /><button type="submit">
          Log out
        </button>
      </p>
    </form>`;
