import Link from "next/link";
import Logo from "@/components/Logo";

const steps = [
  {
    title: "Choose the screening that fits",
    body: "Use the lifestyle screen if you want a quick risk check, or the clinical screen if you already have lab results.",
  },
  {
    title: "Answer only what you know",
    body: "The forms adapt step by step so you can move quickly without seeing a wall of questions.",
  },
  {
    title: "Get an instant risk estimate",
    body: "Your inputs are evaluated by a model trained on medical datasets, then summarized into clear next steps.",
  },
];

const highlights = [
  {
    title: "Fast",
    body: "Most screenings take about two minutes to complete.",
  },
  {
    title: "Private",
    body: "No account is required to use the screening flow.",
  },
  {
    title: "Actionable",
    body: "Results include a risk level and guidance for what to do next.",
  },
  {
    title: "Grounded",
    body: "The models are informed by datasets used for diabetes risk research.",
  },
];

const whatWeUse = [
  "Age, weight, height, and BMI",
  "Blood pressure and cholesterol history",
  "Lifestyle factors such as activity, smoking, and alcohol use",
  "Clinical lab values when they are available",
];

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen px-6 py-10 relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[28rem] bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <nav className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-10">
          <Logo size="large" />
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/methodology"
              className="text-muted hover:text-heading transition-colors"
            >
              Methodology
            </Link>
            <Link
              href="/privacy"
              className="text-muted hover:text-heading transition-colors"
            >
              Privacy
            </Link>
            <Link
              href="/"
              className="rounded-full border border-primary/15 bg-white/70 px-4 py-2 text-heading shadow-sm backdrop-blur-sm transition-transform hover:-translate-y-0.5"
            >
              Back home
            </Link>
          </div>
        </nav>

        <section className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-white/70 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-muted shadow-sm backdrop-blur-sm">
              How it works
            </div>

            <div className="space-y-4 max-w-2xl">
              <h1 className="text-4xl sm:text-5xl md:text-[3.5rem] font-bold text-heading leading-[1.04] tracking-tight">
                A quick screening flow that stays calm and clear
              </h1>
              <p className="text-base sm:text-lg text-muted leading-relaxed max-w-xl">
                We designed the experience to feel like a guided checkup, not a
                form dump. You move through a few focused steps, get a result
                instantly, and can decide what to do next.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/screen/non-medical"
                className="rounded-xl bg-heading px-5 py-3 text-sm font-medium text-white shadow-sm transition-transform hover:-translate-y-0.5"
              >
                Start lifestyle screening
              </Link>
              <Link
                href="/screen/medical"
                className="rounded-xl border border-primary/15 bg-white/80 px-5 py-3 text-sm font-medium text-heading shadow-sm backdrop-blur-sm transition-transform hover:-translate-y-0.5"
              >
                Use clinical screening
              </Link>
            </div>
          </div>

          <aside className="rounded-3xl border border-primary/10 bg-white/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.06)] backdrop-blur-sm">
            <div className="text-xs uppercase tracking-[0.22em] text-muted">
              At a glance
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-primary/10 bg-card/60 p-4"
                >
                  <div className="text-sm font-semibold text-heading">
                    {item.title}
                  </div>
                  <p className="mt-1 text-sm text-muted leading-relaxed">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="mt-14">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted">
                The flow
              </p>
              <h2 className="mt-2 text-2xl sm:text-3xl font-semibold text-heading">
                Three steps from input to insight
              </h2>
            </div>
            <p className="max-w-md text-sm text-muted leading-relaxed">
              The sequence is intentionally short so the experience stays smooth
              on mobile and desktop.
            </p>
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {steps.map((step, index) => (
              <article
                key={step.title}
                className="rounded-2xl border border-primary/10 bg-white/70 p-6 shadow-sm backdrop-blur-sm"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  0{index + 1}
                </div>
                <h3 className="mt-4 text-lg font-semibold text-heading">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  {step.body}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-3xl border border-primary/10 bg-card/70 p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">
              What we analyze
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-heading">
              Inputs depend on the screening path
            </h2>
            <p className="mt-3 text-sm text-muted leading-relaxed">
              The lifestyle flow focuses on symptoms and everyday habits. The
              clinical flow adds lab values for a more detailed assessment when
              they are available.
            </p>

            <ul className="mt-5 space-y-3">
              {whatWeUse.map((item) => (
                <li key={item} className="flex gap-3 text-sm text-heading">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-primary shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-amber-200/70 bg-amber-50 p-6 text-amber-950 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-700">
              Important
            </p>
            <h2 className="mt-2 text-2xl font-semibold">
              Screening, not diagnosis
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-amber-900/90">
              The result is meant to help you understand risk and decide whether
              to speak with a healthcare professional. It should not replace a
              medical consultation, diagnosis, or treatment plan.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/methodology"
                className="rounded-xl border border-amber-300/80 bg-white/70 px-4 py-2 text-sm font-medium text-amber-950 transition-transform hover:-translate-y-0.5"
              >
                Read methodology
              </Link>
              <Link
                href="/privacy"
                className="rounded-xl border border-amber-300/80 bg-white/70 px-4 py-2 text-sm font-medium text-amber-950 transition-transform hover:-translate-y-0.5"
              >
                Review privacy
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}