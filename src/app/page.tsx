import Link from "next/link";
import Logo from "@/components/Logo";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="w-full px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <Logo size="text-2xl" />
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex items-center justify-center px-6 pb-20">
        <div className="max-w-2xl w-full text-center">
          {/* Icon */}
          <div className="mx-auto mb-8 w-20 h-20 rounded-full bg-mint flex items-center justify-center">
            <svg
              className="w-10 h-10 text-primary"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-heading leading-tight mb-4">
            Know your diabetes risk
            <br />
            <span className="text-primary">in minutes</span>
          </h1>

          <p className="text-muted text-lg max-w-md mx-auto mb-10">
            A quick, confidential screening to help you understand your risk
            level. No account needed.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/screen/medical"
              className="w-full sm:w-auto px-8 py-3.5 bg-primary hover:bg-primary-dark text-white font-medium rounded-full transition-colors text-center"
            >
              I have medical data
            </Link>
            <Link
              href="/screen/non-medical"
              className="w-full sm:w-auto px-8 py-3.5 bg-trust-light hover:bg-blue-100 text-trust font-medium rounded-full transition-colors text-center"
            >
              Screen without medical data
            </Link>
          </div>

          <p className="mt-8 text-xs text-muted">
            This tool is for informational purposes only and is not a medical
            diagnosis.
          </p>
        </div>
      </section>
    </main>
  );
}
