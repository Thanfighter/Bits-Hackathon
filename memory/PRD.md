# TradeIQ Sentinel 3.0 — PRD

## Problem Statement
Pre-shipment decision engine for SME exporters. Transforms complex logistics, taxes, and risks into simple GO/NO-GO traffic light decisions (Proceed/Caution/Block).

## Architecture
- **Frontend**: React + Tailwind + Shadcn UI + Leaflet + Framer Motion + Phosphor Icons
- **Backend**: FastAPI + MongoDB + Gemini 3 Flash (Emergent LLM key)
- **Design**: Swiss Brutalist, Light mode, monochrome + traffic light colors only

## User Personas
1. **SME Exporter** ($10K-$5M shipments) — Needs quick risk assessment
2. **First-time Exporter** — Needs guidance on trade risks
3. **Logistics Manager** — Needs data-driven route/carrier decisions

## Core Requirements
- Risk scoring engine: 0.30*congestion + 0.25*tax + 0.20*weather + 0.15*carrier + 0.10*carbon
- Decision thresholds: 0-40 GREEN, 40-70 YELLOW, 70-100 RED
- Scenario simulation (what-if engine)
- Route visualization on map
- AI-powered recommendations via Gemini 3 Flash
- Decision memory (MongoDB)
- Finance/escrow simulation (conceptual)

## What's Been Implemented (March 28, 2026)
### Backend (100% working)
- POST /api/shipments/analyze — Multi-factor risk scoring engine
- POST /api/shipments/simulate — Scenario simulator
- GET /api/shipments/history — Decision memory
- GET /api/shipments/{id} — Individual shipment retrieval
- GET /api/dashboard/stats — Dashboard statistics
- POST /api/ai/recommend — Gemini 3 Flash AI recommendations
- GET /api/finance/simulate — Smart escrow simulation
- GET /api/reference/countries — Country list
- GET /api/reference/carriers — Carrier list
- Mock data: congestion, tax, weather, carrier, carbon (5 JSON files)

### Frontend (95% working)
- Dashboard with stats overview
- New Shipment form with validation
- Loading intelligence animation (terminal-style)
- Risk decision card with traffic light
- Risk breakdown cards (5 factors)
- Leaflet map with grayscale tiles + colored routes
- AI recommendation panel (Gemini)
- Scenario simulator (change carrier/origin/destination)
- Decision memory/history page with filters
- Finance layer with escrow simulation

## Prioritized Backlog
### P0 — Done
- [x] Risk scoring engine
- [x] Shipment form & analysis flow
- [x] Decision output with map

### P1 — Next
- [ ] More countries/ports/routes data
- [ ] Date/delay factor in scenario simulator
- [ ] Real-time weather API integration
- [ ] Export analysis as PDF

### P2 — Future
- [ ] Multi-user support with auth
- [ ] Email alerts for high-risk shipments
- [ ] Historical trend charts
- [ ] DP World API integration
- [ ] Mobile-responsive refinement
