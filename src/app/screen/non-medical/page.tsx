"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import Logo from "@/components/Logo";
import ProgressBar from "@/components/ProgressBar";
import StepWrapper from "@/components/StepWrapper";
import {
  LifestylePrediction,
  LifestyleRequestPayload,
  RESULT_STORAGE_KEY,
  StoredResult,
  toRiskKey,
} from "@/lib/prediction";

const FASTAPI_URL =
  process.env.NEXT_PUBLIC_FASTAPI_URL ?? "http://127.0.0.1:8000";

interface FormData {
  age: string;
  gender: string;
  weight: string;
  height: string;
  high_bp: string;
  high_chol: string;
  smoker: string;
  heavy_alcohol: string;
  physical_activity: string;
  stroke: string;
  heart_disease: string;
  polyuria: string;
  polydipsia: string;
  sudden_weight_loss: string;
  weakness: string;
  polyphagia: string;
  genital_thrush: string;
  visual_blurring: string;
  itching: string;
  irritability: string;
  delayed_healing: string;
  partial_paresis: string;
  muscle_stiffness: string;
  alopecia: string;
}

// ── Zod validation schemas ─────────────────────────────────────
const positiveNumber = (min: number, max: number) =>
  z
    .number()
    .finite()
    .positive()
    .min(min, { message: `Must be at least ${min}` })
    .max(max, { message: `Must be at most ${max}` });

// Full schema for final submission
const lifestyleDataSchema = z.object({
  gender: z.enum(["Male", "Female"]),
  age: positiveNumber(1, 120),
  weight: positiveNumber(10, 300), // kg
  height: positiveNumber(50, 250), // cm
  // CDC features (must be "Yes" or "No")
  high_bp: z.enum(["Yes", "No"]),
  high_chol: z.enum(["Yes", "No"]),
  smoker: z.enum(["Yes", "No"]),
  heavy_alcohol: z.enum(["Yes", "No"]),
  physical_activity: z.enum(["Yes", "No"]),
  stroke: z.enum(["Yes", "No"]),
  heart_disease: z.enum(["Yes", "No"]),
  // UCI symptoms
  polyuria: z.enum(["Yes", "No"]),
  polydipsia: z.enum(["Yes", "No"]),
  sudden_weight_loss: z.enum(["Yes", "No"]),
  weakness: z.enum(["Yes", "No"]),
  polyphagia: z.enum(["Yes", "No"]),
  genital_thrush: z.enum(["Yes", "No"]),
  visual_blurring: z.enum(["Yes", "No"]),
  itching: z.enum(["Yes", "No"]),
  irritability: z.enum(["Yes", "No"]),
  delayed_healing: z.enum(["Yes", "No"]),
  partial_paresis: z.enum(["Yes", "No"]),
  muscle_stiffness: z.enum(["Yes", "No"]),
  alopecia: z.enum(["Yes", "No"]),
});

// Per‑step schemas (for numeric fields)
const stepSchemas: Record<string, z.ZodSchema> = {
  age: positiveNumber(1, 120),
  weight: positiveNumber(10, 300),
  height: positiveNumber(50, 250),
};

const INITIAL: FormData = {
  age: "",
  gender: "",
  weight: "",
  height: "",
  high_bp: "",
  high_chol: "",
  smoker: "",
  heavy_alcohol: "",
  physical_activity: "",
  stroke: "",
  heart_disease: "",
  polyuria: "",
  polydipsia: "",
  sudden_weight_loss: "",
  weakness: "",
  polyphagia: "",
  genital_thrush: "",
  visual_blurring: "",
  itching: "",
  irritability: "",
  delayed_healing: "",
  partial_paresis: "",
  muscle_stiffness: "",
  alopecia: "",
};

