"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

type RiskLevel = "Low" | "Moderate" | "High";

interface ScreeningResult {
  risk_score: number;
  risk_level: RiskLevel;
  probabilities: Record<string, number>;
  breakdown: { symptom_score?: number; lifestyle_score?: number } | null;
}

interface Screening {
  id: string;
  source: "medical" | "lifestyle";
  test_taken_on: string;
  submitted_at: string;
  screening_results: ScreeningResult | null;
}

// ── Colors & badges ────────────────────────────────────────────
const riskColor: Record<RiskLevel, string> = {
  Low: "#2DB87A",
  Moderate: "#F5A623",
  High: "#E84040",
};

const riskBadge: Record<RiskLevel, string> = {
  Low: "bg-green-50 text-green-700 border-green-200",
  Moderate: "bg-amber-50 text-amber-700 border-amber-200",
  High: "bg-red-50 text-red-700 border-red-200",
};

function scoreToPercent(s: number): number {
  if (typeof s !== "number" || !Number.isFinite(s)) return 0;
  return Math.max(0, Math.min(100, Math.round(s * 100)));
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function memberSince(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

// ── Trend sparkline (unchanged) ───────────────────────────────
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
      ? "text-green-600"
      : trend === "rising"
        ? "text-red-600"
        : "text-gray-500";
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
        <polygon points={fill} fill="url(#sparkGrad)" opacity={0.25} />
        <path
          d={path}
          fill="none"
          stroke="#2B6FEB"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
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
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-muted">Oldest</span>
        <span className="text-[10px] text-muted">Latest</span>
      </div>
    </div>
  );
}

