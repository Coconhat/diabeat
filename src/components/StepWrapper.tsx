"use client";

import { ReactNode } from "react";

export default function StepWrapper({
  label,
  sublabel,
  children,
}: {
  label: string;
  sublabel?: string;
  children: ReactNode;
}) {
  return (
    <div className="animate-fadeIn">
      <h2 className="text-2xl font-semibold text-heading mb-1">{label}</h2>
      {sublabel && <p className="text-muted text-sm mb-6">{sublabel}</p>}
      {!sublabel && <div className="mb-6" />}
      {children}
    </div>
  );
}