const steps = [
  // Demographics
  {
    key: "age",
    label: "How old are you?",
    sublabel: "Enter your age in years",
    type: "number",
    placeholder: "e.g. 35",
  },
  {
    key: "gender",
    label: "What is your gender?",
    sublabel: "Select one",
    type: "select",
    options: ["Male", "Female"],
  },
  {
    key: "weight",
    label: "What is your weight?",
    sublabel: "In kilograms — used to calculate your BMI",
    type: "number",
    placeholder: "e.g. 72",
  },
  {
    key: "height",
    label: "What is your height?",
    sublabel: "In centimeters — used to calculate your BMI",
    type: "number",
    placeholder: "e.g. 170",
  },
  // CDC lifestyle
  {
    key: "high_bp",
    label: "Have you been told you have high blood pressure?",
    sublabel: "Diagnosed by a doctor or nurse",
    type: "select",
    options: ["Yes", "No"],
  },
  {
    key: "high_chol",
    label: "Have you been told you have high cholesterol?",
    sublabel: "Diagnosed by a doctor or nurse",
    type: "select",
    options: ["Yes", "No"],
  },
  {
    key: "smoker",
    label: "Have you smoked at least 100 cigarettes in your lifetime?",
    sublabel: "This includes cigars and other tobacco products",
    type: "select",
    options: ["Yes", "No"],
  },
  {
    key: "heavy_alcohol",
    label: "Do you drink heavily?",
    sublabel: "More than 14 drinks/week for men, 7 for women",
    type: "select",
    options: ["Yes", "No"],
  },
  {
    key: "physical_activity",
    label: "Have you done physical activity in the past 30 days?",
    sublabel: "Any exercise outside of your regular job",
    type: "select",
    options: ["Yes", "No"],
  },
  {
    key: "stroke",
    label: "Have you ever had a stroke?",
    sublabel: "Diagnosed by a doctor",
    type: "select",
    options: ["Yes", "No"],
  },
  {
    key: "heart_disease",
    label: "Have you had coronary heart disease or a heart attack?",
    sublabel: "Diagnosed by a doctor",
    type: "select",
    options: ["Yes", "No"],
  },
  // UCI symptoms
  {
    key: "polyuria",
    label: "Do you urinate more frequently than usual?",
    sublabel: "Especially at night or in large amounts",
    type: "select",
    options: ["Yes", "No"],
  },
  {
    key: "polydipsia",
    label: "Do you feel excessively thirsty?",
    sublabel: "Even after drinking water",
    type: "select",
    options: ["Yes", "No"],
  },
  {
    key: "sudden_weight_loss",
    label: "Have you experienced sudden unexplained weight loss?",
    sublabel: "Without changes in diet or exercise",
    type: "select",
    options: ["Yes", "No"],
  },
  {
    key: "weakness",
    label: "Do you feel unusually weak or fatigued?",
    sublabel: "Persistent tiredness that doesn't go away with rest",
    type: "select",
    options: ["Yes", "No"],
  },
  {
    key: "polyphagia",
    label: "Do you feel excessively hungry?",
    sublabel: "Even after eating a full meal",
    type: "select",
    options: ["Yes", "No"],
  },
  {
    key: "genital_thrush",
    label: "Have you had recurring genital thrush?",
    sublabel: "Fungal infections in the genital area",
    type: "select",
    options: ["Yes", "No"],
  },
  {
    key: "visual_blurring",
    label: "Do you experience blurred vision?",
    sublabel: "Sudden or gradual blurring",
    type: "select",
    options: ["Yes", "No"],
  },
  {
    key: "itching",
    label: "Do you have persistent itching?",
    sublabel: "Especially on the skin",
    type: "select",
    options: ["Yes", "No"],
  },
  {
    key: "irritability",
    label: "Do you experience unusual irritability?",
    sublabel: "Mood changes not explained by stress",
    type: "select",
    options: ["Yes", "No"],
  },
  {
    key: "delayed_healing",
    label: "Do cuts or wounds take longer than usual to heal?",
    sublabel: "Small wounds that take weeks to heal",
    type: "select",
    options: ["Yes", "No"],
  },
  {
    key: "partial_paresis",
    label: "Do you experience muscle weakness or partial numbness?",
    sublabel: "In arms, legs, or face",
    type: "select",
    options: ["Yes", "No"],
  },
  {
    key: "muscle_stiffness",
    label: "Do you have muscle stiffness or cramps?",
    sublabel: "Especially in the legs",
    type: "select",
    options: ["Yes", "No"],
  },
  {
    key: "alopecia",
    label: "Have you experienced unusual hair loss?",
    sublabel: "More than normal shedding",
    type: "select",
    options: ["Yes", "No"],
  },
] as const;

