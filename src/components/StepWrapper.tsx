"use client";

import { ReactNode, useEffect, useState } from "react";

export default function StepWrapper({
  stepKey,
  label,
  sublabel,
  children,
}: {
  stepKey: string;
  label: string;
  sublabel?: string;
  children: ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, [stepKey]);

  return (
    <div
      className={`transition-all duration-400 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-3"
      }`}
      style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
    >
      <h2 className="text-2xl font-semibold text-heading mb-1 tracking-tight">
        {label}
      </h2>
      {sublabel && (
        <p className="text-muted text-sm mb-7">{sublabel}</p>
      )}
      {!sublabel && <div className="mb-7" />}
      {children}
    </div>
  );
}
