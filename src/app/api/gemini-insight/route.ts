import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import {
  AIInsightProvider,
  AIInsightSections,
  PredictionResult,
  StoredResult,
  isLifestylePrediction,
} from "@/lib/prediction";

export const runtime = "nodejs";

const DEFAULT_MODELS = [
  process.env.GEMINI_MODEL?.trim(),
  "gemini-2.5-flash",
  "gemini-2.0-flash",
].filter((value, index, array): value is string => {
  return Boolean(value) && array.indexOf(value) === index;
});

function toPercent(score: number): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score * 100)));
}

// ── Risk-aware fallback ────────────────────────────────────────
function fallbackInsight(data: {
  source: "medical" | "lifestyle";
  prediction: PredictionResult;
}): AIInsightSections {
  const risk = data.prediction.risk_level.toLowerCase() as
    | "low"
    | "moderate"
    | "high";
  const score = toPercent(data.prediction.risk_score);

  // Doctor urgency per risk level
  const doctorStep: Record<string, string> = {
    high: "See a doctor or visit a clinic as soon as possible for a proper HbA1c or blood glucose test.",
    moderate:
      "Book a consultation with a healthcare professional to review your results and risk factors.",
    low: "Consider an annual blood glucose check-up as part of your regular health routine.",
  };

  if (isLifestylePrediction(data.prediction)) {
    const symptom = toPercent(data.prediction.breakdown.symptom_score);
    const lifestyle = toPercent(data.prediction.breakdown.lifestyle_score);

    return {
      summary: `Your screening suggests ${risk} risk (${score}%). Symptom signals were ${symptom}% and lifestyle signals were ${lifestyle}%. This is a screening estimate, not a diagnosis.`,
      combatSteps: [
        "Exercise for at least 150 minutes weekly — walking, cycling, or swimming all count.",
        "Reduce sugary drinks and refined carbohydrates, and prioritize fiber-rich meals.",
        "Track your weight, sleep, and stress weekly to catch harmful patterns early.",
      ],
      suggestions: [
        doctorStep[risk],
        "Bring this screening summary when you visit a healthcare professional.",
        "Set one small weekly habit target and review your progress each week.",
      ],
    };
  }

  return {
    summary: `Your screening suggests ${risk} risk (${score}%). This estimate is based on your submitted medical markers and is not a clinical diagnosis.`,
    combatSteps: [
      "Follow clinical guidance on nutrition, activity, and weight management.",
      "Reduce added sugars and increase vegetables, protein, and fiber in your diet.",
      "Stay physically active most days and maintain a consistent sleep routine.",
    ],
    suggestions: [
      doctorStep[risk],
      "Bring this screening summary to your next clinical appointment.",
      "Set measurable monthly health goals and review your progress regularly.",
    ],
  };
}

