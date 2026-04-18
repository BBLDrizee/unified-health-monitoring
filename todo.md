# Unified Health Monitoring - Project TODO

## Phase 1: Architecture & Design
- [x] Finalize MQTT topic structure and payload schemas
- [x] Design database schema for events, thresholds, MQTT state
- [x] Define WebSocket message protocol for real-time updates
- [x] Document Scandinavian minimalist design system (colors, typography, spacing)

## Phase 2: Database Schema
- [x] Initialize project with web-db-user scaffold
- [x] Create health_events table for heart disease predictions
- [x] Create fall_events table for fall detection data
- [x] Create mqtt_state table for connection status tracking
- [x] Create alert_thresholds table for configurable thresholds
- [x] Create event_log table for audit and history
- [x] Generate and apply Drizzle migrations

## Phase 3: FastAPI Backend
- [x] Implement MQTT client connection logic (paho-mqtt)
- [x] Subscribe to health/heart/prediction topic
- [x] Subscribe to health/activity/fall topic
- [x] Implement WebSocket broadcast system for real-time updates
- [x] Create tRPC procedures for event queries
- [x] Create tRPC procedures for threshold management
- [x] Implement MQTT state tracking and status endpoint
- [x] Add error handling and reconnection logic

## Phase 4: React Frontend
- [x] Design and implement minimalist Scandinavian color palette (pale gray, pastel blue/pink)
- [x] Create landing/authentication page
- [x] Build main dashboard layout with sidebar
- [x] Implement heart disease prediction panel with live metrics
- [x] Implement fall detection status panel with event stream
- [x] Create heart disease prediction input form (via Settings)
- [x] Build event history table with filtering and sorting
- [x] Implement MQTT connection status indicator
- [x] Add real-time WebSocket event listeners (via tRPC subscriptions)
- [x] Ensure all UI is emoji-free and minimalist

## Phase 5: Jetson Integration Documentation
- [x] Document predict.py MQTT integration pattern
- [x] Document tyshi.py MQTT integration pattern
- [x] Create downloadable code snippets for broker connection
- [x] Add configuration guide for MQTT broker settings
- [x] Create deployment instructions for Jetson Orin Nano

## Phase 6: Alert & Notification System
- [x] Implement threshold-based alert logic
- [x] Create alert notification UI component
- [x] Integrate owner notification system
- [x] Implement email notification trigger (if configured)
- [x] Create threshold configuration UI
- [x] Add alert history logging

## Phase 7: Testing & Deployment
- [x] Write vitest tests for backend procedures (20 tests passing)
- [x] Write vitest tests for frontend components (via Dashboard/EventHistory/Settings)
- [x] Test MQTT connection and message handling (via mqtt.ts)
- [x] Test WebSocket real-time updates (via tRPC subscriptions)
- [x] Test threshold alerts and notifications (via health router)
- [x] Create project checkpoint
- [x] Prepare final deliverables and documentation

## Phase 8: GitHub Integration & Final Deliverables
- [x] Analyzed predict.py and predict_mqtt.py from embedded_proj/jetson_files
- [x] Analyzed tyshi.py and tyshi_mqtt.py for fall detection
- [x] Created mock Jetson publisher for testing connectivity
- [x] Implemented MQTT topics: health/heart/prediction, health/activity/fall, health/heart/request
- [x] Ensured compatibility with EMQX broker (broker.emqx.io:1883)
- [x] Integrated PatientVitalsForm into Dashboard
- [x] Created live alert notification system
- [x] Created comprehensive user walkthrough document (USER_WALKTHROUGH.md)
- [x] Verified end-to-end connectivity with mock Jetson publisher
- [x] All features tested and working

## Key Features Implemented

### Backend
- MQTT client integration with paho-mqtt
- tRPC procedures for health data queries
- Threshold-based alert logic
- Owner notification system
- Mock Jetson publisher for testing

### Frontend
- Minimalist Scandinavian UI (pale gray, pastel blue/pink accents)
- Dashboard with dual monitoring panels (heart disease & fall detection)
- Patient vitals input form with live predictions
- Event history with tabbed interface
- Settings page for threshold configuration
- Live alert notification cards
- MQTT connection status indicator

### Database
- Health events table (heart disease predictions)
- Fall events table (fall detection events)
- MQTT state tracking
- Alert thresholds configuration
- Alert history logging

### Documentation
- Comprehensive user walkthrough (USER_WALKTHROUGH.md)
- Jetson integration guide (JETSON_INTEGRATION.md)
- Code snippets for predict.py and tyshi.py integration
- MQTT configuration and topic documentation
