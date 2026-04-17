# Unified Health Monitoring Web App

A production-ready, minimalist health monitoring dashboard that integrates with NVIDIA Jetson Orin Nano devices via MQTT. The application displays real-time heart disease predictions (XGBoost) and fall detection alerts (MediaPipe) in a clean, Scandinavian-inspired interface.

## Features

### Core Capabilities

- **Real-time MQTT Integration**: Subscribe to Jetson-published health data via MQTT broker
- **Heart Disease Monitoring**: Display XGBoost model predictions with confidence scores
- **Fall Detection Alerts**: Stream MediaPipe fall/impact detection events with risk assessment
- **Event History**: Complete audit log of all predictions and detections with timestamps
- **Configurable Thresholds**: Owner-controlled alert triggers for both heart disease and fall detection
- **Alert Notifications**: Owner notifications triggered when thresholds are exceeded
- **MQTT Connection Status**: Real-time indicator of broker connectivity and subscription status

### Design

- **Minimalist Scandinavian Aesthetic**: Pale cool gray background with pastel blue and blush pink accents
- **Emoji-Free UI**: Clean typography and geometric shapes for visual interest
- **Responsive Layout**: Mobile-first design optimized for 9:16 aspect ratio
- **Accessible Components**: Built with shadcn/ui and Tailwind CSS for consistency

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Jetson Orin Nano                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ predict.py (XGBoost)    tyshi.py (MediaPipe)         │   │
│  │ - Heart disease model   - Fall detection             │   │
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
│   - React Frontend (Real-time Updates)         │
│   - MySQL Database (Event History)             │
└────────────────────────────────────────────────┘
```

## Technology Stack

### Backend
- **Framework**: Express.js with tRPC
- **MQTT**: paho-mqtt for Jetson integration
- **Database**: MySQL with Drizzle ORM
- **Authentication**: Manus OAuth

### Frontend
- **Framework**: React 19
- **Styling**: Tailwind CSS 4 with custom Scandinavian palette
- **Components**: shadcn/ui
- **State Management**: tRPC React Query hooks

### Infrastructure
- **Hosting**: Manus platform with auto-scaling
- **Database**: Managed MySQL
- **MQTT Broker**: EMQX (public) or self-hosted Mosquitto

## Quick Start

### Prerequisites

- Node.js 22.x
- pnpm 10.x
- MySQL 8.0+
- MQTT Broker (default: broker.emqx.io)

### Installation

```bash
# Clone repository
git clone <repo-url>
cd unified-health-monitoring

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
pnpm drizzle-kit migrate

# Start development server
pnpm dev
```

### Access Dashboard

1. Navigate to `http://localhost:3000`
2. Sign in with Manus OAuth
3. Click "Connect" to initialize MQTT connection
4. Deploy predict.py and tyshi.py to your Jetson
5. Monitor real-time health data

## Database Schema

### Tables

- **users**: Authentication and user management
- **heart_disease_events**: XGBoost prediction results
- **fall_detection_events**: MediaPipe fall detection data
- **mqtt_state**: MQTT broker connection status
- **alert_thresholds**: Configurable alert settings per user
- **alert_history**: Alert audit log with delivery tracking

## MQTT Topics

### Published (from Jetson)

**`health/heart/prediction`**
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

**`health/activity/fall`**
```json
{
  "impactArea": "Head|Hip|Torso",
  "riskLevel": "high|medium|low",
  "injuryDetail": "Fall detected at Head with high impact",
  "confidenceScore": 85,
  "poseData": "[{\"x\": 0.5, \"y\": 0.3, \"z\": 0.1}, ...]"
}
```

## API Endpoints (tRPC)

### Health Monitoring

- `health.getHeartDiseaseEvents(limit)` - Retrieve heart disease predictions
- `health.getFallDetectionEvents(limit)` - Retrieve fall detection events
- `health.getMqttStatus()` - Get MQTT connection status
- `health.initializeMqtt(brokerUrl, brokerPort)` - Connect to MQTT broker
- `health.sendHeartPredictionRequest(vitals)` - Request inference on Jetson
- `health.getAlertThresholds()` - Get current alert configuration
- `health.updateAlertThresholds(config)` - Update alert thresholds
- `health.getAlertHistory(limit)` - Retrieve alert audit log

## Configuration

### Alert Thresholds

Configure in the Settings page:

