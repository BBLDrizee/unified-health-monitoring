/**
 * Mock Jetson Publisher for Testing
 * Simulates predict.py and tyshi.py publishing to MQTT broker
 * Publishes to:
 *   - health/heart/prediction (XGBoost predictions)
 *   - health/activity/fall (Fall detection events)
 */

import * as mqtt from "paho-mqtt";
import { randomUUID } from "crypto";

const BROKER_URL = process.env.MQTT_BROKER_URL || "broker.emqx.io";
const BROKER_PORT = parseInt(process.env.MQTT_BROKER_PORT || "8083");
const BROKER_PROTOCOL = "ws"; // WebSocket protocol

interface HeartPredictionPayload {
  status: "detected" | "not_detected";
  confidenceScore: number;
  age: number;
  sex: number;
  cholesterol: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  heartRate: number;
  glucose: number;
  smoker: number;
  exerciseFrequency: number;
  timestamp: string;
}

interface FallDetectionPayload {
  impactArea: "Head" | "Left Shoulder" | "Right Shoulder" | "Left Elbow" | "Right Elbow" | "Left Wrist" | "Right Wrist" | "Left Hip" | "Right Hip" | "Left Knee" | "Right Knee" | "Left Ankle" | "Right Ankle" | "Unknown";
  riskLevel: "high" | "medium" | "low";
  injuryDetail: string;
  confidenceScore: number;
  timestamp: string;
}

