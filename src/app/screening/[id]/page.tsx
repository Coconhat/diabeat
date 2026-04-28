"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type RiskLevel = "Low" | "Moderate" | "High";

interface ScreeningResult {
  risk_score: number;
  risk_level: RiskLevel;
  probabilities: any;
  breakdown: { symptom_score?: number; lifestyle_score?: number } | null;
}

interface Screening {
  id: string;
  source: "medical" | "lifestyle";
  test_taken_on: string;
  submitted_at: string;
  screening_results: ScreeningResult | null;
}

// Input data interfaces (matches your DB schema)
interface LifestyleInputs {
  age: number;
  gender: string;
  weight_kg: number | null;
  height_cm: number | null;
  bmi: number;
  high_bp: number;
  high_chol: number;
  smoker: number;
  heavy_alcohol: number;
  physical_activity: number;
  stroke: number;
  heart_disease: number;
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
}

interface MedicalInputs {
  age: number;
  gender: string;
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

// Helpers
const riskColor: Record<RiskLevel, string> = {
  Low: "#2DB87A",
  Moderate: "#F5A623",
  High: "#E84040",
};

const riskBadge: Record<RiskLevel, string> = {
  Low: "bg-risk-low/10 text-risk-low border-risk-low/20",
  Moderate: "bg-amber-50 text-risk-moderate border-amber-200",
  High: "bg-red-50 text-risk-high border-red-200",
};

function scoreToPercent(s: number): number {
  if (typeof s !== "number" || !Number.isFinite(s)) return 0;
  return Math.max(0, Math.min(100, Math.round(s * 100)));
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Mini bar component
function MiniBar({
  label,
  value,
  level,
}: {
  label: string;
  value: number;
  level: RiskLevel;
}) {
  const barColor =
    level === "Low"
      ? "bg-risk-low"
      : level === "Moderate"
        ? "bg-risk-moderate"
        : "bg-risk-high";
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-muted">{label}</span>
        <span className="text-xs font-semibold text-heading">{value}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} transition-all duration-500`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// Score ring (big)
function ScoreRing({ percent, level }: { percent: number; level: RiskLevel }) {
  const r = 54,
    circ = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="128" height="128" className="-rotate-90">
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke="#E8F7F1"
          strokeWidth="10"
        />
        <circle
          cx="64"
          cy="64"
          r={r}
          fill="none"
          stroke={riskColor[level]}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(percent / 100) * circ} ${circ}`}
          style={{ transition: "stroke-dasharray 1.2s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-heading">{percent}%</span>
        <span className="text-[10px] text-muted uppercase tracking-wider">
          risk
        </span>
      </div>
    </div>
  );
}

// Component to display a grid of user answers
function InputGrid({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: any }[];
}) {
  return (
    <div className="mt-6 pt-5 border-t border-gray-100">
      <p className="text-xs font-semibold text-heading uppercase tracking-wider mb-3">
        {title}
      </p>
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex justify-between text-sm border-b border-gray-200 pb-2 last:border-0 last:pb-0"
          >
            <span className="text-muted">{item.label}</span>
            <span className="font-medium text-heading">
              {item.value ?? "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ScreeningDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [screening, setScreening] = useState<Screening | null>(null);
  const [inputs, setInputs] = useState<LifestyleInputs | MedicalInputs | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const id = params.id as string;

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/");
        return;
      }
      setUser(user);

      // Fetch screening metadata
      const { data: screeningData, error: screeningError } = await supabase
        .from("screenings")
        .select("id, source, test_taken_on, submitted_at")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (screeningError || !screeningData) {
        router.push("/dashboard");
        return;
      }

      // Fetch result
      const { data: resultData, error: resultError } = await supabase
        .from("screening_results")
        .select("risk_score, risk_level, probabilities, breakdown")
        .eq("screening_id", id)
        .single();

      if (resultError) {
        console.error(resultError);
        router.push("/dashboard");
        return;
      }

      // Fetch inputs based on source
      let inputData = null;
      if (screeningData.source === "lifestyle") {
        const { data, error } = await supabase
          .from("screening_lifestyle_inputs")
          .select("*")
          .eq("screening_id", id)
          .single();
        if (!error) inputData = data as LifestyleInputs;
      } else {
        const { data, error } = await supabase
          .from("screening_medical_inputs")
          .select("*")
          .eq("screening_id", id)
          .single();
        if (!error) inputData = data as MedicalInputs;
      }

      setScreening({
        ...screeningData,
        screening_results: {
          risk_score: resultData.risk_score,
          risk_level: resultData.risk_level as RiskLevel,
          probabilities: resultData.probabilities,
          breakdown: resultData.breakdown,
        },
      });
      setInputs(inputData);
      setLoading(false);
    };

    fetchData();
  }, [id, router]);

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this screening? This action cannot be undone.",
      )
    )
      return;
    setDeleting(true);
    const { error } = await supabase
      .from("screenings")
      .delete()
      .eq("id", id)
      .eq("user_id", user!.id);
    if (error) {
      alert("Failed to delete screening.");
      setDeleting(false);
    } else {
      router.push("/dashboard");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-page">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!screening || !screening.screening_results) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-page">
        <p className="text-muted">Screening not found.</p>
      </main>
    );
  }

  const result = screening.screening_results;
  const pct = scoreToPercent(result.risk_score);
  const level = result.risk_level;
  const isLifestyle = screening.source === "lifestyle";

  // Build items for InputGrid
  let inputItems: { label: string; value: any }[] = [];
  if (isLifestyle && inputs) {
    const i = inputs as LifestyleInputs;
    inputItems = [
      { label: "Age", value: i.age },
      {
        label: "Gender",
        value:
          i.gender === "M" ? "Male" : i.gender === "F" ? "Female" : i.gender,
      },
      { label: "Weight (kg)", value: i.weight_kg },
      { label: "Height (cm)", value: i.height_cm },
      { label: "BMI", value: i.bmi },
      { label: "High blood pressure", value: i.high_bp === 1 ? "Yes" : "No" },
      { label: "High cholesterol", value: i.high_chol === 1 ? "Yes" : "No" },
      {
        label: "Smoker (100+ cigarettes)",
        value: i.smoker === 1 ? "Yes" : "No",
      },
      {
        label: "Heavy alcohol use",
        value: i.heavy_alcohol === 1 ? "Yes" : "No",
      },
      {
        label: "Physical activity (past 30 days)",
        value: i.physical_activity === 1 ? "Yes" : "No",
      },
      { label: "History of stroke", value: i.stroke === 1 ? "Yes" : "No" },
      {
        label: "History of heart disease",
        value: i.heart_disease === 1 ? "Yes" : "No",
      },
      {
        label: "Polyuria (frequent urination)",
        value: i.polyuria === 1 ? "Yes" : "No",
      },
      {
        label: "Polydipsia (excessive thirst)",
        value: i.polydipsia === 1 ? "Yes" : "No",
      },
      {
        label: "Sudden weight loss",
        value: i.sudden_weight_loss === 1 ? "Yes" : "No",
      },
      { label: "Weakness / fatigue", value: i.weakness === 1 ? "Yes" : "No" },
      {
        label: "Polyphagia (excessive hunger)",
        value: i.polyphagia === 1 ? "Yes" : "No",
      },
      { label: "Genital thrush", value: i.genital_thrush === 1 ? "Yes" : "No" },
      {
        label: "Blurred vision",
        value: i.visual_blurring === 1 ? "Yes" : "No",
      },
      { label: "Itching", value: i.itching === 1 ? "Yes" : "No" },
      { label: "Irritability", value: i.irritability === 1 ? "Yes" : "No" },
      {
        label: "Delayed wound healing",
        value: i.delayed_healing === 1 ? "Yes" : "No",
      },
      {
        label: "Partial paresis (muscle weakness)",
        value: i.partial_paresis === 1 ? "Yes" : "No",
      },
      {
        label: "Muscle stiffness / cramps",
        value: i.muscle_stiffness === 1 ? "Yes" : "No",
      },
      { label: "Alopecia (hair loss)", value: i.alopecia === 1 ? "Yes" : "No" },
      { label: "Obesity (BMI ≥ 30)", value: i.obesity === 1 ? "Yes" : "No" },
    ];
  } else if (!isLifestyle && inputs) {
    const i = inputs as MedicalInputs;
    inputItems = [
      { label: "Age", value: i.age },
      { label: "Gender", value: i.gender === "M" ? "Male" : "Female" },
      { label: "Urea (mg/dL)", value: i.urea },
      { label: "Creatinine (mg/dL)", value: i.cr },
      { label: "HbA1c (%)", value: i.hba1c },
      { label: "Cholesterol (mg/dL)", value: i.chol },
      { label: "Triglycerides (mg/dL)", value: i.tg },
      { label: "HDL (mg/dL)", value: i.hdl },
      { label: "LDL (mg/dL)", value: i.ldl },
      { label: "VLDL (mg/dL)", value: i.vldl },
      { label: "BMI", value: i.bmi },
    ];
  }

  return (
    <main className="min-h-screen flex flex-col bg-page">
      <nav className="w-full px-6 py-5 border-b border-gray-100/60 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Logo />
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs text-muted hover:text-heading transition-colors font-medium"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to dashboard
          </Link>
        </div>
      </nav>

      <section className="flex-1 flex flex-col items-center px-4 sm:px-6 pt-8 pb-24">
        <div className="w-full max-w-2xl space-y-4">
          {/* Header with date and model */}
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted font-medium">
                Screening details
              </p>
              <p className="text-sm font-semibold text-heading mt-0.5">
                {formatFullDate(screening.test_taken_on)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">
                {formatTime(screening.submitted_at)}
              </p>
              <span className="inline-block mt-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-mint/50 text-primary">
                {screening.source === "medical"
                  ? "Clinical model"
                  : "Lifestyle model"}
              </span>
            </div>
          </div>

          {/* Risk card */}
          <div
            className={`bg-white border-2 rounded-2xl p-7 sm:p-8`}
            style={{ borderColor: `${riskColor[level]}33` }}
          >
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <ScoreRing percent={pct} level={level} />
              <div className="flex-1 text-center sm:text-left">
                <span
                  className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold ${riskBadge[level]} mb-3`}
                >
                  {level} Risk
                </span>
                <p className="text-heading text-sm leading-relaxed">
                  Your screening indicates a{" "}
                  <strong>{level.toLowerCase()}</strong> risk of diabetes.
                  {level === "Low" && " Keep up the healthy habits."}
                  {level === "Moderate" &&
                    " Consider discussing this result with a healthcare professional."}
                  {level === "High" &&
                    " Please consult a doctor for proper clinical testing."}
                </p>
              </div>
            </div>

            {/* Breakdown for lifestyle */}
            {isLifestyle && result.breakdown && (
              <div className="mt-6 pt-5 border-t border-gray-100 space-y-3">
                <p className="text-xs uppercase tracking-widest text-muted font-medium mb-3">
                  Score breakdown
                </p>
                <MiniBar
                  label="Symptom signals"
                  value={scoreToPercent(result.breakdown?.symptom_score ?? 0)}
                  level={level}
                />
                <MiniBar
                  label="Lifestyle signals"
                  value={scoreToPercent(result.breakdown?.lifestyle_score ?? 0)}
                  level={level}
                />
              </div>
            )}

            {/* Probabilities section */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <p className="text-xs font-semibold text-heading uppercase tracking-wider mb-3">
                Model probabilities
              </p>
              {screening.source === "medical" ? (
                <div className="space-y-2">
                  <MiniBar
                    label="No Diabetes"
                    value={scoreToPercent(result.probabilities.no_diabetes)}
                    level={level}
                  />
                  <MiniBar
                    label="Pre‑diabetic"
                    value={scoreToPercent(result.probabilities.pre_diabetic)}
                    level={level}
                  />
                  <MiniBar
                    label="Diabetic"
                    value={scoreToPercent(result.probabilities.diabetic)}
                    level={level}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-[11px] text-muted">
                      UCI (symptom) model
                    </p>
                    <MiniBar
                      label="Negative"
                      value={scoreToPercent(result.probabilities.uci.negative)}
                      level={level}
                    />
                    <MiniBar
                      label="Positive"
                      value={scoreToPercent(result.probabilities.uci.positive)}
                      level={level}
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] text-muted">
                      CDC (lifestyle) model
                    </p>
                    <MiniBar
                      label="No Diabetes"
                      value={scoreToPercent(
                        result.probabilities.cdc.no_diabetes,
                      )}
                      level={level}
                    />
                    <MiniBar
                      label="Prediabetes"
                      value={scoreToPercent(
                        result.probabilities.cdc.prediabetes,
                      )}
                      level={level}
                    />
                    <MiniBar
                      label="Diabetes"
                      value={scoreToPercent(result.probabilities.cdc.diabetes)}
                      level={level}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* User inputs section */}
          {inputs && inputItems.length > 0 && (
            <InputGrid title="Your answers" items={inputItems} />
          )}

          {/* Delete button */}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl transition-colors text-sm border border-red-200 disabled:opacity-50"
          >
            {deleting ? (
              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            )}
            Delete screening
          </button>

          {/* Disclaimer */}
          <div className="flex gap-3 px-4 py-4 bg-page border border-dashed border-gray-200 rounded-xl">
            <svg
              className="w-4 h-4 text-muted mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-[11px] text-muted leading-relaxed">
              <span className="font-semibold text-heading">
                Not a medical diagnosis.
              </span>{" "}
              This is a screening estimate only. Always consult a qualified
              healthcare provider.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
