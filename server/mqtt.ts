import mqtt from "paho-mqtt";
import {
  createHeartDiseaseEvent,
  createFallDetectionEvent,
  createAlertHistoryRecord,
  getAlertThresholds,
  updateMqttState,
} from "./db";
import { notifyOwner } from "./_core/notification";

interface MqttConfig {
  brokerUrl: string;
  brokerPort: number;
  userId: number;
  clientId: string;
}

interface HeartDiseasePayload {
  status: string; // "detected" or "not_detected"
  confidenceScore: number; // 0-100
  age?: number;
  sex?: string;
  cholesterol?: number;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  glucose?: number;
  smoker?: number;
  exerciseFrequency?: number;
}

interface FallDetectionPayload {
  impactArea: string; // e.g., "Head", "Hip", "Torso"
  riskLevel: string; // "high", "medium", "low"
  injuryDetail?: string;
  confidenceScore?: number; // 0-100
  poseData?: string; // JSON serialized pose keypoints
}

interface WebSocketBroadcaster {
  broadcastEvent: (type: string, data: unknown) => void;
}

let mqttClients: Map<number, any> = new Map();
let wsClients: Map<number, WebSocketBroadcaster> = new Map();

/**
 * Initialize MQTT client for a user
 */
export async function initializeMqttClient(
  config: MqttConfig,
  broadcaster: WebSocketBroadcaster
) {
  try {
    // Disconnect existing client if any
    if (mqttClients.has(config.userId)) {
      const existingClient = mqttClients.get(config.userId);
      if (existingClient && existingClient.isConnected()) {
        existingClient.disconnect();
      }
    }

    // Create new MQTT client
    const client = new mqtt.Client(
      `ws://${config.brokerUrl}:${config.brokerPort}/mqtt`,
      config.clientId
    );

    // Store broadcaster for this user
    wsClients.set(config.userId, broadcaster);

    // Set up event handlers
    client.onConnectionLost = (responseObject: any) => {
      console.log(`[MQTT] Connection lost for user ${config.userId}:`, responseObject);
      updateMqttState(config.userId, {
        isConnected: 0,
        lastDisconnectedAt: new Date(),
        connectionError: responseObject.errorMessage || "Connection lost",
      });
      broadcaster.broadcastEvent("mqtt:disconnected", {
        userId: config.userId,
        timestamp: new Date(),
      });
    };

    client.onMessageArrived = async (message: any) => {
      await handleMqttMessage(config.userId, message, broadcaster);
    };

    client.onConnected = async () => {
      console.log(`[MQTT] Connected for user ${config.userId}`);
      await updateMqttState(config.userId, {
        isConnected: 1,
        lastConnectedAt: new Date(),
        connectionError: null,
      });
      broadcaster.broadcastEvent("mqtt:connected", {
        userId: config.userId,
        timestamp: new Date(),
      });
    };

    // Connect to broker
    client.connect({
      onSuccess: async () => {
        console.log(`[MQTT] Successfully connected to ${config.brokerUrl}:${config.brokerPort}`);
        
        // Subscribe to health topics
        client.subscribe("health/heart/prediction", { qos: 1 });
        client.subscribe("health/activity/fall", { qos: 1 });
        
        await updateMqttState(config.userId, {
          subscriptionStatus: JSON.stringify([
            "health/heart/prediction",
            "health/activity/fall",
          ]),
        });

        broadcaster.broadcastEvent("mqtt:subscribed", {
          userId: config.userId,
          topics: ["health/heart/prediction", "health/activity/fall"],
          timestamp: new Date(),
        });
      },
      onFailure: async (error: any) => {
        console.error(`[MQTT] Connection failed for user ${config.userId}:`, error);
        await updateMqttState(config.userId, {
          isConnected: 0,
          connectionError: error?.errorMessage || "Connection failed",
        });
        broadcaster.broadcastEvent("mqtt:error", {
          userId: config.userId,
          error: error?.errorMessage || "Connection failed",
          timestamp: new Date(),
        });
      },
      useSSL: false,
      cleanSession: true,
    });

    mqttClients.set(config.userId, client);
    return client;
  } catch (error) {
    console.error(`[MQTT] Failed to initialize client for user ${config.userId}:`, error);
    throw error;
  }
}

/**
 * Handle incoming MQTT messages
 */
async function handleMqttMessage(
  userId: number,
  message: mqtt.Message,
  broadcaster: WebSocketBroadcaster
) {
  try {
    const topic = message.destinationName;
    const payload = JSON.parse(message.payloadString);

    console.log(`[MQTT] Received message on topic ${topic}:`, payload);

    if (topic === "health/heart/prediction") {
      await handleHeartDiseaseMessage(userId, payload, broadcaster);
    } else if (topic === "health/activity/fall") {
      await handleFallDetectionMessage(userId, payload, broadcaster);
    }
  } catch (error) {
    console.error("[MQTT] Error processing message:", error);
  }
}

/**
 * Handle heart disease prediction messages
 */
