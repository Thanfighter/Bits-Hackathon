import { useEffect, useState } from "react";

const STEPS = [
  { text: "Connecting to port intelligence network", delay: 400 },
  { text: "Analyzing HS code classification", delay: 600 },
  { text: "Scanning congestion data (5 ports)", delay: 800 },
  { text: "Calculating tariff & compliance exposure", delay: 700 },
  { text: "Simulating weather patterns across route", delay: 900 },
  { text: "Evaluating carrier reliability index", delay: 500 },
  { text: "Computing carbon footprint & CBAM cost", delay: 700 },
  { text: "Running multi-factor risk fusion", delay: 600 },
  { text: "Generating decision output", delay: 400 },
];

export default function LoadingIntelligence({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepStatuses, setStepStatuses] = useState([]);

  useEffect(() => {
    if (currentStep >= STEPS.length) {
      const timer = setTimeout(() => onComplete(), 600);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      const status = Math.random() > 0.15 ? "OK" : "WARN";
      setStepStatuses((prev) => [...prev, status]);
      setCurrentStep((prev) => prev + 1);
    }, STEPS[currentStep].delay);

    return () => clearTimeout(timer);
  }, [currentStep, onComplete]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4 md:p-8" data-testid="loading-intelligence">
      <div className="w-full max-w-2xl bg-zinc-50 border border-zinc-200 p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-3 h-3 bg-zinc-950 animate-pulse" />
          <span className="text-xs font-mono tracking-[0.2em] uppercase font-semibold text-zinc-500">
            SENTINEL ANALYSIS ENGINE
          </span>
        </div>

        <div className="space-y-2 font-mono text-sm">
          {STEPS.map((step, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 transition-opacity duration-300 ${
                i <= currentStep ? "opacity-100" : "opacity-0"
              }`}
            >
              <span className="text-zinc-400 select-none shrink-0">&gt;</span>
              <span className="text-zinc-700 flex-1">{step.text}...</span>
              {i < stepStatuses.length && (
                <span
                  className={`font-bold shrink-0 ${
                    stepStatuses[i] === "OK" ? "text-[#00C853]" : "text-[#FFD600]"
                  }`}
                >
                  [{stepStatuses[i]}]
                </span>
              )}
            </div>
          ))}

          {currentStep < STEPS.length && (
            <div className="flex items-start gap-3">
              <span className="text-zinc-400 select-none">&gt;</span>
              <span className="cursor-blink text-zinc-950 font-bold">_</span>
            </div>
          )}

          {currentStep >= STEPS.length && (
            <div className="flex items-start gap-3 mt-4 pt-4 border-t border-zinc-200">
              <span className="text-zinc-400 select-none">&gt;</span>
              <span className="text-zinc-950 font-bold">
                ANALYSIS COMPLETE — RENDERING DECISION
              </span>
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mt-6 pt-4 border-t border-zinc-200">
          <div className="flex justify-between text-xs font-mono text-zinc-500 mb-2">
            <span>PROGRESS</span>
            <span>{Math.round((currentStep / STEPS.length) * 100)}%</span>
          </div>
          <div className="h-1 bg-zinc-200 w-full">
            <div
              className="h-full bg-zinc-950 transition-all duration-500"
              style={{ width: `${(currentStep / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
