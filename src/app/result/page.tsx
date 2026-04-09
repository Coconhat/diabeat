"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";

const riskConfig = {
  low: {
    label: "Low Risk",
    color: "bg-risk-low",
    textColor: "text-risk-low",
    bgLight: "bg-mint",
    explanation:
      "Based on the information you provided, your estimated risk of diabetes appears to be low. This is encouraging, but maintaining a healthy lifestyle is still important for long-term prevention.",
  },
  moderate: {
    label: "Moderate Risk",
    color: "bg-risk-moderate",
    textColor: "text-risk-moderate",
    bgLight: "bg-amber-50",
    explanation:
      "Your screening suggests a moderate risk level. Some of your indicators are outside the typical range. We recommend discussing these results with a healthcare professional for further evaluation.",
  },
  high: {
    label: "High Risk",
    color: "bg-risk-high",
    textColor: "text-risk-high",
    bgLight: "bg-red-50",
    explanation:
      "Your screening indicates an elevated risk for diabetes. This does not mean you have diabetes, but we strongly recommend consulting with a healthcare professional as soon as possible for proper testing.",
  },
};

function ResultContent() {
  const params = useSearchParams();
  const riskParam = params.get("risk") as keyof typeof riskConfig | null;
  const risk = riskConfig[riskParam ?? "low"] ?? riskConfig.low;

  return (
    <section className="flex-1 flex flex-col items-center px-6 pt-8 pb-20">
      <div className="w-full max-w-lg">
        {/* Risk Badge */}
        <div className="bg-card border border-gray-100 rounded-2xl p-8 text-center">
          <p className="text-sm text-muted mb-4 uppercase tracking-wide font-medium">
            Your screening result
          </p>

          <div
            className={`inline-flex items-center px-6 py-3 rounded-full ${risk.color} text-white text-xl font-bold mb-6`}
          >
            {risk.label}
          </div>

          <p className="text-heading text-base leading-relaxed">
            {risk.explanation}
          </p>
        </div>

        {/* AI Explanation Placeholder */}
        <div className="mt-6 bg-trust-light border border-blue-100 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 rounded-full bg-trust/10 flex items-center justify-center flex-shrink-0">
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
                  d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-trust mb-1">
                AI-generated insight
              </h3>
              <p className="text-sm text-heading leading-relaxed">
                This is a placeholder for a personalized AI-generated
                explanation based on your specific inputs. It would highlight
                which factors contributed most to your risk score and suggest
                actionable next steps.
              </p>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 bg-page border border-gray-200 rounded-2xl p-5">
          <p className="text-xs text-muted leading-relaxed">
            <span className="font-semibold">Disclaimer:</span> This screening
            tool provides an estimate only and is not a medical diagnosis. It
            should not replace professional medical advice, diagnosis, or
            treatment. Always consult a qualified healthcare provider with any
            questions about your health.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3">
          <a
            href="#"
            className="w-full px-8 py-3.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-full transition-colors text-center"
          >
            Talk to a doctor
          </a>
          <Link
            href="/"
            className="w-full px-8 py-3.5 bg-trust-light hover:bg-blue-100 text-trust font-medium rounded-full transition-colors text-center"
          >
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
      <nav className="w-full px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <Logo />
        </div>
      </nav>
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted">Loading results...</p>
          </div>
        }
      >
        <ResultContent />
      </Suspense>
    </main>
  );
}
