import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getHeartDiseaseEvents,
  getFallDetectionEvents,
  getMqttState,
  getOrCreateMqttState,
  getAlertThresholds,
  getOrCreateAlertThresholds,
  updateAlertThresholds,
  getAlertHistory,
} from "../db";
import { initializeMqttClient, publishMqttMessage, getMqttClientStatus } from "../mqtt";

export const healthRouter = router({
  /**
   * Get recent heart disease events for the current user
   */
  getHeartDiseaseEvents: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      return getHeartDiseaseEvents(ctx.user.id, input.limit);
    }),

  /**
   * Get recent fall detection events for the current user
   */
  getFallDetectionEvents: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      return getFallDetectionEvents(ctx.user.id, input.limit);
    }),

  /**
   * Get MQTT connection status
   */
  getMqttStatus: protectedProcedure.query(async ({ ctx }) => {
    const state = await getMqttState(ctx.user.id);
    const clientStatus = getMqttClientStatus(ctx.user.id);
    return {
      ...state,
      isConnected: clientStatus.isConnected,
    };
  }),

  /**
   * Initialize MQTT connection for the user
   */
  initializeMqtt: protectedProcedure
    .input(
      z.object({
        brokerUrl: z.string().default("broker.emqx.io"),
        brokerPort: z.number().default(8083),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Get or create MQTT state in database
        const mqttState = await getOrCreateMqttState(
          ctx.user.id,
          input.brokerUrl,
          input.brokerPort
        );

        // Create a simple broadcaster for WebSocket events
        const broadcaster = {
          broadcastEvent: (type: string, data: unknown) => {
            console.log(`[Broadcast] ${type}:`, data);
            // This will be connected to actual WebSocket in index.ts
          },
        };

        // Initialize MQTT client
        await initializeMqttClient(
          {
            brokerUrl: input.brokerUrl,
            brokerPort: input.brokerPort,
            userId: ctx.user.id,
            clientId: `health-monitor-${ctx.user.id}-${Date.now()}`,
          },
          broadcaster
        );

        return {
          success: true,
          message: "MQTT client initialized successfully",
          brokerUrl: input.brokerUrl,
          brokerPort: input.brokerPort,
        };
      } catch (error) {
        console.error("Failed to initialize MQTT:", error);
        throw new Error(`Failed to initialize MQTT: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Send heart disease prediction request to Jetson
   */
  sendHeartPredictionRequest: protectedProcedure
    .input(
      z.object({
        age: z.number(),
        sex: z.enum(["M", "F"]),
        cholesterol: z.number(),
        bloodPressureSystolic: z.number(),
        bloodPressureDiastolic: z.number(),
        heartRate: z.number(),
        glucose: z.number(),
        smoker: z.number().min(0).max(1),
        exerciseFrequency: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await publishMqttMessage(ctx.user.id, "health/heart/request", {
          userId: ctx.user.id,
          timestamp: new Date().toISOString(),
          ...input,
        });

        return {
          success: true,
          message: "Prediction request sent to Jetson",
        };
      } catch (error) {
        console.error("Failed to send prediction request:", error);
        throw new Error(`Failed to send prediction request: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }),

  /**
   * Get alert thresholds for the current user
   */
  getAlertThresholds: protectedProcedure.query(async ({ ctx }) => {
    return getOrCreateAlertThresholds(ctx.user.id);
  }),

  /**
   * Update alert thresholds for the current user
   */
  updateAlertThresholds: protectedProcedure
    .input(
      z.object({
        heartDiseaseConfidenceThreshold: z.number().min(0).max(100).optional(),
        fallDetectionRiskLevel: z.enum(["high", "medium", "low"]).optional(),
        enableHeartDiseaseAlerts: z.number().min(0).max(1).optional(),
        enableFallDetectionAlerts: z.number().min(0).max(1).optional(),
        enableEmailNotifications: z.number().min(0).max(1).optional(),
        enableInAppNotifications: z.number().min(0).max(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await updateAlertThresholds(ctx.user.id, input);
      return getOrCreateAlertThresholds(ctx.user.id);
    }),

  /**
   * Get alert history for the current user
   */
  getAlertHistory: protectedProcedure
    .input(z.object({ limit: z.number().default(100) }))
    .query(async ({ ctx, input }) => {
      return getAlertHistory(ctx.user.id, input.limit);
    }),
});
