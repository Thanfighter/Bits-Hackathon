import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ArrowRight, ShieldCheck, WarningCircle, Prohibit, Funnel } from "@phosphor-icons/react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DECISION_BADGE = {
  PROCEED: { bg: "bg-[#DCFCE7]", border: "border-[#86EFAC]", text: "text-[#00C853]", icon: ShieldCheck, dot: "bg-[#00C853]" },
  CAUTION: { bg: "bg-[#FEF9C3]", border: "border-[#FDE047]", text: "text-[#b8a000]", icon: WarningCircle, dot: "bg-[#FFD600]" },
  BLOCK: { bg: "bg-[#FEE2E2]", border: "border-[#FCA5A5]", text: "text-[#FF3B30]", icon: Prohibit, dot: "bg-[#FF3B30]" },
};

export default function History() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get(`${API}/shipments/history`);
        setShipments(res.data);
      } catch (e) {
        console.error("Fetch history error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filtered = filter === "ALL"
    ? shipments
    : shipments.filter((s) => s.result?.decision === filter);

  return (
    <div className="p-4 md:p-6" data-testid="history-page">
      {/* Banner */}
      <div
        className="w-full h-32 md:h-40 bg-cover bg-center relative mb-6 border border-zinc-200"
        style={{
          backgroundImage: "url(https://images.pexels.com/photos/5213978/pexels-photo-5213978.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940)",
          filter: "grayscale(100%)",
        }}
      >
        <div className="absolute inset-0 bg-white/80 flex items-end p-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase" data-testid="history-title">
              DECISION MEMORY
            </h1>
            <p className="text-sm text-zinc-500 font-mono mt-1">
              Past analyses and outcomes — {shipments.length} records
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1 mb-4" data-testid="history-filters">
        <Funnel weight="bold" className="w-4 h-4 text-zinc-500 mr-2" />
        {["ALL", "PROCEED", "CAUTION", "BLOCK"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs font-bold uppercase tracking-widest px-4 py-2 transition-colors ${
              filter === f
                ? "bg-zinc-950 text-white"
                : "bg-white text-zinc-600 border border-zinc-200 hover:bg-zinc-50"
            }`}
            data-testid={`filter-${f.toLowerCase()}`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-zinc-100 animate-pulse border border-zinc-200" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 border border-zinc-200 bg-white" data-testid="history-empty">
          <p className="text-sm font-mono text-zinc-500 mb-4">
            {filter === "ALL" ? "No shipments analyzed yet" : `No ${filter} shipments found`}
          </p>
          <Link
            to="/new-shipment"
            className="inline-flex items-center gap-2 bg-zinc-950 text-white font-bold uppercase tracking-widest text-xs px-6 py-3 hover:bg-zinc-800 transition-colors"
          >
            ANALYZE A SHIPMENT
          </Link>
        </div>
      ) : (
        <div className="border border-zinc-200 bg-white" data-testid="history-table">
          {/* Table Header */}
          <div className="hidden md:grid grid-cols-12 gap-0 border-b border-zinc-200 bg-zinc-50">
            {["STATUS", "ROUTE", "HS CODE", "VALUE", "SCORE", "CARRIER", ""].map((h, i) => (
              <div
                key={h}
                className={`p-3 text-[10px] font-mono tracking-[0.2em] uppercase font-semibold text-zinc-500 ${
                  i === 0 ? "col-span-1" :
                  i === 1 ? "col-span-3" :
                  i === 6 ? "col-span-1" : "col-span-2"
                }`}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="divide-y divide-zinc-200">
            {filtered.map((s) => {
              const badge = DECISION_BADGE[s.result?.decision] || DECISION_BADGE.CAUTION;
              return (
                <Link
                  key={s.id}
                  to={`/result/${s.id}`}
                  className="grid grid-cols-1 md:grid-cols-12 gap-0 hover:bg-zinc-50 transition-colors group"
                  data-testid={`history-row-${s.id}`}
                >
                  {/* Status */}
                  <div className="p-3 col-span-1 flex items-center">
                    <div className={`w-3 h-3 ${badge.dot}`} />
                  </div>
                  {/* Route */}
                  <div className="p-3 col-span-3">
                    <span className="text-sm font-bold">{s.input?.origin} → {s.input?.destination}</span>
                    <span className="text-[10px] font-mono text-zinc-400 block">
                      {new Date(s.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {/* HS Code */}
                  <div className="p-3 col-span-2">
                    <span className="text-sm font-mono">{s.input?.hs_code}</span>
                  </div>
                  {/* Value */}
                  <div className="p-3 col-span-2">
                    <span className="text-sm font-mono">${s.input?.value?.toLocaleString()}</span>
                  </div>
                  {/* Score */}
                  <div className="p-3 col-span-2">
                    <span className="text-lg font-black font-mono">{s.result?.risk_score}</span>
                  </div>
                  {/* Carrier */}
                  <div className="p-3 col-span-1 hidden md:flex items-center">
                    <span className="text-xs font-mono text-zinc-500">{s.input?.carrier}</span>
                  </div>
                  {/* Arrow */}
                  <div className="p-3 col-span-1 flex items-center justify-end">
                    <ArrowRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-950 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
