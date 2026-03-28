import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { ArrowRight, Package } from "@phosphor-icons/react";
import LoadingIntelligence from "../components/LoadingIntelligence";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const COUNTRIES = [
  "China", "India", "USA", "Germany", "UK", "Japan", "Singapore", "Netherlands",
  "UAE", "South Korea", "Vietnam", "Brazil", "South Africa", "Kenya", "Turkey",
  "Australia", "Mexico", "Saudi Arabia", "Belgium", "France",
];

const CARRIERS = [
  { id: "maersk", name: "Maersk", reliability: 88 },
  { id: "msc", name: "MSC", reliability: 82 },
  { id: "cma_cgm", name: "CMA CGM", reliability: 85 },
  { id: "cosco", name: "COSCO", reliability: 78 },
  { id: "hapag_lloyd", name: "Hapag-Lloyd", reliability: 86 },
  { id: "evergreen", name: "Evergreen", reliability: 80 },
  { id: "one", name: "ONE", reliability: 75 },
  { id: "yang_ming", name: "Yang Ming", reliability: 72 },
  { id: "zim", name: "ZIM", reliability: 76 },
];

const PRIORITIES = [
  { id: "low", label: "Low — Flexible timing" },
  { id: "medium", label: "Medium — Standard delivery" },
  { id: "high", label: "High — Urgent shipment" },
];

export default function NewShipment() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    hs_code: "",
    origin: "",
    destination: "",
    weight: "",
    value: "",
    priority: "medium",
    carrier: "maersk",
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.hs_code || form.hs_code.length < 2) errs.hs_code = "Enter valid HS code (min 2 digits)";
    if (!form.origin) errs.origin = "Select origin country";
    if (!form.destination) errs.destination = "Select destination country";
    if (form.origin && form.destination && form.origin === form.destination) errs.destination = "Must differ from origin";
    if (!form.weight || parseFloat(form.weight) <= 0) errs.weight = "Enter valid weight";
    if (!form.value || parseFloat(form.value) <= 0) errs.value = "Enter valid value";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setAnalyzing(true);
    try {
      const payload = {
        ...form,
        weight: parseFloat(form.weight),
        value: parseFloat(form.value),
      };
      const res = await axios.post(`${API}/shipments/analyze`, payload);
      // Store result, show loading animation then navigate
      sessionStorage.setItem("lastAnalysis", JSON.stringify(res.data));
      // LoadingIntelligence will call onComplete which navigates
    } catch (e) {
      console.error("Analysis error:", e);
      setAnalyzing(false);
    }
  };

  const handleAnalysisComplete = () => {
    const data = JSON.parse(sessionStorage.getItem("lastAnalysis"));
    if (data?.id) {
      navigate(`/result/${data.id}`);
    }
  };

  if (analyzing) {
    return <LoadingIntelligence onComplete={handleAnalysisComplete} />;
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl" data-testid="new-shipment-page">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase" data-testid="new-shipment-title">
          NEW SHIPMENT
        </h1>
        <p className="text-sm text-zinc-500 mt-1 font-mono">
          Enter shipment details for pre-shipment risk analysis
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-1" data-testid="shipment-form">
        {/* HS Code */}
        <div className="border border-zinc-200 bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <Package weight="bold" className="w-4 h-4 text-zinc-600" />
            <Label className="text-xs font-mono tracking-[0.2em] uppercase font-semibold text-zinc-500">
              HS CODE
            </Label>
          </div>
          <Input
            type="text"
            placeholder="e.g., 8471 (Machinery), 6109 (Textiles)"
            value={form.hs_code}
            onChange={(e) => setForm({ ...form, hs_code: e.target.value })}
            className="rounded-none border-zinc-200 font-mono text-sm h-11"
            data-testid="input-hs-code"
          />
          {errors.hs_code && <p className="text-xs text-[#FF3B30] mt-1 font-mono">{errors.hs_code}</p>}
        </div>

        {/* Origin / Destination */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          <div className="border border-zinc-200 bg-white p-4">
            <Label className="text-xs font-mono tracking-[0.2em] uppercase font-semibold text-zinc-500 block mb-3">
              ORIGIN COUNTRY
            </Label>
            <Select value={form.origin} onValueChange={(v) => setForm({ ...form, origin: v })}>
              <SelectTrigger className="rounded-none border-zinc-200 font-mono text-sm h-11" data-testid="select-origin">
                <SelectValue placeholder="Select origin" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c} className="font-mono text-sm">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.origin && <p className="text-xs text-[#FF3B30] mt-1 font-mono">{errors.origin}</p>}
          </div>

          <div className="border border-zinc-200 bg-white p-4">
            <Label className="text-xs font-mono tracking-[0.2em] uppercase font-semibold text-zinc-500 block mb-3">
              DESTINATION COUNTRY
            </Label>
            <Select value={form.destination} onValueChange={(v) => setForm({ ...form, destination: v })}>
              <SelectTrigger className="rounded-none border-zinc-200 font-mono text-sm h-11" data-testid="select-destination">
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c} className="font-mono text-sm">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.destination && <p className="text-xs text-[#FF3B30] mt-1 font-mono">{errors.destination}</p>}
          </div>
        </div>

        {/* Weight / Value */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          <div className="border border-zinc-200 bg-white p-4">
            <Label className="text-xs font-mono tracking-[0.2em] uppercase font-semibold text-zinc-500 block mb-3">
              WEIGHT (KG)
            </Label>
            <Input
              type="number"
              placeholder="e.g., 5000"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              className="rounded-none border-zinc-200 font-mono text-sm h-11"
              data-testid="input-weight"
            />
            {errors.weight && <p className="text-xs text-[#FF3B30] mt-1 font-mono">{errors.weight}</p>}
          </div>

          <div className="border border-zinc-200 bg-white p-4">
            <Label className="text-xs font-mono tracking-[0.2em] uppercase font-semibold text-zinc-500 block mb-3">
              SHIPMENT VALUE (USD)
            </Label>
            <Input
              type="number"
              placeholder="e.g., 250000"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: e.target.value })}
              className="rounded-none border-zinc-200 font-mono text-sm h-11"
              data-testid="input-value"
            />
            {errors.value && <p className="text-xs text-[#FF3B30] mt-1 font-mono">{errors.value}</p>}
          </div>
        </div>

        {/* Carrier / Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          <div className="border border-zinc-200 bg-white p-4">
            <Label className="text-xs font-mono tracking-[0.2em] uppercase font-semibold text-zinc-500 block mb-3">
              CARRIER
            </Label>
            <Select value={form.carrier} onValueChange={(v) => setForm({ ...form, carrier: v })}>
              <SelectTrigger className="rounded-none border-zinc-200 font-mono text-sm h-11" data-testid="select-carrier">
                <SelectValue placeholder="Select carrier" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {CARRIERS.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="font-mono text-sm">
                    {c.name} ({c.reliability}% reliable)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border border-zinc-200 bg-white p-4">
            <Label className="text-xs font-mono tracking-[0.2em] uppercase font-semibold text-zinc-500 block mb-3">
              PRIORITY
            </Label>
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
              <SelectTrigger className="rounded-none border-zinc-200 font-mono text-sm h-11" data-testid="select-priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent className="rounded-none">
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="font-mono text-sm">
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4">
          <button
            type="submit"
            className="bg-zinc-950 text-white rounded-none font-bold uppercase tracking-widest text-xs px-8 py-4 hover:bg-zinc-800 transition-colors flex items-center gap-3 w-full md:w-auto justify-center"
            data-testid="shipment-form-submit"
          >
            ANALYZE SHIPMENT RISK
            <ArrowRight weight="bold" className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
