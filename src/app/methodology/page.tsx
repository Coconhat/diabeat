import Link from "next/link";
import Logo from "@/components/Logo";

export default function MethodologyPage() {
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
          Methodology and datasets
        </h1>
        <p className="mt-3 text-muted">
          Model accuracy: 98%. Powered by machine learning trained on medical
          datasets.
        </p>

        <div className="mt-8 space-y-5">
          <div className="rounded-xl border border-primary/10 bg-card/60 p-5">
            <h2 className="text-lg font-semibold text-heading">
              Dataset 1 - Diabetes Dataset (Clinical Model)
            </h2>
            <p className="mt-2 text-sm text-muted">
              Collected from Medical City Hospital and the Specialized Center
              for Endocrinology and Diabetes-Al-Kindy Teaching Hospital in Iraq.
              Contains lab data including Urea, Creatinine, HbA1c, Cholesterol,
              TG, HDL, LDL, VLDL, BMI, Age, and Gender.
            </p>
            <div className="mt-3 text-sm">
              <a
                href="https://data.mendeley.com/datasets/wj9rwkp9c2/1"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:text-primary-dark underline decoration-primary/40"
              >
                Mendeley Data (2020)
              </a>
            </div>
            <p className="mt-2 text-xs text-muted">
              Citation: Rashid, Ahlam (2020), "Diabetes Dataset", Mendeley Data,
              V1, doi: 10.17632/wj9rwkp9c2.1
            </p>
          </div>

          <div className="rounded-xl border border-primary/10 bg-card/60 p-5">
            <h2 className="text-lg font-semibold text-heading">
              Dataset 2 - Early Stage Diabetes Risk Prediction Dataset
            </h2>
            <p className="mt-2 text-sm text-muted">
              Collected via patient surveys at Sylhet Diabetes Hospital
              (Bangladesh) and validated by doctors. Contains 520 instances with
              17 symptom attributes such as polyuria, polydipsia, sudden weight
              loss, weakness, and visual blurring.
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              <a
                href="https://archive.ics.uci.edu/dataset/529/early+stage+diabetes+risk+prediction+dataset"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:text-primary-dark underline decoration-primary/40"
              >
                UCI Machine Learning Repository
              </a>
              <a
                href="https://www.kaggle.com/datasets/ishandutta/early-stage-diabetes-risk-prediction-dataset"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:text-primary-dark underline decoration-primary/40"
              >
                Kaggle mirror
              </a>
            </div>
            <p className="mt-2 text-xs text-muted">
              Citation: Early Stage Diabetes Risk Prediction [Dataset]. (2020).
              UCI Machine Learning Repository. https://doi.org/10.24432/C5VG8H
            </p>
          </div>

          <div className="rounded-xl border border-primary/10 bg-card/60 p-5">
            <h2 className="text-lg font-semibold text-heading">
              Dataset 3 - Diabetes Health Indicators Dataset (BRFSS 2015)
            </h2>
            <p className="mt-2 text-sm text-muted">
              Derived from the CDC's 2015 Behavioral Risk Factor Surveillance
              System (BRFSS). Includes 253,680 responses covering lifestyle
              factors such as smoking, physical activity, BMI, blood pressure,
              cholesterol, stroke, and heart disease.
            </p>
            <div className="mt-3 text-sm">
              <a
                href="https://www.kaggle.com/datasets/alexteboul/diabetes-health-indicators-dataset"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:text-primary-dark underline decoration-primary/40"
              >
                Kaggle dataset
              </a>
            </div>
            <p className="mt-2 text-xs text-muted">
              Citation: Teboul, A. (2022). Diabetes Health Indicators Dataset.
              Kaggle.
              https://www.kaggle.com/alexteboul/diabetes-health-indicators-dataset
            </p>
            <p className="mt-1 text-xs text-muted">
              Original source: CDC Behavioral Risk Factor Surveillance System
              (BRFSS) 2015.
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
