export type RiskKey = "low" | "moderate" | "high";

export interface MedicalRequestPayload {
  gender: string;
  age: number;
  urea: number;
  cr: number;
  hba1c: number;
  chol: number;
  tg: number;
  hdl: number;
  ldl: number;
  vldl: number;
  bmi: number;
}

export interface LifestyleRequestPayload {
  gender: string;
  age: number;
  polyuria: number;
  polydipsia: number;
  sudden_weight_loss: number;
  weakness: number;
  polyphagia: number;
  genital_thrush: number;
  visual_blurring: number;
  itching: number;
  irritability: number;
  delayed_healing: number;
  partial_paresis: number;
  muscle_stiffness: number;
  alopecia: number;
  obesity: number;
  high_bp: number;
  high_chol: number;
  smoker: number;
  stroke: number;
  heart_disease: number;
  physical_activity: number;
  heavy_alcohol: number;
  bmi: number;
}

export interface MedicalPrediction {
  risk_score: number;
  risk_level: string;
  probabilities: {
    no_diabetes: number;
    pre_diabetic: number;
    diabetic: number;
  };
}

export interface LifestylePrediction {
  risk_score: number;
  risk_level: string;
  breakdown: {
    symptom_score: number;
    lifestyle_score: number;
  };
  probabilities: {
    uci: {
      negative: number;
      positive: number;
    };
    cdc: {
      no_diabetes: number;
      prediabetes: number;
      diabetes: number;
    };
  };
}

export type PredictionResult = MedicalPrediction | LifestylePrediction;

export interface StoredResult {
  source: "medical" | "lifestyle";
  prediction: PredictionResult;
  inputSummary: Record<string, string | number>;
  submittedAt: string;
}

export interface AIInsightSections {
  summary: string;
  combatSteps: string[];
  suggestions: string[];
}

export type AIInsightProvider = "gemini" | "fallback";

export const RESULT_STORAGE_KEY = "diabeat:last-result";

export function toRiskKey(riskLevel?: string | null): RiskKey {
  const normalized = (riskLevel ?? "").trim().toLowerCase();

  if (normalized.includes("high")) return "high";
  if (normalized.includes("moderate")) return "moderate";
  if (normalized.includes("low")) return "low";

  return "low";
}

export function isLifestylePrediction(
  prediction: PredictionResult,
): prediction is LifestylePrediction {
  return "breakdown" in prediction;
}
