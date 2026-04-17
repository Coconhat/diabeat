"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import SpotlightCard from "@/components/SpotlightCard";
import {
  AIInsightProvider,
  AIInsightSections,
  RESULT_STORAGE_KEY,
  RiskKey,
  StoredResult,
  isLifestylePrediction,
  toRiskKey,
} from "@/lib/prediction";

const riskConfig: Record<
  RiskKey,
  {
    label: string;
    color: string;
    textColor: string;
    ringClass: string;
    iconBg: string;
    explanation: string;
  }
> = {
  low: {
    label: "Low Risk",
    color: "bg-risk-low",
    textColor: "text-risk-low",
    ringClass: "pulse-ring pulse-ring-low",
    iconBg: "bg-mint",
    explanation:
      "Based on the information you provided, your estimated risk of diabetes appears to be low. This is encouraging, but maintaining a healthy lifestyle is still important for long-term prevention.",
  },
  moderate: {
    label: "Moderate Risk",
    color: "bg-risk-moderate",
    textColor: "text-risk-moderate",
    ringClass: "pulse-ring pulse-ring-moderate",
    iconBg: "bg-amber-50",
    explanation:
      "Your screening suggests a moderate risk level. Some of your indicators are outside the typical range. We recommend discussing these results with a healthcare professional for further evaluation.",
  },
  high: {
    label: "High Risk",
    color: "bg-risk-high",
    textColor: "text-risk-high",
    ringClass: "pulse-ring pulse-ring-high",
    iconBg: "bg-red-50",
    explanation:
      "Your screening indicates an elevated risk for diabetes. This does not mean you have diabetes, but we strongly recommend consulting with a healthcare professional as soon as possible for proper testing.",
  },
};

interface InsightResponse {
  insight?: AIInsightSections;
  provider?: AIInsightProvider;
  model?: string;
  warning?: string;
}

function scoreToPercent(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score * 100)));
}

function fallbackClientInsight(result: StoredResult): AIInsightSections {
  const score = scoreToPercent(result.prediction.risk_score);

  if (isLifestylePrediction(result.prediction)) {
    const symptom = scoreToPercent(result.prediction.breakdown.symptom_score);
    const lifestyle = scoreToPercent(
      result.prediction.breakdown.lifestyle_score,
    );

    return {
      summary: `Your estimated risk is ${result.prediction.risk_level.toLowerCase()} (${score}%). Symptom signals were ${symptom}% and lifestyle signals were ${lifestyle}%.`,
      combatSteps: [
        "Aim for at least 150 minutes of weekly physical activity.",
        "Reduce sugar-heavy foods and prioritize fiber-rich balanced meals.",
        "Track your sleep, stress, and weight trends each week.",
      ],
      suggestions: [
        "Schedule a follow-up blood sugar or HbA1c test.",
        "Share this result with a healthcare professional for guidance.",
        "Pick one lifestyle habit to improve this week and track consistency.",
      ],
    };
  }

  return {
    summary: `Your estimated risk is ${result.prediction.risk_level.toLowerCase()} (${score}%). This is a screening estimate based on your submitted medical values and not a diagnosis.`,
    combatSteps: [
      "Follow a steady weekly exercise routine appropriate for your condition.",
      "Limit added sugar and refined carbohydrates in daily meals.",
      "Maintain healthy sleep and hydration habits.",
    ],
    suggestions: [
      "Review these results with a clinician for personalized next steps.",
      "Consider regular follow-up lab checks.",
      "Set measurable monthly health goals and track progress.",
    ],
  };
}

