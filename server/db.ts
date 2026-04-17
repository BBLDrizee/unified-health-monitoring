import { eq, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  heartDiseaseEvents,
  fallDetectionEvents,
  mqttState,
  alertThresholds,
  alertHistory,
  type InsertHeartDiseaseEvent,
  type InsertFallDetectionEvent,
  type InsertMqttState,
  type InsertAlertThreshold,
  type InsertAlertHistoryRecord,
} from "../drizzle/schema";
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

// Health monitoring queries

export async function getHeartDiseaseEvents(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(heartDiseaseEvents)
    .where(eq(heartDiseaseEvents.userId, userId))
    .orderBy(desc(heartDiseaseEvents.createdAt))
    .limit(limit);
}

export async function getFallDetectionEvents(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(fallDetectionEvents)
    .where(eq(fallDetectionEvents.userId, userId))
    .orderBy(desc(fallDetectionEvents.createdAt))
    .limit(limit);
}

export async function getMqttState(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(mqttState)
    .where(eq(mqttState.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrCreateMqttState(userId: number, brokerUrl: string, brokerPort: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  let state = await getMqttState(userId);
  if (!state) {
    await db.insert(mqttState).values({
      userId,
      brokerUrl,
      brokerPort,
      isConnected: 0,
    });
    state = await getMqttState(userId);
  }
  return state;
}

export async function updateMqttState(
  userId: number,
  updates: Partial<InsertMqttState>
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(mqttState)
    .set(updates)
    .where(eq(mqttState.userId, userId));
}

export async function getAlertThresholds(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(alertThresholds)
    .where(eq(alertThresholds.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrCreateAlertThresholds(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  let thresholds = await getAlertThresholds(userId);
  if (!thresholds) {
    await db.insert(alertThresholds).values({ userId });
    thresholds = await getAlertThresholds(userId);
  }
  return thresholds;
}

export async function updateAlertThresholds(
  userId: number,
  updates: Partial<InsertAlertThreshold>
) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(alertThresholds)
    .set(updates)
    .where(eq(alertThresholds.userId, userId));
}

export async function createHeartDiseaseEvent(event: InsertHeartDiseaseEvent) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(heartDiseaseEvents).values(event);
  return result;
}

export async function createFallDetectionEvent(event: InsertFallDetectionEvent) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(fallDetectionEvents).values(event);
  return result;
}

export async function createAlertHistoryRecord(record: InsertAlertHistoryRecord) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.insert(alertHistory).values(record);
  return result;
}

export async function getAlertHistory(userId: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(alertHistory)
    .where(eq(alertHistory.userId, userId))
    .orderBy(desc(alertHistory.createdAt))
    .limit(limit);
}


