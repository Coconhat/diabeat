import { supabase } from "@/lib/supabase";

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
  },
) {
  // Check if already saved (prevent duplicates on re-render)
  const { data: existing } = await supabase
    .from("screenings")
    .select("id")
    .eq("user_id", userId)
    .eq("submitted_at", stored.submittedAt)
    .maybeSingle();

  if (existing) return; // already saved, skip

  // 1. Insert screening
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

  // 2. Insert result
  await supabase.from("screening_results").insert({
    screening_id: screening.id,
    risk_score: stored.prediction.risk_score,
    risk_level: stored.prediction.risk_level.toLowerCase(),
    probabilities: stored.prediction.probabilities,
    breakdown: stored.prediction.breakdown ?? null,
    model_name:
      stored.source === "medical" ? "medical_rf" : "lifestyle_ensemble",
  });

  // 3. Insert inputs
  const table =
    stored.source === "medical"
      ? "screening_medical_inputs"
      : "screening_lifestyle_inputs";

  await supabase.from(table).insert({
    screening_id: screening.id,
    ...stored.inputSummary,
  });
}
