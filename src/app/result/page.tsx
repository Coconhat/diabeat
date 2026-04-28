"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import {
  AIInsightProvider,
  AIInsightSections,
  RESULT_STORAGE_KEY,
  RiskKey,
  StoredResult,
  isLifestylePrediction,
  toRiskKey,
} from "@/lib/prediction";
import { supabase } from "@/lib/supabase";
import { saveScreeningToSupabase } from "@/lib/saveScreening";

// ── Risk config ────────────────────────────────────────────────
const riskConfig: Record<
  RiskKey,
  {
    label: string;
    badge: string;
    accent: string;
    bar: string;
    explanation: string;
  }
> = {
  low: {
    label: "Low Risk",
    badge: "bg-risk-low text-white",
    accent: "border-risk-low/30",
    bar: "bg-risk-low",
    explanation:
      "Your indicators suggest a low likelihood of diabetes at this time. Keep up the healthy habits — consistent lifestyle choices are the best long-term protection.",
  },
  moderate: {
    label: "Moderate Risk",
    badge: "bg-risk-moderate text-white",
    accent: "border-risk-moderate/30",
    bar: "bg-risk-moderate",
    explanation:
      "Some of your indicators fall outside the typical range. This isn't a diagnosis, but it's a signal worth discussing with a healthcare professional soon.",
  },
  high: {
    label: "High Risk",
    badge: "bg-risk-high text-white",
    accent: "border-risk-high/30",
    bar: "bg-risk-high",
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

function fallbackInsight(result: StoredResult): AIInsightSections {
  const score = scoreToPercent(result.prediction.risk_score);
  if (isLifestylePrediction(result.prediction)) {
    const s = scoreToPercent(result.prediction.breakdown.symptom_score);
    const l = scoreToPercent(result.prediction.breakdown.lifestyle_score);
    return {
      summary: `Your estimated risk is ${result.prediction.risk_level.toLowerCase()} (${score}%). Symptom signals scored ${s}% and lifestyle signals scored ${l}%.`,
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

// ── Score ring ─────────────────────────────────────────────────
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
          stroke={colorMap[riskKey]}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
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

// ── Mini bar ───────────────────────────────────────────────────
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

// ── Blurred fake preview ───────────────────────────────────────
function BlurredPreview() {
  return (
    <div
      className="px-6 py-6 space-y-6 pointer-events-none select-none"
      aria-hidden
    >
      {/* Fake summary section */}
      <div className="space-y-2">
        <div className="h-2 w-16 bg-gray-200 rounded-full" />
        <div className="h-3 bg-gray-200 rounded-full w-[92%]" />
        <div className="h-3 bg-gray-200 rounded-full w-[78%]" />
        <div className="h-3 bg-gray-200 rounded-full w-[85%]" />
      </div>
      {/* Fake steps */}
      <div className="space-y-3">
        <div className="h-2 w-24 bg-gray-200 rounded-full" />
        {[88, 72, 80].map((w, i) => (
          <div key={i} className="flex gap-2.5 items-start">
            <div className="w-5 h-5 rounded-full bg-gray-200 flex-shrink-0 mt-0.5" />
            <div
              className={`h-3 bg-gray-200 rounded-full mt-1`}
              style={{ width: `${w}%` }}
            />
          </div>
        ))}
      </div>
      {/* Fake suggestions */}
      <div className="space-y-3">
        <div className="h-2 w-28 bg-gray-200 rounded-full" />
        {[75, 90, 68].map((w, i) => (
          <div key={i} className="flex gap-2.5 items-start">
            <div className="w-4 h-4 rounded bg-gray-200 flex-shrink-0 mt-0.5" />
            <div
              className={`h-3 bg-gray-200 rounded-full mt-0.5`}
              style={{ width: `${w}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Sign-in gate overlay ───────────────────────────────────────
function SignInGate({
  onSignIn,
  signingIn,
}: {
  onSignIn: () => void;
  signingIn: boolean;
}) {
  return (
    <div
      className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 text-center rounded-2xl"
      style={{
        background:
          "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.88) 22%, rgba(255,255,255,1) 42%)",
      }}
    >
      {/* Urgency badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mint/70 text-primary text-[11px] font-bold uppercase tracking-wider mb-3">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        Free forever
      </div>

      {/* Headline */}
      <h3 className="text-[22px] font-bold text-heading leading-tight mb-2">
        Your full AI insight is ready
      </h3>

      {/* Sub-copy */}
      <p className="text-sm text-muted max-w-[280px] leading-relaxed mb-5">
        Sign in to unlock it — plus track your diabetes risk over time and get
        notified if anything changes.
      </p>

      {/* Feature grid */}
      <div className="grid grid-cols-2 gap-2 mb-6 w-full max-w-xs text-left">
        {[
          {
            icon: "🧠",
            label: "Full AI explanation",
            sub: "Personalized to your result",
          },
          {
            icon: "📅",
            label: "Screening history",
            sub: "Every test, saved forever",
          },
          {
            icon: "📈",
            label: "Trend tracking",
            sub: "See if risk improves over time",
          },
          {
            icon: "🔒",
            label: "Private & encrypted",
            sub: "Your data stays yours",
          },
        ].map((f) => (
          <div
            key={f.label}
            className="flex items-start gap-2 bg-white/80 border border-gray-100 rounded-xl px-3 py-2.5"
          >
            <span className="text-base mt-0.5">{f.icon}</span>
            <div>
              <p className="text-[11px] font-semibold text-heading">
                {f.label}
              </p>
              <p className="text-[10px] text-muted leading-tight mt-0.5">
                {f.sub}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Google CTA */}
      <button
        onClick={onSignIn}
        disabled={signingIn}
        className="w-full max-w-xs flex items-center justify-center gap-3 px-6 py-3.5 bg-heading hover:opacity-90 text-white font-semibold rounded-full text-sm shadow-[0_4px_16px_-4px_rgba(26,29,35,0.35)] transition-all mb-2 disabled:opacity-60"
      >
        {signingIn ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg
            className="w-4 h-4 flex-shrink-0"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        {signingIn ? "Redirecting..." : "Continue with Google — it's free"}
      </button>

      <p className="text-[10px] text-muted max-w-[240px]">
        Your health data is encrypted and never shared or sold.
      </p>
    </div>
  );
}

// ── Main content ───────────────────────────────────────────────
function ResultContent() {
  const params = useSearchParams();
  const [storedResult, setStoredResult] = useState<StoredResult | null>(null);
  const [insight, setInsight] = useState<AIInsightSections | null>(null);
  const [insightProvider, setInsightProvider] =
    useState<AIInsightProvider>("fallback");
  const [insightModel, setInsightModel] = useState("");
  const [insightWarning, setInsightWarning] = useState("");
  const [isInsightLoading, setIsInsightLoading] = useState(false);

  const [signingIn, setSigningIn] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");

  useEffect(() => {
    if (!storedResult || !isSignedIn || authLoading) return;
    if (saveStatus !== "idle") return; // don't save twice

    const save = async () => {
      setSaveStatus("saving");
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        await saveScreeningToSupabase(user.id, {
          source: storedResult.source,
          prediction: {
            risk_score: storedResult.prediction.risk_score,
            risk_level: storedResult.prediction.risk_level,
            probabilities: storedResult.prediction.probabilities as any, // ✅ fix: allow nested probabilities for lifestyle model
            breakdown: isLifestylePrediction(storedResult.prediction)
              ? storedResult.prediction.breakdown
              : undefined,
          },
          inputSummary: storedResult.inputSummary as Record<
            string,
            string | number | boolean | null
          >,
          submittedAt: storedResult.submittedAt,
        });

        setSaveStatus("saved");
      } catch (e) {
        console.error("Auto-save failed:", e);
        setSaveStatus("error");
      }
    };

    void save();
  }, [storedResult, isSignedIn, authLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsSignedIn(!!data.user);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_e, session) => {
        setIsSignedIn(!!session?.user);
        setAuthLoading(false);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

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

  // Only fetch insight when signed in
  useEffect(() => {
    if (!storedResult || !isSignedIn) {
      setInsight(null);
      return;
    }
    let cancelled = false;

    const load = async () => {
      setIsInsightLoading(true);
      setInsightWarning("");
      try {
        const res = await fetch("/api/gemini-insight", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(storedResult),
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const payload = (await res.json()) as InsightResponse;
        if (cancelled) return;
        setInsightProvider(payload.provider ?? "fallback");
        setInsightModel(payload.model ?? "");
        setInsightWarning(payload.warning ?? "");
        setInsight(payload.insight ?? fallbackInsight(storedResult));
      } catch {
        if (cancelled) return;
        setInsight(fallbackInsight(storedResult));
        setInsightProvider("fallback");
        setInsightWarning(
          "Gemini is temporarily unavailable — showing fallback guidance.",
        );
      } finally {
        if (!cancelled) setIsInsightLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [storedResult, isSignedIn]);

  const handleSignIn = async () => {
    setSigningIn(true);
    const raw = sessionStorage.getItem(RESULT_STORAGE_KEY);
    if (raw) localStorage.setItem("pending_result", raw);

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
  };

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
        {/* ── Date + meta ─────────────────────────────────── */}
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

        {/* ── Risk card ───────────────────────────────────── */}
        <div
          className={`bg-card border-2 ${risk.accent} rounded-2xl p-7 sm:p-8 animate-fade-in-up stagger-1`}
        >
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {riskScore !== null && (
              <div className="flex-shrink-0">
                <ScoreRing percent={riskScore} riskKey={riskKey} />
              </div>
            )}
            <div className="flex-1 text-center sm:text-left">
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
              <p className="text-heading text-sm leading-relaxed">
                {risk.explanation}
              </p>
            </div>
          </div>

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

        {/* ── AI Insight — blurred with gate if not signed in ── */}
        <div className="relative rounded-2xl overflow-hidden animate-fade-in-up stagger-2">
          {/* The card itself */}
          <div
            className={`bg-white border border-slate-200 rounded-2xl overflow-hidden ${!isSignedIn ? "pointer-events-none" : ""}`}
          >
            {/* Header — always visible */}
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
              {isSignedIn && (
                <span className="text-[11px] text-muted bg-page px-2.5 py-1 rounded-full border border-gray-200">
                  {insightProvider === "gemini"
                    ? `Gemini${insightModel ? ` · ${insightModel}` : ""}`
                    : "Fallback guidance"}
                </span>
              )}
            </div>

            {/* Body */}
            {!isSignedIn && (
              <div className="filter blur-sm">
                <BlurredPreview />
              </div>
            )}

            {isSignedIn && isInsightLoading && (
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

            {isSignedIn && !isInsightLoading && insight && (
              <div className="divide-y divide-slate-100">
                <div className="px-6 py-5">
                  <p className="text-[11px] uppercase tracking-widest text-muted font-semibold mb-2">
                    Summary
                  </p>
                  <p className="text-sm text-heading leading-relaxed">
                    {insight.summary}
                  </p>
                </div>
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

            {isSignedIn && insightWarning && (
              <div className="mx-6 mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-xs text-amber-800 leading-relaxed">
                  {insightWarning}
                </p>
              </div>
            )}
          </div>

          {!authLoading && !isSignedIn && (
            <SignInGate onSignIn={handleSignIn} signingIn={signingIn} />
          )}
        </div>

        {/* ── Disclaimer ──────────────────────────────────── */}
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

        {/* Save status indicator */}
        {isSignedIn && (
          <div className="flex items-center justify-end gap-1.5 px-1 -mt-2 animate-fade-in">
            {saveStatus === "saving" && (
              <>
                <div className="w-3 h-3 border border-muted border-t-transparent rounded-full animate-spin" />
                <span className="text-[11px] text-muted">
                  Saving to history...
                </span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <svg
                  className="w-3.5 h-3.5 text-risk-low"
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
                <span className="text-[11px] text-risk-low font-medium">
                  Saved to history
                </span>
                <Link
                  href="/dashboard"
                  className="text-[11px] text-primary font-semibold underline ml-1"
                >
                  View →
                </Link>
              </>
            )}
            {saveStatus === "error" && (
              <span className="text-[11px] text-risk-high">
                Could not save — try again later
              </span>
            )}
          </div>
        )}
        {/* ── Start over ──────────────────────────────────── */}
        <div className="animate-fade-in-up stagger-4">
          <Link
            href="/"
            className="btn-press flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-page hover:bg-gray-100 text-muted hover:text-heading font-medium rounded-full transition-colors text-sm border border-gray-200"
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

// ── Page shell ─────────────────────────────────────────────────
export default function ResultPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
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
