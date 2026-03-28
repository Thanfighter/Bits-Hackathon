import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Plus, ArrowRight, ShieldCheck, WarningCircle, Prohibit } from "@phosphor-icons/react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DECISION_BADGE = {
  PROCEED: { bg: "bg-[#DCFCE7]", border: "border-[#86EFAC]", text: "text-[#00C853]", icon: ShieldCheck },
  CAUTION: { bg: "bg-[#FEF9C3]", border: "border-[#FDE047]", text: "text-[#b8a000]", icon: WarningCircle },
  BLOCK: { bg: "bg-[#FEE2E2]", border: "border-[#FCA5A5]", text: "text-[#FF3B30]", icon: Prohibit },
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API}/dashboard/stats`);
        setStats(res.data);
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4" data-testid="dashboard-loading">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-zinc-100 animate-pulse border border-zinc-200" />
        ))}
      </div>
    );
  }

  const decisions = stats?.decisions || { PROCEED: 0, CAUTION: 0, BLOCK: 0 };
  const total = stats?.total_shipments || 0;

  return (
    <div className="p-4 md:p-6" data-testid="dashboard-page">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase" data-testid="dashboard-title">
            COMMAND CENTER
          </h1>
          <p className="text-sm text-zinc-500 mt-1 font-mono">
            Pre-shipment intelligence overview
          </p>
        </div>
        <Link
          to="/new-shipment"
          className="bg-zinc-950 text-white rounded-none font-bold uppercase tracking-widest text-xs px-6 py-4 hover:bg-zinc-800 transition-colors flex items-center gap-2 w-fit"
          data-testid="new-shipment-btn"
        >
          <Plus weight="bold" className="w-4 h-4" />
          NEW SHIPMENT
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-1 mb-8">
        <div className="bg-zinc-950 text-white p-6 col-span-1" data-testid="stat-total">
          <span className="text-xs font-mono tracking-[0.2em] uppercase text-zinc-400 block mb-2">
            TOTAL ANALYZED
          </span>
          <span className="text-5xl font-black font-mono tracking-tighter">{total}</span>
        </div>
        {Object.entries(DECISION_BADGE).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <div key={key} className={`${config.bg} border ${config.border} p-6`} data-testid={`stat-${key.toLowerCase()}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon weight="bold" className={`w-4 h-4 ${config.text}`} />
                <span className={`text-xs font-mono tracking-[0.2em] uppercase font-semibold ${config.text}`}>
                  {key}
                </span>
              </div>
              <span className="text-5xl font-black font-mono tracking-tighter">
                {decisions[key] || 0}
              </span>
            </div>
          );
        })}
      </div>

      {/* Avg Risk Score */}
      {total > 0 && (
        <div className="border border-zinc-200 bg-white p-6 mb-8" data-testid="avg-risk">
          <span className="text-xs font-mono tracking-[0.2em] uppercase text-zinc-500 block mb-2">
            AVERAGE RISK SCORE
          </span>
          <div className="flex items-end gap-4">
            <span className="text-6xl font-black font-mono tracking-tighter">
              {stats?.avg_risk_score || 0}
            </span>
            <div className="h-2 flex-1 bg-zinc-100 mb-3">
              <div
                className={`h-full transition-all duration-700 ${
                  (stats?.avg_risk_score || 0) <= 40 ? "bg-[#00C853]" :
                  (stats?.avg_risk_score || 0) <= 70 ? "bg-[#FFD600]" : "bg-[#FF3B30]"
                }`}
                style={{ width: `${stats?.avg_risk_score || 0}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Recent Shipments */}
      <div className="border border-zinc-200 bg-white" data-testid="recent-shipments">
        <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
          <span className="text-xs font-mono tracking-[0.2em] uppercase font-semibold text-zinc-500">
            RECENT ANALYSES
          </span>
          {total > 0 && (
            <Link
              to="/history"
              className="text-xs font-mono text-zinc-500 hover:text-zinc-950 flex items-center gap-1"
              data-testid="view-all-history"
            >
              VIEW ALL <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>

        {(!stats?.recent_shipments || stats.recent_shipments.length === 0) ? (
          <div className="p-12 text-center" data-testid="empty-state">
            <div
              className="w-full h-32 bg-cover bg-center opacity-10 grayscale mb-4"
              style={{ backgroundImage: "url(https://images.unsplash.com/photo-1751970046974-6d5a27f23ce1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1Mjh8MHwxfHNlYXJjaHwxfHxjYXJnbyUyMHNoaXAlMjBwb3J0JTIwYWVyaWFsfGVufDB8fHx8MTc3NDY3OTkzNnww&ixlib=rb-4.1.0&q=85)" }}
            />
            <p className="text-sm font-mono text-zinc-500 mb-4">No shipments analyzed yet</p>
            <Link
              to="/new-shipment"
              className="inline-flex items-center gap-2 bg-zinc-950 text-white font-bold uppercase tracking-widest text-xs px-6 py-3 hover:bg-zinc-800 transition-colors"
              data-testid="empty-state-cta"
            >
              <Plus weight="bold" className="w-4 h-4" />
              ANALYZE FIRST SHIPMENT
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200">
            {stats.recent_shipments.map((s) => {
              const badge = DECISION_BADGE[s.result?.decision] || DECISION_BADGE.CAUTION;
              const Icon = badge.icon;
              return (
                <Link
                  key={s.id}
                  to={`/result/${s.id}`}
                  className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors group"
                  data-testid={`shipment-row-${s.id}`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 flex items-center justify-center ${badge.bg} border ${badge.border} shrink-0`}>
                      <Icon weight="bold" className={`w-5 h-5 ${badge.text}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate">
                        {s.input?.origin} → {s.input?.destination}
                      </div>
                      <div className="text-xs font-mono text-zinc-500 truncate">
                        HS:{s.input?.hs_code} | ${s.input?.value?.toLocaleString()} | {s.input?.carrier}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="text-lg font-black font-mono">{s.result?.risk_score}</span>
                    <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-950 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
