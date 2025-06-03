"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

interface FormData {
  hasRecords: string;
  age: string;
  gender: string;
  height: string;
  weight: string;
  glucose: string;
  smoking: string;
  activity: string;
  sleep: string;
  familyHistory: string;
  bloodPressure: string;
  a1c: string;
  cholesterol: string;
  triglycerides: string;
}

export default function AssessmentPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    hasRecords: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    glucose: "",
    smoking: "",
    activity: "",
    sleep: "",
    familyHistory: "",
    bloodPressure: "",
    a1c: "",
    cholesterol: "",
    triglycerides: "",
  });

  const totalSteps = formData.hasRecords === "yes" ? 6 : 5;
  const progress = (currentStep / totalSteps) * 100;

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      // Calculate risk and navigate to results
      const riskScore = calculateRisk();
      router.push(`/results?score=${riskScore}`);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateRisk = () => {
    let score = 0;

    // Age factor
    const age = Number.parseInt(formData.age);
    if (age >= 45) score += 20;
    else if (age >= 35) score += 10;

    // BMI calculation
    const height = Number.parseFloat(formData.height) / 100; // convert to meters
    const weight = Number.parseFloat(formData.weight);
    const bmi = weight / (height * height);
    if (bmi >= 30) score += 25;
    else if (bmi >= 25) score += 15;

    // Medical records specific factors
    if (formData.hasRecords === "yes") {
      // Glucose
      if (formData.glucose === "diabetic") score += 30;
      else if (formData.glucose === "prediabetic") score += 20;

      // A1C
      const a1c = Number.parseFloat(formData.a1c || "0");
      if (a1c >= 6.5) score += 30;
      else if (a1c >= 5.7) score += 20;

      // Cholesterol and triglycerides
      const cholesterol = Number.parseInt(formData.cholesterol || "0");
      if (cholesterol > 240) score += 10;

      const triglycerides = Number.parseInt(formData.triglycerides || "0");
      if (triglycerides > 200) score += 10;
    }

    // Common factors for both paths
    if (formData.bloodPressure === "high") score += 20;
    if (formData.smoking === "yes") score += 15;
    if (formData.activity === "low") score += 20;
    if (formData.sleep === "poor") score += 10;
    if (formData.familyHistory === "yes") score += 25;

    return Math.min(score, 100); // Cap at 100
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.hasRecords !== "";
      case 2:
        return formData.age && formData.gender;
      case 3:
        return formData.height && formData.weight;
      case 4:
        if (formData.hasRecords === "yes") {
          return formData.glucose && formData.bloodPressure && formData.a1c;
        }
        return formData.smoking && formData.activity;
      case 5:
        if (formData.hasRecords === "yes") {
          return formData.cholesterol && formData.triglycerides;
        }
        return formData.sleep && formData.familyHistory;
      case 6:
        return (
          formData.smoking &&
          formData.activity &&
          formData.sleep &&
          formData.familyHistory
        );
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">
                Do you have recent medical records or test results?
              </Label>
              <RadioGroup
                value={formData.hasRecords}
                onValueChange={(value) => updateFormData("hasRecords", value)}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="records-yes" />
                  <Label htmlFor="records-yes">
                    Yes, I have my medical records
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="records-no" />
                  <Label htmlFor="records-no">
                    No, I don't have medical records
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="age" className="text-base font-medium">
                What is your age?
              </Label>
              <Input
                id="age"
                type="number"
                placeholder="Enter your age"
                value={formData.age}
                onChange={(e) => updateFormData("age", e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-base font-medium">
                What is your gender?
              </Label>
              <RadioGroup
                value={formData.gender}
                onValueChange={(value) => updateFormData("gender", value)}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other">Other</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="height" className="text-base font-medium">
                Height (cm)
              </Label>
              <Input
                id="height"
                type="number"
                placeholder="Enter your height in centimeters"
                value={formData.height}
                onChange={(e) => updateFormData("height", e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="weight" className="text-base font-medium">
                Weight (kg)
              </Label>
              <Input
                id="weight"
                type="number"
                placeholder="Enter your weight in kilograms"
                value={formData.weight}
                onChange={(e) => updateFormData("weight", e.target.value)}
                className="mt-2"
              />
            </div>
          </div>
        );

      case 4:
        // Different questions based on whether user has medical records
        if (formData.hasRecords === "yes") {
          return (
            <div className="space-y-6">
              <div>
                <Label htmlFor="glucose" className="text-base font-medium">
                  Fasting Glucose Level (mg/dL)
                </Label>
                <Select
                  value={formData.glucose}
                  onValueChange={(value) => updateFormData("glucose", value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select glucose level range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal (70-99 mg/dL)</SelectItem>
                    <SelectItem value="prediabetic">
                      Prediabetic (100-125 mg/dL)
                    </SelectItem>
                    <SelectItem value="diabetic">
                      Diabetic (126+ mg/dL)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-base font-medium">Blood Pressure</Label>
                <RadioGroup
                  value={formData.bloodPressure}
                  onValueChange={(value) =>
                    updateFormData("bloodPressure", value)
                  }
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="normal" id="bp-normal" />
                    <Label htmlFor="bp-normal">Normal (less than 120/80)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="elevated" id="bp-elevated" />
                    <Label htmlFor="bp-elevated">
                      Elevated (120-129/less than 80)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="bp-high" />
                    <Label htmlFor="bp-high">High (130/80 or higher)</Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label htmlFor="a1c" className="text-base font-medium">
                  HbA1c (%)
                </Label>
                <Input
                  id="a1c"
                  type="number"
                  step="0.1"
                  placeholder="Enter your HbA1c percentage"
                  value={formData.a1c}
                  onChange={(e) => updateFormData("a1c", e.target.value)}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Normal: below 5.7%, Prediabetic: 5.7-6.4%, Diabetic: 6.5% or
                  higher
                </p>
              </div>
            </div>
          );
        } else {
          return (
            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium">Do you smoke?</Label>
                <RadioGroup
                  value={formData.smoking}
                  onValueChange={(value) => updateFormData("smoking", value)}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="smoke-no" />
                    <Label htmlFor="smoke-no">No, never</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="former" id="smoke-former" />
                    <Label htmlFor="smoke-former">Former smoker</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="smoke-yes" />
                    <Label htmlFor="smoke-yes">Yes, currently</Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label className="text-base font-medium">
                  Physical Activity Level
                </Label>
                <RadioGroup
                  value={formData.activity}
                  onValueChange={(value) => updateFormData("activity", value)}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="high" id="activity-high" />
                    <Label htmlFor="activity-high">
                      High (5+ times per week)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="moderate" id="activity-moderate" />
                    <Label htmlFor="activity-moderate">
                      Moderate (2-4 times per week)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="low" id="activity-low" />
                    <Label htmlFor="activity-low">
                      Low (less than 2 times per week)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          );
        }

      case 5:
        if (formData.hasRecords === "yes") {
          return (
            <div className="space-y-6">
              <div>
                <Label htmlFor="cholesterol" className="text-base font-medium">
                  Total Cholesterol (mg/dL)
                </Label>
                <Input
                  id="cholesterol"
                  type="number"
                  placeholder="Enter your total cholesterol"
                  value={formData.cholesterol}
                  onChange={(e) =>
                    updateFormData("cholesterol", e.target.value)
                  }
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Desirable: Less than 200 mg/dL, Borderline high: 200-239
                  mg/dL, High: 240 mg/dL and above
                </p>
              </div>
              <div>
                <Label
                  htmlFor="triglycerides"
                  className="text-base font-medium"
                >
                  Triglycerides (mg/dL)
                </Label>
                <Input
                  id="triglycerides"
                  type="number"
                  placeholder="Enter your triglycerides"
                  value={formData.triglycerides}
                  onChange={(e) =>
                    updateFormData("triglycerides", e.target.value)
                  }
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Normal: Less than 150 mg/dL, Borderline high: 150-199 mg/dL,
                  High: 200 mg/dL and above
                </p>
              </div>
            </div>
          );
        } else {
          return (
            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium">Sleep Quality</Label>
                <RadioGroup
                  value={formData.sleep}
                  onValueChange={(value) => updateFormData("sleep", value)}
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="good" id="sleep-good" />
                    <Label htmlFor="sleep-good">
                      Good (7-9 hours, restful)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fair" id="sleep-fair" />
                    <Label htmlFor="sleep-fair">
                      Fair (6-7 hours or occasional issues)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="poor" id="sleep-poor" />
                    <Label htmlFor="sleep-poor">
                      Poor (less than 6 hours or frequent issues)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              <div>
                <Label className="text-base font-medium">
                  Family History of Diabetes
                </Label>
                <RadioGroup
                  value={formData.familyHistory}
                  onValueChange={(value) =>
                    updateFormData("familyHistory", value)
                  }
                  className="mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="family-no" />
                    <Label htmlFor="family-no">No family history</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="distant" id="family-distant" />
                    <Label htmlFor="family-distant">
                      Distant relatives (grandparents, aunts, uncles)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="family-yes" />
                    <Label htmlFor="family-yes">
                      Close relatives (parents, siblings)
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          );
        }

      case 6:
        return (
          <div className="space-y-6">
            <div>
              <Label className="text-base font-medium">Do you smoke?</Label>
              <RadioGroup
                value={formData.smoking}
                onValueChange={(value) => updateFormData("smoking", value)}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="smoke-no" />
                  <Label htmlFor="smoke-no">No, never</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="former" id="smoke-former" />
                  <Label htmlFor="smoke-former">Former smoker</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="smoke-yes" />
                  <Label htmlFor="smoke-yes">Yes, currently</Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label className="text-base font-medium">
                Physical Activity Level
              </Label>
              <RadioGroup
                value={formData.activity}
                onValueChange={(value) => updateFormData("activity", value)}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="activity-high" />
                  <Label htmlFor="activity-high">
                    High (5+ times per week)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="moderate" id="activity-moderate" />
                  <Label htmlFor="activity-moderate">
                    Moderate (2-4 times per week)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="activity-low" />
                  <Label htmlFor="activity-low">
                    Low (less than 2 times per week)
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label className="text-base font-medium">Sleep Quality</Label>
              <RadioGroup
                value={formData.sleep}
                onValueChange={(value) => updateFormData("sleep", value)}
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="good" id="sleep-good" />
                  <Label htmlFor="sleep-good">Good (7-9 hours, restful)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fair" id="sleep-fair" />
                  <Label htmlFor="sleep-fair">
                    Fair (6-7 hours or occasional issues)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="poor" id="sleep-poor" />
                  <Label htmlFor="sleep-poor">
                    Poor (less than 6 hours or frequent issues)
                  </Label>
                </div>
              </RadioGroup>
            </div>
            <div>
              <Label className="text-base font-medium">
                Family History of Diabetes
              </Label>
              <RadioGroup
                value={formData.familyHistory}
                onValueChange={(value) =>
                  updateFormData("familyHistory", value)
                }
                className="mt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="family-no" />
                  <Label htmlFor="family-no">No family history</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="distant" id="family-distant" />
                  <Label htmlFor="family-distant">
                    Distant relatives (grandparents, aunts, uncles)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="family-yes" />
                  <Label htmlFor="family-yes">
                    Close relatives (parents, siblings)
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Progress Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Diabetes Risk Assessment
              </h1>
              <span className="text-sm text-gray-600">
                Step {currentStep} of {totalSteps}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question Card */}
          <Card className="border-0 shadow-lg rounded-2xl">
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">
                {currentStep === 1 && "Medical Records"}
                {currentStep === 2 && "Basic Information"}
                {currentStep === 3 && "Physical Measurements"}
                {currentStep === 4 &&
                  (formData.hasRecords === "yes"
                    ? "Medical Metrics"
                    : "Lifestyle Habits")}
                {currentStep === 5 &&
                  (formData.hasRecords === "yes"
                    ? "Additional Medical Data"
                    : "Additional Factors")}
                {currentStep === 6 && "Lifestyle Habits"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderStep()}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </Button>

                <Button
                  onClick={nextStep}
                  disabled={!isStepValid()}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                >
                  <span>
                    {currentStep === totalSteps ? "Get Results" : "Next"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
