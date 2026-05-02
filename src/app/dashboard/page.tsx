"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import { ConfirmModal } from "@/components/ConfirmationModal";

type RiskLevel = "low" | "moderate" | "high";

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

// ── Design tokens ──────────────────────────────────────────────
const riskColor: Record<RiskLevel, string> = {
  low: "#16A34A",
  moderate: "#D97706",
  high: "#DC2626",
};

const riskBg: Record<RiskLevel, string> = {
  low: "#F0FDF4",
  moderate: "#FFFBEB",
  high: "#FEF2F2",
};

const riskBorder: Record<RiskLevel, string> = {
  low: "#BBF7D0",
  moderate: "#FDE68A",
  high: "#FECACA",
};

function riskBadgeStyle(level: RiskLevel): React.CSSProperties {
  return {
    backgroundColor: riskBg[level],
    color: riskColor[level],
    borderColor: riskBorder[level],
  };
}

// ── Utilities ──────────────────────────────────────────────────
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

function memberSince(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── Score Ring ─────────────────────────────────────────────────
function ScoreRing({ percent, level }: { percent: number; level: RiskLevel }) {
  const r = 44;
  const circ = 2 * Math.PI * r;
  const color = riskColor[level];
  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0">
      <svg width="108" height="108" className="-rotate-90">
        <circle
          cx="54"
          cy="54"
          r={r}
          fill="none"
          stroke="#F1F5F9"
          strokeWidth="10"
        />
        <circle
          cx="54"
          cy="54"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(percent / 100) * circ} ${circ}`}
          style={{ transition: "stroke-dasharray 1s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center leading-none">
        <span className="text-2xl font-black text-gray-900 tracking-tight">
          {percent}%
        </span>
        <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mt-0.5">
          risk
        </span>
      </div>
    </div>
  );
}

// ── Trend Sparkline ────────────────────────────────────────────
function TrendSparkline({ screenings }: { screenings: Screening[] }) {
  const points = screenings
    .filter((s) => s.screening_results)
    .slice(0, 8)
    .reverse()
    .map((s) => scoreToPercent(s.screening_results!.risk_score));

  if (points.length < 2) return null;

  const W = 280,
    H = 64,
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

  return (
    <div className="mt-5 pt-5 border-t border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] uppercase tracking-widest text-gray-400 font-semibold">
          Risk trend
        </p>
        <span
          className="text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{
            color:
              trend === "improving"
                ? riskColor.low
                : trend === "rising"
                  ? riskColor.high
                  : "#6B7280",
            backgroundColor:
              trend === "improving"
                ? riskBg.low
                : trend === "rising"
                  ? riskBg.high
                  : "#F3F4F6",
          }}
        >
          {trend === "improving"
            ? `↓ ${Math.abs(delta)}pts`
            : trend === "rising"
              ? `↑ ${delta}pts`
              : "Stable"}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 64 }}>
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.2} />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <polygon points={fill} fill="url(#sparkGrad)" />
        <path
          d={path}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coords.map((c, i) => (
          <circle
            key={i}
            cx={c.x}
            cy={c.y}
            r={i === coords.length - 1 ? 4 : 2.5}
            fill={i === coords.length - 1 ? "#3B82F6" : "#fff"}
            stroke="#3B82F6"
            strokeWidth="2"
          />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-gray-400">Oldest</span>
        <span className="text-[10px] text-gray-400">Latest</span>
      </div>
    </div>
  );
}

// ── Mini ring for day detail cards ────────────────────────────
function MiniRing({ pct, level }: { pct: number; level: RiskLevel }) {
  const r = 15;
  const circ = 2 * Math.PI * r;
  const color = riskColor[level];
  return (
    <div className="relative flex items-center justify-center w-9 h-9 flex-shrink-0">
      <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90 w-9 h-9">
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke="#EEF2FF"
          strokeWidth="4"
        />
        <circle
          cx="18"
          cy="18"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * circ} ${circ}`}
        />
      </svg>
      <span
        className="text-[9px] font-black relative z-10 tabular-nums"
        style={{ color }}
      >
        {pct}%
      </span>
    </div>
  );
}