class MockJetsonPublisher {
  private client: mqtt.Client | null = null;
  private isConnected = false;
  private clientId = `mock-jetson-${randomUUID().substring(0, 8)}`;

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    try {
      const wsUrl = `${BROKER_PROTOCOL}://${BROKER_URL}:${BROKER_PORT}/mqtt`;
      console.log(`[MockJetson] Initializing MQTT client at ${wsUrl}`);

      this.client = new mqtt.Client(wsUrl, this.clientId);

      this.client.onConnectionLost = this.onConnectionLost.bind(this);
      this.client.onMessageArrived = this.onMessageArrived.bind(this);
      this.client.connect({
        onSuccess: this.onConnectSuccess.bind(this),
        onFailure: this.onConnectFailure.bind(this),
        useSSL: false,
        cleanSession: true,
        reconnect: true,
      });
    } catch (error) {
      console.error("[MockJetson] Failed to initialize MQTT client:", error);
    }
  }

  private onConnectSuccess() {
    this.isConnected = true;
    console.log("[MockJetson] Connected to MQTT broker");
  }

  private onConnectFailure(error: any) {
    console.error("[MockJetson] Connection failed:", error);
    this.isConnected = false;
  }

  private onConnectionLost(error: any) {
    console.warn("[MockJetson] Connection lost:", error);
    this.isConnected = false;
  }

  private onMessageArrived(message: mqtt.Message) {
    console.log(`[MockJetson] Message arrived on ${message.destinationName}`);
  }

  /**
   * Publish a simulated heart disease prediction
   */
  publishHeartPrediction(payload: Partial<HeartPredictionPayload>) {
    if (!this.isConnected || !this.client) {
      console.warn("[MockJetson] Not connected to broker, cannot publish");
      return false;
    }

    const fullPayload: HeartPredictionPayload = {
      status: payload.status || "not_detected",
      confidenceScore: payload.confidenceScore || Math.floor(Math.random() * 100),
      age: payload.age || 55,
      sex: payload.sex || 1,
      cholesterol: payload.cholesterol || 240,
      bloodPressureSystolic: payload.bloodPressureSystolic || 120,
      bloodPressureDiastolic: payload.bloodPressureDiastolic || 80,
      heartRate: payload.heartRate || 75,
      glucose: payload.glucose || 120,
      smoker: payload.smoker || 0,
      exerciseFrequency: payload.exerciseFrequency || 3,
      timestamp: new Date().toISOString(),
    };

    try {
      const message = new mqtt.Message(JSON.stringify(fullPayload));
      message.destinationName = "health/heart/prediction";
      message.qos = 1;
      this.client.send(message);
      console.log("[MockJetson] Published heart prediction:", fullPayload);
      return true;
    } catch (error) {
      console.error("[MockJetson] Failed to publish heart prediction:", error);
      return false;
    }
  }

  /**
   * Publish a simulated fall detection event
   */
  publishFallDetection(payload: Partial<FallDetectionPayload>) {
    if (!this.isConnected || !this.client) {
      console.warn("[MockJetson] Not connected to broker, cannot publish");
      return false;
    }

    const impactAreas: FallDetectionPayload["impactArea"][] = [
      "Head",
      "Left Shoulder",
      "Right Shoulder",
      "Left Hip",
      "Right Hip",
      "Left Knee",
      "Right Knee",
    ];

    const fullPayload: FallDetectionPayload = {
      impactArea: payload.impactArea || impactAreas[Math.floor(Math.random() * impactAreas.length)],
      riskLevel: payload.riskLevel || (Math.random() > 0.5 ? "high" : "medium"),
      injuryDetail: payload.injuryDetail || "Fall detected with potential impact injuries",
      confidenceScore: payload.confidenceScore || Math.floor(Math.random() * 100),
      timestamp: new Date().toISOString(),
    };

    try {
      const message = new mqtt.Message(JSON.stringify(fullPayload));
      message.destinationName = "health/activity/fall";
      message.qos = 1;
      this.client.send(message);
      console.log("[MockJetson] Published fall detection:", fullPayload);
      return true;
    } catch (error) {
      console.error("[MockJetson] Failed to publish fall detection:", error);
      return false;
    }
  }

  /**
   * Simulate continuous monitoring with periodic events
   */
  startSimulation(heartIntervalMs = 30000, fallIntervalMs = 60000) {
    console.log("[MockJetson] Starting simulation...");

    // Simulate heart predictions every 30 seconds
    setInterval(() => {
      if (this.isConnected) {
        const isAbnormal = Math.random() > 0.7; // 30% chance of abnormal
        this.publishHeartPrediction({
          status: isAbnormal ? "detected" : "not_detected",
          confidenceScore: isAbnormal ? Math.floor(Math.random() * 40 + 60) : Math.floor(Math.random() * 30),
          age: 55 + Math.floor(Math.random() * 20),
          cholesterol: 180 + Math.floor(Math.random() * 100),
          bloodPressureSystolic: 110 + Math.floor(Math.random() * 40),
          bloodPressureDiastolic: 70 + Math.floor(Math.random() * 30),
          heartRate: 60 + Math.floor(Math.random() * 40),
          glucose: 100 + Math.floor(Math.random() * 50),
        });
      }
    }, heartIntervalMs);

    // Simulate fall detection every 60 seconds (rarely)
    setInterval(() => {
      if (this.isConnected && Math.random() > 0.85) {
        // Only 15% chance of fall
        this.publishFallDetection({
          riskLevel: Math.random() > 0.5 ? "high" : "medium",
          confidenceScore: Math.floor(Math.random() * 30 + 70),
        });
      }
    }, fallIntervalMs);
  }

  disconnect() {
    if (this.client && this.isConnected) {
      this.client.disconnect();
      this.isConnected = false;
      console.log("[MockJetson] Disconnected from broker");
    }
  }
}

// Export singleton instance
let publisherInstance: MockJetsonPublisher | null = null;

export function getOrCreateMockPublisher(): MockJetsonPublisher {
  if (!publisherInstance) {
    publisherInstance = new MockJetsonPublisher();
  }
  return publisherInstance;
}

export function startMockJetsonSimulation() {
  const publisher = getOrCreateMockPublisher();
  publisher.startSimulation();
}

export function publishMockHeartPrediction(payload: Partial<HeartPredictionPayload>) {
  const publisher = getOrCreateMockPublisher();
  return publisher.publishHeartPrediction(payload);
}

export function publishMockFallDetection(payload: Partial<FallDetectionPayload>) {
  const publisher = getOrCreateMockPublisher();
  return publisher.publishFallDetection(payload);
}

// Auto-start if running as main module
if (import.meta.url === `file://${process.argv[1]}`) {
  const publisher = getOrCreateMockPublisher();
  publisher.startSimulation();
  console.log("[MockJetson] Simulation running. Press Ctrl+C to stop.");
}
