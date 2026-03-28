import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Robot, Spinner } from "@phosphor-icons/react";
import RiskDecisionCard from "../components/RiskDecisionCard";
import RiskBreakdown from "../components/RiskBreakdown";
import MapView from "../components/MapView";
import ScenarioSimulator from "../components/ScenarioSimulator";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ShipmentResult() {
  const { id } = useParams();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiRec, setAiRec] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    const fetchShipment = async () => {
      try {
        // Try sessionStorage first
        const cached = sessionStorage.getItem("lastAnalysis");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.id === id) {
            setShipment(parsed);
            setLoading(false);
            sessionStorage.removeItem("lastAnalysis");
            return;
          }
        }
        const res = await axios.get(`${API}/shipments/${id}`);
        setShipment(res.data);
      } catch (e) {
        console.error("Fetch shipment error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchShipment();
  }, [id]);

  const fetchAIRecommendation = useCallback(async () => {
    if (aiLoading || aiRec) return;
    setAiLoading(true);
    try {
      const res = await axios.post(`${API}/ai/recommend`, { shipment_id: id });
      setAiRec(res.data);
    } catch (e) {
      console.error("AI recommendation error:", e);
    } finally {
      setAiLoading(false);
    }
  }, [id, aiLoading, aiRec]);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-zinc-100 animate-pulse border border-zinc-200" />
        ))}
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="p-4 md:p-6 text-center py-20">
        <p className="font-mono text-zinc-500">Shipment not found</p>
        <Link to="/" className="text-xs font-bold uppercase tracking-widest mt-4 inline-block hover:underline">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const result = shipment.result;
  const input = shipment.input;

  return (
    <div className="p-4 md:p-6" data-testid="shipment-result-page">
      {/* Back + Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/"
          className="p-2 hover:bg-zinc-100 transition-colors border border-zinc-200"
          data-testid="back-to-dashboard"
        >
          <ArrowLeft weight="bold" className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase">
            ANALYSIS RESULT
          </h1>
          <p className="text-xs font-mono text-zinc-500">
            {input.origin} → {input.destination} | HS:{input.hs_code} | ${input.value?.toLocaleString()} | {input.carrier}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-1">
        {/* Left Column - Decision + Breakdown */}
        <div className="lg:col-span-5 space-y-1">
          <RiskDecisionCard result={result} />
          <RiskBreakdown breakdown={result.breakdown} />
        </div>

        {/* Right Column - Map + AI + Simulator */}
        <div className="lg:col-span-7 space-y-1">
          <MapView route={result.route} decisionColor={result.decision_color} />

          {/* AI Recommendation */}
          <div className="border border-zinc-200 bg-white" data-testid="ai-recommendation-section">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
              <span className="text-xs font-mono tracking-[0.2em] uppercase font-semibold text-zinc-500">
                AI ADVISOR — GEMINI
              </span>
              {!aiRec && (
                <button
                  onClick={fetchAIRecommendation}
                  disabled={aiLoading}
                  className="bg-zinc-950 text-white rounded-none font-bold uppercase tracking-widest text-[10px] px-4 py-2 hover:bg-zinc-800 transition-colors disabled:opacity-40 flex items-center gap-2"
                  data-testid="get-ai-recommendation-btn"
                >
                  {aiLoading ? (
                    <Spinner weight="bold" className="w-3 h-3 animate-spin" />
                  ) : (
                    <Robot weight="bold" className="w-3 h-3" />
                  )}
                  {aiLoading ? "ANALYZING..." : "GET RECOMMENDATION"}
                </button>
              )}
            </div>
            <div className="p-4">
              {aiRec ? (
                <div className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-zinc-700" data-testid="ai-recommendation-text">
                  {aiRec.recommendation}
                </div>
              ) : (
                <p className="text-xs font-mono text-zinc-400">
                  Click to get AI-powered analysis and actionable recommendations from Gemini.
                </p>
              )}
            </div>
          </div>

          {/* Scenario Simulator */}
          <ScenarioSimulator shipmentId={id} originalResult={result} />
        </div>
      </div>

      {/* Shipment Details Summary */}
      <div className="mt-1 border border-zinc-200 bg-white" data-testid="shipment-details">
        <div className="p-4 border-b border-zinc-200">
          <span className="text-xs font-mono tracking-[0.2em] uppercase font-semibold text-zinc-500">
            SHIPMENT INPUT SUMMARY
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 divide-x divide-y divide-zinc-200">
          {[
            { label: "HS CODE", value: input.hs_code },
            { label: "ORIGIN", value: input.origin },
            { label: "DESTINATION", value: input.destination },
            { label: "WEIGHT", value: `${input.weight?.toLocaleString()} kg` },
            { label: "VALUE", value: `$${input.value?.toLocaleString()}` },
            { label: "CARRIER", value: input.carrier?.replace(/_/g, " ") },
            { label: "PRIORITY", value: input.priority?.toUpperCase() },
          ].map((item) => (
            <div key={item.label} className="p-3">
              <span className="text-[10px] font-mono tracking-[0.2em] uppercase text-zinc-500 block mb-1">
                {item.label}
              </span>
              <span className="text-sm font-bold font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
