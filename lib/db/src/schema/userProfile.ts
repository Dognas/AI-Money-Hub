import { pgTable, text, integer, real, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userProfilesTable = pgTable("user_profiles", {
  id: text("id").primaryKey(), // matches auth user id
  age: integer("age"),
  country: text("country"),
  currency: text("currency").default("USD"),
  monthlyIncome: real("monthly_income"),
  monthlyExpenses: real("monthly_expenses"),
  monthlySavings: real("monthly_savings"),
  totalDebt: real("total_debt"),
  totalSavings: real("total_savings"),
  totalInvestments: real("total_investments"),
  retirementAge: integer("retirement_age"),
  riskTolerance: text("risk_tolerance"), // conservative | moderate | aggressive
  financialGoal: text("financial_goal"),
  healthScore: integer("health_score"),
  netWorthHistory: jsonb("net_worth_history").$type<{ date: string; value: number }[]>().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertUserProfileSchema = createInsertSchema(userProfilesTable).omit({ createdAt: true, updatedAt: true });
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;
export type UserProfile = typeof userProfilesTable.$inferSelect;