- **Heart Disease Confidence Threshold**: 0-100% (default: 70%)
- **Fall Detection Risk Level**: high/medium/low (default: high)
- **Email Notifications**: Enable/disable
- **In-App Notifications**: Enable/disable

### MQTT Broker

Default: `broker.emqx.io:8083` (WebSocket)

For production, consider:
- Self-hosted Mosquitto
- AWS IoT Core
- Azure IoT Hub
- HiveMQ Cloud

## Jetson Integration

See [JETSON_INTEGRATION.md](./JETSON_INTEGRATION.md) for complete setup instructions.

### Quick Deploy

```bash
# On Jetson Orin Nano
pip install paho-mqtt xgboost mediapipe opencv-python numpy

# Copy scripts
scp predict.py jetson@<ip>:/home/jetson/
scp tyshi.py jetson@<ip>:/home/jetson/

# Run as systemd services
sudo systemctl start health-predict health-tyshi
```

## Development

### Project Structure

```
client/
  src/
    pages/
      Dashboard.tsx           # Main monitoring dashboard
      EventHistory.tsx        # Event history and filtering
      Settings.tsx            # Alert threshold configuration
      JetsonIntegration.tsx   # Integration documentation
      Home.tsx                # Landing/login page
    components/              # Reusable UI components
    lib/trpc.ts              # tRPC client setup
    index.css                # Scandinavian design tokens
server/
  routers/
    health.ts                # Health monitoring procedures
  mqtt.ts                     # MQTT client and handlers
  db.ts                       # Database query helpers
drizzle/
  schema.ts                   # Database schema
  migrations/                 # SQL migrations
```

### Running Tests

```bash
# Run all tests
pnpm test

# Watch mode
pnpm test --watch

# Coverage
pnpm test --coverage
```

### Building for Production

```bash
# Build frontend and backend
pnpm build

# Start production server
pnpm start
```

## Troubleshooting

### MQTT Connection Issues

```bash
# Test broker connectivity
mosquitto_sub -h broker.emqx.io -p 1883 -t "health/#"

# Check Jetson logs
ssh jetson@<ip> "sudo journalctl -u health-predict -f"
```

### Database Issues

```bash
# Reset migrations
pnpm drizzle-kit drop

# Regenerate schema
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### Frontend Build Errors

```bash
# Clear cache
rm -rf node_modules/.vite
pnpm install

# Rebuild
pnpm build
```

## Performance Optimization

### Jetson Side

- Reduce inference frequency (process every Nth frame)
- Use TensorRT for model acceleration
- Batch process predictions
- Optimize MediaPipe confidence thresholds

### Dashboard Side

- Implement WebSocket event streaming (in progress)
- Add data pagination for history tables
- Cache MQTT status updates
- Lazy load event history

## Security Considerations

1. **MQTT Authentication**: Enable username/password on broker
2. **TLS/SSL**: Use encrypted connections in production
3. **Data Privacy**: Ensure HIPAA compliance for health data
4. **Access Control**: Implement role-based permissions
5. **Audit Logging**: All events logged with timestamps

## Deployment

### Manus Platform

```bash
# Create checkpoint
pnpm webdev-save-checkpoint

# Click "Publish" in Management UI
# or use CLI
manus publish
```

### Self-Hosted

```bash
# Build Docker image
docker build -t health-monitoring .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=mysql://... \
  -e MQTT_BROKER=broker.emqx.io \
  health-monitoring
```

## Contributing

1. Create feature branch: `git checkout -b feature/name`
2. Make changes and test: `pnpm test`
3. Commit: `git commit -am "Add feature"`
4. Push: `git push origin feature/name`
5. Create pull request

## License

MIT

## Support

For issues, questions, or feature requests:
- GitHub Issues: [project-repo/issues](https://github.com/your-org/unified-health-monitoring/issues)
- Documentation: [JETSON_INTEGRATION.md](./JETSON_INTEGRATION.md)
- Email: support@example.com

## Roadmap

- [ ] Real-time WebSocket event streaming
- [ ] Advanced analytics and trend analysis
- [ ] Multi-user support with role-based access
- [ ] Mobile app (React Native)
- [ ] Integration with wearable devices
- [ ] Machine learning model versioning
- [ ] Automated alert escalation
- [ ] FHIR compliance for health data interoperability

## Acknowledgments

- NVIDIA Jetson documentation and community
- MediaPipe for pose detection
- XGBoost for gradient boosting
- Manus platform for hosting and OAuth
- shadcn/ui for component library
