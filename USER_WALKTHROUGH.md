# Unified Health Monitoring Dashboard - User Walkthrough

## Overview

The Unified Health Monitoring Dashboard is a real-time health monitoring system that integrates with NVIDIA Jetson Orin Nano devices via MQTT. It displays live heart disease predictions (XGBoost) and fall detection alerts (MediaPipe) in a clean, minimalist interface.

---

## Getting Started

### 1. Accessing the Dashboard

1. Navigate to your deployed website (e.g., `https://healthdash-dekdhb97.manus.space`)
2. Click **Sign In** to authenticate with your Manus account
3. You will be redirected to the main dashboard

### 2. Initial Setup: Connecting to MQTT Broker

When you first access the dashboard, you will see an **MQTT Connection Required** card at the top.

**To connect to the MQTT broker:**

1. Click the **Connect** button
2. The system will attempt to connect to the default MQTT broker (`broker.emqx.io:8083`)
3. Once connected, you will see a green **Connected** indicator in the top-right corner
4. The MQTT status will update to show real-time connection state

**Note:** The connection is required to receive live health data from your Jetson device.

---

## Main Dashboard Features

### Heart Disease Prediction Panel (Left)

This panel displays the latest heart disease prediction from the XGBoost model running on your Jetson device.

**What you see:**
- **Status**: "Detected" (red) or "Not Detected" (blue)
- **Confidence Score**: Percentage (0-100%) indicating model confidence
- **Vital Signs**: Age, Cholesterol, Blood Pressure (Systolic), Heart Rate
- **Last Updated**: Timestamp of the most recent prediction

**How it works:**
- The Jetson device continuously monitors patient vitals
- When new data is available, it publishes to the `health/heart/prediction` MQTT topic
- The dashboard receives and displays the latest prediction in real-time

---

### Fall Detection Panel (Right)

This panel displays the latest fall detection event from the MediaPipe pose estimation model.

**What you see:**
- **Impact Area**: Which body part was impacted (e.g., "Head", "Left Hip", "Right Knee")
- **Risk Level**: "High", "Medium", or "Low" based on injury severity
- **Injury Detail**: Potential injuries associated with the impact
- **Confidence Score**: Percentage indicating detection confidence
- **Last Updated**: Timestamp of the most recent fall event

**How it works:**
- The Jetson device monitors video feed for falls using MediaPipe pose detection
- When a fall is detected, it publishes to the `health/activity/fall` MQTT topic
- The dashboard receives and displays the event with injury risk assessment

---

## Heart Disease Risk Assessment Form

Below the monitoring panels, you will find the **Heart Disease Risk Assessment Form**.

### Entering Patient Vitals

**Basic Vitals (Required):**
1. **Age**: Patient age in years (0-120)
2. **Sex**: Select "Male" or "Female"
3. **Cholesterol**: Serum cholesterol level (mg/dL)
4. **Glucose**: Blood glucose level (mg/dL)
5. **Blood Pressure Systolic**: Systolic pressure (mm Hg)
6. **Blood Pressure Diastolic**: Diastolic pressure (mm Hg)
7. **Heart Rate**: Resting heart rate (bpm)
8. **Smoker**: Select "Yes" or "No"
9. **Exercise Frequency**: Days per week (0-7)

**Advanced Parameters (Optional):**
Click **Show Advanced Parameters** to enter additional clinical data:
- Chest Pain Type (0-3)
- Fasting Blood Sugar (Yes/No)
- Resting ECG Results (0-2)
- Exercise Induced Angina (Yes/No)
- ST Depression (0-6.2)
- ST Slope (0-2)
- Major Vessels Colored (0-4)
- Thalassemia Type (0-3)

### Getting a Prediction

1. Fill in the required basic vitals
2. Optionally add advanced parameters
3. Click **Get Prediction**
4. The form will send the data to your Jetson device via MQTT
5. The Jetson will run the XGBoost model and return a prediction
6. The result will display immediately below the form showing:
   - **Status**: "Heart Disease Risk Detected" or "No Heart Disease Detected"
   - **Confidence Score**: Model confidence percentage
   - **Probability**: Decimal probability (0.0-1.0)

**Alert:** If the confidence score exceeds 70%, a red alert card will appear and you will receive a toast notification recommending medical consultation.

---

## Event History

Click **View Full History** to access the Event History page.

### Heart Disease Events Tab

Displays all heart disease predictions with:
- Timestamp
- Status (Detected/Not Detected)
- Confidence Score
- Patient Vitals (Age, Cholesterol, BP, Heart Rate)

### Fall Detection Events Tab

Displays all fall detection events with:
- Timestamp
- Impact Area
- Risk Level (High/Medium/Low)
- Injury Details
- Confidence Score

### Alert History Tab

Displays all triggered alerts with:
- Timestamp
- Alert Type (Heart Disease/Fall Detection)
- Severity
- Whether notification was sent
- Whether alert was acknowledged

---

## Configure Thresholds

Click **Configure Thresholds** to customize alert settings.

### Heart Disease Alert Settings

