"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type RiskLevel = "Low" | "Moderate" | "High";

type ScreeningResult = {
  risk_score: number;
  risk_level: RiskLevel;
  probabilities: Record<string, number>;
  breakdown: { symptom_score?: number; lifestyle_score?: number } | null;
};

interface Screening {
  id: string;
  source: "medical" | "lifestyle";
  test_taken_on: string;
  submitted_at: string;
  screening_results: ScreeningResult | null;
}

type ScreeningRowFromDB = {
  id: string;
  source: "medical" | "lifestyle";
  test_taken_on: string;
  submitted_at: string;
  screening_results: {
    risk_score: number;
    risk_level: string;
    probabilities: Record<string, number>;
    breakdown: { symptom_score?: number; lifestyle_score?: number } | null;
  }[];
};

function normalizeScreeningRow(row: ScreeningRowFromDB): Screening {
  const firstResult = row.screening_results?.[0] ?? null;
  return {
    ...row,
    screening_results: firstResult
      ? {
          ...firstResult,
          risk_level: firstResult.risk_level as RiskLevel,
        }
      : null,
  };
}

// ── Helpers ────────────────────────────────────────────────────
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

function scoreToPercent(s: number) {
  return Math.max(0, Math.min(100, Math.round(s * 100)));
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFullDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function memberSince(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

// ── Mini trend sparkline ───────────────────────────────────────
function TrendSparkline({ screenings }: { screenings: Screening[] }) {
  const points = screenings
    .filter((s) => s.screening_results)
    .slice(0, 8)
    .reverse()
    .map((s) => scoreToPercent(s.screening_results!.risk_score));

  if (points.length < 2) return null;

  const W = 280,
    H = 72,
    pad = 8;
  const max = Math.max(...points, 100);
  const min = 0;

  const coords = points.map((v, i) => ({
    x: pad + (i / (points.length - 1)) * (W - pad * 2),
    y: H - pad - ((v - min) / (max - min)) * (H - pad * 2),
  }));

  const path = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`)
    .join(" ");

  const fill = [
    ...coords.map((c) => `${c.x},${c.y}`),
    `${coords[coords.length - 1].x},${H}`,
    `${coords[0].x},${H}`,
  ].join(" ");

  const latest = points[points.length - 1];
  const prev = points[points.length - 2];
  const delta = latest - prev;
  const trend = delta === 0 ? "stable" : delta < 0 ? "improving" : "rising";
  const trendColor =
    trend === "improving"
      ? "text-risk-low"
      : trend === "rising"
        ? "text-risk-high"
        : "text-muted";
  const trendLabel =
    trend === "improving"
      ? `↓ ${Math.abs(delta)}% from last`
      : trend === "rising"
        ? `↑ ${delta}% from last`
        : "No change from last";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-widest text-muted font-medium">
          Risk trend
        </p>
        <span className={`text-xs font-semibold ${trendColor}`}>
          {trendLabel}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 72 }}>
        {/* Zone bands */}
        <rect
          x={0}
          y={0}
          width={W}
          height={H * 0.3}
          fill="#E84040"
          opacity={0.04}
        />
        <rect
          x={0}
          y={H * 0.3}
          width={W}
          height={H * 0.3}
          fill="#F5A623"
          opacity={0.04}
        />
        <rect
          x={0}
          y={H * 0.6}
          width={W}
          height={H * 0.4}
          fill="#2DB87A"
          opacity={0.04}
        />
        {/* Fill */}
        <polygon points={fill} fill="url(#sparkGrad)" opacity={0.25} />
        {/* Line */}
        <path
          d={path}
          fill="none"
          stroke="#2B6FEB"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Dots */}
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={i === coords.length - 1 ? 4 : 3}
            fill={i === coords.length - 1 ? "#2B6FEB" : "#fff"}
            stroke="#2B6FEB"
            strokeWidth="2"
          />
        ))}
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2B6FEB" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#2B6FEB" stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>
      {/* X labels */}
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-muted">Oldest</span>
        <span className="text-[10px] text-muted">Latest</span>
      </div>
    </div>
  );
}

// ── Score ring ─────────────────────────────────────────────────
function ScoreRing({ percent, level }: { percent: number; level: RiskLevel }) {
  const r = 42,
    circ = 2 * Math.PI * r;
  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0">
      <svg width="100" height="100" className="-rotate-90">
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#F5F7FA"
          strokeWidth="9"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={riskColor[level]}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${(percent / 100) * circ} ${circ}`}
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-lg font-bold text-heading">{percent}%</span>
        <span className="text-[9px] text-muted uppercase tracking-wide">
          risk
        </span>
      </div>
    </div>
  );
}

