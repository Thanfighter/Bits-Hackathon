import { Anchor, CurrencyDollar, CloudRain, Truck, Leaf } from "@phosphor-icons/react";

const FACTOR_CONFIG = {
  congestion: {
    label: "PORT CONGESTION",
    icon: Anchor,
    detail: (d) => `Origin delay: ${d.origin_delay}d | Queue: ${d.origin_port}→${d.dest_port}`,
  },
  tax: {
    label: "TAX & COMPLIANCE",
    icon: CurrencyDollar,
    detail: (d) => `Tariff: ${d.effective_tariff_pct}% | Est. tax: $${d.estimated_tax?.toLocaleString()}`,
  },
  weather: {
    label: "WEATHER RISK",
    icon: CloudRain,
    detail: (d) => `${d.risk_zones} high-risk zone(s) | Regions: ${d.regions?.join(", ")}`,
  },
  carrier: {
    label: "CARRIER RISK",
    icon: Truck,
    detail: (d) => `Reliability: ${d.reliability}% | Transit: ${d.avg_transit_days}d | Rating: ${d.insurance_rating}`,
  },
  carbon: {
    label: "CARBON / ESG",
    icon: Leaf,
    detail: (d) => `CO2: ${d.co2_tons}t | CBAM: $${d.cbam_cost?.toLocaleString()} | ${d.distance_nm}nm`,
  },
};

const WEIGHTS = { congestion: 0.30, tax: 0.25, weather: 0.20, carrier: 0.15, carbon: 0.10 };

function getBarColor(score) {
  if (score <= 40) return "bg-[#00C853]";
  if (score <= 70) return "bg-[#FFD600]";
  return "bg-[#FF3B30]";
}

export default function RiskBreakdown({ breakdown }) {
  if (!breakdown) return null;

  return (
    <div className="border border-zinc-200 bg-white" data-testid="risk-breakdown">
      <div className="p-4 border-b border-zinc-200">
        <span className="text-xs font-mono tracking-[0.2em] uppercase font-semibold text-zinc-500">
          RISK FACTOR BREAKDOWN
        </span>
      </div>

      <div className="divide-y divide-zinc-200">
        {Object.entries(FACTOR_CONFIG).map(([key, config]) => {
          const data = breakdown[key];
          if (!data) return null;
          const Icon = config.icon;
          const weight = WEIGHTS[key];

          return (
            <div key={key} className="p-4 hover:bg-zinc-50 transition-colors" data-testid={`risk-factor-${key}`}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon weight="bold" className="w-4 h-4 text-zinc-600" />
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-700">
                    {config.label}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 ml-1">
                    w:{weight}
                  </span>
                </div>
                <span className="text-lg font-black font-mono tracking-tight" data-testid={`${key}-score`}>
                  {data.score}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-zinc-100 w-full mb-2">
                <div
                  className={`h-full ${getBarColor(data.score)} transition-all duration-700`}
                  style={{ width: `${data.score}%` }}
                />
              </div>

              <p className="text-xs font-mono text-zinc-500 leading-relaxed">
                {config.detail(data)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
