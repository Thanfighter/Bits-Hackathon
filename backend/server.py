from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# LLM setup
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Load mock data
DATA_DIR = ROOT_DIR / 'data'

def load_json(filename):
    with open(DATA_DIR / filename, 'r') as f:
        return json.load(f)

congestion_data = load_json('congestion.json')
tax_data = load_json('tax_rates.json')
weather_data = load_json('weather.json')
carrier_data = load_json('carrier_scores.json')
carbon_data = load_json('carbon_data.json')

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ---------- MODELS ----------

class ShipmentInput(BaseModel):
    hs_code: str
    origin: str
    destination: str
    weight: float
    value: float
    priority: str = "medium"
    carrier: str = "maersk"

class SimulationInput(BaseModel):
    shipment_id: str
    new_carrier: Optional[str] = None
    new_origin: Optional[str] = None
    new_destination: Optional[str] = None
    delay_days: Optional[int] = None

class AIRecommendInput(BaseModel):
    shipment_id: str
    question: Optional[str] = None

# ---------- RISK SCORING ENGINE ----------

def normalize(value, min_val=0, max_val=100):
    return max(0, min(100, (value - min_val) / (max_val - min_val) * 100))

def get_hs_category(hs_code: str) -> str:
    try:
        chapter = int(hs_code[:2])
    except (ValueError, IndexError):
        return "84-85"
    
    categories = {
        (1,5): "01-05", (6,14): "06-14", (15,15): "15", (16,24): "16-24",
        (25,27): "25-27", (28,38): "28-38", (39,40): "39-40", (41,43): "41-43",
        (44,46): "44-46", (47,49): "47-49", (50,63): "50-63", (64,67): "64-67",
        (68,70): "68-70", (71,71): "71", (72,83): "72-83", (84,85): "84-85",
        (86,89): "86-89", (90,92): "90-92", (93,93): "93", (94,96): "94-96"
    }
    for (lo, hi), cat in categories.items():
        if lo <= chapter <= hi:
            return cat
    return "94-96"

def get_port_for_country(country: str) -> str:
    country_key = country.lower().replace(' ', '_')
    return congestion_data['country_to_port'].get(country_key, 'singapore')

def calc_congestion_score(origin: str, destination: str) -> dict:
    origin_port = get_port_for_country(origin)
    dest_port = get_port_for_country(destination)
    origin_data = congestion_data['ports'].get(origin_port, {"score": 50})
    dest_data = congestion_data['ports'].get(dest_port, {"score": 50})
    avg_score = (origin_data['score'] + dest_data['score']) / 2
    return {
        "score": round(avg_score, 1),
        "origin_port": origin_port,
        "dest_port": dest_port,
        "origin_delay": origin_data.get('avg_delay_days', 2),
        "dest_delay": dest_data.get('avg_delay_days', 2),
        "origin_coords": [origin_data.get('lat', 0), origin_data.get('lng', 0)],
        "dest_coords": [dest_data.get('lat', 0), dest_data.get('lng', 0)]
    }

def calc_tax_score(hs_code: str, origin: str, destination: str, value: float) -> dict:
    hs_cat = get_hs_category(hs_code)
    cat_info = tax_data['hs_categories'].get(hs_cat, {"base_tariff": 10, "cbam_applicable": False})
    origin_key = origin.lower().replace(' ', '_')
    dest_key = destination.lower().replace(' ', '_')
    origin_mod = tax_data['country_modifiers'].get(origin_key, {"tariff_modifier": 1.0, "sanctions_risk": 5})
    dest_mod = tax_data['country_modifiers'].get(dest_key, {"tariff_modifier": 1.0, "sanctions_risk": 5})
    
    effective_tariff = cat_info['base_tariff'] * origin_mod['tariff_modifier']
    tax_amount = value * effective_tariff / 100
    sanctions_risk = max(origin_mod.get('sanctions_risk', 0), dest_mod.get('sanctions_risk', 0))
    score = min(100, effective_tariff * 2.5 + sanctions_risk)
    
    return {
        "score": round(score, 1),
        "effective_tariff_pct": round(effective_tariff, 1),
        "estimated_tax": round(tax_amount, 2),
        "cbam_applicable": cat_info['cbam_applicable'],
        "sanctions_risk": sanctions_risk,
        "trade_agreement": origin_mod.get('trade_agreement', False) or dest_mod.get('trade_agreement', False),
        "hs_category": cat_info['name']
    }

