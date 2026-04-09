import Link from "next/link";

export default function Logo({ size = "default" }: { size?: "default" | "large" }) {
  const textSize = size === "large" ? "text-3xl" : "text-xl";

  return (
    <Link href="/" className={`${textSize} font-bold tracking-tight inline-flex items-center gap-2 group`}>
      {/* Heartbeat icon mark */}
      <span className="relative flex items-center justify-center w-8 h-8 bg-mint rounded-lg group-hover:scale-105 transition-transform duration-200">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          className="text-primary"
        >
          <path
            d="M3 12h4l3-9 4 18 3-9h4"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span>
        <span className="text-primary">Dia</span>
        <span className="text-heading">beat</span>
      </span>
    </Link>
  );
}
