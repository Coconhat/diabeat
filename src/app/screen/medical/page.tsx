"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import ProgressBar from "@/components/ProgressBar";
import StepWrapper from "@/components/StepWrapper";

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
  { key: "age", label: "How old are you?", sublabel: "Enter your age in years", type: "number", placeholder: "e.g. 45", unit: "years" },
  { key: "gender", label: "What is your gender?", sublabel: "Select one", type: "select", options: ["Male", "Female"], unit: "" },
  { key: "urea", label: "Blood Urea level", sublabel: "From your lab results", type: "number", placeholder: "e.g. 4.7", unit: "mmol/L" },
  { key: "cr", label: "Creatinine (Cr)", sublabel: "Serum creatinine level", type: "number", placeholder: "e.g. 80", unit: "μmol/L" },
  { key: "hba1c", label: "HbA1c level", sublabel: "Glycated hemoglobin percentage", type: "number", placeholder: "e.g. 5.7", unit: "%" },
  { key: "chol", label: "Total Cholesterol", sublabel: "From your lipid panel", type: "number", placeholder: "e.g. 5.2", unit: "mmol/L" },
  { key: "tg", label: "Triglycerides (TG)", sublabel: "From your lipid panel", type: "number", placeholder: "e.g. 1.7", unit: "mmol/L" },
  { key: "hdl", label: "HDL Cholesterol", sublabel: "High-density lipoprotein", type: "number", placeholder: "e.g. 1.3", unit: "mmol/L" },
  { key: "ldl", label: "LDL Cholesterol", sublabel: "Low-density lipoprotein", type: "number", placeholder: "e.g. 3.0", unit: "mmol/L" },
  { key: "vldl", label: "VLDL Cholesterol", sublabel: "Very low-density lipoprotein", type: "number", placeholder: "e.g. 0.8", unit: "mmol/L" },
  { key: "bmi", label: "Body Mass Index (BMI)", sublabel: "Weight (kg) / Height (m)²", type: "number", placeholder: "e.g. 24.5", unit: "kg/m²" },
] as const;

export default function MedicalScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(INITIAL);
  const current = steps[step];

  const value = data[current.key as keyof FormData];
  const canNext = value.trim() !== "";

  function handleNext() {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      // Mock: navigate to result with "moderate" for medical path
      router.push("/result?risk=moderate");
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  function setValue(val: string) {
    setData({ ...data, [current.key]: val });
  }

  return (
    <main className="min-h-screen flex flex-col">
      <nav className="w-full px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <Logo />
        </div>
      </nav>

      <section className="flex-1 flex flex-col items-center px-6 pt-8 pb-20">
        <div className="w-full max-w-lg">
          <ProgressBar current={step + 1} total={steps.length} />

          <div className="mt-8 bg-card border border-gray-100 rounded-2xl p-8">
            <StepWrapper label={current.label} sublabel={current.sublabel}>
              {current.type === "number" && (
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={current.placeholder}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-lg transition-shadow pr-20"
                    autoFocus
                  />
                  {current.unit && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted">
                      {current.unit}
                    </span>
                  )}
                </div>
              )}

              {current.type === "select" && (
                <div className="flex flex-col gap-3">
                  {current.options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setValue(opt)}
                      className={`w-full text-left px-5 py-3.5 rounded-xl border transition-all ${
                        value === opt
                          ? "border-primary bg-mint text-primary font-medium"
                          : "border-gray-200 hover:border-gray-300 text-heading"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </StepWrapper>

            <div className="flex items-center justify-between mt-8">
              <button
                onClick={handleBack}
                disabled={step === 0}
                className="px-5 py-2.5 text-muted hover:text-heading rounded-full transition-colors disabled:opacity-0"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={!canNext}
                className="px-8 py-2.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {step === steps.length - 1 ? "See results" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