def calc_weather_score(origin: str, destination: str) -> dict:
    origin_port = get_port_for_country(origin)
    dest_port = get_port_for_country(destination)
    route_key = f"{origin_port}_{dest_port}"
    reverse_key = f"{dest_port}_{origin_port}"
    
    regions = weather_data['route_regions'].get(route_key, 
              weather_data['route_regions'].get(reverse_key, ["indian_ocean"]))
    
    storm_risks = []
    for region in regions:
        region_data = weather_data['regions'].get(region, {"storm_risk": 30})
        storm_risks.append(region_data['storm_risk'])
    
    max_risk = max(storm_risks) if storm_risks else 30
    avg_risk = sum(storm_risks) / len(storm_risks) if storm_risks else 30
    score = (max_risk * 0.6 + avg_risk * 0.4)
    
    return {
        "score": round(score, 1),
        "regions": regions,
        "max_storm_risk": max_risk,
        "risk_zones": len([r for r in storm_risks if r > 50])
    }

def calc_carrier_score(carrier: str) -> dict:
    carrier_key = carrier.lower().replace(' ', '_').replace('-', '_')
    info = carrier_data['carriers'].get(carrier_key, carrier_data['carriers']['regional_standard'])
    score = 100 - info['reliability']
    return {
        "score": round(score, 1),
        "reliability": info['reliability'],
        "avg_transit_days": info['avg_transit_days'],
        "insurance_rating": info['insurance_rating'],
        "fleet_age": info['fleet_age']
    }

def calc_carbon_score(hs_code: str, origin: str, destination: str, weight: float) -> dict:
    hs_cat = get_hs_category(hs_code)
    intensity = carbon_data['carbon_intensity'].get(hs_cat, 30)
    
    origin_port = get_port_for_country(origin)
    dest_port = get_port_for_country(destination)
    route_key = f"{origin_port}_{dest_port}"
    reverse_key = f"{dest_port}_{origin_port}"
    distance = carbon_data['route_distance_nm'].get(route_key,
               carbon_data['route_distance_nm'].get(reverse_key, 5000))
    
    co2_tons = (weight / 1000) * (distance / 1000) * (intensity / 100) * 0.015
    
    dest_key = destination.lower().replace(' ', '_')
    cbam_region = carbon_data['destination_cbam_region'].get(dest_key, 'default')
    cbam_info = carbon_data['cbam_rates'].get(cbam_region, carbon_data['cbam_rates']['default'])
    cbam_cost = co2_tons * cbam_info['rate_per_ton_co2']
    
    score = min(100, intensity * 0.6 + (distance / 200) + (cbam_cost / 50))
    
    return {
        "score": round(score, 1),
        "co2_tons": round(co2_tons, 2),
        "cbam_cost": round(cbam_cost, 2),
        "distance_nm": distance,
        "carbon_intensity": intensity,
        "cbam_region": cbam_region
    }

def calculate_risk(shipment: ShipmentInput) -> dict:
    congestion = calc_congestion_score(shipment.origin, shipment.destination)
    tax = calc_tax_score(shipment.hs_code, shipment.origin, shipment.destination, shipment.value)
    weather = calc_weather_score(shipment.origin, shipment.destination)
    carrier = calc_carrier_score(shipment.carrier)
    carbon = calc_carbon_score(shipment.hs_code, shipment.origin, shipment.destination, shipment.weight)
    
    risk_score = (
        0.30 * congestion['score'] +
        0.25 * tax['score'] +
        0.20 * weather['score'] +
        0.15 * carrier['score'] +
        0.10 * carbon['score']
    )
    risk_score = round(risk_score, 1)
    
    if risk_score <= 40:
        decision = "PROCEED"
        decision_color = "green"
    elif risk_score <= 70:
        decision = "CAUTION"
        decision_color = "yellow"
    else:
        decision = "BLOCK"
        decision_color = "red"
    
    confidence = round(max(60, 95 - abs(risk_score - 55) * 0.5), 1)
    
    tags = []
    if congestion['score'] > 50:
        tags.append("congestion")
    if tax['score'] > 50:
        tags.append("tax")
    if weather['score'] > 50:
        tags.append("weather")
    if carrier['score'] > 30:
        tags.append("carrier")
    if carbon['score'] > 50:
        tags.append("carbon")
    
    return {
        "risk_score": risk_score,
        "decision": decision,
        "decision_color": decision_color,
        "confidence": confidence,
        "tags": tags,
        "breakdown": {
            "congestion": congestion,
            "tax": tax,
            "weather": weather,
            "carrier": carrier,
            "carbon": carbon
        },
        "route": {
            "origin_coords": congestion['origin_coords'],
            "dest_coords": congestion['dest_coords'],
            "origin_port": congestion['origin_port'],
            "dest_port": congestion['dest_port']
        }
    }

# ---------- ROUTES ----------

@api_router.get("/")
async def root():
    return {"message": "TradeIQ Sentinel 3.0 API"}

