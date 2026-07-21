import { type Session } from "../middleware/index.ts";

export type AppEnv = { Variables: { session: Session | null } };
