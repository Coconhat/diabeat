"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import Logo from "@/components/Logo";
import ProgressBar from "@/components/ProgressBar";
import StepWrapper from "@/components/StepWrapper";
import {
  MedicalPrediction,
  MedicalRequestPayload,
  RESULT_STORAGE_KEY,
  StoredResult,
  toRiskKey,
} from "@/lib/prediction";

const FASTAPI_URL =
  process.env.NEXT_PUBLIC_FASTAPI_URL ?? "http://127.0.0.1:8000";

interface FormData {
  age: string;
  gender: string;
  urea: string;
  cr: string;
  hba1c: string;
  chol: string;
  tg: string;
  hdl: string;
  ldl: string;
  vldl: string;
  bmi: string;
}

// ── Zod schemas for validation ─────────────────────────────────
const positiveNumber = (min: number, max: number) =>
  z
    .number()
    .finite()
    .positive()
    .min(min, { message: `Must be at least ${min}` })
    .max(max, { message: `Must be at most ${max}` });

const medicalDataSchema = z.object({
  gender: z.enum(["M", "F"]),
  age: positiveNumber(1, 99), // 1–99 years
  urea: positiveNumber(0.5, 100), // mmol/L (severe kidney failure can exceed 50)
  cr: positiveNumber(5, 2000), // μmol/L (ESRD can be very high)
  hba1c: positiveNumber(3, 20), // % (severe diabetes up to 15+)
  chol: positiveNumber(1, 30), // mmol/L (familial hypercholesterolemia)
  tg: positiveNumber(0.1, 30), // mmol/L (severe hypertriglyceridemia)
  hdl: positiveNumber(0.1, 5), // mmol/L (very low is possible)
  ldl: positiveNumber(0.1, 20), // mmol/L
  vldl: positiveNumber(0.1, 10), // mmol/L
  bmi: positiveNumber(10, 70), // kg/m² (severe obesity or underweight)
});

// Step validation (same permissive ranges)
const stepSchemas: Record<string, z.ZodSchema> = {
  age: positiveNumber(1, 120),
  urea: positiveNumber(0.5, 100),
  cr: positiveNumber(5, 2000),
  hba1c: positiveNumber(3, 20),
  chol: positiveNumber(1, 30),
  tg: positiveNumber(0.1, 30),
  hdl: positiveNumber(0.1, 5),
  ldl: positiveNumber(0.1, 20),
  vldl: positiveNumber(0.1, 10),
  bmi: positiveNumber(10, 70),
};

const INITIAL: FormData = {
  age: "",
  gender: "",
  urea: "",
  cr: "",
  hba1c: "",
  chol: "",
  tg: "",
  hdl: "",
  ldl: "",
  vldl: "",
  bmi: "",
};

const steps = [
  {
    key: "age",
    label: "How old are you?",
    sublabel: "Enter your age in years",
    type: "number",
    placeholder: "e.g. 45",
    unit: "years",
  },
  {
    key: "gender",
    label: "What is your gender?",
    sublabel: "Select one",
    type: "select",
    options: ["Male", "Female"],
    unit: "",
  },
  {
    key: "urea",
    label: "Blood Urea level",
    sublabel: "From your lab results",
    type: "number",
    placeholder: "e.g. 4.7",
    unit: "mmol/L",
  },
  {
    key: "cr",
    label: "Creatinine (Cr)",
    sublabel: "Serum creatinine level",
    type: "number",
    placeholder: "e.g. 80",
    unit: "μmol/L",
  },
  {
    key: "hba1c",
    label: "HbA1c level",
    sublabel: "Glycated hemoglobin percentage",
    type: "number",
    placeholder: "e.g. 5.7",
    unit: "%",
  },
  {
    key: "chol",
    label: "Total Cholesterol",
    sublabel: "From your lipid panel",
    type: "number",
    placeholder: "e.g. 5.2",
    unit: "mmol/L",
  },
  {
    key: "tg",
    label: "Triglycerides (TG)",
    sublabel: "From your lipid panel",
    type: "number",
    placeholder: "e.g. 1.7",
    unit: "mmol/L",
  },
  {
    key: "hdl",
    label: "HDL Cholesterol",
    sublabel: "High-density lipoprotein",
    type: "number",
    placeholder: "e.g. 1.3",
    unit: "mmol/L",
  },
  {
    key: "ldl",
    label: "LDL Cholesterol",
    sublabel: "Low-density lipoprotein",
    type: "number",
    placeholder: "e.g. 3.0",
    unit: "mmol/L",
  },
  {
    key: "vldl",
    label: "VLDL Cholesterol",
    sublabel: "Very low-density lipoprotein",
    type: "number",
    placeholder: "e.g. 0.8",
    unit: "mmol/L",
  },
  {
    key: "bmi",
    label: "Body Mass Index (BMI)",
    sublabel: "Weight (kg) / Height (m)²",
    type: "number",
    placeholder: "e.g. 24.5",
    unit: "kg/m²",
  },
] as const;