// ── Score ring (big) ──────────────────────────────────────────
function ScoreRing({ percent, level }: { percent: number; level: RiskLevel }) {
  const r = 42,
    circ = 2 * Math.PI * r;
  const color = riskColor[level];
  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0">
      <svg width="100" height="100" className="-rotate-90">
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="#EFF3F6"
          strokeWidth="9"
        />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${(percent / 100) * circ} ${circ}`}
          style={{ transition: "stroke-dasharray 1s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-xl font-bold text-gray-900">{percent}%</span>
        <span className="text-[10px] text-gray-500 uppercase tracking-wide">
          risk
        </span>
      </div>
    </div>
  );
}

// ── Group helpers ──────────────────────────────────────────────
function groupByDate(screenings: Screening[]): Map<string, Screening[]> {
  const map = new Map<string, Screening[]>();
  for (const s of screenings) {
    const key = s.test_taken_on.split("T")[0];
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  return map;
}

function formatGroupDate(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00");
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";

  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

// ── Individual screening card (fixed circle & colors) ─────────
function ScreeningCard({
  s,
  isLatest,
  isSelected,
  onSelect,
}: {
  s: Screening;
  isLatest: boolean;
  isSelected: boolean;
  onSelect: (id: string, checked: boolean) => void;
}) {
  const result = s.screening_results;
  if (!result) return null;
  const pct = scoreToPercent(result.risk_score);
  const level = result.risk_level;
  const color = riskColor[level];
  // Calculate circle dash
  const r = 17; // radius
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <div
      className={`group flex items-center justify-between bg-white rounded-2xl border px-4 py-3 transition-all hover:shadow-md ${
        isSelected
          ? "border-primary/50 bg-primary/5"
          : "border-gray-100 hover:border-gray-200"
      }`}
    >
      {/* Left side: checkbox + info */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(s.id, e.target.checked)}
          className="w-4.5 h-4.5 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
        />
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border w-fit ${riskBadge[level]}`}
            >
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              {level} Risk
            </span>
            {isLatest && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                Latest
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted">
            {s.source === "medical" ? "🏥 Clinical" : "🌿 Lifestyle"}
          </span>
        </div>
      </div>

      {/* Right side: mini ring + link */}
      <Link href={`/screening/${s.id}`} className="flex items-center gap-2">
        <div className="relative flex items-center justify-center w-10 h-10 flex-shrink-0">
          <svg
            viewBox="0 0 44 44"
            className="absolute inset-0 -rotate-90 w-10 h-10"
          >
            <circle
              cx="22"
              cy="22"
              r={r}
              fill="none"
              stroke="#EDF2F7"
              strokeWidth="4.5"
            />
            <circle
              cx="22"
              cy="22"
              r={r}
              fill="none"
              stroke={color}
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circ}`}
            />
          </svg>
          <span
            className="text-[11px] font-bold relative z-10"
            style={{ color }}
          >
            {pct}%
          </span>
        </div>
        <svg
          className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}

// ── Grouped history with select all + delete button ───────────
function ScreeningHistory({
  screenings,
  selectedIds,
  onSelect,
  onSelectAll,
  onDeleteSelected,
  deleting,
}: {
  screenings: Screening[];
  selectedIds: Set<string>;
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onDeleteSelected: () => void;
  deleting: boolean;
}) {
  if (screenings.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        <EmptyState />
      </div>
    );
  }

  const grouped = groupByDate(screenings);
  const latestId = screenings[0]?.id;
  const allSelected =
    screenings.length > 0 && screenings.every((s) => selectedIds.has(s.id));
  const someSelected = selectedIds.size > 0;

  return (
    <div className="space-y-6">
      {/* Select all row with Delete button on the right */}
      <div className="flex items-center justify-between px-1">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-muted hover:text-heading transition-colors">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary/30 cursor-pointer"
          />
          <span>{allSelected ? "Deselect all" : "Select all"}</span>
        </label>
        <div className="flex items-center gap-3">
          {someSelected && (
            <>
              <span className="text-[11px] text-primary font-medium">
                {selectedIds.size} selected
              </span>
              <button
                onClick={onDeleteSelected}
                disabled={deleting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium rounded-full transition-colors disabled:opacity-50"
              >
                {deleting ? (
                  <div className="w-3 h-3 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                )}
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Grouped cards */}
      {Array.from(grouped.entries()).map(([dateKey, group]) => (
        <div key={dateKey}>
          <div className="flex items-center gap-3 mb-2.5 px-1">
            <span className="text-xs font-semibold text-gray-700">
              {formatGroupDate(dateKey)}
            </span>
            <div className="flex-1 h-px bg-gray-100" />
            <span className="text-[10px] text-gray-400">
              {group.length} {group.length === 1 ? "test" : "tests"}
            </span>
          </div>
          <div className="space-y-2">
            {group.map((s) => (
              <ScreeningCard
                key={s.id}
                s={s}
                isLatest={s.id === latestId}
                isSelected={selectedIds.has(s.id)}
                onSelect={onSelect}
              />
            ))}
          </div>
        </div>
      ))}
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

// ── Main Dashboard ─────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const fetchScreenings = async (userId: string) => {
    const { data: screeningsData, error: screeningsError } = await supabase
      .from("screenings")
      .select("id, source, test_taken_on, submitted_at")
      .eq("user_id", userId)
      .order("test_taken_on", { ascending: false })
      .order("submitted_at", { ascending: false });

    if (screeningsError) throw screeningsError;
    if (!screeningsData || screeningsData.length === 0) {
      setScreenings([]);
      setSelectedIds(new Set());
      return;
    }

    const screeningIds = screeningsData.map((s) => s.id);
    const { data: resultsData, error: resultsError } = await supabase
      .from("screening_results")
      .select("screening_id, risk_score, risk_level, probabilities, breakdown")
      .in("screening_id", screeningIds);

    if (resultsError) throw resultsError;

    const resultMap = new Map();
    resultsData?.forEach((r) => {
      resultMap.set(r.screening_id, {
        risk_score: r.risk_score,
        risk_level: r.risk_level as RiskLevel,
        probabilities: r.probabilities,
        breakdown: r.breakdown,
      });
    });

    const merged: Screening[] = screeningsData.map((s) => ({
      ...s,
      screening_results: resultMap.get(s.id) || null,
    }));

    setScreenings(merged);
    setSelectedIds(new Set());
  };

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
      await fetchScreenings(user.id);
      setLoading(false);
    };
    init();
  }, [router]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/");
  };

  const handleSelect = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedIds(newSet);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = screenings.map((s) => s.id);
      setSelectedIds(new Set(allIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const confirmMsg = `Delete ${selectedIds.size} screening${selectedIds.size === 1 ? "" : "s"}? This cannot be undone.`;
    if (!confirm(confirmMsg)) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("screenings")
        .delete()
        .in("id", Array.from(selectedIds));
      if (error) throw error;
      if (user) await fetchScreenings(user.id);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Could not delete screenings. Please try again.");
    } finally {
      setDeleting(false);
    }
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

  const validScreenings = screenings.filter((s) => s.screening_results);
  const averageRisk =
    validScreenings.length > 0
      ? Math.round(
          validScreenings.reduce(
            (acc, s) => acc + scoreToPercent(s.screening_results!.risk_score),
            0,
          ) / validScreenings.length,
        )
      : null;

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-semibold rounded-full shadow-sm hover:bg-primary-dark transition-all"
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

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="space-y-6">
          {/* Profile card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName}
                className="w-12 h-12 rounded-full object-cover border border-gray-200"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-mint flex items-center justify-center">
                <span className="text-lg font-bold text-primary">
                  {fullName[0]?.toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-gray-900">{fullName}</p>
              <p className="text-xs text-gray-500">{email}</p>
              {createdAt && (
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Member since {memberSince(createdAt)}
                </p>
              )}
            </div>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-full transition-colors disabled:opacity-50"
            >
              {signingOut ? (
                <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
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

          {/* Latest result */}
          {latest && latestResult && latestPct !== null && (
            <div
              className="bg-white rounded-2xl border-2 p-6 shadow-sm"
              style={{ borderColor: `${riskColor[latestResult.risk_level]}30` }}
            >
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                Latest result
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-5">
                <ScoreRing
                  percent={latestPct}
                  level={latestResult.risk_level}
                />
                <div className="flex-1 text-center sm:text-left">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${riskBadge[latestResult.risk_level]} mb-2`}
                  >
                    {latestResult.risk_level} Risk
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    {formatFullDate(latest.test_taken_on)}
                  </p>
                  <p className="text-xs text-gray-500 capitalize mt-0.5">
                    {latest.source === "medical"
                      ? "Clinical model"
                      : "Lifestyle model"}
                  </p>
                </div>
              </div>
              {screenings.length > 1 && (
                <TrendSparkline screenings={screenings} />
              )}
            </div>
          )}

          {/* Stats row */}
          {screenings.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 text-center shadow-sm">
                <p className="text-xl font-bold text-gray-900">
                  {screenings.length}
                </p>
                <p className="text-[11px] text-gray-500 uppercase tracking-wide">
                  Total screenings
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 text-center shadow-sm">
                <p className="text-xl font-bold text-gray-900">
                  {averageRisk !== null ? `${averageRisk}%` : "—"}
                </p>
                <p className="text-[11px] text-gray-500 uppercase tracking-wide">
                  Avg risk
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-100 px-4 py-3 text-center shadow-sm">
                <p className="text-xl font-bold text-gray-900">
                  {screenings[0]?.test_taken_on
                    ? formatShortDate(screenings[0].test_taken_on)
                    : "—"}
                </p>
                <p className="text-[11px] text-gray-500 uppercase tracking-wide">
                  Last check
                </p>
              </div>
            </div>
          )}

          {/* Screening history with grouped select + delete on right */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <p className="text-xs uppercase tracking-widest text-gray-500 font-medium">
                Screening history
              </p>
              <span className="text-[11px] text-gray-400">
                {screenings.length} total
              </span>
            </div>
            <ScreeningHistory
              screenings={screenings}
              selectedIds={selectedIds}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
              onDeleteSelected={handleDeleteSelected}
              deleting={deleting}
            />
          </div>

          {/* Disclaimer */}
          <div className="flex gap-3 px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl">
            <svg
              className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0"
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
            <p className="text-[11px] text-gray-500 leading-relaxed">
              <span className="font-semibold text-gray-700">
                Not a medical diagnosis.
              </span>{" "}
              Results are screening estimates only. Always consult a qualified
              healthcare provider.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
