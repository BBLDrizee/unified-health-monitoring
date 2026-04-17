import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Activity, AlertCircle } from "lucide-react";

export default function EventHistory() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("heart");

  // Queries
  const heartEventsQuery = trpc.health.getHeartDiseaseEvents.useQuery(
    { limit: 100 },
    { enabled: isAuthenticated }
  );
  const fallEventsQuery = trpc.health.getFallDetectionEvents.useQuery(
    { limit: 100 },
    { enabled: isAuthenticated }
  );
  const alertHistoryQuery = trpc.health.getAlertHistory.useQuery(
    { limit: 100 },
    { enabled: isAuthenticated }
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Event History
          </h1>
          <p className="text-muted-foreground">
            Sign in to view your event history
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
          <h1 className="text-3xl font-bold text-foreground">Event History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse all recorded health events and alerts
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="heart">Heart Disease</TabsTrigger>
            <TabsTrigger value="fall">Fall Detection</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
          </TabsList>

          {/* Heart Disease Events */}
          <TabsContent value="heart" className="mt-6">
            <Card className="health-card">
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Heart className="w-5 h-5 text-secondary" />
                Heart Disease Predictions
              </h2>

              {heartEventsQuery.isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading events...</p>
                </div>
              ) : heartEventsQuery.data && heartEventsQuery.data.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Timestamp
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Confidence
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Age
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Cholesterol
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          BP
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {heartEventsQuery.data.map((event, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-border hover:bg-muted/50"
                        >
                          <td className="py-3 px-4 text-foreground">
                            {new Date(event.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                event.status === "detected"
                                  ? "bg-secondary/20 text-secondary"
                                  : "bg-primary/20 text-primary"
                              }`}
                            >
                              {event.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-foreground">
                            {event.confidenceScore}%
                          </td>
                          <td className="py-3 px-4 text-foreground">
                            {event.age || "—"}
                          </td>
                          <td className="py-3 px-4 text-foreground">
                            {event.cholesterol || "—"}
                          </td>
                          <td className="py-3 px-4 text-foreground">
                            {event.bloodPressureSystolic || "—"}
                            {event.bloodPressureDiastolic
                              ? `/${event.bloodPressureDiastolic}`
                              : ""}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No heart disease events recorded yet
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Fall Detection Events */}
          <TabsContent value="fall" className="mt-6">
            <Card className="health-card">
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Fall Detection Events
              </h2>

              {fallEventsQuery.isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading events...</p>
                </div>
              ) : fallEventsQuery.data && fallEventsQuery.data.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Timestamp
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Impact Area
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Risk Level
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Confidence
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Details
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {fallEventsQuery.data.map((event, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-border hover:bg-muted/50"
                        >
                          <td className="py-3 px-4 text-foreground">
                            {new Date(event.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-foreground">
                            {event.impactArea}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                event.riskLevel === "high"
                                  ? "bg-destructive/20 text-destructive"
                                  : event.riskLevel === "medium"
                                  ? "bg-secondary/20 text-secondary"
                                  : "bg-primary/20 text-primary"
                              }`}
                            >
                              {event.riskLevel}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-foreground">
                            {event.confidenceScore || "—"}%
                          </td>
                          <td className="py-3 px-4 text-foreground text-xs">
                            {event.injuryDetail || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No fall detection events recorded yet
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Alert History */}
          <TabsContent value="alerts" className="mt-6">
            <Card className="health-card">
              <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
                Alert History
              </h2>

              {alertHistoryQuery.isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading alerts...</p>
                </div>
              ) : alertHistoryQuery.data && alertHistoryQuery.data.length > 0 ? (
                <div className="space-y-3">
                  {alertHistoryQuery.data.map((alert, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-lg border ${
                        alert.severity === "critical"
                          ? "bg-destructive/10 border-destructive/20"
                          : alert.severity === "high"
                          ? "bg-secondary/10 border-secondary/20"
                          : alert.severity === "medium"
                          ? "bg-primary/10 border-primary/20"
                          : "bg-muted border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground capitalize">
                              {alert.alertType.replace("_", " ")}
                            </span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                alert.severity === "critical"
                                  ? "bg-destructive/20 text-destructive"
                                  : alert.severity === "high"
                                  ? "bg-secondary/20 text-secondary"
                                  : alert.severity === "medium"
                                  ? "bg-primary/20 text-primary"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {alert.severity}
                            </span>
                          </div>
                          <p className="text-sm text-foreground mb-2">
                            {alert.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>
                              {new Date(alert.createdAt).toLocaleString()}
                            </span>
                            {alert.notificationSent ? (
                              <span className="text-primary">
                                Notification sent
                              </span>
                            ) : (
                              <span className="text-muted-foreground">
                                No notification
                              </span>
                            )}
                            {alert.acknowledged && (
                              <span className="text-primary">Acknowledged</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No alerts recorded yet
                  </p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