export default function MedicalScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(INITIAL);
  const [fieldError, setFieldError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const current = steps[step];

  const rawValue = data[current.key as keyof FormData];
  const canNext = rawValue.trim() !== "";

  // Validate current field on value change
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
        setFieldError(result.error.issues[0].message);
      } else {
        setFieldError("");
      }
    } else if (current.key === "gender") {
      if (rawValue !== "Male" && rawValue !== "Female") {
        setFieldError("Please select a gender");
      } else {
        setFieldError("");
      }
    } else {
      setFieldError("");
    }
  }, [rawValue, current.key, current.type, canNext]);

  const handleNext = useCallback(async () => {
    if (!canNext || isSubmitting) return;
    if (fieldError) return; // don't proceed if current field invalid

    if (step < steps.length - 1) {
      setStep(step + 1);
      return;
    }

    // ---- Final submission: validate all fields ----
    const parsed = {
      gender: data.gender === "Female" ? "F" : "M",
      age: Number.parseFloat(data.age),
      urea: Number.parseFloat(data.urea),
      cr: Number.parseFloat(data.cr),
      hba1c: Number.parseFloat(data.hba1c),
      chol: Number.parseFloat(data.chol),
      tg: Number.parseFloat(data.tg),
      hdl: Number.parseFloat(data.hdl),
      ldl: Number.parseFloat(data.ldl),
      vldl: Number.parseFloat(data.vldl),
      bmi: Number.parseFloat(data.bmi),
    };

    const validation = medicalDataSchema.safeParse(parsed);
    if (!validation.success) {
      // show first error
      const firstError = validation.error.issues[0];
      setSubmitError(`${firstError.path.join(".")}: ${firstError.message}`);
      return;
    }

    const payload: MedicalRequestPayload = parsed;

    const inputSummary: Record<string, string | number | boolean | null> = {
      gender: payload.gender,
      age: payload.age,
      urea: payload.urea,
      cr: payload.cr,
      hba1c: payload.hba1c,
      chol: payload.chol,
      tg: payload.tg,
      hdl: payload.hdl,
      ldl: payload.ldl,
      vldl: payload.vldl,
      bmi: payload.bmi,
    };

    setSubmitError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${FASTAPI_URL}/predict/medical`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Medical model request failed (${response.status}).`);
      }

      const prediction = (await response.json()) as MedicalPrediction;
      const stored: StoredResult = {
        source: "medical",
        prediction,
        inputSummary,
        submittedAt: new Date().toISOString(),
      };

      sessionStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(stored));
      router.push(`/result?risk=${toRiskKey(prediction.risk_level)}`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not run medical screening right now.";
      setSubmitError(message);
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

  // Enter key behaviour: only advance if field is valid and not submitting
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter" && canNext && !fieldError && !isSubmitting) {
        void handleNext();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canNext, fieldError, isSubmitting, handleNext]);

  return (
    <main className="min-h-screen flex flex-col">
      <nav className="w-full px-6 py-5 border-b border-gray-100/60">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Logo />
          <span className="text-xs text-muted font-medium">
            Medical screening
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
                    key={current.key}
                    type="number"
                    inputMode="decimal"
                    value={rawValue}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={current.placeholder}
                    className={`w-full px-5 py-4 rounded-xl border text-lg bg-page/50 placeholder:text-muted/40 transition-all duration-200 pr-24 ${
                      fieldError
                        ? "border-red-300 focus:border-red-500 focus:ring-red-100"
                        : "border-gray-200 focus:border-primary"
                    }`}
                    autoFocus
                  />
                  {current.unit && (
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm text-muted font-medium bg-mint/60 px-2.5 py-1 rounded-lg">
                      {current.unit}
                    </span>
                  )}
                </div>
              )}

              {current.type === "select" && (
                <div className="flex flex-col gap-2.5">
                  {current.options.map((opt) => {
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

              {/* Error message for current field */}
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
                onClick={() => {
                  void handleNext();
                }}
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

            {/* Keyboard hint (only when field is valid) */}
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
