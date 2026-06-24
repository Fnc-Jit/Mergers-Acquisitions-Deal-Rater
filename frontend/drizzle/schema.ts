import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const deals = mysqlTable("deals", {
  id: int("id").autoincrement().primaryKey(),
  acquirerTicker: varchar("acquirerTicker", { length: 10 }).notNull(),
  targetTicker: varchar("targetTicker", { length: 10 }).notNull(),
  dealValue: int("dealValue").notNull(), // in millions USD
  premium: int("premium").notNull(), // percentage
  paymentType: mysqlEnum("paymentType", ["cash", "stock", "mixed"]).notNull(),
  crossBorder: int("crossBorder").default(0).notNull(), // boolean as int
  sameIndustry: int("sameIndustry").default(0).notNull(), // boolean as int
  dealQualityScore: int("dealQualityScore"), // 0-100 score
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Deal = typeof deals.$inferSelect;
export type InsertDeal = typeof deals.$inferInsert;

export const historicalDeals = mysqlTable("historicalDeals", {
  id: int("id").autoincrement().primaryKey(),
  dealName: varchar("dealName", { length: 255 }).notNull(),
  acquirer: varchar("acquirer", { length: 100 }).notNull(),
  target: varchar("target", { length: 100 }).notNull(),
  sector: varchar("sector", { length: 100 }).notNull(),
  dealValue: int("dealValue").notNull(), // in millions USD
  premium: int("premium").notNull(), // percentage
  paymentType: mysqlEnum("paymentType", ["cash", "stock", "mixed"]).notNull(),
  crossBorder: int("crossBorder").default(0).notNull(),
  sameIndustry: int("sameIndustry").default(0).notNull(),
  outcome: mysqlEnum("outcome", ["success", "failed", "pending"]).notNull(),
  announcementDate: varchar("announcementDate", { length: 10 }).notNull(), // YYYY-MM-DD
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HistoricalDeal = typeof historicalDeals.$inferSelect;
export type InsertHistoricalDeal = typeof historicalDeals.$inferInsert;