// ── Screening row ──────────────────────────────────────────────
function ScreeningRow({ s, isLatest }: { s: Screening; isLatest: boolean }) {
  const result = s.screening_results;
  if (!result) return null;
  const pct = scoreToPercent(result.risk_score);
  const level = result.risk_level;

  return (
    <div
      className={`flex items-center gap-4 px-5 py-4 rounded-xl border transition-all hover:shadow-sm ${
        isLatest
          ? "border-primary/20 bg-mint/10"
          : "border-gray-100 bg-white hover:border-gray-200"
      }`}
    >
      {/* Mini ring */}
      <div className="relative flex-shrink-0 w-10 h-10">
        <svg viewBox="0 0 40 40" className="-rotate-90 w-10 h-10">
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="#F5F7FA"
            strokeWidth="5"
          />
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke={riskColor[level]}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${(pct / 100) * 2 * Math.PI * 16} ${
              2 * Math.PI * 16
            }`}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-heading">
          {pct}%
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${riskBadge[level]}`}
          >
            {level} Risk
          </span>
          <span className="text-[11px] text-muted capitalize">
            {s.source === "medical" ? "Clinical" : "Lifestyle"}
          </span>
          {isLatest && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
              Latest
            </span>
          )}
        </div>
        <p className="text-xs text-muted mt-1">
          {formatShortDate(s.test_taken_on)}
        </p>
      </div>

      {/* Arrow */}
      <svg
        className="w-4 h-4 text-muted flex-shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="text-center py-12 px-6">
      <div className="w-14 h-14 rounded-2xl bg-mint/40 flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-7 h-7 text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <p className="text-sm font-semibold text-heading mb-1">
        No screenings yet
      </p>
      <p className="text-xs text-muted mb-5">
        Take your first screening and your results will appear here.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-full text-sm shadow-[0_2px_12px_-2px_rgba(45,184,122,0.4)] hover:bg-primary-dark transition-all"
      >
        Take a screening
      </Link>
    </div>
  );
}

async function saveScreeningToSupabase(
  userId: string,
  stored: {
    source: "medical" | "lifestyle";
    prediction: {
      risk_score: number;
      risk_level: string;
      probabilities: Record<string, number>;
      breakdown?: Record<string, number>;
    };
    inputSummary: Record<string, string | number | boolean | null>;
    submittedAt: string;
  },
) {
  // 1. Create the screening row
  const { data: screening, error: screeningError } = await supabase
    .from("screenings")
    .insert({
      user_id: userId,
      source: stored.source,
      test_taken_on: new Date(stored.submittedAt).toISOString().split("T")[0],
      submitted_at: stored.submittedAt,
    })
    .select()
    .single();

  if (screeningError || !screening) {
    throw new Error(screeningError?.message ?? "Failed to create screening");
  }

  const screeningId = screening.id;

  // 2. Save the result
  await supabase.from("screening_results").insert({
    screening_id: screeningId,
    risk_score: stored.prediction.risk_score,
    risk_level: stored.prediction.risk_level.toLowerCase(),
    probabilities: stored.prediction.probabilities,
    breakdown: stored.prediction.breakdown ?? null,
    model_name:
      stored.source === "medical" ? "medical_rf" : "lifestyle_ensemble",
  });

  // 3. Save the inputs
  if (stored.source === "medical") {
    await supabase.from("screening_medical_inputs").insert({
      screening_id: screeningId,
      ...stored.inputSummary,
    });
  } else {
    await supabase.from("screening_lifestyle_inputs").insert({
      screening_id: screeningId,
      ...stored.inputSummary,
    });
  }
}

