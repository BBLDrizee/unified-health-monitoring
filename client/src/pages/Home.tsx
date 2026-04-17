import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isAuthenticated && !loading) {
      setLocation("/dashboard");
    }
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Health Monitoring
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Real-time health data from your Jetson Orin Nano. Monitor heart disease predictions and fall detection in one unified dashboard.
        </p>
        
        <div className="space-y-4">
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full"
          >
            Sign In
          </Button>
          
          <p className="text-xs text-muted-foreground">
            Secure authentication powered by Manus OAuth
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <h2 className="text-sm font-semibold text-foreground mb-4">
            Features
          </h2>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>Real-time MQTT integration with Jetson</li>
            <li>Heart disease prediction monitoring</li>
            <li>Fall detection alerts</li>
            <li>Configurable alert thresholds</li>
            <li>Event history and audit logging</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
