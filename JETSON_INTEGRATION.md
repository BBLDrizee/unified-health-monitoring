# Jetson Orin Nano Integration Guide

This document provides complete instructions for integrating the Unified Health Monitoring dashboard with your NVIDIA Jetson Orin Nano running `predict.py` (XGBoost heart disease prediction) and `tyshi.py` (MediaPipe fall detection).

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  Jetson Orin Nano                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ predict.py (XGBoost)    tyshi.py (MediaPipe)         │   │
│  │ - Heart disease model   - Fall detection             │   │
│  │ - Inference on video    - Pose analysis              │   │
│  │ - MQTT publisher        - MQTT publisher             │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│                    MQTT Client                               │
└────────────────────────┼────────────────────────────────────┘
                         │
                    MQTT Broker
                  (broker.emqx.io)
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        │         WebSocket Bridge        │
        │                │                │
┌───────▼────────────────▼────────────────▼──────┐
│   Unified Health Monitoring Dashboard          │
│   - FastAPI Backend (MQTT Subscriber)          │
│   - React Frontend (Real-time WebSocket)       │
│   - Database (Event History & Thresholds)      │
└────────────────────────────────────────────────┘
```

## MQTT Topic Structure

### Published Topics (from Jetson)

**Heart Disease Prediction:**
- Topic: `health/heart/prediction`
- Frequency: On-demand or periodic
- Payload:
  ```json
  {
    "status": "detected|not_detected",
    "confidenceScore": 0-100,
    "age": 45,
    "sex": "M",
    "cholesterol": 240,
    "bloodPressureSystolic": 140,
    "bloodPressureDiastolic": 90,
    "heartRate": 75,
    "glucose": 120,
    "smoker": 0,
    "exerciseFrequency": 3
  }
  ```

**Fall Detection:**
- Topic: `health/activity/fall`
- Frequency: On detection
- Payload:
  ```json
  {
    "impactArea": "Head|Hip|Torso",
    "riskLevel": "high|medium|low",
    "injuryDetail": "Fall detected at Head with high impact",
    "confidenceScore": 85,
    "poseData": "[{\"x\": 0.5, \"y\": 0.3, \"z\": 0.1}, ...]"
  }
  ```

### Subscribed Topics (from Dashboard)

**Heart Disease Request:**
- Topic: `health/heart/request`
- Payload: Same as prediction payload (for manual inference requests)

## Installation on Jetson Orin Nano

### 1. System Setup

```bash
# Update system packages
sudo apt-get update
sudo apt-get upgrade -y

# Install Python development tools
sudo apt-get install -y python3-pip python3-dev python3-venv

# Create virtual environment (recommended)
python3 -m venv ~/health-monitor-env
source ~/health-monitor-env/bin/activate
```

### 2. Install Dependencies

```bash
# Core dependencies
pip install paho-mqtt==1.6.1
pip install xgboost==1.7.6
pip install mediapipe==0.8.11
pip install opencv-python==4.6.0.66
pip install numpy==1.23.5

# Optional: for GPU acceleration
pip install tensorrt
```

### 3. Deploy Scripts

Copy `predict.py` and `tyshi.py` to your Jetson:

```bash
# From your development machine
scp predict.py jetson@<jetson-ip>:/home/jetson/
scp tyshi.py jetson@<jetson-ip>:/home/jetson/

# SSH into Jetson
ssh jetson@<jetson-ip>
cd ~
```

### 4. Configure MQTT Broker

Edit the broker URL in both scripts (default: `broker.emqx.io`):

```python
# In predict.py and tyshi.py
BROKER_URL = "broker.emqx.io"
BROKER_PORT = 1883
```

For production, consider self-hosting Mosquitto:

```bash
# Install Mosquitto on Jetson
sudo apt-get install -y mosquitto mosquitto-clients

# Start service
sudo systemctl start mosquitto
sudo systemctl enable mosquitto

# Then use local broker
BROKER_URL = "localhost"
BROKER_PORT = 1883
```

### 5. Run as Background Services

#### Option A: Using systemd (Recommended)

Create `/etc/systemd/system/health-predict.service`:

```ini
[Unit]
Description=Health Monitoring - Heart Disease Prediction
After=network.target

[Service]
Type=simple
User=jetson
WorkingDirectory=/home/jetson
ExecStart=/home/jetson/health-monitor-env/bin/python3 /home/jetson/predict.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Create `/etc/systemd/system/health-tyshi.service`:

```ini
[Unit]
Description=Health Monitoring - Fall Detection
After=network.target

[Service]
Type=simple
User=jetson
WorkingDirectory=/home/jetson
ExecStart=/home/jetson/health-monitor-env/bin/python3 /home/jetson/tyshi.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start services:

```bash
sudo systemctl daemon-reload
sudo systemctl enable health-predict health-tyshi
sudo systemctl start health-predict health-tyshi

