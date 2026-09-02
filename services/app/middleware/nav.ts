import { createMiddleware } from "hono/factory";
import { type AppEnv } from "@/app/types.ts";
import { type Session } from "./session.ts";

export type NavItem = { label: string; href: string; active?: boolean };

const buildNav = (session: Session | null, path: string): NavItem[] => {
  if (!session) return [];
  const nav: NavItem[] = [
    {
      href: "/study",
      label: "Study",
    },
  ];
  if (session.role === "teacher") {
    nav.push(
      {
        href: "/admin/users",
        label: "Admin: Users",
      },
      {
        href: "/admin/decks",
        label: "Admin: Decks",
      },
      {
        href: "/admin/backup",
        label: "Admin: Download backup",
      },
    );
  }
  return nav.map((item) => ({
    ...item,
    active: path.startsWith(item.href),
  }));
};

export const attachNav = createMiddleware<AppEnv>(async (c, next) => {
  const session = c.get("session"); // relies on attachSession running first
  c.set("nav", buildNav(session, c.req.path));
  await next();
});