function mapToLifestylePayload(data: FormData): LifestyleRequestPayload {
  const age = parseFloat(data.age) || 0;
  const weight = parseFloat(data.weight) || 0;
  const heightCm = parseFloat(data.height) || 0;
  const heightM = heightCm > 0 ? heightCm / 100 : 1;
  const bmi = parseFloat((weight / (heightM * heightM)).toFixed(2));
  const yn = (val: string) => (val === "Yes" ? 1 : 0);

  return {
    gender: data.gender,
    age,
    bmi,
    high_bp: yn(data.high_bp),
    high_chol: yn(data.high_chol),
    smoker: yn(data.smoker),
    heavy_alcohol: yn(data.heavy_alcohol),
    physical_activity: yn(data.physical_activity),
    stroke: yn(data.stroke),
    heart_disease: yn(data.heart_disease),
    polyuria: yn(data.polyuria),
    polydipsia: yn(data.polydipsia),
    sudden_weight_loss: yn(data.sudden_weight_loss),
    weakness: yn(data.weakness),
    polyphagia: yn(data.polyphagia),
    genital_thrush: yn(data.genital_thrush),
    visual_blurring: yn(data.visual_blurring),
    itching: yn(data.itching),
    irritability: yn(data.irritability),
    delayed_healing: yn(data.delayed_healing),
    partial_paresis: yn(data.partial_paresis),
    muscle_stiffness: yn(data.muscle_stiffness),
    alopecia: yn(data.alopecia),
    obesity: bmi >= 30 ? 1 : 0,
  };
}

