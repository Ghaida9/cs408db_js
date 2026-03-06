import { useEffect, useState } from "react";
import { Database } from "lucide-react";

interface SplashScreenProps {
  onComplete: () => void;
}

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [phase, setPhase] = useState<"enter" | "visible" | "exit">("enter");

  useEffect(() => {
    const enterTimer = requestAnimationFrame(() => {
      setPhase("visible");
    });

    const exitTimer = setTimeout(() => {
      setPhase("exit");
    }, 2100);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2600);

    return () => {
      cancelAnimationFrame(enterTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const opacity =
    phase === "enter"
      ? "opacity-0"
      : phase === "visible"
      ? "opacity-100"
      : "opacity-0";

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-500 ${opacity}`}
      style={{
        background:
          "radial-gradient(circle at center, #0f1c3f 0%, #070b18 70%, #02040a 100%)",
      }}
    >
      {/* Glow Background Rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-3xl absolute"></div>
        <div className="w-[350px] h-[350px] rounded-full bg-purple-500/10 blur-2xl absolute"></div>
      </div>

      {/* Logo */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-3xl animate-ping bg-cyan-400/20"></div>

        <div
          className="relative w-24 h-24 rounded-3xl flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, #22d3ee 0%, #9333ea 100%)",
            boxShadow:
              "0 0 40px rgba(34,211,238,0.4), 0 0 80px rgba(147,51,234,0.3)",
          }}
        >
          <Database className="w-12 h-12 text-white" strokeWidth={1.5} />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-4xl font-extrabold tracking-tight mb-2 text-white">
        CS <span className="text-cyan-400">408</span>
      </h1>

      {/* Subtitle */}
      <p className="text-gray-400 tracking-[0.25em] uppercase mb-10">
        Database Quiz
      </p>

      {/* Loading Dots */}
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-3 h-3 rounded-full bg-cyan-400 animate-bounce"
            style={{
              animationDelay: `${i * 150}ms`,
              animationDuration: "0.8s",
            }}
          />
        ))}
      </div>

      {/* Bottom Text */}
      <p className="absolute bottom-8 text-xs text-gray-500">
        Powered by AI · Llama 3.1 8B
      </p>
    </div>
  );
}