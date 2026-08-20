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
  !props?.session || !props.navigation?.length
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

export const loginPage = (params?: {
  error?: string;
  navigation?: NavItem[];
  session?: Session | null;
  username?: string;
}) =>
  layout({
    title: "Login",
    children: html` ${params?.error ? html`<div>${params.error}</div>` : ""}
      <form action="/login" method="POST">
        <label>
          <span>username</span>
          <input type="text" name="username" value="${params?.username}" />
        </label>
        <br />
        <label>
          <span>password</span>
          <input type="password" name="password" />
        </label>
        <br />
        <button type="submit">Log in</button>
      </form>`,
  });

export const logoutForm = (params?: { error?: string; session?: Session }) =>
  html` ${params?.error ? html`<div>${params.error}</div>` : ""}
    <form action="/logout" method="POST">
      <p>
        logged in as ${params?.session?.username}<br /><button type="submit">
          Log out
        </button>
      </p>
    </form>`;