export default function NonMedicalScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(INITIAL);
  const [fieldError, setFieldError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const current = steps[step];
  const rawValue = data[current.key as keyof FormData];
  const canNext = rawValue.trim() !== "";

  // Validate current field on change
  useEffect(() => {
    if (!canNext) {
      setFieldError("");
      return;
    }
    const schema = stepSchemas[current.key];
    if (schema && current.type === "number") {
      const num = Number.parseFloat(rawValue);
      const result = schema.safeParse(num);
      if (!result.success) {
        setFieldError(result.error.errors[0].message);
      } else {
        setFieldError("");
      }
    } else if (current.type === "select") {
      if (
        rawValue !== "Yes" &&
        rawValue !== "No" &&
        rawValue !== "Male" &&
        rawValue !== "Female"
      ) {
        setFieldError("Please select an option");
      } else {
        setFieldError("");
      }
    } else {
      setFieldError("");
    }
  }, [rawValue, current.key, current.type, canNext]);

  const handleNext = useCallback(async () => {
    if (!canNext || fieldError || isSubmitting) return;

    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }

    // Final validation of all fields
    const validation = lifestyleDataSchema.safeParse(data);
    if (!validation.success) {
      const firstError = validation.error.errors[0];
      setSubmitError(`${firstError.path}: ${firstError.message}`);
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);

    try {
      const payload = mapToLifestylePayload(data);
      const response = await fetch(`${FASTAPI_URL}/predict/lifestyle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Lifestyle model request failed (${response.status}).`);
      }

      const prediction = (await response.json()) as LifestylePrediction;
      const stored: StoredResult = {
        source: "lifestyle",
        prediction,
        inputSummary: payload as unknown as Record<
          string,
          string | number | boolean | null
        >,
        submittedAt: new Date().toISOString(),
      };

      sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(stored));
      router.push(`/result?risk=${toRiskKey(prediction.risk_level)}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Could not run lifestyle screening right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [canNext, fieldError, isSubmitting, step, data, router]);

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  function setValue(val: string) {
    setData({ ...data, [current.key]: val });
    setSubmitError("");
  }

  // Enter key only when field is valid
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && canNext && !fieldError && !isSubmitting) {
        void handleNext();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canNext, fieldError, isSubmitting, handleNext]);

  return (
    <main className="min-h-screen flex flex-col">
      <nav className="w-full px-6 py-5 border-b border-gray-100/60">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Logo />
          <span className="text-xs text-muted font-medium">
            Lifestyle screening · Step {step + 1} of {steps.length}
          </span>
        </div>
      </nav>

      <section className="flex-1 flex flex-col items-center px-6 pt-10 pb-20">
        <div className="w-full max-w-lg">
          <ProgressBar current={step + 1} total={steps.length} />

          <div className="mt-10 bg-card border border-gray-100 rounded-2xl p-8 sm:p-10 shadow-[0_1px_3px_rgba(26,29,35,0.04)]">
            <StepWrapper
              stepKey={current.key}
              label={current.label}
              sublabel={current.sublabel}
            >
              {current.type === "number" && (
                <div className="relative">
                  <input
                    type="number"
                    inputMode="numeric"
                    value={rawValue}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={
                      "placeholder" in current ? current.placeholder : ""
                    }
                    className={`w-full px-5 py-4 rounded-xl border text-lg bg-page/50 placeholder:text-muted/40 transition-all duration-200 ${
                      fieldError
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-200 focus:border-primary"
                    }`}
                    autoFocus
                  />
                </div>
              )}

              {current.type === "select" && (
                <div className="flex flex-col gap-2.5">
                  {"options" in current &&
                    current.options.map((opt) => {
                      const selected = rawValue === opt;
                      return (
                        <button
                          key={opt}
                          onClick={() => setValue(opt)}
                          className={`option-card w-full text-left px-5 py-4 rounded-xl border flex items-center justify-between ${
                            selected
                              ? "option-selected border-primary bg-mint/60 text-primary font-medium"
                              : "border-gray-200 hover:border-gray-300 text-heading bg-card"
                          }`}
                        >
                          <span>{opt}</span>
                          {selected && (
                            <svg
                              className="w-5 h-5 text-primary flex-shrink-0 animate-scale-in"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={2.5}
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                </div>
              )}

              {fieldError && (
                <p className="mt-2 text-sm text-red-500">{fieldError}</p>
              )}
            </StepWrapper>

            <div className="flex items-center justify-between mt-10">
              <button
                onClick={handleBack}
                disabled={step === 0}
                className="btn-press group flex items-center gap-1.5 px-4 py-2.5 text-muted hover:text-heading rounded-full transition-colors disabled:opacity-0 disabled:pointer-events-none"
              >
                <svg
                  className="w-4 h-4 transition-transform group-hover:-translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </button>

              <button
                onClick={() => void handleNext()}
                disabled={!canNext || !!fieldError || isSubmitting}
                className="btn-press group flex items-center gap-1.5 px-8 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-full transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_2px_8px_-2px_rgba(0,119,182,0.3)]"
              >
                {isSubmitting
                  ? "Analyzing..."
                  : step === steps.length - 1
                    ? "See results"
                    : "Next"}
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>

            {submitError && (
              <p className="text-center text-sm text-risk-high mt-4">
                {submitError}
              </p>
            )}

            {canNext && !fieldError && current.type === "number" && (
              <p className="text-center text-xs text-muted/50 mt-4 animate-fade-in">
                Press{" "}
                <kbd className="px-1.5 py-0.5 bg-page rounded text-[10px] font-mono border border-gray-200">
                  Enter
                </kbd>{" "}
                to continue
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
