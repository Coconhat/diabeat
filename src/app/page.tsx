"use client";
import Link from "next/link";
import Logo from "@/components/Logo";
import LogoLoop from "@/components/LogoLoop";
import SplitText from "@/components/SplitText";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { RippleButton } from "@/components/ui/ripple-button";
import StaggeredMenu from "@/components/StaggeredMenu";

export default function Home() {
  const trustItems = [
    {
      node: "Developed with healthcare professionals",
    },
    {
      node: "Model accuracy: 98%",
    },
    {
      node: "Powered by machine learning trained on medical datasets",
    },
    {
      node: "With Gemini AI analysis",
    },
  ];

  return (
    <main className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Nav */}
      <nav className="w-full px-6 py-5 relative z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Logo size="large" />
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-6 pb-20 relative z-10">
        <div className="max-w-xl w-full text-center">
          {/* Animated icon */}
          <div className="animate-fade-in-up stagger-1 mx-auto mb-10 relative w-24 h-24">
            <div className="absolute inset-0 rounded-2xl bg-mint rotate-6 scale-95" />
            <div className="relative w-full h-full rounded-2xl bg-card border border-primary/10 flex items-center justify-center shadow-sm">
              <svg
                className="w-11 h-11 text-primary"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-[3.4rem] font-bold text-heading leading-[1.1] tracking-tight">
            Detect your
            <br />
            diabetes risk
          </h1>
          <SplitText
            text="before it's too late"
            className="text-4xl sm:text-5xl md:text-[3.4rem] font-bold leading-[1.1] tracking-tight mb-5 text-primary"
            delay={50}
            duration={1.25}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-100px"
            textAlign="center"
          />

          <p className="animate-fade-in-up stagger-3 text-muted text-base sm:text-lg max-w-sm mx-auto mb-10 leading-relaxed">
            Get results in minutes with a quick, confidential screening. No
            account needed.
          </p>

          <div className="animate-fade-in-up stagger-4 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
            <Link
              href="/screen/non-medical"
              className="group w-full sm:w-auto flex flex-col items-center text-center gap-2"
            >
              <RippleButton
                rippleColor="#ADD8E6"
                className="text-black rounded-xl px-7 py-4 text-base sm:text-lg w-full sm:w-[260px] h-14"
              >
                Lifestyle Screening
              </RippleButton>
              <p className="text-xs sm:text-sm text-muted/80 leading-relaxed max-w-[18rem]">
                Based on habits, symptoms, and health history
              </p>
            </Link>
            <Link
              href="/screen/medical"
              className="group w-full sm:w-auto flex flex-col items-center text-center gap-2"
            >
              <RainbowButton className="text-white rounded-xl px-7 py-4 text-base sm:text-lg w-full sm:w-[260px] h-14">
                Clinical Screening
              </RainbowButton>
              <p className="text-xs sm:text-sm text-muted/80 leading-relaxed max-w-[18rem]">
                I have lab results (HbA1c, cholesterol, etc.)
              </p>
            </Link>
          </div>

          <div className="animate-fade-in-up stagger-4 mt-3 text-sm text-muted font-medium">
            Takes ~2 minutes. No signup required.
          </div>

          <div className="animate-fade-in-up stagger-5 mt-10">
            <LogoLoop
              logos={trustItems}
              ariaLabel="Trust signals"
              speed={40}
              gap={28}
              logoHeight={12}
              pauseOnHover
              fadeOut
              className="text-xs text-muted"
            />
          </div>

          <div className="animate-fade-in-up stagger-6 mt-6 rounded-xl border border-amber-200/70 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <strong className="font-semibold">Not a diagnosis.</strong> This
            tool provides informational screening only. If you have concerns,
            talk with a healthcare professional.
          </div>

          {/* Trust indicators */}
          <div className="animate-fade-in-up stagger-6 mt-10 flex items-center justify-center gap-6 text-xs text-muted">
            <div className="flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-primary"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Private &amp; secure
            </div>
            <div className="flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-primary"
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
              Fast results
            </div>
            <div className="flex items-center gap-1.5">
              <svg
                className="w-3.5 h-3.5 text-primary"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              No signup
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 px-6 pb-16 mt-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-center sm:text-left">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              How it works
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-heading">
              Your screening in three simple steps
            </h2>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-primary/10 bg-card/60 p-5">
              <div className="text-sm font-semibold text-heading">
                1. Answer a few questions
              </div>
              <p className="mt-2 text-sm text-muted">
                Share basic health info, symptoms, or lab values if you have
                them.
              </p>
            </div>
            <div className="rounded-xl border border-primary/10 bg-card/60 p-5">
              <div className="text-sm font-semibold text-heading">
                2. Our AI analyzes your risk
              </div>
              <p className="mt-2 text-sm text-muted">
                A model trained on medical datasets evaluates your inputs.
              </p>
            </div>
            <div className="rounded-xl border border-primary/10 bg-card/60 p-5">
              <div className="text-sm font-semibold text-heading">
                3. Get instant results + recommendations
              </div>
              <p className="mt-2 text-sm text-muted">
                See your risk level and next-step guidance in minutes.
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs text-muted">
            Powered by machine learning trained on medical datasets.
          </p>
        </div>
      </section>

      {/* Product depth */}
      <section className="relative z-10 px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="space-y-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                What we analyze
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-heading">
                Factors used in the risk model
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-primary/10 bg-card/60 p-5">
                  <div className="text-sm font-semibold text-heading">
                    Clinical data (optional)
                  </div>
                  <ul className="mt-2 text-sm text-muted space-y-1">
                    <li>Age, BMI, HbA1c</li>
                    <li>Cholesterol, TG, HDL, LDL, VLDL</li>
                    <li>Urea, Creatinine</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-primary/10 bg-card/60 p-5">
                  <div className="text-sm font-semibold text-heading">
                    Symptoms and lifestyle
                  </div>
                  <ul className="mt-2 text-sm text-muted space-y-1">
                    <li>Polyuria, polydipsia, weight loss, weakness</li>
                    <li>Visual blurring, irritability, delayed healing</li>
                    <li>
                      Smoking, activity, blood pressure, cholesterol history
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-primary/10 bg-card/60 p-5">
              <div className="text-sm font-semibold text-heading">
                Privacy-first
              </div>
              <p className="mt-2 text-sm text-muted">
                We only ask for information needed to generate your screening
                result. No account required.
                <Link
                  href="/privacy"
                  className="ml-1 text-primary hover:text-primary-dark underline decoration-primary/40"
                >
                  Privacy overview
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
