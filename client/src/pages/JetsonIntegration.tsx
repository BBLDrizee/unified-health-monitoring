import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import { useState } from "react";

export default function JetsonIntegration() {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const predictPyCode = `import paho.mqtt.client as mqtt
import json
import xgboost as xgb
import pickle

# Load your XGBoost model
model = xgb.Booster()
model.load_model('model.bin')

# MQTT Configuration
BROKER_URL = "broker.emqx.io"
BROKER_PORT = 1883
TOPIC_PUBLISH = "health/heart/prediction"
TOPIC_SUBSCRIBE = "health/heart/request"

client = mqtt.Client()

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to MQTT broker")
        client.subscribe(TOPIC_SUBSCRIBE)
    else:
        print(f"Connection failed with code {rc}")

def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode())
        
        # Extract features from request
        features = [
            payload.get('age', 0),
            payload.get('sex', 0),  # 0=F, 1=M
            payload.get('cholesterol', 0),
            payload.get('bloodPressureSystolic', 0),
            payload.get('bloodPressureDiastolic', 0),
            payload.get('heartRate', 0),
            payload.get('glucose', 0),
            payload.get('smoker', 0),
            payload.get('exerciseFrequency', 0),
        ]
        
        # Run inference
        prediction = model.predict([features])[0]
        confidence = float(prediction) * 100
        
        # Publish result
        result = {
            "status": "detected" if confidence > 50 else "not_detected",
            "confidenceScore": int(confidence),
            "age": payload.get('age'),
            "sex": payload.get('sex'),
            "cholesterol": payload.get('cholesterol'),
            "bloodPressureSystolic": payload.get('bloodPressureSystolic'),
            "bloodPressureDiastolic": payload.get('bloodPressureDiastolic'),
            "heartRate": payload.get('heartRate'),
            "glucose": payload.get('glucose'),
            "smoker": payload.get('smoker'),
            "exerciseFrequency": payload.get('exerciseFrequency'),
        }
        
        client.publish(TOPIC_PUBLISH, json.dumps(result))
        print(f"Published prediction: {result}")
        
    except Exception as e:
        print(f"Error processing message: {e}")

client.on_connect = on_connect
client.on_message = on_message

client.connect(BROKER_URL, BROKER_PORT, 60)
client.loop_forever()`;

  const tyshiPyCode = `import paho.mqtt.client as mqtt
import json
import cv2
import mediapipe as mp
import numpy as np

# MediaPipe setup
mp_pose = mp.solutions.pose
pose = mp_pose.Pose(min_detection_confidence=0.5)

# MQTT Configuration
BROKER_URL = "broker.emqx.io"
BROKER_PORT = 1883
TOPIC_PUBLISH = "health/activity/fall"

client = mqtt.Client()

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("Connected to MQTT broker for fall detection")
    else:
        print(f"Connection failed with code {rc}")

def detect_fall(landmarks):
    """
    Simple fall detection logic based on pose keypoints.
    Returns (is_fall, impact_area, risk_level, confidence)
    """
    if not landmarks:
        return False, None, None, 0
    
    # Extract key points
    nose = landmarks[0]
    left_shoulder = landmarks[11]
    right_shoulder = landmarks[12]
    left_hip = landmarks[23]
    right_hip = landmarks[24]
    left_ankle = landmarks[27]
    right_ankle = landmarks[28]
    
    # Calculate body angle (simplified)
    shoulder_y = (left_shoulder.y + right_shoulder.y) / 2
    hip_y = (left_hip.y + right_hip.y) / 2
    ankle_y = (left_ankle.y + right_ankle.y) / 2
    
    # Check if person is horizontal (lying down)
    is_horizontal = abs(shoulder_y - hip_y) < 0.1 and abs(hip_y - ankle_y) < 0.1
    
    # Determine impact area
    if nose.y > shoulder_y:
        impact_area = "Head"
    elif hip_y > 0.7:
        impact_area = "Hip"
    else:
        impact_area = "Torso"
    
    if is_horizontal:
        return True, impact_area, "high", 85
    
    return False, None, None, 0

def process_frame(frame):
    """Process video frame for fall detection"""
    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    results = pose.process(rgb_frame)
    
    if results.pose_landmarks:
        landmarks = results.pose_landmarks.landmark
        is_fall, impact_area, risk_level, confidence = detect_fall(landmarks)
        
        if is_fall:
            payload = {
                "impactArea": impact_area,
                "riskLevel": risk_level,
                "injuryDetail": f"Fall detected at {impact_area}",
                "confidenceScore": confidence,
                "poseData": json.dumps([
                    {"x": lm.x, "y": lm.y, "z": lm.z}
                    for lm in landmarks
                ])
            }
            
            client.publish(TOPIC_PUBLISH, json.dumps(payload))
            print(f"Fall detected: {payload}")
            
            return True
    
    return False

client.on_connect = on_connect

client.connect(BROKER_URL, BROKER_PORT, 60)

# Main video processing loop
cap = cv2.VideoCapture(0)

try:
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        
        process_frame(frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
finally:
    cap.release()
    client.disconnect()`;

  const mqttConfigCode = `# MQTT Broker Configuration for Jetson Orin Nano

# Public MQTT Broker (for development/testing)
BROKER_URL = "broker.emqx.io"
BROKER_PORT = 1883  # Standard MQTT port
WS_PORT = 8083      # WebSocket port (for web dashboard)

# For production, consider using:
# - Mosquitto (self-hosted)
# - AWS IoT Core
# - Azure IoT Hub
# - HiveMQ Cloud

# Topic Structure
TOPICS = {
    "heart_prediction": "health/heart/prediction",
    "heart_request": "health/heart/request",
    "fall_detection": "health/activity/fall",
}

# Message Payload Format

# Heart Disease Prediction (published by predict.py)
HEART_PREDICTION_PAYLOAD = {
    "status": "detected|not_detected",
    "confidenceScore": 0-100,
    "age": int,
    "sex": "M|F",
    "cholesterol": int,
    "bloodPressureSystolic": int,
    "bloodPressureDiastolic": int,
    "heartRate": int,
    "glucose": int,
    "smoker": 0|1,
    "exerciseFrequency": int,
}

# Fall Detection (published by tyshi.py)
FALL_DETECTION_PAYLOAD = {
    "impactArea": "Head|Hip|Torso|...",
    "riskLevel": "high|medium|low",
    "injuryDetail": "string description",
    "confidenceScore": 0-100,
    "poseData": "JSON serialized pose keypoints",
}

# Installation on Jetson Orin Nano

# 1. Install dependencies
sudo apt-get update
sudo apt-get install -y python3-pip python3-dev
pip3 install paho-mqtt xgboost mediapipe opencv-python numpy

# 2. Deploy predict.py and tyshi.py to Jetson
# Copy the scripts to your Jetson device:
# scp predict.py jetson@<jetson-ip>:/home/jetson/
# scp tyshi.py jetson@<jetson-ip>:/home/jetson/

# 3. Run scripts as background services
# Option A: Using systemd (recommended)
# Create /etc/systemd/system/health-predict.service
# Create /etc/systemd/system/health-tyshi.service

# Option B: Using screen or tmux
# screen -S predict python3 predict.py
# screen -S tyshi python3 tyshi.py

# 4. Monitor logs
# journalctl -u health-predict -f
# journalctl -u health-tyshi -f`;

  const copyToClipboard = (code: string, key: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(key);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const downloadCode = (code: string, filename: string) => {
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/plain;charset=utf-8," + encodeURIComponent(code)
    );
    element.setAttribute("download", filename);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Jetson Integration
          </h1>
          <p className="text-muted-foreground">
            Complete guide to integrating predict.py and tyshi.py with the health monitoring dashboard
          </p>
        </div>

        {/* Overview */}
        <Card className="health-card mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Overview</h2>
          <p className="text-foreground mb-4">
            This dashboard receives real-time health data from your NVIDIA Jetson Orin Nano via MQTT. Two Python scripts run on the Jetson:
          </p>
          <ul className="space-y-2 text-foreground">
            <li>
              <strong>predict.py:</strong> Runs XGBoost heart disease prediction model and publishes results to <code className="bg-muted px-2 py-1 rounded text-sm">health/heart/prediction</code>
            </li>
            <li>
              <strong>tyshi.py:</strong> Uses MediaPipe for fall/impact detection and publishes to <code className="bg-muted px-2 py-1 rounded text-sm">health/activity/fall</code>
            </li>
          </ul>
        </Card>

        {/* Code Snippets */}
        <div className="space-y-8">
          {/* predict.py */}
          <Card className="health-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">predict.py</h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(predictPyCode, "predict")}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copiedCode === "predict" ? "Copied" : "Copy"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadCode(predictPyCode, "predict.py")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              XGBoost heart disease prediction model integration with MQTT
            </p>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs text-foreground">
              <code>{predictPyCode}</code>
            </pre>
          </Card>

          {/* tyshi.py */}
          <Card className="health-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">tyshi.py</h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(tyshiPyCode, "tyshi")}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copiedCode === "tyshi" ? "Copied" : "Copy"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadCode(tyshiPyCode, "tyshi.py")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              MediaPipe fall detection with MQTT publishing
            </p>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs text-foreground">
              <code>{tyshiPyCode}</code>
            </pre>
          </Card>

          {/* MQTT Configuration */}
          <Card className="health-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-foreground">
                MQTT Configuration
              </h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyToClipboard(mqttConfigCode, "config")}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  {copiedCode === "config" ? "Copied" : "Copy"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => downloadCode(mqttConfigCode, "mqtt_config.txt")}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Broker configuration, topic structure, and installation guide
            </p>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs text-foreground">
              <code>{mqttConfigCode}</code>
            </pre>
          </Card>
        </div>

        {/* Quick Start */}
        <Card className="health-card mt-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Quick Start</h2>
          <ol className="space-y-3 text-foreground">
            <li>
              <strong>1. Prepare Jetson:</strong> Install dependencies and deploy scripts
            </li>
            <li>
              <strong>2. Start Services:</strong> Run predict.py and tyshi.py on your Jetson
            </li>
            <li>
              <strong>3. Connect Dashboard:</strong> Click "Connect" on the dashboard to establish MQTT connection
            </li>
            <li>
              <strong>4. Monitor Data:</strong> Watch real-time predictions and fall detection events
            </li>
            <li>
              <strong>5. Configure Alerts:</strong> Set thresholds for notifications
            </li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
