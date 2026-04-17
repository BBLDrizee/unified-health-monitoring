import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function Settings() {
  const { isAuthenticated } = useAuth();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  // Queries
  const thresholdsQuery = trpc.health.getAlertThresholds.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Mutations
  const updateThresholdsMutation = trpc.health.updateAlertThresholds.useMutation();

  // Form state
  const [formData, setFormData] = useState({
    heartDiseaseConfidenceThreshold: 70,
    fallDetectionRiskLevel: "high" as "high" | "medium" | "low",
    enableHeartDiseaseAlerts: true,
    enableFallDetectionAlerts: true,
    enableEmailNotifications: true,
    enableInAppNotifications: true,
  });

  // Sync form with query data
  useEffect(() => {
    if (thresholdsQuery.data) {
      setFormData({
        heartDiseaseConfidenceThreshold:
          thresholdsQuery.data.heartDiseaseConfidenceThreshold || 70,
        fallDetectionRiskLevel:
          (thresholdsQuery.data.fallDetectionRiskLevel as "high" | "medium" | "low") || "high",
        enableHeartDiseaseAlerts:
          thresholdsQuery.data.enableHeartDiseaseAlerts === 1,
        enableFallDetectionAlerts:
          thresholdsQuery.data.enableFallDetectionAlerts === 1,
        enableEmailNotifications:
          thresholdsQuery.data.enableEmailNotifications === 1,
        enableInAppNotifications:
          thresholdsQuery.data.enableInAppNotifications === 1,
      });
    }
  }, [thresholdsQuery.data]);

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      await updateThresholdsMutation.mutateAsync({
        heartDiseaseConfidenceThreshold: formData.heartDiseaseConfidenceThreshold,
        fallDetectionRiskLevel: formData.fallDetectionRiskLevel,
        enableHeartDiseaseAlerts: formData.enableHeartDiseaseAlerts ? 1 : 0,
        enableFallDetectionAlerts: formData.enableFallDetectionAlerts ? 1 : 0,
        enableEmailNotifications: formData.enableEmailNotifications ? 1 : 0,
        enableInAppNotifications: formData.enableInAppNotifications ? 1 : 0,
      });
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error("Failed to save settings:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Settings</h1>
          <p className="text-muted-foreground">
            Sign in to access settings
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
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure alert thresholds and notification preferences
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8 max-w-2xl">
        {/* Status Messages */}
        {saveStatus === "success" && (
          <div className="mb-6 p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-sm text-foreground">Settings saved successfully</p>
          </div>
        )}

        {saveStatus === "error" && (
          <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-foreground">Failed to save settings</p>
          </div>
        )}

        {/* Heart Disease Settings */}
        <Card className="health-card mb-6">
          <h2 className="text-lg font-bold text-foreground mb-6">
            Heart Disease Alerts
          </h2>

          <div className="space-y-6">
            <div>
              <Label className="metric-label">Confidence Threshold</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Alert triggers when confidence score exceeds this percentage
              </p>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.heartDiseaseConfidenceThreshold}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      heartDiseaseConfidenceThreshold: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-24"
                />
                <span className="text-foreground">%</span>
              </div>
              <div className="mt-3 w-full bg-muted rounded-full h-2">
                <div
                  className="bg-secondary h-2 rounded-full transition-all"
                  style={{
                    width: `${formData.heartDiseaseConfidenceThreshold}%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="enableHeartDiseaseAlerts"
                  checked={formData.enableHeartDiseaseAlerts}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      enableHeartDiseaseAlerts: checked as boolean,
                    })
                  }
                />
                <Label
                  htmlFor="enableHeartDiseaseAlerts"
                  className="text-foreground cursor-pointer"
                >
                  Enable heart disease alerts
                </Label>
              </div>
            </div>
          </div>
        </Card>

        {/* Fall Detection Settings */}
        <Card className="health-card mb-6">
          <h2 className="text-lg font-bold text-foreground mb-6">
            Fall Detection Alerts
          </h2>

          <div className="space-y-6">
            <div>
              <Label className="metric-label">Risk Level Threshold</Label>
              <p className="text-xs text-muted-foreground mb-3">
                Alert triggers when risk level meets or exceeds this level
              </p>
              <Select
                value={formData.fallDetectionRiskLevel}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    fallDetectionRiskLevel: value as "high" | "medium" | "low",
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium or Higher</SelectItem>
                  <SelectItem value="low">Low or Higher</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="enableFallDetectionAlerts"
                  checked={formData.enableFallDetectionAlerts}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      enableFallDetectionAlerts: checked as boolean,
                    })
                  }
                />
                <Label
                  htmlFor="enableFallDetectionAlerts"
                  className="text-foreground cursor-pointer"
                >
                  Enable fall detection alerts
                </Label>
              </div>
            </div>
          </div>
        </Card>

        {/* Notification Preferences */}
        <Card className="health-card mb-6">
          <h2 className="text-lg font-bold text-foreground mb-6">
            Notification Preferences
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Checkbox
                id="enableEmailNotifications"
                checked={formData.enableEmailNotifications}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    enableEmailNotifications: checked as boolean,
                  })
                }
              />
              <Label
                htmlFor="enableEmailNotifications"
                className="text-foreground cursor-pointer"
              >
                Email notifications
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="enableInAppNotifications"
                checked={formData.enableInAppNotifications}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    enableInAppNotifications: checked as boolean,
                  })
                }
              />
              <Label
                htmlFor="enableInAppNotifications"
                className="text-foreground cursor-pointer"
              >
                In-app notifications
              </Label>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saveStatus === "saving"}
          className="w-full"
          size="lg"
        >
          {saveStatus === "saving" ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}