@api_router.post("/shipments/analyze")
async def analyze_shipment(shipment: ShipmentInput):
    result = calculate_risk(shipment)
    
    shipment_id = str(uuid.uuid4())
    doc = {
        "id": shipment_id,
        "input": shipment.model_dump(),
        "result": result,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "analyzed"
    }
    await db.shipments.insert_one(doc)
    
    return {
        "id": shipment_id,
        "input": shipment.model_dump(),
        "result": result,
        "created_at": doc['created_at']
    }

@api_router.post("/shipments/simulate")
async def simulate_shipment(sim: SimulationInput):
    shipment_doc = await db.shipments.find_one({"id": sim.shipment_id}, {"_id": 0})
    if not shipment_doc:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    original_input = shipment_doc['input']
    sim_input = ShipmentInput(
        hs_code=original_input['hs_code'],
        origin=sim.new_origin or original_input['origin'],
        destination=sim.new_destination or original_input['destination'],
        weight=original_input['weight'],
        value=original_input['value'],
        priority=original_input['priority'],
        carrier=sim.new_carrier or original_input['carrier']
    )
    
    new_result = calculate_risk(sim_input)
    original_result = shipment_doc['result']
    
    return {
        "original": {
            "score": original_result['risk_score'],
            "decision": original_result['decision']
        },
        "simulated": {
            "score": new_result['risk_score'],
            "decision": new_result['decision'],
            "decision_color": new_result['decision_color'],
            "confidence": new_result['confidence'],
            "breakdown": new_result['breakdown'],
            "route": new_result['route'],
            "tags": new_result['tags']
        },
        "delta": round(new_result['risk_score'] - original_result['risk_score'], 1),
        "input_changes": {
            "carrier": sim.new_carrier,
            "origin": sim.new_origin,
            "destination": sim.new_destination,
            "delay_days": sim.delay_days
        }
    }

@api_router.get("/shipments/history")
async def get_shipment_history():
    shipments = await db.shipments.find({}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return shipments

@api_router.get("/shipments/{shipment_id}")
async def get_shipment(shipment_id: str):
    shipment = await db.shipments.find_one({"id": shipment_id}, {"_id": 0})
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    return shipment

@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    total = await db.shipments.count_documents({})
    pipeline = [
        {"$group": {
            "_id": "$result.decision",
            "count": {"$sum": 1}
        }}
    ]
    decision_counts = await db.shipments.aggregate(pipeline).to_list(10)
    
    decisions = {"PROCEED": 0, "CAUTION": 0, "BLOCK": 0}
    for d in decision_counts:
        decisions[d['_id']] = d['count']
    
    recent = await db.shipments.find({}, {"_id": 0}).sort("created_at", -1).to_list(5)
    
    avg_pipeline = [
        {"$group": {
            "_id": None,
            "avg_score": {"$avg": "$result.risk_score"}
        }}
    ]
    avg_result = await db.shipments.aggregate(avg_pipeline).to_list(1)
    avg_score = round(avg_result[0]['avg_score'], 1) if avg_result else 0
    
    return {
        "total_shipments": total,
        "decisions": decisions,
        "avg_risk_score": avg_score,
        "recent_shipments": recent
    }

@api_router.post("/ai/recommend")
async def get_ai_recommendation(req: AIRecommendInput):
    shipment = await db.shipments.find_one({"id": req.shipment_id}, {"_id": 0})
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")
    
    result = shipment['result']
    inp = shipment['input']
    breakdown = result['breakdown']
    
    prompt = f"""You are a trade logistics expert advisor for TradeIQ Sentinel. Analyze this shipment and provide a concise, actionable recommendation.

Shipment Details:
- HS Code: {inp['hs_code']} ({breakdown['tax']['hs_category']})
- Route: {inp['origin']} → {inp['destination']}
- Value: ${inp['value']:,.2f} | Weight: {inp['weight']}kg
- Carrier: {inp['carrier']}
- Priority: {inp['priority']}

Risk Analysis:
- Overall Score: {result['risk_score']}/100 → Decision: {result['decision']}
- Congestion: {breakdown['congestion']['score']}/100 (Origin delay: {breakdown['congestion']['origin_delay']}d, Dest delay: {breakdown['congestion']['dest_delay']}d)
- Tax & Compliance: {breakdown['tax']['score']}/100 (Tariff: {breakdown['tax']['effective_tariff_pct']}%, Est. Tax: ${breakdown['tax']['estimated_tax']:,.2f})
- Weather: {breakdown['weather']['score']}/100 (Regions: {', '.join(breakdown['weather']['regions'])})
- Carrier Risk: {breakdown['carrier']['score']}/100 (Reliability: {breakdown['carrier']['reliability']}%)
- Carbon/ESG: {breakdown['carbon']['score']}/100 (CO2: {breakdown['carbon']['co2_tons']}t, CBAM cost: ${breakdown['carbon']['cbam_cost']:,.2f})

{f"User question: {req.question}" if req.question else ""}

Provide:
1. A 2-sentence executive summary
2. Top 3 actionable recommendations (numbered)
3. Estimated cost impact if recommendations are followed
4. One alternative route suggestion if applicable

Keep it sharp, specific, and under 200 words. No fluff."""

    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"sentinel_{req.shipment_id}_{uuid.uuid4().hex[:8]}",
            system_message="You are TradeIQ Sentinel's AI advisor. Give sharp, data-driven trade logistics advice. Be concise and actionable."
        )
        chat.with_model("gemini", "gemini-3-flash-preview")
        
        user_msg = UserMessage(text=prompt)
        response = await chat.send_message(user_msg)
        
        return {
            "recommendation": response,
            "shipment_id": req.shipment_id,
            "model": "gemini-3-flash"
        }
    except Exception as e:
        logger.error(f"AI recommendation error: {e}")
        return {
            "recommendation": generate_fallback_recommendation(result, inp),
            "shipment_id": req.shipment_id,
            "model": "fallback"
        }