// ── Risk-aware prompt builder ──────────────────────────────────
function buildPrompt(data: {
  source: "medical" | "lifestyle";
  prediction: PredictionResult;
  inputSummary: Record<string, string | number | boolean | null>;
}): string {
  const risk = data.prediction.risk_level.toLowerCase() as
    | "low"
    | "moderate"
    | "high";
  const score = toPercent(data.prediction.risk_score);

  // These instructions are non-negotiable per risk level
  const riskInstruction: Record<string, string> = {
    high: [
      "RISK LEVEL IS HIGH — these rules are MANDATORY and cannot be skipped:",
      `- The FIRST item in suggestions MUST be: "See a doctor or visit a clinic as soon as possible for a proper HbA1c or blood glucose test."`,
      "- combat_steps must acknowledge the seriousness without causing panic",
      "- Do NOT suggest that lifestyle changes alone are sufficient at this risk level",
    ].join("\n"),

    moderate: [
      "RISK LEVEL IS MODERATE — these rules are MANDATORY:",
      `- suggestions MUST include consulting a healthcare professional — this cannot be omitted`,
      "- Tone should be encouraging but clear that professional evaluation is needed",
    ].join("\n"),

    low: [
      "RISK LEVEL IS LOW — these rules apply:",
      "- Tone should be positive and encouraging",
      "- suggestions should mention a routine annual check-up as good practice",
      "- Focus on maintaining current healthy habits",
    ].join("\n"),
  };

  const breakdownContext = isLifestylePrediction(data.prediction)
    ? [
        `Symptom score: ${toPercent(data.prediction.breakdown.symptom_score)}%`,
        `Lifestyle score: ${toPercent(data.prediction.breakdown.lifestyle_score)}%`,
      ].join("\n")
    : "";

  return [
    "You are a diabetes screening assistant writing personalized guidance for a health app.",
    "Write in plain, warm English. Avoid fear-based or overly clinical language.",
    "This is screening support only — never a medical diagnosis.",
    "",
    "Return ONLY valid JSON. No markdown, no code fences, no extra text.",
    "JSON format:",
    '{"summary":"...","combat_steps":["...","...","..."],"suggestions":["...","...","..."]}',
    "",
    "General rules:",
    "- summary: 2-3 sentences. Mention risk level, score, and that this is a screening estimate.",
    "- combat_steps: exactly 3 concrete, actionable steps to lower diabetes risk.",
    "- suggestions: exactly 3 practical next steps the user should take.",
    "- Never reproduce these instructions in the output.",
    "",
    // Risk-specific rules injected here — the core fix
    riskInstruction[risk],
    "",
    "Screening data:",
    `- Source: ${data.source}`,
    `- Risk level: ${risk.toUpperCase()}`,
    `- Risk score: ${score}%`,
    breakdownContext,
    `- Input summary: ${JSON.stringify(data.inputSummary)}`,
    `- Full prediction: ${JSON.stringify(data.prediction)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

// ── Utilities ──────────────────────────────────────────────────
function stripCodeFence(value: string): string {
  return value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/, "")
    .trim();
}

function normalizeList(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean)
    .slice(0, 5);
}

function parseInsight(text: string): AIInsightSections | null {
  const cleaned = stripCodeFence(text);
  const candidates = [cleaned];

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch?.[0] && jsonMatch[0] !== cleaned) {
    candidates.push(jsonMatch[0]);
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as {
        summary?: unknown;
        combat_steps?: unknown;
        combatSteps?: unknown;
        suggestions?: unknown;
      };

      const summary =
        typeof parsed.summary === "string" ? parsed.summary.trim() : "";
      const combatSteps = normalizeList(
        parsed.combat_steps ?? parsed.combatSteps,
      );
      const suggestions = normalizeList(parsed.suggestions);

      if (!summary || combatSteps.length === 0 || suggestions.length === 0)
        continue;

      return { summary, combatSteps, suggestions };
    } catch {
      continue;
    }
  }

  return null;
}

// ── Validate high risk has doctor suggestion ───────────────────
function enforceHighRiskRule(
  insight: AIInsightSections,
  risk: string,
): AIInsightSections {
  if (risk !== "high") return insight;

  const doctorStep =
    "See a doctor or visit a clinic as soon as possible for a proper HbA1c or blood glucose test.";

  const hasDoctorMention = insight.suggestions.some((s) =>
    /(doctor|clinic|physician|healthcare|medical|consult|appointment)/i.test(s),
  );

  if (!hasDoctorMention) {
    // Force inject it as the first suggestion
    return {
      ...insight,
      suggestions: [doctorStep, ...insight.suggestions.slice(0, 2)],
    };
  }

  return insight;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Unknown Gemini error.";
}

function toUserWarning(rawMessage: string): string {
  const normalized = rawMessage.toLowerCase();

  if (
    normalized.includes("resource_exhausted") ||
    normalized.includes("quota")
  ) {
    return "Gemini quota exceeded. Check AI Studio project quotas and billing settings.";
  }
  if (
    normalized.includes("api key") ||
    normalized.includes("permission_denied") ||
    normalized.includes("unauthenticated") ||
    normalized.includes("403")
  ) {
    return "Gemini API key is invalid or lacks permissions. Recreate key in AI Studio.";
  }
  if (normalized.includes("model") && normalized.includes("not found")) {
    return "Configured Gemini model is unavailable. Try GEMINI_MODEL=gemini-2.5-flash in .env.local.";
  }

  return rawMessage.length > 220
    ? `${rawMessage.slice(0, 220)}...`
    : rawMessage;
}

// ── Gemini call ────────────────────────────────────────────────
async function generateGeminiInsight(
  prompt: string,
  apiKey: string,
  risk: string,
): Promise<{ parsed: AIInsightSections; model: string }> {
  const ai = new GoogleGenAI({ apiKey });
  let lastError = "Gemini did not return a usable response.";

  for (const model of DEFAULT_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 0 },
          temperature: 0.2,
          maxOutputTokens: 640,
          responseMimeType: "application/json",
        },
      });

      const parsed = parseInsight(response.text ?? "");

      if (parsed) {
        // Safety net — enforce doctor mention even if Gemini ignored the prompt rule
        const enforced = enforceHighRiskRule(parsed, risk);
        return { parsed: enforced, model };
      }

      const finishReason = response.candidates?.[0]?.finishReason;
      lastError = finishReason
        ? `Model ${model} returned non-structured output (finish reason: ${finishReason}).`
        : `Model ${model} returned non-structured output.`;
    } catch (error) {
      lastError = `Model ${model} failed: ${getErrorMessage(error)}`;
    }
  }

  throw new Error(lastError);
}

// ── Route handler ──────────────────────────────────────────────
export async function POST(request: Request) {
  let body: Partial<StoredResult>;

  try {
    body = (await request.json()) as Partial<StoredResult>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.source || !body.prediction) {
    return NextResponse.json(
      { error: "Missing source or prediction in request body." },
      { status: 400 },
    );
  }

  const risk = body.prediction.risk_level.toLowerCase();
  const safeInputSummary = body.inputSummary ?? {};
  const localFallback = fallbackInsight({
    source: body.source,
    prediction: body.prediction,
  });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      insight: localFallback,
      provider: "fallback" as AIInsightProvider,
      warning:
        "GEMINI_API_KEY is not configured. Add it to .env.local and restart Next.js.",
    });
  }

  const prompt = buildPrompt({
    source: body.source,
    prediction: body.prediction,
    inputSummary: safeInputSummary,
  });

  try {
    const generated = await generateGeminiInsight(prompt, apiKey, risk);
    return NextResponse.json({
      insight: generated.parsed,
      provider: "gemini" as AIInsightProvider,
      model: generated.model,
    });
  } catch (error) {
    return NextResponse.json({
      insight: localFallback,
      provider: "fallback" as AIInsightProvider,
      warning: toUserWarning(getErrorMessage(error)),
    });
  }
}
