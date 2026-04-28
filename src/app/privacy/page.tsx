import Link from "next/link";
import Logo from "@/components/Logo";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-6 py-10 relative overflow-hidden">
      <div className="max-w-4xl mx-auto relative z-10">
        <nav className="flex items-center justify-between mb-10">
          <Logo size="large" />
          <Link
            href="/"
            className="text-sm text-primary hover:text-primary-dark"
          >
            Back to home
          </Link>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold text-heading">
          Privacy overview
        </h1>
        <p className="mt-3 text-muted">
          A brief overview of how the screening experience approaches privacy.
        </p>

        <div className="mt-8 grid gap-4">
          <div className="rounded-xl border border-primary/10 bg-card/60 p-5">
            <h2 className="text-sm font-semibold text-heading">
              Data minimization
            </h2>
            <p className="mt-2 text-sm text-muted">
              We only ask for information needed to generate your screening
              result.
            </p>
          </div>

          <div className="rounded-xl border border-primary/10 bg-card/60 p-5">
            <h2 className="text-sm font-semibold text-heading">
              No account required
            </h2>
            <p className="mt-2 text-sm text-muted">
              You can complete a screening without creating an account.
            </p>
          </div>

          <div className="rounded-xl border border-primary/10 bg-card/60 p-5">
            <h2 className="text-sm font-semibold text-heading">
              Your choice of inputs
            </h2>
            <p className="mt-2 text-sm text-muted">
              Prefer not to enter medical lab values? Use the non-medical
              screening instead.
            </p>
          </div>

          <div className="rounded-xl border border-primary/10 bg-card/60 p-5">
            <h2 className="text-sm font-semibold text-heading">
              Training data transparency
            </h2>
            <p className="mt-2 text-sm text-muted">
              See the datasets used to train the model on the{" "}
              <Link
                href="/methodology"
                className="text-primary hover:text-primary-dark underline decoration-primary/40"
              >
                methodology page
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-amber-200/70 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong className="font-semibold">Not a diagnosis.</strong> This tool
          provides informational screening only.
        </div>
      </div>
    </main>
  );
}
