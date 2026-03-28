import { useEffect, useState } from "react";
import axios from "axios";
import { Vault, Lock, ArrowsClockwise, Receipt } from "@phosphor-icons/react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Finance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinance = async () => {
      try {
        const res = await axios.get(`${API}/finance/simulate`);
        setData(res.data);
      } catch (e) {
        console.error("Finance fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchFinance();
  }, []);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-zinc-100 animate-pulse border border-zinc-200" />
        ))}
      </div>
    );
  }

  const summary = data?.summary || {};
  const escrowItems = data?.escrow_items || [];

  return (
    <div className="p-4 md:p-6" data-testid="finance-page">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase" data-testid="finance-title">
          FINANCE LAYER
        </h1>
        <p className="text-sm text-zinc-500 mt-1 font-mono">
          Smart escrow simulation & trade finance overview
        </p>
      </div>

      {/* Texture overlay header */}
      <div className="relative border border-zinc-200 bg-zinc-50 p-6 md:p-8 mb-1 overflow-hidden" data-testid="finance-header">
        <div
          className="absolute top-0 right-0 w-1/2 h-full bg-cover bg-right opacity-5"
          style={{
            backgroundImage: "url(https://images.unsplash.com/photo-1765046255479-669cf07a0230?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTB8MHwxfHNlYXJjaHwyfHxkYXRhJTIwdmlzdWFsaXphdGlvbiUyMG5ldHdvcmslMjBhYnN0cmFjdHxlbnwwfHx8fDE3NzQ2Nzk5NDh8MA&ixlib=rb-4.1.0&q=85)",
            mixBlendMode: "multiply",
          }}
        />
        <div className="relative flex items-center gap-3 mb-4">
          <Vault weight="bold" className="w-5 h-5 text-zinc-600" />
          <span className="text-xs font-mono tracking-[0.2em] uppercase font-semibold text-zinc-500">
            CONCEPTUAL — SMART ESCROW SIMULATION
          </span>
        </div>
        <p className="text-sm text-zinc-600 font-mono leading-relaxed relative max-w-xl">
          This layer simulates a smart escrow system where shipment funds are locked upon initiation
          and released only on delivery confirmation. Blocked shipments prevent fund release,
          reducing financial exposure.
        </p>
      </div>

      {/* Financial Summary — Receipt Style */}
      <div className="border border-zinc-200 bg-zinc-50 p-6 font-mono mb-1" data-testid="finance-summary">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-dashed border-zinc-300">
          <Receipt weight="bold" className="w-4 h-4 text-zinc-500" />
          <span className="text-xs tracking-[0.2em] uppercase font-semibold text-zinc-500">
            FINANCIAL SUMMARY
          </span>
        </div>

        <div className="space-y-3">
          {[
            { label: "TOTAL SHIPMENT VALUE", value: summary.total_shipment_value, prefix: "$" },
            { label: "TOTAL TAX LIABILITY", value: summary.total_tax_liability, prefix: "$" },
            { label: "TOTAL CBAM COST", value: summary.total_cbam_cost, prefix: "$" },
            { label: "LOSS PREVENTED (BLOCKED)", value: summary.potential_loss_prevented, prefix: "$" },
          ].map((item) => (
            <div key={item.label} className="flex justify-between items-baseline">
              <span className="text-xs text-zinc-500 tracking-wider">{item.label}</span>
              <span className="text-sm font-bold text-right">
                {item.prefix}{(item.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}

          <div className="border-t border-dashed border-zinc-300 pt-3 flex justify-between items-baseline">
            <span className="text-xs text-zinc-500 tracking-wider font-bold">ESCROW LOCKED (15%)</span>
            <span className="text-lg font-black">
              ${(summary.escrow_locked || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Escrow Items */}
      <div className="border border-zinc-200 bg-white" data-testid="escrow-items">
        <div className="p-4 border-b border-zinc-200 flex items-center gap-2">
          <Lock weight="bold" className="w-4 h-4 text-zinc-500" />
          <span className="text-xs font-mono tracking-[0.2em] uppercase font-semibold text-zinc-500">
            ESCROW CONTRACTS
          </span>
        </div>

        {escrowItems.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-sm font-mono text-zinc-400">No escrow contracts yet. Analyze shipments to generate contracts.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200">
            {escrowItems.map((item, i) => (
              <div key={i} className="p-4 hover:bg-zinc-50 transition-colors font-mono" data-testid={`escrow-item-${i}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-zinc-400">#{item.id}</span>
                    <span className="text-sm font-bold">{item.origin} → {item.destination}</span>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${
                    item.status === "locked"
                      ? "bg-[#DCFCE7] border border-[#86EFAC] text-[#00C853]"
                      : "bg-[#FEF9C3] border border-[#FDE047] text-[#b8a000]"
                  }`}>
                    {item.status === "locked" ? (
                      <Lock weight="bold" className="w-3 h-3" />
                    ) : (
                      <ArrowsClockwise weight="bold" className="w-3 h-3" />
                    )}
                    {item.status}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Value: ${item.value?.toLocaleString()}</span>
                  <span>{item.release_condition}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Disclaimer */}
      <div className="mt-4 p-3 border border-dashed border-zinc-300 bg-zinc-50">
        <p className="text-[10px] font-mono tracking-wider text-zinc-400 uppercase text-center">
          This is a conceptual simulation. No real financial transactions are processed.
        </p>
      </div>
    </div>
  );
}
