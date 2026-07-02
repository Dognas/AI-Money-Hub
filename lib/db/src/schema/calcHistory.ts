import { pgTable, text, serial, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const calcHistoryTable = pgTable("calc_history", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  calcId: text("calc_id").notNull(),
  calcName: text("calc_name").notNull(),
  inputs: jsonb("inputs").$type<Record<string, number | string>>().notNull(),
  results: jsonb("results").$type<Record<string, number | string>>().notNull(),
  isFavorite: text("is_favorite").notNull().default("false"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCalcHistorySchema = createInsertSchema(calcHistoryTable).omit({ id: true, createdAt: true });
export type InsertCalcHistory = z.infer<typeof insertCalcHistorySchema>;
export type CalcHistory = typeof calcHistoryTable.$inferSelect;