- **Confidence Threshold**: Set the confidence score (0-100%) above which alerts trigger
  - Default: 70%
  - Example: If set to 60%, alerts trigger when confidence exceeds 60%

- **Enable Heart Disease Alerts**: Toggle on/off to enable/disable heart disease alerts

### Fall Detection Alert Settings

- **Risk Level Threshold**: Select the minimum risk level to trigger alerts
  - Options: "Low", "Medium", "High"
  - Example: If set to "Medium", only medium and high-risk falls trigger alerts

- **Enable Fall Detection Alerts**: Toggle on/off to enable/disable fall alerts

### Notification Preferences

- **Enable Email Notifications**: Send alert emails to the owner
- **Enable In-App Notifications**: Show toast notifications in the dashboard

**Note:** Changes are saved automatically. The system will use these thresholds to determine when to send alerts.

---

## Live Alert Notifications

When an alert is triggered, you will see:

1. **Alert Card**: A prominent card appears at the top of the dashboard with:
   - Alert type (Fall Detected / High Heart Disease Risk)
   - Severity indicator
   - Detailed message
   - Dismiss button

2. **Toast Notification**: A temporary notification appears in the bottom-right corner

3. **Owner Notification**: If enabled, the system owner receives a notification

### Dismissing Alerts

Click the **Dismiss** button on the alert card to close it. The alert will remain in the Alert History for audit purposes.

---

## Jetson Integration

Click **Jetson Integration** to view integration documentation and code snippets.

### What You'll Find

- **predict.py Integration**: Code showing how to integrate the XGBoost heart disease model with MQTT
- **tyshi.py Integration**: Code showing how to integrate the MediaPipe fall detection with MQTT
- **MQTT Configuration**: Broker settings and topic structure
- **Quick Start Guide**: Step-by-step instructions for deploying on Jetson Orin Nano

### MQTT Topics

- **Publish (Jetson → Dashboard):**
  - `health/heart/prediction`: Heart disease predictions
  - `health/activity/fall`: Fall detection events

- **Subscribe (Dashboard → Jetson):**
  - `health/heart/request`: Patient vitals for on-demand predictions

### Example Payload Formats

**Heart Disease Prediction:**
```json
{
  "status": "detected",
  "confidenceScore": 75,
  "age": 55,
  "cholesterol": 240,
  "bloodPressureSystolic": 120,
  "bloodPressureDiastolic": 80,
  "heartRate": 75,
  "timestamp": "2026-04-18T07:40:00Z"
}
```

**Fall Detection Event:**
```json
{
  "impactArea": "Head",
  "riskLevel": "high",
  "injuryDetail": "Traumatic brain injury | Cervical fracture | Concussion",
  "confidenceScore": 85,
  "timestamp": "2026-04-18T07:40:00Z"
}
```

---

## Troubleshooting

### MQTT Connection Issues

**Problem:** "Disconnected" status persists
- **Solution 1**: Check that your Jetson device is connected to the network
- **Solution 2**: Verify the MQTT broker is running (default: `broker.emqx.io:8083`)
- **Solution 3**: Click the **Connect** button again to retry

### No Prediction Data Appearing

**Problem:** "No prediction data yet" message
- **Solution 1**: Ensure MQTT is connected (green indicator)
- **Solution 2**: Verify your Jetson is publishing predictions to `health/heart/prediction` topic
- **Solution 3**: Check that the XGBoost model is loaded on the Jetson

### No Fall Detection Events

**Problem:** "No fall detection events yet" message
- **Solution 1**: Ensure MQTT is connected
- **Solution 2**: Verify the camera is connected to the Jetson
- **Solution 3**: Check that tyshi.py is running and publishing to `health/activity/fall` topic

### Alerts Not Triggering

**Problem:** Predictions appear but no alerts
- **Solution 1**: Check threshold settings (Configure Thresholds page)
- **Solution 2**: Verify "Enable Alerts" is toggled on
- **Solution 3**: Check that confidence score exceeds the configured threshold

---

## Best Practices

1. **Regular Monitoring**: Check the dashboard regularly for new predictions and fall events
2. **Threshold Tuning**: Adjust alert thresholds based on your specific use case
3. **Medical Consultation**: Always consult with healthcare providers for high-risk predictions
4. **Emergency Response**: For fall detection alerts, verify the patient's safety immediately
5. **Data Review**: Periodically review event history to identify trends
6. **Jetson Maintenance**: Ensure the Jetson device has adequate power and network connectivity

---

## Support & Documentation

For detailed technical documentation on Jetson integration, see:
- `JETSON_INTEGRATION.md` - Comprehensive integration guide
- `README.md` - Project overview and setup instructions

For issues or questions, contact your system administrator.

---

## Key Takeaways

- **Dashboard**: Real-time view of latest predictions and fall events
- **Form**: Submit patient vitals for on-demand predictions
- **History**: Review all past events and alerts
- **Settings**: Customize alert thresholds and notification preferences
- **Integration**: Connect your Jetson device via MQTT for live monitoring

Enjoy using the Unified Health Monitoring Dashboard!
