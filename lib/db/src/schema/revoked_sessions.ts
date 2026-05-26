import { pgTable, text, bigint } from "drizzle-orm/pg-core";

export const revokedSessionsTable = pgTable("revoked_sessions", {
  jti: text("jti").primaryKey(),
  expiresAt: bigint("expires_at", { mode: "number" }).notNull(),
});

export type RevokedSession = typeof revokedSessionsTable.$inferSelect;
