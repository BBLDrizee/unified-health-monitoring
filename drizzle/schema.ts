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

/**
 * Heart disease prediction events from Jetson via MQTT
 * Stores XGBoost inference results from predict.py
 */
export const heartDiseaseEvents = mysqlTable("heart_disease_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 32 }).notNull(), // "detected" or "not_detected"
  confidenceScore: int("confidenceScore").notNull(), // 0-100 percentage
  age: int("age"),
  sex: varchar("sex", { length: 10 }),
  cholesterol: int("cholesterol"),
  bloodPressureSystolic: int("bloodPressureSystolic"),
  bloodPressureDiastolic: int("bloodPressureDiastolic"),
  heartRate: int("heartRate"),
  glucose: int("glucose"),
  smoker: int("smoker"), // 0 or 1
  exerciseFrequency: int("exerciseFrequency"),
  rawPayload: text("rawPayload"), // Store original MQTT JSON
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type HeartDiseaseEvent = typeof heartDiseaseEvents.$inferSelect;
export type InsertHeartDiseaseEvent = typeof heartDiseaseEvents.$inferInsert;

/**
 * Fall detection events from Jetson via MQTT
 * Stores MediaPipe fall/impact detection results from tyshi.py
 */
export const fallDetectionEvents = mysqlTable("fall_detection_events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  impactArea: varchar("impactArea", { length: 64 }).notNull(), // e.g., "Head", "Hip", "Torso"
  riskLevel: varchar("riskLevel", { length: 32 }).notNull(), // "high", "medium", "low"
  injuryDetail: text("injuryDetail"), // Detailed injury description
  confidenceScore: int("confidenceScore"), // 0-100 percentage
  poseData: text("poseData"), // JSON serialized pose keypoints
  rawPayload: text("rawPayload"), // Store original MQTT JSON
  alertTriggered: int("alertTriggered").default(0), // 0 or 1
  alertSentAt: timestamp("alertSentAt"),
  receivedAt: timestamp("receivedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FallDetectionEvent = typeof fallDetectionEvents.$inferSelect;
export type InsertFallDetectionEvent = typeof fallDetectionEvents.$inferInsert;

/**
 * MQTT broker connection state tracking
 * Maintains current connection status and subscription info
 */
export const mqttState = mysqlTable("mqtt_state", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  brokerUrl: varchar("brokerUrl", { length: 256 }).notNull(),
  brokerPort: int("brokerPort").notNull(),
  isConnected: int("isConnected").default(0).notNull(), // 0 or 1
  lastConnectedAt: timestamp("lastConnectedAt"),
  lastDisconnectedAt: timestamp("lastDisconnectedAt"),
  lastHeartbeatAt: timestamp("lastHeartbeatAt"),
  subscriptionStatus: varchar("subscriptionStatus", { length: 256 }), // JSON array of subscribed topics
  connectionError: text("connectionError"), // Last error message if any
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MqttState = typeof mqttState.$inferSelect;
export type InsertMqttState = typeof mqttState.$inferInsert;

/**
 * Configurable alert thresholds
 * Owner can set thresholds for heart disease risk and fall detection alerts
 */
export const alertThresholds = mysqlTable("alert_thresholds", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  heartDiseaseConfidenceThreshold: int("heartDiseaseConfidenceThreshold").default(70).notNull(), // 0-100
  fallDetectionRiskLevel: varchar("fallDetectionRiskLevel", { length: 32 }).default("high").notNull(), // "high", "medium", "low"
  enableHeartDiseaseAlerts: int("enableHeartDiseaseAlerts").default(1).notNull(), // 0 or 1
  enableFallDetectionAlerts: int("enableFallDetectionAlerts").default(1).notNull(), // 0 or 1
  enableEmailNotifications: int("enableEmailNotifications").default(1).notNull(), // 0 or 1
  enableInAppNotifications: int("enableInAppNotifications").default(1).notNull(), // 0 or 1
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AlertThreshold = typeof alertThresholds.$inferSelect;
export type InsertAlertThreshold = typeof alertThresholds.$inferInsert;

/**
 * Alert history and audit log
 * Tracks all triggered alerts for compliance and analysis
 */
export const alertHistory = mysqlTable("alert_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  alertType: varchar("alertType", { length: 32 }).notNull(), // "heart_disease" or "fall_detection"
  eventId: int("eventId"),
  severity: varchar("severity", { length: 32 }).notNull(), // "critical", "high", "medium", "low"
  message: text("message").notNull(),
  notificationSent: int("notificationSent").default(0).notNull(), // 0 or 1
  acknowledged: int("acknowledged").default(0).notNull(), // 0 or 1
  acknowledgedAt: timestamp("acknowledgedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AlertHistoryRecord = typeof alertHistory.$inferSelect;
export type InsertAlertHistoryRecord = typeof alertHistory.$inferInsert;