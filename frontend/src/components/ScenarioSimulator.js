import { useState } from "react";
import axios from "axios";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ArrowsClockwise } from "@phosphor-icons/react";
import RiskDecisionCard from "./RiskDecisionCard";
import RiskBreakdown from "./RiskBreakdown";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COUNTRIES = [
  "China", "India", "USA", "Germany", "UK", "Japan", "Singapore", "Netherlands",
  "UAE", "South Korea", "Vietnam", "Brazil", "South Africa", "Kenya", "Turkey",
  "Australia", "Mexico", "Saudi Arabia", "Belgium", "France",
];

const CARRIERS = [
  { id: "maersk", name: "Maersk" },
  { id: "msc", name: "MSC" },
  { id: "cma_cgm", name: "CMA CGM" },
  { id: "cosco", name: "COSCO" },
  { id: "hapag_lloyd", name: "Hapag-Lloyd" },
  { id: "evergreen", name: "Evergreen" },
  { id: "one", name: "ONE" },
  { id: "yang_ming", name: "Yang Ming" },
  { id: "zim", name: "ZIM" },
];

export default function ScenarioSimulator({ shipmentId, originalResult }) {
  const [carrier, setCarrier] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    if (!carrier && !origin && !destination) return;
    setLoading(true);
    try {
      const payload = { shipment_id: shipmentId };
      if (carrier) payload.new_carrier = carrier;
      if (origin) payload.new_origin = origin;
      if (destination) payload.new_destination = destination;

      const res = await axios.post(`${API}/shipments/simulate`, payload);
      setSimResult(res.data);
    } catch (e) {
      console.error("Simulation error:", e);
    } finally {
      setLoading(false);
    }
  };

  const resetSim = () => {
    setCarrier("");
    setOrigin("");
    setDestination("");
    setSimResult(null);
  };

  return (
    <div className="border border-zinc-200 bg-white" data-testid="scenario-simulator">
      <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
        <span className="text-xs font-mono tracking-[0.2em] uppercase font-semibold text-zinc-500">
          SCENARIO SIMULATOR — WHAT IF?
        </span>
        {simResult && (
          <button
            onClick={resetSim}
            className="text-xs font-mono text-zinc-500 hover:text-zinc-950 underline"
            data-testid="reset-simulation"
          >
            RESET
          </button>
        )}
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-xs font-mono tracking-[0.2em] uppercase text-zinc-500 block mb-2">
              CHANGE CARRIER
            </label>
            <Select value={carrier} onValueChange={setCarrier}>
              <SelectTrigger className="rounded-none border-zinc-200 font-mono text-sm h-10" data-testid="sim-carrier-select">
                <SelectValue placeholder="Keep current" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {CARRIERS.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="font-mono text-sm">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-mono tracking-[0.2em] uppercase text-zinc-500 block mb-2">
              CHANGE ORIGIN
            </label>
            <Select value={origin} onValueChange={setOrigin}>
              <SelectTrigger className="rounded-none border-zinc-200 font-mono text-sm h-10" data-testid="sim-origin-select">
                <SelectValue placeholder="Keep current" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c} className="font-mono text-sm">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-mono tracking-[0.2em] uppercase text-zinc-500 block mb-2">
              CHANGE DESTINATION
            </label>
            <Select value={destination} onValueChange={setDestination}>
              <SelectTrigger className="rounded-none border-zinc-200 font-mono text-sm h-10" data-testid="sim-destination-select">
                <SelectValue placeholder="Keep current" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c} className="font-mono text-sm">
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <button
          onClick={runSimulation}
          disabled={loading || (!carrier && !origin && !destination)}
          className="bg-zinc-950 text-white rounded-none font-bold uppercase tracking-widest text-xs px-6 py-3 hover:bg-zinc-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 w-full md:w-auto justify-center"
          data-testid="run-simulation-btn"
        >
          <ArrowsClockwise weight="bold" className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {loading ? "SIMULATING..." : "RUN SIMULATION"}
        </button>
      </div>

      {simResult && (
        <div className="border-t border-zinc-200 p-4 space-y-4" data-testid="simulation-result">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-zinc-50 border border-zinc-200">
              <span className="text-xs font-mono tracking-[0.2em] uppercase text-zinc-500 block mb-1">ORIGINAL</span>
              <span className="text-2xl font-black font-mono">{simResult.original.score}</span>
              <span className="text-xs font-mono ml-2 text-zinc-500">{simResult.original.decision}</span>
            </div>
            <div className="p-3 bg-zinc-50 border border-zinc-200">
              <span className="text-xs font-mono tracking-[0.2em] uppercase text-zinc-500 block mb-1">SIMULATED</span>
              <span className="text-2xl font-black font-mono">{simResult.simulated.score}</span>
              <span className="text-xs font-mono ml-2 text-zinc-500">{simResult.simulated.decision}</span>
            </div>
            <div className="p-3 bg-zinc-50 border border-zinc-200">
              <span className="text-xs font-mono tracking-[0.2em] uppercase text-zinc-500 block mb-1">CHANGE</span>
              <span className={`text-2xl font-black font-mono ${
                simResult.delta < 0 ? "text-[#00C853]" : simResult.delta > 0 ? "text-[#FF3B30]" : "text-zinc-500"
              }`}>
                {simResult.delta > 0 ? "+" : ""}{simResult.delta}
              </span>
            </div>
          </div>

          <RiskDecisionCard
            result={{
              ...simResult.simulated,
              risk_score: simResult.simulated.score,
              delta: simResult.delta,
            }}
          />
          <RiskBreakdown breakdown={simResult.simulated.breakdown} />
        </div>
      )}
    </div>
  );
}
