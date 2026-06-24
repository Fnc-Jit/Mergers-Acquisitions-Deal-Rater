import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, deals, historicalDeals, Deal, InsertDeal, HistoricalDeal } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createDeal(deal: InsertDeal): Promise<Deal | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(deals).values(deal);
  if (!result[0].insertId) return null;
  return db.select().from(deals).where(eq(deals.id, result[0].insertId as number)).then(r => r[0] || null);
}

export async function getHistoricalDeals(limit: number = 100): Promise<HistoricalDeal[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(historicalDeals).limit(limit);
}

export async function getHistoricalDealById(id: number): Promise<HistoricalDeal | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(historicalDeals).where(eq(historicalDeals.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// Calculate similarity between two deals for finding comparables
export function calculateDealSimilarity(deal1: Deal, deal2: HistoricalDeal): number {
  let similarity = 0;
  // Payment type match (25 points)
  if (deal1.paymentType === deal2.paymentType) similarity += 25;
  // Cross-border match (15 points)
  if (deal1.crossBorder === deal2.crossBorder) similarity += 15;
  // Same industry match (20 points)
  if (deal1.sameIndustry === deal2.sameIndustry) similarity += 20;
  // Deal value similarity (20 points) - closer is better
  const valueDiff = Math.abs(deal1.dealValue - deal2.dealValue);
  const maxValue = Math.max(deal1.dealValue, deal2.dealValue);
  const valueSimilarity = Math.max(0, 20 * (1 - valueDiff / (maxValue || 1)));
  similarity += valueSimilarity;
  // Premium similarity (20 points)
  const premiumDiff = Math.abs(deal1.premium - deal2.premium);
  const premiumSimilarity = Math.max(0, 20 * (1 - premiumDiff / 100));
  similarity += premiumSimilarity;
  return similarity;
}

export async function findComparableDeals(deal: Deal, limit: number = 5): Promise<HistoricalDeal[]> {
  const allHistoricalDeals = await getHistoricalDeals(1000);
  const scored = allHistoricalDeals.map(hd => ({
    deal: hd,
    similarity: calculateDealSimilarity(deal, hd),
  }));
  return scored
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
    .map(s => s.deal);
}

// TODO: add more feature queries here as your schema grows.