// ── Calendar History ───────────────────────────────────────────
function CalendarHistory({
  screenings,
  selectedIds,
  onSelect,
  onDeleteSelected,
  deleting,
}: {
  screenings: Screening[];
  selectedIds: Set<string>;
  onSelect: (id: string, checked: boolean) => void;
  onDeleteSelected: () => void;
  deleting: boolean;
}) {
  const today = new Date();

  const [viewDate, setViewDate] = useState(() => {
    if (screenings.length > 0) {
      const d = new Date(screenings[0].test_taken_on + "T00:00:00");
      return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const [activeDay, setActiveDay] = useState<string | null>(() => {
    if (screenings.length > 0) return screenings[0].test_taken_on.split("T")[0];
    return null;
  });

  const dateMap = useMemo(() => {
    const map = new Map<string, Screening[]>();
    for (const s of screenings) {
      const key = s.test_taken_on.split("T")[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return map;
  }, [screenings]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = today.toISOString().split("T")[0];

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const activeDayScreenings = activeDay ? (dateMap.get(activeDay) ?? []) : [];
  const allActiveDaySelected =
    activeDayScreenings.length > 0 &&
    activeDayScreenings.every((s) => selectedIds.has(s.id));
  const someActiveDaySelected = activeDayScreenings.some((s) =>
    selectedIds.has(s.id),
  );

  // Cells: null for empty leading slots, number for day
  const cells: (null | number)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthLabel = viewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  if (screenings.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Calendar header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-50">
        <button
          onClick={prevMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-900">{monthLabel}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {Array.from(dateMap.entries())
              .filter(([key]) => {
                const d = new Date(key + "T00:00:00");
                return d.getFullYear() === year && d.getMonth() === month;
              })
              .reduce((acc, [, arr]) => acc + arr.length, 0)}{" "}
            screenings this month
          </p>
        </div>
        <button
          onClick={nextMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 px-4 pt-3 pb-1">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div
            key={d}
            className="text-center text-[10px] font-bold text-gray-300 uppercase tracking-widest"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 px-4 pb-4">
        {cells.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;

          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayScreenings = dateMap.get(dateStr) ?? [];
          const hasScreenings = dayScreenings.length > 0;
          const isToday = dateStr === todayStr;
          const isActive = dateStr === activeDay;

          const riskLevels = dayScreenings
            .map((s) => s.screening_results?.risk_level)
            .filter(Boolean) as RiskLevel[];

          // Dominant risk for the day (highest severity wins)
          const dominantRisk: RiskLevel | null = riskLevels.includes("high")
            ? "high"
            : riskLevels.includes("moderate")
              ? "moderate"
              : riskLevels.length > 0
                ? "low"
                : null;

          return (
            <button
              key={dateStr}
              onClick={() => {
                if (!hasScreenings) return;
                setActiveDay(isActive ? null : dateStr);
              }}
              disabled={!hasScreenings}
              className={`
                relative flex flex-col items-center py-1.5 rounded-xl transition-all duration-150 min-h-[52px]
                ${
                  isActive
                    ? "shadow-md scale-[1.04]"
                    : hasScreenings
                      ? "hover:bg-gray-50 hover:scale-[1.02]"
                      : "cursor-default"
                }
              `}
              style={
                isActive && dominantRisk
                  ? { backgroundColor: riskColor[dominantRisk], color: "#fff" }
                  : isActive
                    ? { backgroundColor: "#3B82F6", color: "#fff" }
                    : {}
              }
            >
              {/* Today indicator ring */}
              {isToday && !isActive && (
                <span className="absolute inset-0 rounded-xl ring-2 ring-blue-400 ring-offset-0" />
              )}

              <span
                className={`text-[13px] font-bold tabular-nums ${
                  isActive
                    ? "text-white"
                    : isToday
                      ? "text-blue-600"
                      : hasScreenings
                        ? "text-gray-800"
                        : "text-gray-200"
                }`}
              >
                {day}
              </span>

              {/* Risk dots */}
              {hasScreenings && (
                <div className="flex items-center gap-px mt-1.5 flex-wrap justify-center max-w-full px-1">
                  {riskLevels.slice(0, 4).map((lvl, idx) => (
                    <span
                      key={idx}
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{
                        backgroundColor: isActive
                          ? "rgba(255,255,255,0.75)"
                          : riskColor[lvl],
                      }}
                    />
                  ))}
                  {riskLevels.length > 4 && (
                    <span
                      className="text-[8px] font-bold ml-0.5"
                      style={{
                        color: isActive ? "rgba(255,255,255,0.6)" : "#9CA3AF",
                      }}
                    >
                      +{riskLevels.length - 4}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Risk legend */}
      <div className="flex items-center justify-center gap-5 px-5 py-3 border-t border-gray-50">
        {(["low", "moderate", "high"] as RiskLevel[]).map((level) => (
          <div key={level} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: riskColor[level] }}
            />
            <span className="text-[10px] font-medium text-gray-400 capitalize">
              {level}
            </span>
          </div>
        ))}
      </div>

      {/* ── Day detail panel ── */}
      {activeDay && activeDayScreenings.length > 0 && (
        <div className="border-t border-gray-100">
          {/* Detail header */}
          <div className="flex items-start justify-between px-5 pt-4 pb-3">
            <div>
              <p className="text-sm font-bold text-gray-900">
                {formatGroupDate(activeDay)}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {activeDayScreenings.length}{" "}
                {activeDayScreenings.length === 1 ? "screening" : "screenings"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {someActiveDaySelected && (
                <button
                  onClick={onDeleteSelected}
                  disabled={deleting}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold rounded-full transition-colors disabled:opacity-50"
                >
                  {deleting ? (
                    <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg
                      className="w-3 h-3"
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
                  Delete ({selectedIds.size})
                </button>
              )}
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allActiveDaySelected}
                  onChange={(e) =>
                    activeDayScreenings.forEach((s) =>
                      onSelect(s.id, e.target.checked),
                    )
                  }
                  className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/30 cursor-pointer"
                />
                <span className="text-[11px] text-gray-400 font-medium">
                  Select all
                </span>
              </label>
            </div>
          </div>

          {/* Screening cards */}
          <div className="px-5 pb-5 space-y-2">
            {activeDayScreenings.map((s) => {
              const result = s.screening_results;
              if (!result) return null;
              const pct = scoreToPercent(result.risk_score);
              const level = result.risk_level;
              const isLatest = s.id === screenings[0]?.id;
              const submittedTime = new Date(s.submitted_at).toLocaleTimeString(
                "en-US",
                { hour: "numeric", minute: "2-digit", hour12: true },
              );

              return (
                <div
                  key={s.id}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                    selectedIds.has(s.id)
                      ? "border-blue-200 bg-blue-50/60"
                      : "border-gray-100 bg-gray-50/40 hover:border-gray-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.has(s.id)}
                    onChange={(e) => onSelect(s.id, e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500/30 cursor-pointer flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Risk badge */}
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border"
                        style={riskBadgeStyle(level)}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: riskColor[level] }}
                        />
                        {level.charAt(0).toUpperCase() + level.slice(1)} Risk
                      </span>
                      {isLatest && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 font-bold uppercase tracking-wide">
                          Latest
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400">
                        {s.source === "medical"
                          ? "🏥 Clinical"
                          : "🌿 Lifestyle"}
                      </span>
                      <span className="text-[10px] text-gray-300">·</span>
                      <span className="text-[10px] text-gray-400">
                        {submittedTime}
                      </span>
                    </div>
                  </div>

                  <Link
                    href={`/screening/${s.id}`}
                    className="flex items-center gap-1.5 flex-shrink-0 group"
                  >
                    <MiniRing pct={pct} level={level} />
                    <svg
                      className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition-colors"
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
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl text-center py-14 px-6 shadow-sm">
      <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-7 h-7 text-blue-400"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
      <p className="text-sm font-bold text-gray-900">No screenings yet</p>
      <p className="text-xs text-gray-400 mt-1 mb-5">
        Complete your first screening — results will appear here.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-full shadow-sm hover:bg-blue-700 transition-all"
      >
        Take a screening
      </Link>
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 px-4 py-3.5 shadow-sm text-center">
      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
        {label}
      </p>
      <p className="text-lg font-black text-gray-900 leading-none">{value}</p>
      {sub && <p className="text-[10px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ── SignInGate (same as result page) ───────────────────────────
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
        Sign in to view your history
      </h3>

      {/* Sub-copy */}
      <p className="text-sm text-muted max-w-[280px] leading-relaxed mb-5">
        Access all your past screenings, track risk trends, and get AI insights
        personalized to you.
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
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState(false);

  // Auth state for gate
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  // ── Auth gate handlers ─────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const signedIn = !!data.user;
      setIsSignedIn(signedIn);
      setAuthLoading(false);
      if (signedIn) setUser(data.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_e, session) => {
        const signedIn = !!session?.user;
        setIsSignedIn(signedIn);
        setAuthLoading(false);
        if (signedIn && session?.user) setUser(session.user);
        else setUser(null);
      },
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setSigningIn(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
  };

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

  // Fetch screenings only when signed in and user exists
  useEffect(() => {
    if (isSignedIn && user) {
      setLoading(true);
      fetchScreenings(user.id)
        .catch((err) => console.error("Failed to load screenings", err))
        .finally(() => setLoading(false));
    } else if (isSignedIn === false) {
      setLoading(false);
    }
  }, [isSignedIn, user]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    // after sign out, UI will automatically show gate because isSignedIn becomes false
    setSigningOut(false);
  };

  const handleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setDeleteModal(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("screenings")
        .delete()
        .in("id", Array.from(selectedIds));
      if (error) throw error;
      setDeleteModal(false);
      if (user) await fetchScreenings(user.id);
    } catch (err) {
      console.error("Delete failed:", err);
      setDeleteModal(false);
      setDeleteError(true);
    } finally {
      setDeleting(false);
    }
  };

  // ── Computed values for signed‑in dashboard ─────────────────
  const latest = screenings[0] ?? null;
  const latestResult = latest?.screening_results ?? null;
  const latestPct = latestResult
    ? scoreToPercent(latestResult.risk_score)
    : null;

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

  const email = user?.email ?? "";
  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email ??
    "User";
  const createdAt = user?.created_at ?? "";

  // Show a centered spinner while checking auth
  if (authLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  // Show the same layout with gate if not signed in
  const showGate = !isSignedIn;

  return (
    <main className="min-h-screen flex flex-col bg-gray-50">
      {/* Nav */}
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-full shadow-sm hover:bg-blue-700 transition-all"
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
            New Screening
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 py-8 space-y-5 relative">
        {/* ── Profile card ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
            <span className="text-base font-black text-white">
              {email?.[0]?.toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">
              {fullName}
            </p>
            <p className="text-[11px] text-gray-400 truncate">
              {email || "Guest"}
            </p>
            {createdAt && (
              <p className="text-[10px] text-gray-300 mt-0.5">
                Member since {memberSince(createdAt)}
              </p>
            )}
          </div>
          {isSignedIn && (
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-300 rounded-full transition-all disabled:opacity-50 flex-shrink-0"
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
          )}
        </div>

        {/* Main dashboard content area — gate overlay on top if not signed in */}
        <div className="relative">
          {/* Always render the dashboard content (blurred when gate is shown) */}
          <div
            className={
              showGate ? "filter blur-sm pointer-events-none select-none" : ""
            }
          >
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* ── Latest result card ── */}
                {latest && latestResult && latestPct !== null && (
                  <div
                    className="bg-white rounded-2xl border shadow-sm p-6"
                    style={{ borderColor: riskBorder[latestResult.risk_level] }}
                  >
                    <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-4">
                      Latest Result
                    </p>
                    <div className="flex items-center gap-5">
                      <ScoreRing
                        percent={latestPct}
                        level={latestResult.risk_level}
                      />
                      <div className="flex-1 min-w-0">
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border"
                          style={riskBadgeStyle(latestResult.risk_level)}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              backgroundColor:
                                riskColor[latestResult.risk_level],
                            }}
                          />
                          {latestResult.risk_level.charAt(0).toUpperCase() +
                            latestResult.risk_level.slice(1)}{" "}
                          Risk
                        </span>
                        <p className="text-sm font-semibold text-gray-800 mt-2 leading-snug">
                          {formatFullDate(latest.test_taken_on)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {latest.source === "medical"
                            ? "🏥 Clinical model"
                            : "🌿 Lifestyle model"}
                        </p>
                      </div>
                    </div>
                    {screenings.length > 1 && (
                      <TrendSparkline screenings={screenings} />
                    )}
                  </div>
                )}

                {/* ── Stats row ── */}
                {screenings.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    <StatCard
                      label="Total"
                      value={String(screenings.length)}
                      sub="screenings"
                    />
                    <StatCard
                      label="Avg Risk"
                      value={averageRisk !== null ? `${averageRisk}%` : "—"}
                      sub="across all"
                    />
                    <StatCard
                      label="Last Check"
                      value={
                        screenings[0]?.test_taken_on
                          ? formatShortDate(screenings[0].test_taken_on)
                          : "—"
                      }
                    />
                  </div>
                )}

                {/* ── Calendar history ── */}
                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <p className="text-[11px] uppercase tracking-widest text-gray-400 font-bold">
                      Screening History
                    </p>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {screenings.length} total
                    </span>
                  </div>
                  <CalendarHistory
                    screenings={screenings}
                    selectedIds={selectedIds}
                    onSelect={handleSelect}
                    onDeleteSelected={handleDeleteSelected}
                    deleting={deleting}
                  />
                </div>
              </>
            )}
          </div>

          {/* Sign‑in gate overlay */}
          {showGate && (
            <SignInGate onSignIn={handleSignIn} signingIn={signingIn} />
          )}
        </div>

        {/* ── Disclaimer ── */}
        <div className="flex gap-3 px-4 py-4 bg-white border border-gray-100 rounded-xl shadow-sm mt-44">
          <svg
            className="w-4 h-4 text-gray-300 mt-0.5 flex-shrink-0"
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
          <p className="text-[11px] text-gray-400 leading-relaxed">
            <span className="font-bold text-gray-600">
              Not a medical diagnosis.
            </span>{" "}
            Results are screening estimates only. Always consult a qualified
            healthcare provider.
          </p>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModal}
        variant="danger"
        title={`Delete ${selectedIds.size} screening${selectedIds.size === 1 ? "" : "s"}?`}
        description="This action is permanent and cannot be undone. Your screening data will be removed."
        confirmLabel="Yes, delete"
        cancelLabel="Keep them"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal(false)}
      />

      {/* Error modal */}
      <ConfirmModal
        isOpen={deleteError}
        variant="default"
        title="Something went wrong"
        description="We couldn't delete your screenings. Please check your connection and try again."
        confirmLabel="Got it"
        cancelLabel=""
        onConfirm={() => setDeleteError(false)}
        onCancel={() => setDeleteError(false)}
      />
    </main>
  );
}
