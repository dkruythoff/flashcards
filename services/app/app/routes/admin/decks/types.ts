import type { AppEnv } from "@/app/types.ts";
import type { Deck } from "@/db/decks.ts";

export type DeckEnv = AppEnv & {
  Variables: AppEnv["Variables"] & { deck: Deck };
};
