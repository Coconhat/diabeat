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

function fallbackInsight(data: {
  source: "medical" | "lifestyle";
  prediction: PredictionResult;
}): AIInsightSections {
  const risk = data.prediction.risk_level;
  const score = toPercent(data.prediction.risk_score);

  if (isLifestylePrediction(data.prediction)) {
    const symptom = toPercent(data.prediction.breakdown.symptom_score);
    const lifestyle = toPercent(data.prediction.breakdown.lifestyle_score);

    return {
      summary: `Your screening suggests ${risk.toLowerCase()} risk (${score}%). Symptom signals were ${symptom}% and lifestyle signals were ${lifestyle}%.`,
      combatSteps: [
        "Exercise for at least 150 minutes weekly (walking, cycling, or similar).",
        "Prioritize balanced meals with fewer sugary drinks and refined carbs.",
        "Track weight, sleep, and stress weekly to spot harmful patterns early.",
      ],
      suggestions: [
        "Book a clinical blood glucose or HbA1c test for confirmation.",
        "Discuss your family history and risk factors with a healthcare professional.",
        "Set one small weekly habit target and review progress every Sunday.",
      ],
    };
  }

  return {
    summary: `Your screening suggests ${risk.toLowerCase()} risk (${score}%). This estimate is based on your submitted medical markers and is not a diagnosis.`,
    combatSteps: [
      "Follow your clinician guidance on nutrition, activity, and weight targets.",
      "Reduce added sugars and increase vegetables, protein, and fiber intake.",
      "Stay physically active most days and keep a consistent sleep routine.",
    ],
    suggestions: [
      "Schedule follow-up lab testing for confirmation and trend tracking.",
      "Bring this screening summary when consulting your doctor.",
      "Set realistic monthly health goals and monitor progress.",
    ],
  };
}

function buildPrompt(data: {
  source: "medical" | "lifestyle";
  prediction: PredictionResult;
  inputSummary: Record<string, string | number>;
}): string {
  return [
    "You are writing guidance for a diabetes risk screening app.",
    "Write in plain English and avoid fear-based language.",
    "This is screening support, not diagnosis.",
    "Return ONLY valid JSON. No markdown, no code fences, no extra text.",
    "JSON format:",
    '{"summary":"...","combat_steps":["...","...","..."],"suggestions":["...","...","..."]}',
    "Rules:",
    "- summary: 2-3 sentences, mention this is a screening estimate",
    "- combat_steps: exactly 3 concrete steps to lower risk",
    "- suggestions: exactly 3 practical suggestions",
    "",
    `Screening type: ${data.source}`,
    `Model output: ${JSON.stringify(data.prediction)}`,
    `Input summary: ${JSON.stringify(data.inputSummary)}`,
  ].join("\n");
}

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

      if (!summary || combatSteps.length === 0 || suggestions.length === 0) {
        continue;
      }

      return {
        summary,
        combatSteps,
        suggestions,
      };
    } catch {
      continue;
    }
  }

  return null;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Unknown Gemini error.";
}

function toUserWarning(rawMessage: string): string {
  const normalized = rawMessage.toLowerCase();

  if (
    normalized.includes("resource_exhausted") ||
    normalized.includes("quota")
  ) {
    return "Gemini quota is exceeded or unavailable for this key/project. Check AI Studio project quotas and billing settings.";
  }

  if (
    normalized.includes("api key") ||
    normalized.includes("permission_denied") ||
    normalized.includes("unauthenticated") ||
    normalized.includes("403")
  ) {
    return "Gemini API key is invalid or lacks permissions. Recreate key in AI Studio and ensure Generative Language API access.";
  }

  if (normalized.includes("model") && normalized.includes("not found")) {
    return "Configured Gemini model is unavailable for this key. Try setting GEMINI_MODEL=gemini-2.5-flash in .env.local.";
  }

  if (
    normalized.includes("non-structured output") ||
    normalized.includes("max_tokens") ||
    normalized.includes("finish reason")
  ) {
    return "Gemini returned an incomplete response. Please retry once; if it persists, keep GEMINI_MODEL=gemini-2.5-flash and restart Next.js.";
  }

  return rawMessage.length > 220
    ? `${rawMessage.slice(0, 220)}...`
    : rawMessage;
}

async function generateGeminiInsight(
  prompt: string,
  apiKey: string,
): Promise<{ parsed: AIInsightSections; model: string }> {
  const ai = new GoogleGenAI({ apiKey });
  let lastError = "Gemini did not return a usable response.";

  for (const model of DEFAULT_MODELS) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          // Disable thinking so token budget is used for the JSON payload itself.
          thinkingConfig: { thinkingBudget: 0 },
          temperature: 0.2,
          maxOutputTokens: 640,
          responseMimeType: "application/json",
        },
      });

      const parsed = parseInsight(response.text ?? "");
      if (parsed) {
        return { parsed, model };
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

function responsePayload(params: {
  insight: AIInsightSections;
  provider: AIInsightProvider;
  warning?: string;
  model?: string;
}) {
  return NextResponse.json(params);
}

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

  const safeInputSummary = body.inputSummary ?? {};
  const localFallback = fallbackInsight({
    source: body.source,
    prediction: body.prediction,
  });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return responsePayload({
      insight: localFallback,
      provider: "fallback",
      warning:
        "GEMINI_API_KEY is not configured. Create one in AI Studio and restart Next.js.",
    });
  }

  const prompt = buildPrompt({
    source: body.source,
    prediction: body.prediction,
    inputSummary: safeInputSummary,
  });

  try {
    const generated = await generateGeminiInsight(prompt, apiKey);
    return responsePayload({
      insight: generated.parsed,
      provider: "gemini",
      model: generated.model,
    });
  } catch (error) {
    return responsePayload({
      insight: localFallback,
      provider: "fallback",
      warning: toUserWarning(getErrorMessage(error)),
    });
  }
}