async function handleHeartDiseaseMessage(
  userId: number,
  payload: HeartDiseasePayload,
  broadcaster: WebSocketBroadcaster
) {
  try {
    // Store event in database
    const event = await createHeartDiseaseEvent({
      userId,
      status: payload.status,
      confidenceScore: payload.confidenceScore,
      age: payload.age,
      sex: payload.sex,
      cholesterol: payload.cholesterol,
      bloodPressureSystolic: payload.bloodPressureSystolic,
      bloodPressureDiastolic: payload.bloodPressureDiastolic,
      heartRate: payload.heartRate,
      glucose: payload.glucose,
      smoker: payload.smoker,
      exerciseFrequency: payload.exerciseFrequency,
      rawPayload: JSON.stringify(payload),
    });

    // Broadcast to WebSocket clients
    broadcaster.broadcastEvent("heart:prediction", {
      ...payload,
      timestamp: new Date(),
    });

    // Check if alert should be triggered
    const thresholds = await getAlertThresholds(userId);
    if (
      thresholds?.enableHeartDiseaseAlerts &&
      payload.confidenceScore >= thresholds.heartDiseaseConfidenceThreshold
    ) {
      await createAlertHistoryRecord({
        userId,
        alertType: "heart_disease",
        severity: payload.confidenceScore >= 90 ? "critical" : "high",
        message: `Heart disease detected with ${payload.confidenceScore}% confidence`,
        notificationSent: 0,
      });

      broadcaster.broadcastEvent("alert:heart_disease", {
        severity: payload.confidenceScore >= 90 ? "critical" : "high",
        confidenceScore: payload.confidenceScore,
        timestamp: new Date(),
      });

      // Send owner notification if enabled
      if (thresholds.enableEmailNotifications || thresholds.enableInAppNotifications) {
        await notifyOwner({
          title: "Heart Disease Alert",
          content: `Heart disease detected with ${payload.confidenceScore}% confidence. Patient age: ${payload.age}, Cholesterol: ${payload.cholesterol}`,
        });
      }
    }
  } catch (error) {
    console.error("[MQTT] Error handling heart disease message:", error);
  }
}

/**
 * Handle fall detection messages
 */
async function handleFallDetectionMessage(
  userId: number,
  payload: FallDetectionPayload,
  broadcaster: WebSocketBroadcaster
) {
  try {
    // Store event in database
    const event = await createFallDetectionEvent({
      userId,
      impactArea: payload.impactArea,
      riskLevel: payload.riskLevel,
      injuryDetail: payload.injuryDetail,
      confidenceScore: payload.confidenceScore,
      poseData: payload.poseData,
      rawPayload: JSON.stringify(payload),
      alertTriggered: 0,
    });

    // Broadcast to WebSocket clients
    broadcaster.broadcastEvent("fall:detection", {
      ...payload,
      timestamp: new Date(),
    });

    // Check if alert should be triggered
    const thresholds = await getAlertThresholds(userId);
    const riskLevels = { high: 3, medium: 2, low: 1 };
    const thresholdRiskLevel = riskLevels[thresholds?.fallDetectionRiskLevel as keyof typeof riskLevels] || 3;
    const currentRiskLevel = riskLevels[payload.riskLevel as keyof typeof riskLevels] || 1;

    if (
      thresholds?.enableFallDetectionAlerts &&
      currentRiskLevel >= thresholdRiskLevel
    ) {
      await createAlertHistoryRecord({
        userId,
        alertType: "fall_detection",
        severity: payload.riskLevel === "high" ? "critical" : payload.riskLevel === "medium" ? "high" : "medium",
        message: `Fall detected at ${payload.impactArea} with ${payload.riskLevel} risk level`,
        notificationSent: 0,
      });

      broadcaster.broadcastEvent("alert:fall_detection", {
        severity: payload.riskLevel === "high" ? "critical" : payload.riskLevel === "medium" ? "high" : "medium",
        impactArea: payload.impactArea,
        riskLevel: payload.riskLevel,
        timestamp: new Date(),
      });

      // Send owner notification if enabled
      if (thresholds.enableEmailNotifications || thresholds.enableInAppNotifications) {
        await notifyOwner({
          title: "Fall Detection Alert",
          content: `Fall detected at ${payload.impactArea} with ${payload.riskLevel} risk level. ${payload.injuryDetail || ""}`,
        });
      }
    }
  } catch (error) {
    console.error("[MQTT] Error handling fall detection message:", error);
  }
}

/**
 * Publish message to MQTT broker (for sending inference requests to Jetson)
 */
export async function publishMqttMessage(
  userId: number,
  topic: string,
  payload: unknown
) {
  try {
    const client = mqttClients.get(userId);
    if (!client || !client.isConnected()) {
      throw new Error("MQTT client not connected");
    }

    const message = new mqtt.Message(JSON.stringify(payload));
    message.destinationName = topic;
    message.qos = 1;
    client.send(message);

    console.log(`[MQTT] Published to ${topic}:`, payload);
  } catch (error) {
    console.error("[MQTT] Error publishing message:", error);
    throw error;
  }
}

/**
 * Register WebSocket broadcaster for a user
 */
export function registerWebSocketBroadcaster(userId: number, broadcaster: WebSocketBroadcaster) {
  wsClients.set(userId, broadcaster);
}

/**
 * Get MQTT client status for a user
 */
export function getMqttClientStatus(userId: number) {
  const client = mqttClients.get(userId);
  return {
    isConnected: client?.isConnected() || false,
    clientId: client?.clientId || null,
  };
}

/**
 * Disconnect MQTT client for a user
 */
export function disconnectMqttClient(userId: number) {
  const client = mqttClients.get(userId);
  if (client && client.isConnected()) {
    client.disconnect();
    mqttClients.delete(userId);
    wsClients.delete(userId);
  }
}
