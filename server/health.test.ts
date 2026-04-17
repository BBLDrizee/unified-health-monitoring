import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions
vi.mock("./db", () => ({
  getDb: vi.fn(),
  getHeartDiseaseEvents: vi.fn(async () => []),
  getFallDetectionEvents: vi.fn(async () => []),
  getMqttState: vi.fn(async () => ({
    userId: 1,
    isConnected: false,
    brokerUrl: "broker.emqx.io",
    brokerPort: 1883,
    lastConnectedAt: null,
  })),
  getOrCreateAlertThresholds: vi.fn(async () => ({
    id: 1,
    userId: 1,
    heartDiseaseConfidenceThreshold: 70,
    fallDetectionRiskLevel: "high",
    enableHeartDiseaseAlerts: 1,
    enableFallDetectionAlerts: 1,
    enableEmailNotifications: 1,
    enableInAppNotifications: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  updateAlertThresholds: vi.fn(async () => ({
    success: true,
  })),
  getAlertHistory: vi.fn(async () => []),
  insertHeartDiseaseEvent: vi.fn(async () => ({ insertId: 1 })),
  insertFallDetectionEvent: vi.fn(async () => ({ insertId: 1 })),
  insertAlertHistory: vi.fn(async () => ({ insertId: 1 })),
}));

// Mock MQTT service
vi.mock("./mqtt", () => ({
  getMqttClientStatus: vi.fn(() => ({
    isConnected: false,
    lastMessageTime: null,
    subscribedTopics: [],
  })),
  initializeMqttClient: vi.fn(async () => ({
    success: true,
  })),
}));

function createAuthContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Health Monitoring Procedures", () => {
  let ctx: TrpcContext;

  beforeEach(() => {
    ctx = createAuthContext();
    vi.clearAllMocks();
  });

  describe("health.getHeartDiseaseEvents", () => {
    it("should return array of heart disease events", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.health.getHeartDiseaseEvents({ limit: 10 });
      expect(Array.isArray(result)).toBe(true);
    });

    it("should respect limit parameter", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.health.getHeartDiseaseEvents({ limit: 5 });
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it("should require authentication", async () => {
      const unauthCtx: TrpcContext = {
        user: null,
        req: ctx.req,
        res: ctx.res,
      };
      const caller = appRouter.createCaller(unauthCtx);
      
      try {
        await caller.health.getHeartDiseaseEvents({ limit: 10 });
        expect.fail("Should have thrown authentication error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("health.getFallDetectionEvents", () => {
    it("should return array of fall detection events", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.health.getFallDetectionEvents({ limit: 10 });
      expect(Array.isArray(result)).toBe(true);
    });

    it("should require authentication", async () => {
      const unauthCtx: TrpcContext = {
        user: null,
        req: ctx.req,
        res: ctx.res,
      };
      const caller = appRouter.createCaller(unauthCtx);
      
      try {
        await caller.health.getFallDetectionEvents({ limit: 10 });
        expect.fail("Should have thrown authentication error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("health.getMqttStatus", () => {
    it("should return MQTT status object", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.health.getMqttStatus();
      
      expect(result).toHaveProperty("isConnected");
      expect(typeof result.isConnected).toBe("boolean");
    });

    it("should require authentication", async () => {
      const unauthCtx: TrpcContext = {
        user: null,
        req: ctx.req,
        res: ctx.res,
      };
      const caller = appRouter.createCaller(unauthCtx);
      
      try {
        await caller.health.getMqttStatus();
        expect.fail("Should have thrown authentication error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("health.getAlertThresholds", () => {
    it("should return threshold configuration", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.health.getAlertThresholds();
      
      expect(result).toHaveProperty("heartDiseaseConfidenceThreshold");
      expect(result).toHaveProperty("fallDetectionRiskLevel");
      expect(result).toHaveProperty("enableHeartDiseaseAlerts");
      expect(result).toHaveProperty("enableFallDetectionAlerts");
    });

    it("should have valid default thresholds", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.health.getAlertThresholds();
      
      expect(result.heartDiseaseConfidenceThreshold).toBeGreaterThanOrEqual(0);
      expect(result.heartDiseaseConfidenceThreshold).toBeLessThanOrEqual(100);
      expect(["high", "medium", "low"]).toContain(result.fallDetectionRiskLevel);
    });

    it("should require authentication", async () => {
      const unauthCtx: TrpcContext = {
        user: null,
        req: ctx.req,
        res: ctx.res,
      };
      const caller = appRouter.createCaller(unauthCtx);
      
      try {
        await caller.health.getAlertThresholds();
        expect.fail("Should have thrown authentication error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("health.updateAlertThresholds", () => {
    it("should validate threshold range", async () => {
      const caller = appRouter.createCaller(ctx);
      
      try {
        await caller.health.updateAlertThresholds({
          heartDiseaseConfidenceThreshold: 150, // Invalid: > 100
          fallDetectionRiskLevel: "high",
          enableHeartDiseaseAlerts: 1,
          enableFallDetectionAlerts: 1,
          enableEmailNotifications: 1,
          enableInAppNotifications: 1,
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(["BAD_REQUEST", "INTERNAL_SERVER_ERROR"]).toContain(error.code);
      }
    });

    it("should validate risk level enum", async () => {
      const caller = appRouter.createCaller(ctx);
      
      try {
        await caller.health.updateAlertThresholds({
          heartDiseaseConfidenceThreshold: 70,
          fallDetectionRiskLevel: "invalid" as any,
          enableHeartDiseaseAlerts: 1,
          enableFallDetectionAlerts: 1,
          enableEmailNotifications: 1,
          enableInAppNotifications: 1,
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(["BAD_REQUEST", "INTERNAL_SERVER_ERROR"]).toContain(error.code);
      }
    });

    it("should require authentication", async () => {
      const unauthCtx: TrpcContext = {
        user: null,
        req: ctx.req,
        res: ctx.res,
      };
      const caller = appRouter.createCaller(unauthCtx);
      
      try {
        await caller.health.updateAlertThresholds({
          heartDiseaseConfidenceThreshold: 70,
          fallDetectionRiskLevel: "high",
          enableHeartDiseaseAlerts: 1,
          enableFallDetectionAlerts: 1,
          enableEmailNotifications: 1,
          enableInAppNotifications: 1,
        });
        expect.fail("Should have thrown authentication error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("health.getAlertHistory", () => {
    it("should return array of alerts", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.health.getAlertHistory({ limit: 10 });
      expect(Array.isArray(result)).toBe(true);
    });

    it("should respect limit parameter", async () => {
      const caller = appRouter.createCaller(ctx);
      const result = await caller.health.getAlertHistory({ limit: 5 });
      expect(result.length).toBeLessThanOrEqual(5);
    });

    it("should require authentication", async () => {
      const unauthCtx: TrpcContext = {
        user: null,
        req: ctx.req,
        res: ctx.res,
      };
      const caller = appRouter.createCaller(unauthCtx);
      
      try {
        await caller.health.getAlertHistory({ limit: 10 });
        expect.fail("Should have thrown authentication error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });

  describe("health.initializeMqtt", () => {
    it("should validate broker URL format", async () => {
      const caller = appRouter.createCaller(ctx);
      
      try {
        await caller.health.initializeMqtt({
          brokerUrl: "invalid url",
          brokerPort: 1883,
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(["BAD_REQUEST", "INTERNAL_SERVER_ERROR"]).toContain(error.code);
      }
    });

    it("should validate port range", async () => {
      const caller = appRouter.createCaller(ctx);
      
      try {
        await caller.health.initializeMqtt({
          brokerUrl: "broker.emqx.io",
          brokerPort: 99999, // Invalid: > 65535
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        expect(["BAD_REQUEST", "INTERNAL_SERVER_ERROR"]).toContain(error.code);
      }
    });

    it("should require authentication", async () => {
      const unauthCtx: TrpcContext = {
        user: null,
        req: ctx.req,
        res: ctx.res,
      };
      const caller = appRouter.createCaller(unauthCtx);
      
      try {
        await caller.health.initializeMqtt({
          brokerUrl: "broker.emqx.io",
          brokerPort: 1883,
        });
        expect.fail("Should have thrown authentication error");
      } catch (error: any) {
        expect(error.code).toBe("UNAUTHORIZED");
      }
    });
  });
});