function ResultContent() {
  const params = useSearchParams();
  const [storedResult, setStoredResult] = useState<StoredResult | null>(null);
  const [insight, setInsight] = useState<AIInsightSections | null>(null);
  const [insightProvider, setInsightProvider] =
    useState<AIInsightProvider>("fallback");
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [insightWarning, setInsightWarning] = useState("");
  const [insightModel, setInsightModel] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem(RESULT_STORAGE_KEY);
    if (!raw) return;

    try {
      setStoredResult(JSON.parse(raw) as StoredResult);
    } catch {
      setStoredResult(null);
    }
  }, []);

  const queryRisk = params.get("risk");
  const riskKey = useMemo<RiskKey>(() => {
    if (storedResult) {
      return toRiskKey(storedResult.prediction.risk_level);
    }
    return toRiskKey(queryRisk);
  }, [queryRisk, storedResult]);

  const risk = riskConfig[riskKey];

  useEffect(() => {
    if (!storedResult) {
      setInsight(null);
      return;
    }

    let cancelled = false;

    const loadInsight = async () => {
      setIsInsightLoading(true);
      setInsightWarning("");

      try {
        const response = await fetch("/api/gemini-insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(storedResult),
        });

        if (!response.ok) {
          throw new Error(`Insight API failed (${response.status})`);
        }

        const payload = (await response.json()) as InsightResponse;

        if (cancelled) return;

        setInsightWarning(payload.warning ?? "");
        setInsightProvider(payload.provider ?? "fallback");
        setInsightModel(payload.model ?? "");

        setInsight(payload.insight ?? fallbackClientInsight(storedResult));
      } catch {
        if (cancelled) return;
        setInsight(fallbackClientInsight(storedResult));
        setInsightProvider("fallback");
        setInsightModel("");
        setInsightWarning(
          "Gemini is temporarily unavailable, showing fallback insight.",
        );
      } finally {
        if (!cancelled) {
          setIsInsightLoading(false);
        }
      }
    };

    void loadInsight();

    return () => {
      cancelled = true;
    };
  }, [storedResult]);

  const riskScore =
    storedResult !== null
      ? scoreToPercent(storedResult.prediction.risk_score)
      : null;

  return (
    <section className="flex-1 flex flex-col items-center px-6 pt-10 pb-20">
      <div className="w-full max-w-5xl">
        {/* Result card */}
        <div className="max-w-lg mx-auto">
          <div className="bg-card border border-gray-100 rounded-2xl p-8 sm:p-10 text-center shadow-[0_1px_3px_rgba(26,29,35,0.04)] animate-fade-in-up stagger-1">
            <p className="text-xs text-muted mb-6 uppercase tracking-widest font-medium">
              Your screening result
            </p>

            {/* Animated badge with pulse ring */}
            <div className="flex justify-center mb-8">
              <div className={`relative ${risk.ringClass}`}>
                <div
                  className={`relative z-10 inline-flex items-center gap-2.5 px-8 py-4 rounded-full ${risk.color} text-white text-xl font-bold animate-scale-in shadow-lg`}
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.2}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  {risk.label}
                </div>
              </div>
            </div>

            <p className="text-heading text-base leading-relaxed max-w-sm mx-auto">
              {risk.explanation}
            </p>

            {riskScore !== null && (
              <p className="mt-4 text-sm text-muted">
                Estimated score:{" "}
                <span className="font-semibold text-heading">{riskScore}%</span>
              </p>
            )}

            {storedResult && (
              <div className="mt-6 text-left bg-page border border-gray-200/80 rounded-xl p-4 space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted font-medium">
                  Model details
                </p>
                <p className="text-sm text-heading">
                  Source:{" "}
                  {storedResult.source === "medical"
                    ? "Medical model"
                    : "Lifestyle model"}
                </p>
                {isLifestylePrediction(storedResult.prediction) && (
                  <p className="text-sm text-heading">
                    Symptom score:{" "}
                    {scoreToPercent(
                      storedResult.prediction.breakdown.symptom_score,
                    )}
                    % | Lifestyle score:{" "}
                    {scoreToPercent(
                      storedResult.prediction.breakdown.lifestyle_score,
                    )}
                    %
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* AI Explanation */}
        <div className="mt-6 bg-white/90 border border-slate-200/90 rounded-2xl p-5 sm:p-6 animate-fade-in-up stagger-2 shadow-[0_10px_26px_-20px_rgba(15,23,42,0.45)]">
          <div className="flex items-start justify-between gap-3.5 flex-wrap mb-4">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg
                  className="w-4.5 h-4.5 text-trust"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-trust">
                  AI-generated insight
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Personalized summary, action plan, and practical suggestions
                </p>
              </div>
            </div>

            <div className="text-right text-xs text-muted">
              {insightProvider === "gemini"
                ? "Powered by Gemini"
                : "Fallback guidance"}
              {insightModel && (
                <p className="mt-0.5 text-heading">{insightModel}</p>
              )}
            </div>
          </div>

          {isInsightLoading && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-44 rounded-2xl border border-slate-200 bg-white/80 animate-pulse"
                />
              ))}
            </div>
          )}

          {!isInsightLoading && insight && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <SpotlightCard
                className="bg-white border-slate-200 text-heading p-5 rounded-2xl"
                spotlightColor="rgba(230, 240, 255, 0.7)"
              >
                <p className="text-xs uppercase tracking-wide text-muted font-semibold mb-2">
                  1. Summary
                </p>
                <p className="text-sm leading-relaxed">{insight.summary}</p>
              </SpotlightCard>

              <SpotlightCard
                className="bg-white border-slate-200 text-heading p-5 rounded-2xl"
                spotlightColor="rgba(230, 240, 255, 0.7)"
              >
                <p className="text-xs uppercase tracking-wide text-muted font-semibold mb-2">
                  2. How To Combat It
                </p>
                <ol className="list-decimal pl-5 space-y-1.5 text-sm leading-relaxed">
                  {insight.combatSteps.map((step, index) => (
                    <li key={`combat-${index}`}>{step}</li>
                  ))}
                </ol>
              </SpotlightCard>

              <SpotlightCard
                className="bg-white border-slate-200 text-heading p-5 rounded-2xl"
                spotlightColor="rgba(230, 240, 255, 0.7)"
              >
                <p className="text-xs uppercase tracking-wide text-muted font-semibold mb-2">
                  3. Suggestions
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-sm leading-relaxed">
                  {insight.suggestions.map((suggestion, index) => (
                    <li key={`suggestion-${index}`}>{suggestion}</li>
                  ))}
                </ul>
              </SpotlightCard>
            </div>
          )}

          {!isInsightLoading && !insight && (
            <div className="rounded-xl border border-dashed border-blue-200 bg-card p-4 text-sm text-heading">
              Complete a screening to see your personalized AI explanation here.
            </div>
          )}

          {insightWarning && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs text-amber-800 leading-relaxed">
                {insightWarning}
              </p>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="max-w-lg mx-auto mt-5 bg-page border border-gray-200/80 rounded-2xl p-5 animate-fade-in-up stagger-3">
          <div className="flex items-start gap-3">
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
            <p className="text-xs text-muted leading-relaxed">
              <span className="font-semibold text-heading">Disclaimer:</span>{" "}
              This screening tool provides an estimate only and is not a medical
              diagnosis. It should not replace professional medical advice,
              diagnosis, or treatment. Always consult a qualified healthcare
              provider with any questions about your health.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="max-w-lg mx-auto mt-10 flex flex-col gap-3 animate-fade-in-up stagger-4">
          <a
            href="#"
            className="btn-press w-full px-8 py-4 bg-primary hover:bg-primary-dark text-white font-medium rounded-full transition-all text-center shadow-[0_2px_12px_-2px_rgba(0,119,182,0.35)] hover:shadow-[0_4px_20px_-2px_rgba(0,119,182,0.4)] flex items-center justify-center gap-2"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            Talk to a doctor
          </a>
          <Link
            href="/"
            className="btn-press w-full px-8 py-4 bg-trust-light hover:bg-blue-100 text-trust font-medium rounded-full transition-colors text-center flex items-center justify-center gap-2"
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
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Start over
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function ResultPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <nav className="w-full px-6 py-5 border-b border-gray-100/60">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Logo />
          <span className="text-xs text-muted font-medium">Results</span>
        </div>
      </nav>
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <ResultContent />
      </Suspense>
    </main>
  );
}