# Check status
sudo systemctl status health-predict
sudo systemctl status health-tyshi

# View logs
sudo journalctl -u health-predict -f
sudo journalctl -u health-tyshi -f
```

#### Option B: Using Screen/Tmux

```bash
# Terminal 1: predict.py
screen -S predict
source ~/health-monitor-env/bin/activate
python3 ~/predict.py

# Terminal 2: tyshi.py
screen -S tyshi
source ~/health-monitor-env/bin/activate
python3 ~/tyshi.py

# Detach with Ctrl+A then D
# Reattach with: screen -r predict
```

#### Option C: Using nohup

```bash
nohup python3 ~/predict.py > ~/predict.log 2>&1 &
nohup python3 ~/tyshi.py > ~/tyshi.log 2>&1 &

# Monitor logs
tail -f ~/predict.log
tail -f ~/tyshi.log
```

## Connecting to Dashboard

### 1. Access the Dashboard

Navigate to your deployed Unified Health Monitoring dashboard URL.

### 2. Authenticate

Sign in with your Manus account.

### 3. Connect MQTT Broker

1. Click the "Connect" button on the dashboard
2. Verify broker URL and port (default: `broker.emqx.io:8083`)
3. Dashboard will subscribe to:
   - `health/heart/prediction`
   - `health/activity/fall`

### 4. Monitor Real-Time Data

- **Cardiovascular Health Panel**: Displays latest heart disease prediction
- **Activity Safety Panel**: Shows latest fall detection event
- **Event History**: Browse all historical events
- **Alerts**: Receive notifications when thresholds are exceeded

## Configuration & Customization

### Alert Thresholds

Configure in the dashboard settings:

- **Heart Disease Confidence Threshold**: Default 70%
- **Fall Detection Risk Level**: Default "high"
- **Email Notifications**: Enable/disable
- **In-App Notifications**: Enable/disable

### Custom Models

To use your own XGBoost model in `predict.py`:

```python
# Load your model
model = xgb.Booster()
model.load_model('path/to/your/model.bin')

# Ensure input features match your model's expected order
# Update the features list in on_message() accordingly
```

### Custom Fall Detection Logic

Modify the `detect_fall()` function in `tyshi.py` to customize detection:

```python
def detect_fall(landmarks):
    # Your custom logic here
    # Return: (is_fall, impact_area, risk_level, confidence)
    pass
```

## Troubleshooting

### MQTT Connection Issues

```bash
# Test MQTT broker connectivity
mosquitto_sub -h broker.emqx.io -p 1883 -t "health/#"

# Publish test message
mosquitto_pub -h broker.emqx.io -p 1883 -t "health/test" -m "test"
```

### Check Jetson Logs

```bash
# For systemd services
sudo journalctl -u health-predict -n 50
sudo journalctl -u health-tyshi -n 50

# For nohup
tail -100 ~/predict.log
tail -100 ~/tyshi.log
```

### Network Connectivity

```bash
# Check internet connection
ping broker.emqx.io

# Check open ports
netstat -tuln | grep 1883

# Monitor network traffic
sudo iftop
```

### GPU/Memory Issues

```bash
# Check GPU memory
nvidia-smi

# Monitor system resources
top
htop

# Reduce inference frequency if needed
# Adjust frame skip or batch processing in scripts
```

## Performance Optimization

### For Jetson Orin Nano

1. **Reduce Inference Frequency**: Process every Nth frame instead of every frame
2. **Use TensorRT**: Convert models to TensorRT format for faster inference
3. **Batch Processing**: Group multiple predictions together
4. **Optimize MediaPipe**: Use lower confidence thresholds for faster detection

Example optimization:

```python
# In tyshi.py
FRAME_SKIP = 2  # Process every 2nd frame
frame_count = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    frame_count += 1
    if frame_count % FRAME_SKIP == 0:
        process_frame(frame)
```

## Security Considerations

1. **Use TLS/SSL for MQTT**: Enable in production
2. **Set MQTT Credentials**: Add username/password authentication
3. **Firewall Rules**: Restrict MQTT broker access
4. **Network Isolation**: Keep Jetson on secure network
5. **Data Privacy**: Ensure compliance with health data regulations

## Support & Resources

- **MQTT Documentation**: https://mqtt.org/
- **Paho MQTT Python**: https://github.com/eclipse/paho.mqtt.python
- **MediaPipe**: https://mediapipe.dev/
- **XGBoost**: https://xgboost.readthedocs.io/
- **Jetson Documentation**: https://developer.nvidia.com/embedded/jetson-orin-nano

## Next Steps

1. Deploy scripts to Jetson
2. Start services and verify MQTT connection
3. Access dashboard and click "Connect"
4. Configure alert thresholds
5. Monitor real-time health data
6. Review event history and trends
