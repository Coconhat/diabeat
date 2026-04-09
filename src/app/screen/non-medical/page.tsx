"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "@/components/Logo";
import ProgressBar from "@/components/ProgressBar";
import StepWrapper from "@/components/StepWrapper";

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
  { key: "age", label: "How old are you?", sublabel: "Enter your age in years", type: "number", placeholder: "e.g. 35" },
  { key: "gender", label: "What is your gender?", sublabel: "Select one", type: "select", options: ["Male", "Female"] },
  { key: "weight", label: "What is your weight?", sublabel: "In kilograms", type: "number", placeholder: "e.g. 72" },
  { key: "height", label: "What is your height?", sublabel: "In centimeters", type: "number", placeholder: "e.g. 170" },
  { key: "familyHistory", label: "Family history of diabetes?", sublabel: "Has a close relative been diagnosed?", type: "select", options: ["Yes", "No", "Not sure"] },
  { key: "physicalActivity", label: "How active are you?", sublabel: "Your typical weekly activity level", type: "select", options: ["Sedentary", "Lightly active", "Moderately active", "Very active"] },
  { key: "smoking", label: "Do you smoke?", sublabel: "Current smoking status", type: "select", options: ["Yes", "No", "Former smoker"] },
  { key: "diet", label: "How would you describe your diet?", sublabel: "Overall eating habits", type: "select", options: ["Mostly healthy", "Mixed", "Mostly unhealthy"] },
] as const;

export default function NonMedicalScreen() {
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
      // Mock: navigate to result
      router.push("/result?risk=low");
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
                <input
                  type="number"
                  inputMode="numeric"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={current.placeholder}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-lg transition-shadow"
                  autoFocus
                />
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
