import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Activity, Heart, Wifi, WifiOff, LogOut } from "lucide-react";

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [wsConnected, setWsConnected] = useState(false);
  const [latestHeartEvent, setLatestHeartEvent] = useState<any>(null);
  const [latestFallEvent, setLatestFallEvent] = useState<any>(null);

  // Queries
  const heartEventsQuery = trpc.health.getHeartDiseaseEvents.useQuery(
    { limit: 1 },
    { enabled: isAuthenticated }
  );
  const fallEventsQuery = trpc.health.getFallDetectionEvents.useQuery(
    { limit: 1 },
    { enabled: isAuthenticated }
  );
  const mqttStatusQuery = trpc.health.getMqttStatus.useQuery(
    undefined,
    { enabled: isAuthenticated, refetchInterval: 5000 }
  );
  const alertThresholdsQuery = trpc.health.getAlertThresholds.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Initialize MQTT
  const initMqttMutation = trpc.health.initializeMqtt.useMutation();

  useEffect(() => {
    if (heartEventsQuery.data?.length) {
      setLatestHeartEvent(heartEventsQuery.data[0]);
    }
  }, [heartEventsQuery.data]);

  useEffect(() => {
    if (fallEventsQuery.data?.length) {
      setLatestFallEvent(fallEventsQuery.data[0]);
    }
  }, [fallEventsQuery.data]);

  const handleInitMqtt = async () => {
    try {
      await initMqttMutation.mutateAsync({
        brokerUrl: "broker.emqx.io",
        brokerPort: 8083,
      });
    } catch (error) {
      console.error("Failed to initialize MQTT:", error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Health Monitoring
          </h1>
          <p className="text-muted-foreground mb-8">
            Sign in to access your health monitoring dashboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Health Monitoring
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Real-time health data from Jetson Orin Nano
              </p>
            </div>
            <div className="flex items-center gap-4">
              {mqttStatusQuery.data?.isConnected ? (
                <div className="flex items-center gap-2 text-primary">
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm font-medium">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm font-medium">Disconnected</span>
                </div>
              )}
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/'} className="text-muted-foreground hover:text-foreground">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container py-8">
        {/* MQTT Status Card */}
        {!mqttStatusQuery.data?.isConnected && (
          <Card className="mb-8 p-6 border-primary/20 bg-primary/5">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground">
                    MQTT Connection Required
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Connect to your MQTT broker to receive real-time health data from your Jetson device.
                  </p>
                </div>
              </div>
              <Button
                onClick={handleInitMqtt}
                disabled={initMqttMutation.isPending}
                className="flex-shrink-0"
              >
                {initMqttMutation.isPending ? "Connecting..." : "Connect"}
              </Button>
            </div>
          </Card>
        )}

        {/* Monitoring Panels Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Heart Disease Prediction Panel */}
          <Card className="health-card">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Heart className="w-5 h-5 text-secondary" />
                  Cardiovascular Health
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  XGBoost Heart Disease Prediction
                </p>
              </div>
            </div>

            {latestHeartEvent ? (
              <div className="space-y-6">
                <div>
                  <div className="metric-label">Status</div>
                  <div className="metric-value capitalize mt-2">
                    {latestHeartEvent.status === "detected" ? (
                      <span className="text-secondary">Detected</span>
                    ) : (
                      <span className="text-primary">Not Detected</span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="metric-label">Confidence Score</div>
                  <div className="metric-value mt-2">
                    {latestHeartEvent.confidenceScore}%
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-3">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${latestHeartEvent.confidenceScore}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <div className="metric-label">Age</div>
                    <div className="text-lg font-semibold mt-1">
                      {latestHeartEvent.age || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="metric-label">Cholesterol</div>
                    <div className="text-lg font-semibold mt-1">
                      {latestHeartEvent.cholesterol || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="metric-label">BP Systolic</div>
                    <div className="text-lg font-semibold mt-1">
                      {latestHeartEvent.bloodPressureSystolic || "—"}
                    </div>
                  </div>
                  <div>
                    <div className="metric-label">Heart Rate</div>
                    <div className="text-lg font-semibold mt-1">
                      {latestHeartEvent.heartRate || "—"}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground pt-2">
                  Last updated: {new Date(latestHeartEvent.createdAt).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">
                  No prediction data yet. Waiting for Jetson inference...
                </p>
              </div>
            )}
          </Card>

          {/* Fall Detection Panel */}
          <Card className="health-card">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Activity Safety
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  MediaPipe Fall Detection
                </p>
              </div>
            </div>

            {latestFallEvent ? (
              <div className="space-y-6">
                <div>
                  <div className="metric-label">Impact Area</div>
                  <div className="metric-value capitalize mt-2">
                    {latestFallEvent.impactArea}
                  </div>
                </div>

                <div>
                  <div className="metric-label">Risk Level</div>
                  <div className={`metric-value capitalize mt-2 ${
                    latestFallEvent.riskLevel === "high"
                      ? "text-destructive"
                      : latestFallEvent.riskLevel === "medium"
                      ? "text-secondary"
                      : "text-primary"
                  }`}>
                    {latestFallEvent.riskLevel}
                  </div>
                </div>

                {latestFallEvent.injuryDetail && (
                  <div>
                    <div className="metric-label">Injury Detail</div>
                    <p className="text-sm text-foreground mt-2">
                      {latestFallEvent.injuryDetail}
                    </p>
                  </div>
                )}

                {latestFallEvent.confidenceScore && (
                  <div>
                    <div className="metric-label">Confidence Score</div>
                    <div className="text-lg font-semibold mt-2">
                      {latestFallEvent.confidenceScore}%
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mt-3">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{
                          width: `${latestFallEvent.confidenceScore}%`,
                        }}
                      />
                    </div>
                  </div>
                )}

                <div className="text-xs text-muted-foreground pt-2">
                  Last updated: {new Date(latestFallEvent.createdAt).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">
                  No fall detection events yet. Monitoring active...
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button variant="outline" className="w-full" onClick={() => window.location.href = '/event-history'}>
            View Full History
          </Button>
          <Button variant="outline" className="w-full" onClick={() => window.location.href = '/settings'}>
            Configure Thresholds
          </Button>
          <Button variant="outline" className="w-full" onClick={() => window.location.href = '/jetson-integration'}>
            Jetson Integration
          </Button>
        </div>
      </div>
    </div>
  );
}
