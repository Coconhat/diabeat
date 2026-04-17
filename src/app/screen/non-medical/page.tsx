"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  familyHistory: string;
  physicalActivity: string;
  smoking: string;
  diet: string;
}

const INITIAL: FormData = {
  age: "",
  gender: "",
  weight: "",
  height: "",
  familyHistory: "",
  physicalActivity: "",
  smoking: "",
  diet: "",
};

const steps = [
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
    sublabel: "In kilograms",
    type: "number",
    placeholder: "e.g. 72",
  },
  {
    key: "height",
    label: "What is your height?",
    sublabel: "In centimeters",
    type: "number",
    placeholder: "e.g. 170",
  },
  {
    key: "familyHistory",
    label: "Family history of diabetes?",
    sublabel: "Has a close relative been diagnosed?",
    type: "select",
    options: ["Yes", "No", "Not sure"],
  },
  {
    key: "physicalActivity",
    label: "How active are you?",
    sublabel: "Your typical weekly activity level",
    type: "select",
    options: [
      "Sedentary",
      "Lightly active",
      "Moderately active",
      "Very active",
    ],
  },
  {
    key: "smoking",
    label: "Do you smoke?",
    sublabel: "Current smoking status",
    type: "select",
    options: ["Yes", "No", "Former smoker"],
  },
  {
    key: "diet",
    label: "How would you describe your diet?",
    sublabel: "Overall eating habits",
    type: "select",
    options: ["Mostly healthy", "Mixed", "Mostly unhealthy"],
  },
] as const;

function mapToLifestylePayload(data: FormData): LifestyleRequestPayload {
  const age = Number.parseFloat(data.age) || 0;
  const weight = Number.parseFloat(data.weight) || 0;
  const heightCm = Number.parseFloat(data.height) || 0;
  const heightMeters = heightCm > 0 ? heightCm / 100 : 0;
  const bmi =
    heightMeters > 0
      ? Number((weight / (heightMeters * heightMeters)).toFixed(2))
      : 0;

  const familyHistory = data.familyHistory === "Yes";
  const isActive =
    data.physicalActivity === "Moderately active" ||
    data.physicalActivity === "Very active";
  const sedentary = data.physicalActivity === "Sedentary";
  const unhealthyDiet = data.diet === "Mostly unhealthy";
  const isSmoker = data.smoking === "Yes";

  return {
    gender: data.gender,
    age,
    polyuria: 0,
    polydipsia: 0,
    sudden_weight_loss: 0,
    weakness: sedentary ? 1 : 0,
    polyphagia: unhealthyDiet ? 1 : 0,
    genital_thrush: 0,
    visual_blurring: 0,
    itching: 0,
    irritability: sedentary ? 1 : 0,
    delayed_healing: familyHistory ? 1 : 0,
    partial_paresis: 0,
    muscle_stiffness: sedentary ? 1 : 0,
    alopecia: 0,
    obesity: bmi >= 30 ? 1 : 0,
    high_bp: familyHistory && age >= 45 ? 1 : 0,
    high_chol: unhealthyDiet ? 1 : 0,
    smoker: isSmoker ? 1 : 0,
    stroke: 0,
    heart_disease: familyHistory && age >= 55 ? 1 : 0,
    physical_activity: isActive ? 1 : 0,
    heavy_alcohol: 0,
    bmi,
  };
}

export default function NonMedicalScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(INITIAL);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const current = steps[step];

  const value = data[current.key as keyof FormData];
  const canNext = value.trim() !== "";

  const handleNext = useCallback(async () => {
    if (!canNext || isSubmitting) return;

    if (step < steps.length - 1) {
      setStep(step + 1);
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
        inputSummary: {
          age: payload.age,
          gender: payload.gender,
          bmi: payload.bmi,
          family_history: data.familyHistory,
          activity: data.physicalActivity,
          smoking: data.smoking,
          diet: data.diet,
        },
        submittedAt: new Date().toISOString(),
      };

      sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(stored));
      router.push(`/result?risk=${toRiskKey(prediction.risk_level)}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not run lifestyle screening right now.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [canNext, data, isSubmitting, router, step]);

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  function setValue(val: string) {
    setData({ ...data, [current.key]: val });
    setSubmitError("");
  }

  // Enter key to advance
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter") {
        void handleNext();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleNext]);

  return (
    <main className="min-h-screen flex flex-col">
      <nav className="w-full px-6 py-5 border-b border-gray-100/60">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Logo />
          <span className="text-xs text-muted font-medium">
            Non-medical screening
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
                <input
                  key={current.key}
                  type="number"
                  inputMode="numeric"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={current.placeholder}
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 text-lg bg-page/50 placeholder:text-muted/40 transition-all duration-200"
                  autoFocus
                />
              )}

              {current.type === "select" && (
                <div className="flex flex-col gap-2.5">
                  {current.options.map((opt) => {
                    const selected = value === opt;
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
                onClick={() => {
                  void handleNext();
                }}
                disabled={!canNext || isSubmitting}
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

            {/* Keyboard hint */}
            {canNext && current.type === "number" && (
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