// ── Main page ──────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/");
        return;
      }
      setUser(user);

      // ── Save pending result if coming from OAuth flow ──
      const pending = localStorage.getItem("pending_result");
      if (pending) {
        try {
          const stored = JSON.parse(pending);
          await saveScreeningToSupabase(user.id, stored);
          localStorage.removeItem("pending_result");
        } catch (e) {
          console.error("Failed to save pending result:", e);
        }
      }

      // Fetch screenings with results joined
      const { data } = await supabase
        .from("screenings")
        .select(
          `
            id,
            source,
            test_taken_on,
            submitted_at,
            screening_results (
              risk_score,
              risk_level,
              probabilities,
              breakdown
            )
          `,
        )
        .eq("user_id", user.id)
        .order("test_taken_on", { ascending: false })
        .order("submitted_at", { ascending: false });

      const normalized = ((data ?? []) as ScreeningRowFromDB[]).map(
        normalizeScreeningRow,
      );
      setScreenings(normalized);
      setLoading(false);
    };

    init();
  }, [router]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/");
  };

  const latest = screenings[0] ?? null;
  const latestResult = latest?.screening_results ?? null;
  const latestPct = latestResult
    ? scoreToPercent(latestResult.risk_score)
    : null;

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-page">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email ??
    "User";
  const email = user?.email ?? "";
  const createdAt = user?.created_at ?? "";

  return (
    <main className="min-h-screen flex flex-col bg-page">
      {/* ── Nav ───────────────────────────────────────────── */}
      <nav className="w-full px-6 py-5 border-b border-gray-100/60 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-full hover:bg-primary-dark transition-all shadow-[0_2px_8px_-2px_rgba(45,184,122,0.4)]"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            New screening
          </Link>
        </div>
      </nav>

      <section className="flex-1 flex flex-col items-center px-4 sm:px-6 pt-8 pb-24">
        <div className="w-full max-w-2xl space-y-4">
          {/* ── Profile card ──────────────────────────────── */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center gap-4 animate-fade-in">
            {/* Avatar */}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-mint flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-primary">
                  {fullName[0]?.toUpperCase()}
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-heading truncate">
                {fullName}
              </p>
              <p className="text-xs text-muted truncate">{email}</p>
              {createdAt && (
                <p className="text-[11px] text-muted mt-1">
                  Member since {memberSince(createdAt)}
                </p>
              )}
            </div>

            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 text-xs text-muted hover:text-heading border border-gray-200 hover:border-gray-300 rounded-full transition-all disabled:opacity-50"
            >
              {signingOut ? (
                <div className="w-3 h-3 border border-muted border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
              )}
              Sign out
            </button>
          </div>

          {/* ── Latest result (if exists) ─────────────────── */}
          {latest && latestResult && latestPct !== null && (
            <div
              className={`bg-white border-2 rounded-2xl p-6 animate-fade-in-up stagger-1`}
              style={{ borderColor: `${riskColor[latestResult.risk_level]}33` }}
            >
              <p className="text-xs uppercase tracking-widest text-muted font-medium mb-4">
                Latest result
              </p>

              <div className="flex items-center gap-5">
                <ScoreRing
                  percent={latestPct}
                  level={latestResult.risk_level}
                />

                <div className="flex-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${riskBadge[latestResult.risk_level]} mb-2`}
                  >
                    {latestResult.risk_level} Risk
                  </span>
                  <p className="text-xs text-muted">
                    {formatFullDate(latest.test_taken_on)}
                  </p>
                  <p className="text-[11px] text-muted mt-0.5 capitalize">
                    {latest.source === "medical"
                      ? "Clinical model"
                      : "Lifestyle model"}
                  </p>
                </div>
              </div>

              {/* Trend sparkline */}
              {screenings.length > 1 && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <TrendSparkline screenings={screenings} />
                </div>
              )}
            </div>
          )}

          {/* ── Stats row ─────────────────────────────────── */}
          {screenings.length > 0 && (
            <div className="grid grid-cols-3 gap-3 animate-fade-in-up stagger-2">
              {[
                { label: "Total screenings", value: screenings.length },
                {
                  label: "Avg risk score",
                  value: `${Math.round(
                    screenings
                      .filter((s) => s.screening_results)
                      .reduce(
                        (acc, s) =>
                          acc + scoreToPercent(s.screening_results!.risk_score),
                        0,
                      ) / screenings.filter((s) => s.screening_results).length,
                  )}%`,
                },
                {
                  label: "Last check",
                  value: formatShortDate(screenings[0].test_taken_on),
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white border border-gray-100 rounded-xl px-4 py-3 text-center"
                >
                  <p className="text-base font-bold text-heading">
                    {stat.value}
                  </p>
                  <p className="text-[10px] text-muted mt-0.5 leading-tight">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* ── Screening history list ────────────────────── */}
          <div className="animate-fade-in-up stagger-3">
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-xs uppercase tracking-widest text-muted font-medium">
                Screening history
              </p>
              <span className="text-[11px] text-muted">
                {screenings.length} total
              </span>
            </div>

            {screenings.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <EmptyState />
              </div>
            ) : (
              <div className="space-y-2">
                {screenings.map((s, i) => (
                  <ScreeningRow key={s.id} s={s} isLatest={i === 0} />
                ))}
              </div>
            )}
          </div>

          {/* ── Disclaimer ────────────────────────────────── */}
          <div className="flex gap-3 px-4 py-4 bg-page border border-dashed border-gray-200 rounded-xl animate-fade-in-up stagger-4">
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
              Results are screening estimates only. Always consult a qualified
              healthcare provider.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
