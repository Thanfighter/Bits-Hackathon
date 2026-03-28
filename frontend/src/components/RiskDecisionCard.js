import { WarningCircle, ShieldCheck, Prohibit, TrendUp, TrendDown } from "@phosphor-icons/react";

const DECISION_CONFIG = {
  PROCEED: {
    bg: "bg-[#00C853]",
    text: "text-black",
    mutedBg: "bg-[#DCFCE7]",
    border: "border-[#86EFAC]",
    icon: ShieldCheck,
    label: "PROCEED",
    sublabel: "Ship with confidence",
    pulse: "pulse-green",
  },
  CAUTION: {
    bg: "bg-[#FFD600]",
    text: "text-black",
    mutedBg: "bg-[#FEF9C3]",
    border: "border-[#FDE047]",
    icon: WarningCircle,
    label: "CAUTION",
    sublabel: "Review risks before shipping",
    pulse: "pulse-yellow",
  },
  BLOCK: {
    bg: "bg-[#FF3B30]",
    text: "text-white",
    mutedBg: "bg-[#FEE2E2]",
    border: "border-[#FCA5A5]",
    icon: Prohibit,
    label: "BLOCK",
    sublabel: "Do not ship — high risk",
    pulse: "pulse-red",
  },
};

export default function RiskDecisionCard({ result, compact = false }) {
  if (!result) return null;

  const config = DECISION_CONFIG[result.decision] || DECISION_CONFIG.CAUTION;
  const Icon = config.icon;
  const scoreDelta = result.delta;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 ${config.mutedBg} border ${config.border}`} data-testid="risk-decision-compact">
        <div className={`w-2.5 h-2.5 ${config.bg} ${config.pulse}`} />
        <span className="text-xs font-bold font-mono uppercase">{config.label}</span>
        <span className="text-xs font-mono text-zinc-600">{result.risk_score}</span>
      </div>
    );
  }

  return (
    <div className="border border-zinc-200 bg-white" data-testid="risk-decision-card">
      {/* Decision Header */}
      <div className={`${config.bg} ${config.text} p-6 md:p-8`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Icon weight="bold" className="w-8 h-8" />
              <span className="text-xs font-mono tracking-[0.2em] uppercase opacity-80">
                DECISION OUTPUT
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">
              {config.label}
            </h2>
            <p className="text-sm mt-1 opacity-80">{config.sublabel}</p>
          </div>
          <div className="text-right">
            <div className="text-6xl font-black font-mono tracking-tighter" data-testid="risk-score-value">
              {result.risk_score}
            </div>
            <div className="text-xs font-mono tracking-[0.2em] uppercase opacity-70">
              RISK SCORE
            </div>
          </div>
        </div>
      </div>

      {/* Confidence + Delta */}
      <div className="flex border-t border-zinc-200 divide-x divide-zinc-200">
        <div className="flex-1 p-4">
          <span className="text-xs font-mono tracking-[0.2em] uppercase text-zinc-500 block mb-1">
            CONFIDENCE
          </span>
          <span className="text-2xl font-black font-mono" data-testid="confidence-value">
            {result.confidence}%
          </span>
        </div>
        {result.tags && (
          <div className="flex-1 p-4">
            <span className="text-xs font-mono tracking-[0.2em] uppercase text-zinc-500 block mb-1">
              RISK FLAGS
            </span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {result.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 bg-zinc-100 text-zinc-700 border border-zinc-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        {scoreDelta !== undefined && (
          <div className="flex-1 p-4">
            <span className="text-xs font-mono tracking-[0.2em] uppercase text-zinc-500 block mb-1">
              DELTA
            </span>
            <div className="flex items-center gap-2">
              {scoreDelta < 0 ? (
                <TrendDown className="w-5 h-5 text-[#00C853]" weight="bold" />
              ) : scoreDelta > 0 ? (
                <TrendUp className="w-5 h-5 text-[#FF3B30]" weight="bold" />
              ) : null}
              <span className={`text-2xl font-black font-mono ${
                scoreDelta < 0 ? "text-[#00C853]" : scoreDelta > 0 ? "text-[#FF3B30]" : "text-zinc-500"
              }`}>
                {scoreDelta > 0 ? "+" : ""}{scoreDelta}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
