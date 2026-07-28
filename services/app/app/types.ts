import type { NavItem, Session } from "../middleware/index.ts";

export type AppEnv = {
  Variables: {
    session: Session | null;
    nav: NavItem[];
  };
};
