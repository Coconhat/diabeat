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

// ── Risk config ────────────────────────────────────────────────
const riskConfig: Record<
  RiskKey,
  {
    label: string;
    badge: string; // badge bg + text
    accent: string; // border / ring
    pill: string; // subtle pill behind badge
    bar: string; // progress bar fill
    icon: string; // icon color
    explanation: string;
  }
> = {
  low: {
    label: "Low Risk",
    badge: "bg-risk-low text-white",
    accent: "border-risk-low/30",
    pill: "bg-mint/40",
    bar: "bg-risk-low",
    icon: "text-risk-low",
    explanation:
      "Your indicators suggest a low likelihood of diabetes at this time. Keep up the healthy habits — consistent lifestyle choices are the best long-term protection.",
  },
  moderate: {
    label: "Moderate Risk",
    badge: "bg-risk-moderate text-white",
    accent: "border-risk-moderate/30",
    pill: "bg-amber-50",
    bar: "bg-risk-moderate",
    icon: "text-risk-moderate",
    explanation:
      "Some of your indicators fall outside the typical range. This isn't a diagnosis, but it's a signal worth discussing with a healthcare professional soon.",
  },
  high: {
    label: "High Risk",
    badge: "bg-risk-high text-white",
    accent: "border-risk-high/30",
    pill: "bg-red-50",
    bar: "bg-risk-high",
    icon: "text-risk-high",
    explanation:
      "Your screening shows an elevated risk profile. Please consult a healthcare professional as soon as possible for proper clinical testing — early detection makes a significant difference.",
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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function fallbackClientInsight(result: StoredResult): AIInsightSections {
  const score = scoreToPercent(result.prediction.risk_score);

  if (isLifestylePrediction(result.prediction)) {
    const symptom = scoreToPercent(result.prediction.breakdown.symptom_score);
    const lifestyle = scoreToPercent(
      result.prediction.breakdown.lifestyle_score,
    );
    return {
      summary: `Your estimated risk is ${result.prediction.risk_level.toLowerCase()} (${score}%). Symptom signals scored ${symptom}% and lifestyle signals scored ${lifestyle}%.`,
      combatSteps: [
        "Aim for at least 150 minutes of moderate physical activity per week.",
        "Reduce sugar-heavy foods and prioritize fiber-rich, balanced meals.",
        "Track your sleep, stress, and weight trends consistently.",
      ],
      suggestions: [
        "Schedule a follow-up blood sugar or HbA1c test with your doctor.",
        "Share this result with a healthcare professional for guidance.",
        "Pick one lifestyle habit to improve this week and track consistency.",
      ],
    };
  }

  return {
    summary: `Your estimated risk is ${result.prediction.risk_level.toLowerCase()} (${score}%). This is a screening estimate based on your submitted medical values — not a diagnosis.`,
    combatSteps: [
      "Follow a steady weekly exercise routine appropriate for your condition.",
      "Limit added sugar and refined carbohydrates in daily meals.",
      "Maintain healthy sleep and hydration habits.",
    ],
    suggestions: [
      "Review these results with a clinician for personalized next steps.",
      "Consider scheduling regular follow-up lab checks.",
      "Set measurable monthly health goals and track your progress.",
    ],
  };
}

// ── Score ring SVG ─────────────────────────────────────────────
function ScoreRing({
  percent,
  riskKey,
}: {
  percent: number;
  riskKey: RiskKey;
}) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (percent / 100) * circ;
  const colorMap: Record<RiskKey, string> = {
    low: "#2DB87A",
    moderate: "#F5A623",
    high: "#E84040",
  };
  const color = colorMap[riskKey];

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
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke-dasharray 1s ease" }}
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

// ── Trend mini-bar ─────────────────────────────────────────────
function MiniBar({
  label,
  value,
  riskKey,
}: {
  label: string;
  value: number;
  riskKey: RiskKey;
}) {
  const colorMap: Record<RiskKey, string> = {
    low: "bg-risk-low",
    moderate: "bg-risk-moderate",
    high: "bg-risk-high",
  };
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-xs text-muted">{label}</span>
        <span className="text-xs font-semibold text-heading">{value}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${colorMap[riskKey]} transition-all duration-1000`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

// ── Main result content ────────────────────────────────────────
function ResultContent() {
  const params = useSearchParams();
  const [storedResult, setStoredResult] = useState<StoredResult | null>(null);
  const [insight, setInsight] = useState<AIInsightSections | null>(null);
  const [insightProvider, setInsightProvider] =
    useState<AIInsightProvider>("fallback");
  const [isInsightLoading, setIsInsightLoading] = useState(false);
  const [insightWarning, setInsightWarning] = useState("");
  const [insightModel, setInsightModel] = useState("");
  const [saved, setSaved] = useState(false);

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
    if (storedResult) return toRiskKey(storedResult.prediction.risk_level);
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
        if (!response.ok)
          throw new Error(`Insight API failed (${response.status})`);
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
          "Gemini is temporarily unavailable — showing fallback guidance.",
        );
      } finally {
        if (!cancelled) setIsInsightLoading(false);
      }
    };

    void loadInsight();
    return () => {
      cancelled = true;
    };
  }, [storedResult]);

  const riskScore = storedResult
    ? scoreToPercent(storedResult.prediction.risk_score)
    : null;
  const takenAt = storedResult?.submittedAt ?? null;
  const isLifestyle =
    storedResult && isLifestylePrediction(storedResult.prediction);
  const symptomPct = isLifestyle
    ? scoreToPercent((storedResult!.prediction as any).breakdown.symptom_score)
    : null;
  const lifestylePct = isLifestyle
    ? scoreToPercent(
        (storedResult!.prediction as any).breakdown.lifestyle_score,
      )
    : null;

  return (
    <section className="flex-1 flex flex-col items-center px-4 sm:px-6 pt-8 pb-24">
      <div className="w-full max-w-2xl space-y-4">
        {/* ── 1. Date + meta row ─────────────────────────── */}
        {takenAt && (
          <div className="flex items-center justify-between px-1 animate-fade-in">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted font-medium">
                Screening result
              </p>
              <p className="text-sm font-semibold text-heading mt-0.5">
                {formatDate(takenAt)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">{formatTime(takenAt)}</p>
              <span className="inline-block mt-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-mint/50 text-primary">
                {storedResult?.source === "medical" ? "Clinical" : "Lifestyle"}{" "}
                model
              </span>
            </div>
          </div>
        )}

        {/* ── 2. Hero result card ────────────────────────── */}
        <div
          className={`bg-card border-2 ${risk.accent} rounded-2xl p-7 sm:p-8 animate-fade-in-up stagger-1`}
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Score ring — the primary visual */}
            {riskScore !== null && (
              <div className="flex-shrink-0">
                <ScoreRing percent={riskScore} riskKey={riskKey} />
              </div>
            )}

            <div className="flex-1 text-center sm:text-left">
              {/* Risk badge */}
              <span
                className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold ${risk.badge} mb-3`}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                {risk.label}
              </span>

              {/* Explanation — primary body text */}
              <p className="text-heading text-sm leading-relaxed">
                {risk.explanation}
              </p>
            </div>
          </div>

          {/* Sub-scores — only for lifestyle */}
          {isLifestyle && symptomPct !== null && lifestylePct !== null && (
            <div className="mt-6 pt-5 border-t border-gray-100 space-y-3">
              <p className="text-xs uppercase tracking-widest text-muted font-medium mb-3">
                Score breakdown
              </p>
              <MiniBar
                label="Symptom signals"
                value={symptomPct}
                riskKey={riskKey}
              />
              <MiniBar
                label="Lifestyle signals"
                value={lifestylePct}
                riskKey={riskKey}
              />
            </div>
          )}
        </div>

        {/* ── 3. AI Insight card ─────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden animate-fade-in-up stagger-2">
          {/* Card header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-trust-light flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-trust"
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
                <p className="text-sm font-semibold text-heading">
                  AI-generated insight
                </p>
                <p className="text-[11px] text-muted">
                  Personalized to your screening
                </p>
              </div>
            </div>
            <span className="text-[11px] text-muted bg-page px-2.5 py-1 rounded-full border border-gray-200">
              {insightProvider === "gemini"
                ? `Gemini${insightModel ? ` · ${insightModel}` : ""}`
                : "Fallback guidance"}
            </span>
          </div>

          {/* Loading skeleton */}
          {isInsightLoading && (
            <div className="p-6 space-y-3">
              {[80, 60, 70].map((w, i) => (
                <div
                  key={i}
                  className="h-3 bg-gray-100 rounded-full animate-pulse"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          )}

          {/* Insight content — stacked, not 3 cols */}
          {!isInsightLoading && insight && (
            <div className="divide-y divide-slate-100">
              {/* Summary */}
              <div className="px-6 py-5">
                <p className="text-[11px] uppercase tracking-widest text-muted font-semibold mb-2">
                  Summary
                </p>
                <p className="text-sm text-heading leading-relaxed">
                  {insight.summary}
                </p>
              </div>

              {/* Combat steps */}
              <div className="px-6 py-5">
                <p className="text-[11px] uppercase tracking-widest text-muted font-semibold mb-3">
                  How to reduce your risk
                </p>
                <ol className="space-y-2.5">
                  {insight.combatSteps.map((step, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm text-heading leading-relaxed"
                    >
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-mint text-primary text-[11px] font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* Suggestions */}
              <div className="px-6 py-5">
                <p className="text-[11px] uppercase tracking-widest text-muted font-semibold mb-3">
                  Suggested next steps
                </p>
                <ul className="space-y-2.5">
                  {insight.suggestions.map((s, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm text-heading leading-relaxed"
                    >
                      <svg
                        className="flex-shrink-0 w-4 h-4 text-primary mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* No insight state */}
          {!isInsightLoading && !insight && (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-muted">
                Complete a screening to see your personalized AI insight here.
              </p>
            </div>
          )}

          {/* Warning banner */}
          {insightWarning && (
            <div className="mx-6 mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-xs text-amber-800 leading-relaxed">
                {insightWarning}
              </p>
            </div>
          )}
        </div>

        {/* ── 4. Disclaimer ──────────────────────────────── */}
        <div className="flex gap-3 px-4 py-4 bg-page border border-dashed border-gray-200 rounded-xl animate-fade-in-up stagger-3">
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
            This tool provides estimates only. Always consult a qualified
            healthcare provider for proper diagnosis and treatment.
          </p>
        </div>

        {/* ── 5. Actions ─────────────────────────────────── */}
        <div className="space-y-2.5 animate-fade-in-up stagger-4">
          {/* Primary CTA — Save result */}
          {!saved && storedResult && (
            <button
              onClick={() => {
                // Store for OAuth → save flow
                localStorage.setItem(
                  "pending_result",
                  sessionStorage.getItem(RESULT_STORAGE_KEY) ?? "",
                );
                // TODO: trigger supabase OAuth
                setSaved(true);
              }}
              className="btn-press w-full px-8 py-4 bg-primary hover:bg-primary-dark text-white font-semibold rounded-full transition-all text-center shadow-[0_2px_12px_-2px_rgba(45,184,122,0.4)] hover:shadow-[0_4px_20px_-2px_rgba(45,184,122,0.5)] flex items-center justify-center gap-2"
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
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              Save result to my history
            </button>
          )}

          {saved && (
            <div className="w-full px-8 py-4 bg-mint/60 border border-risk-low/30 text-primary font-semibold rounded-full text-center text-sm flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
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
              Saved — signing you in...
            </div>
          )}

          {/* Secondary CTAs */}
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href="https://www.doctor.com"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-press flex items-center justify-center gap-2 px-5 py-3.5 bg-trust-light hover:bg-blue-100 text-trust font-medium rounded-full transition-colors text-sm"
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
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              Find a doctor
            </a>

            <Link
              href="/"
              className="btn-press flex items-center justify-center gap-2 px-5 py-3.5 bg-page hover:bg-gray-100 text-muted hover:text-heading font-medium rounded-full transition-colors text-sm border border-gray-200"
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
      </div>
    </section>
  );
}

// ── Page shell ─────────────────────────────────────────────────
export default function ResultPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <nav className="w-full px-6 py-5 border-b border-gray-100/60 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Logo />
          <Link
            href="/history"
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            History
          </Link>
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
