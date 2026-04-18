import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface VitalsFormData {
  age: string;
  sex: string;
  cholesterol: string;
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  heartRate: string;
  glucose: string;
  smoker: string;
  exerciseFrequency: string;
  cp: string;
  fbs: string;
  restecg: string;
  exang: string;
  oldpeak: string;
  slope: string;
  ca: string;
  thal: string;
}

interface PredictionResult {
  status: "detected" | "not_detected";
  confidenceScore: number;
  probability: number;
}

interface PatientVitalsFormProps {
  onPredictionReceived?: (result: PredictionResult) => void;
}

export default function PatientVitalsForm({ onPredictionReceived }: PatientVitalsFormProps) {
  const [formData, setFormData] = useState<VitalsFormData>({
    age: "55",
    sex: "1",
    cholesterol: "240",
    bloodPressureSystolic: "120",
    bloodPressureDiastolic: "80",
    heartRate: "75",
    glucose: "120",
    smoker: "0",
    exerciseFrequency: "3",
    cp: "0",
    fbs: "0",
    restecg: "0",
    exang: "0",
    oldpeak: "1.5",
    slope: "0",
    ca: "0",
    thal: "0",
  });

  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const sendPredictionMutation = trpc.health.sendHeartPredictionRequest.useMutation({
    onSuccess: (result: any) => {
      const predictionResult: PredictionResult = {
        status: result.status,
        confidenceScore: result.confidenceScore,
        probability: result.probability,
      };
      setPrediction(predictionResult);
      onPredictionReceived?.(predictionResult);
      toast.success("Prediction received from Jetson");
    },
    onError: (error) => {
      toast.error(`Failed to get prediction: ${error.message}`);
    },
  });

  const handleInputChange = (field: keyof VitalsFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.age || !formData.cholesterol || !formData.bloodPressureSystolic || !formData.heartRate) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Send to backend
    sendPredictionMutation.mutate({
      age: parseFloat(formData.age),
      sex: parseInt(formData.sex), // 1 = Male, 0 = Female
      cholesterol: parseFloat(formData.cholesterol),
      bloodPressureSystolic: parseFloat(formData.bloodPressureSystolic),
      bloodPressureDiastolic: parseFloat(formData.bloodPressureDiastolic),
      heartRate: parseFloat(formData.heartRate),
      glucose: parseFloat(formData.glucose),
      smoker: parseInt(formData.smoker),
      exerciseFrequency: parseInt(formData.exerciseFrequency),
      cp: parseInt(formData.cp),
      fbs: parseInt(formData.fbs),
      restecg: parseInt(formData.restecg),
      exang: parseInt(formData.exang),
      oldpeak: parseFloat(formData.oldpeak),
      slope: parseInt(formData.slope),
      ca: parseInt(formData.ca),
      thal: parseInt(formData.thal),
    });
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Heart className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Heart Disease Risk Assessment</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Vitals Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age">Age (years)</Label>
              <Input
                id="age"
                type="number"
                min="0"
                max="120"
                value={formData.age}
                onChange={(e) => handleInputChange("age", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="sex">Sex</Label>
              <Select value={formData.sex} onValueChange={(value) => handleInputChange("sex", value)}>
                <SelectTrigger id="sex" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Male</SelectItem>
                  <SelectItem value="0">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cholesterol">Cholesterol (mg/dL)</Label>
              <Input
                id="cholesterol"
                type="number"
                min="0"
                value={formData.cholesterol}
                onChange={(e) => handleInputChange("cholesterol", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="glucose">Glucose (mg/dL)</Label>
              <Input
                id="glucose"
                type="number"
                min="0"
                value={formData.glucose}
                onChange={(e) => handleInputChange("glucose", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="systolic">Blood Pressure Systolic (mm Hg)</Label>
              <Input
                id="systolic"
                type="number"
                min="0"
                value={formData.bloodPressureSystolic}
                onChange={(e) => handleInputChange("bloodPressureSystolic", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="diastolic">Blood Pressure Diastolic (mm Hg)</Label>
              <Input
                id="diastolic"
                type="number"
                min="0"
                value={formData.bloodPressureDiastolic}
                onChange={(e) => handleInputChange("bloodPressureDiastolic", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
              <Input
                id="heartRate"
                type="number"
                min="0"
                value={formData.heartRate}
                onChange={(e) => handleInputChange("heartRate", e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="smoker">Smoker</Label>
              <Select value={formData.smoker} onValueChange={(value) => handleInputChange("smoker", value)}>
                <SelectTrigger id="smoker" className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No</SelectItem>
                  <SelectItem value="1">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="exercise">Exercise Frequency (days/week)</Label>
              <Input
                id="exercise"
                type="number"
                min="0"
                max="7"
                value={formData.exerciseFrequency}
                onChange={(e) => handleInputChange("exerciseFrequency", e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Advanced Parameters */}
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAdvanced ? "Hide" : "Show"} Advanced Parameters
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="cp">Chest Pain Type (0-3)</Label>
                  <Input
                    id="cp"
                    type="number"
                    min="0"
                    max="3"
                    value={formData.cp}
                    onChange={(e) => handleInputChange("cp", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="fbs">Fasting Blood Sugar &gt; 120 mg/dL</Label>
                  <Select value={formData.fbs} onValueChange={(value) => handleInputChange("fbs", value)}>
                    <SelectTrigger id="fbs" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No</SelectItem>
                      <SelectItem value="1">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="restecg">Resting ECG (0-2)</Label>
                  <Input
                    id="restecg"
                    type="number"
                    min="0"
                    max="2"
                    value={formData.restecg}
                    onChange={(e) => handleInputChange("restecg", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="exang">Exercise Induced Angina</Label>
                  <Select value={formData.exang} onValueChange={(value) => handleInputChange("exang", value)}>
                    <SelectTrigger id="exang" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">No</SelectItem>
                      <SelectItem value="1">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="oldpeak">ST Depression (0-6.2)</Label>
                  <Input
                    id="oldpeak"
                    type="number"
                    min="0"
                    step="0.1"
                    value={formData.oldpeak}
                    onChange={(e) => handleInputChange("oldpeak", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="slope">ST Slope (0-2)</Label>
                  <Input
                    id="slope"
                    type="number"
                    min="0"
                    max="2"
                    value={formData.slope}
                    onChange={(e) => handleInputChange("slope", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="ca">Major Vessels (0-4)</Label>
                  <Input
                    id="ca"
                    type="number"
                    min="0"
                    max="4"
                    value={formData.ca}
                    onChange={(e) => handleInputChange("ca", e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="thal">Thalassemia (0-3)</Label>
                  <Input
                    id="thal"
                    type="number"
                    min="0"
                    max="3"
                    value={formData.thal}
                    onChange={(e) => handleInputChange("thal", e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            disabled={sendPredictionMutation.isPending}
            className="w-full"
          >
            {sendPredictionMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending to Jetson...
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 mr-2" />
                Get Prediction
              </>
            )}
          </Button>
        </form>
      </Card>

      {/* Prediction Result */}
      {prediction && (
        <Card className={`p-6 border-2 ${prediction.status === "detected" ? "border-red-300 bg-red-50" : "border-green-300 bg-green-50"}`}>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${prediction.status === "detected" ? "bg-red-100" : "bg-green-100"}`}>
              <AlertCircle className={`w-6 h-6 ${prediction.status === "detected" ? "text-red-600" : "text-green-600"}`} />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-lg mb-2">
                {prediction.status === "detected" ? "Heart Disease Risk Detected" : "No Heart Disease Detected"}
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Confidence Score: <span className="font-semibold">{prediction.confidenceScore}%</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Probability: {(prediction.probability * 100).toFixed(2)}%
              </p>
              {prediction.status === "detected" && (
                <p className="text-sm text-red-600 mt-3 font-medium">
                  Please consult with a healthcare provider for further evaluation.
                </p>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
