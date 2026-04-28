"use client";

import Prism from "@/components/Prism";

export default function AppBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
      aria-hidden
    >
      <div className="absolute inset-0 bg-white" />
      <div className="absolute inset-0 opacity-55">
        <Prism
          animationType="rotate"
          scale={3.6}
          glow={1.2}
          noise={0}
          bloom={1.2}
          colorFrequency={1.2}
          hoverStrength={1.6}
          inertia={0.06}
          timeScale={0.4}
          suspendWhenOffscreen
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-white/20 via-white/30 to-white/45" />
    </div>
  );
}
