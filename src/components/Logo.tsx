import Link from "next/link";

export default function Logo({ size = "text-2xl" }: { size?: string }) {
  return (
    <Link href="/" className={`${size} font-bold tracking-tight`}>
      <span className="text-primary">Dia</span>
      <span className="text-heading">beat</span>
    </Link>
  );
}
