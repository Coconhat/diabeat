// lib/saveScreening.ts
import { supabase } from "@/lib/supabase";
import { AIInsightSections, AIInsightProvider } from "@/lib/prediction";

export async function saveScreeningToSupabase(
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
    aiInsight?: AIInsightSections;
    aiProvider?: AIInsightProvider;
    aiModel?: string;
    aiGeneratedAt?: string;
  },
) {
  // 1. Check if this screening already exists (by user + submitted_at)
  const { data: existingScreening } = await supabase
    .from("screenings")
    .select("id")
    .eq("user_id", userId)
    .eq("submitted_at", stored.submittedAt)
    .maybeSingle();

  // If it exists, just update the AI fields in screening_results (if provided)
  if (existingScreening && stored.aiInsight) {
    const { error: updateError } = await supabase
      .from("screening_results")
      .update({
        ai_insight: stored.aiInsight,
        ai_provider: stored.aiProvider,
        ai_model: stored.aiModel,
        ai_generated_at: stored.aiGeneratedAt,
      })
      .eq("screening_id", existingScreening.id);

    if (updateError) {
      console.error("Failed to update AI insight:", updateError);
    }
    return; // nothing else to do
  }

  // If already exists and no AI insight provided, skip (already saved)
  if (existingScreening) return;

  // 2. First time save – insert all data
  const { data: screening, error } = await supabase
    .from("screenings")
    .insert({
      user_id: userId,
      source: stored.source,
      test_taken_on: new Date(stored.submittedAt).toISOString().split("T")[0],
      submitted_at: stored.submittedAt,
    })
    .select()
    .single();

  if (error || !screening)
    throw new Error(error?.message ?? "Failed to save screening");

  // 3. Insert result (including AI if already available – e.g., from fallback)
  await supabase.from("screening_results").insert({
    screening_id: screening.id,
    risk_score: stored.prediction.risk_score,
    risk_level: stored.prediction.risk_level.toLowerCase(),
    probabilities: stored.prediction.probabilities,
    breakdown: stored.prediction.breakdown ?? null,
    model_name:
      stored.source === "medical" ? "medical_rf" : "lifestyle_ensemble",
    ai_insight: stored.aiInsight ?? null,
    ai_provider: stored.aiProvider ?? null,
    ai_model: stored.aiModel ?? null,
    ai_generated_at: stored.aiGeneratedAt ?? null,
  });

  // 4. Insert inputs
  const table =
    stored.source === "medical"
      ? "screening_medical_inputs"
      : "screening_lifestyle_inputs";

  await supabase.from(table).insert({
    screening_id: screening.id,
    ...stored.inputSummary,
  });
}
