import type { NavItem, Session } from "@/middleware/index.ts";
import type { Deck } from "@/db/decks.ts";

export type AppEnv = {
  Variables: {
    session: Session | null;
    nav: NavItem[];
  };
};

export type DeckEnv = AppEnv & {
  Variables: AppEnv["Variables"] & { deck: Deck };
};