def generate_fallback_recommendation(result, inp):
    decision = result['decision']
    score = result['risk_score']
    breakdown = result['breakdown']
    
    recs = []
    if breakdown['congestion']['score'] > 50:
        recs.append(f"Port congestion is high. Consider delaying shipment by {breakdown['congestion']['origin_delay']}+ days or using an alternate port.")
    if breakdown['tax']['score'] > 50:
        recs.append(f"Tax burden is significant at {breakdown['tax']['effective_tariff_pct']}%. Check for trade agreements or tariff exemptions.")
    if breakdown['weather']['score'] > 50:
        recs.append(f"Weather risk is elevated with {breakdown['weather']['risk_zones']} high-risk zone(s). Consider seasonal timing adjustment.")
    if breakdown['carrier']['score'] > 30:
        recs.append(f"Current carrier reliability is {breakdown['carrier']['reliability']}%. Consider switching to a higher-rated carrier.")
    if breakdown['carbon']['cbam_cost'] > 100:
        recs.append(f"CBAM costs of ${breakdown['carbon']['cbam_cost']:,.2f} detected. Evaluate lower-carbon shipping options.")
    
    if not recs:
        recs.append("All risk factors within acceptable range. Proceed with current configuration.")
    
    return f"Risk Score: {score}/100 — {decision}.\n\nRecommendations:\n" + "\n".join(f"{i+1}. {r}" for i, r in enumerate(recs[:3]))

@api_router.get("/reference/countries")
async def get_countries():
    countries = sorted(list(set(
        list(congestion_data['country_to_port'].keys()) +
        list(tax_data['country_modifiers'].keys())
    )))
    return [c.replace('_', ' ').title() for c in countries]

@api_router.get("/reference/carriers")
async def get_carriers():
    return [{"id": k, "name": k.replace('_', ' ').title(), "reliability": v['reliability']} 
            for k, v in carrier_data['carriers'].items()]

@api_router.get("/finance/simulate")
async def finance_simulate():
    shipments = await db.shipments.find({}, {"_id": 0}).sort("created_at", -1).to_list(10)
    
    total_value = sum(s['input']['value'] for s in shipments) if shipments else 0
    total_tax = sum(s['result']['breakdown']['tax']['estimated_tax'] for s in shipments) if shipments else 0
    total_cbam = sum(s['result']['breakdown']['carbon']['cbam_cost'] for s in shipments) if shipments else 0
    blocked = [s for s in shipments if s['result']['decision'] == 'BLOCK']
    saved_value = sum(s['input']['value'] for s in blocked)
    
    escrow_items = []
    for s in shipments[:5]:
        escrow_items.append({
            "id": s['id'][:8],
            "origin": s['input']['origin'],
            "destination": s['input']['destination'],
            "value": s['input']['value'],
            "status": "locked" if s['result']['decision'] == "PROCEED" else "held",
            "release_condition": "On delivery confirmation" if s['result']['decision'] == "PROCEED" else "Pending risk resolution"
        })
    
    return {
        "summary": {
            "total_shipment_value": round(total_value, 2),
            "total_tax_liability": round(total_tax, 2),
            "total_cbam_cost": round(total_cbam, 2),
            "potential_loss_prevented": round(saved_value, 2),
            "escrow_locked": round(total_value * 0.15, 2)
        },
        "escrow_items": escrow_items
    }

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
