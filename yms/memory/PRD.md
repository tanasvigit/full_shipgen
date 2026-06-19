# YARD.OS — Vehicle Orchestration Platform (YMS)

## Original Problem Statement
Build a frontend-only Yard Management System web app for large manufacturing plants, warehouses, ports, logistics parks, etc. Manages full lifecycle of company, contract, and outside vehicles from pre-arrival to exit. UI styled like Fleetbase/ShipGen. Uses static JSON data — no backend.

## Architecture
- React 19 + React Router v7
- Tailwind + Shadcn UI components
- Recharts for charts
- Lucide icons
- Static data from `/src/data/db.js`
- No backend, no API calls, no authentication
- Fonts: Chivo (display), IBM Plex Sans (body), IBM Plex Mono (numbers)
- Theme: Light surfaces + dark slate-900 sidebar; amber-400 accent

## User Personas
- **Yard Controller** — primary user; uses Control Tower, queue, gate
- **Gate Security** — uses Gate Management module
- **Operations Manager** — reviews Docks, Loading Ops, Equipment, Labor
- **Finance Manager** — tracks Detention costs, KPIs
- **Executive** — uses Executive KPIs & AI Insights

## Core Requirements (delivered v1)
- Control Tower Dashboard (12 KPIs, throughput chart, vehicle mix, priority queue, live events, zone occupancy, detention chart, dock summary, AI strip)
- Appointments — slot timeline grid + tabular list
- Gate Management — QR scanner, validation panel, vehicle details, incoming list
- Virtual Queue — dynamic priority scoring, formula card, queue table
- Yard Map — interactive 2D overhead with zones A–F, vehicle dots, dock column, gate markers
- Docks — card grid with status, progress, equipment, labor, utilization
- Vehicles — fleet master with category filters (Company/Contract/Outside)
- Loading Ops — active operations tracker with exceptions
- Detention — formula card, breakdown chart, records table
- Equipment — Forklifts/Cranes/Reach Stackers cards with battery & location
- Labor — Team-wise availability & utilization
- AI Insights — Hero + 4 module cards (Slot Optimizer, Delay Predictor, Vehicle Allocator, Cost Optimizer) + insight cards with apply/dismiss
- Executive KPIs — scorecard + TAT trend + occupancy trend

## What's been implemented (Feb 2026)
- All 13 pages with full sidebar nav
- Rich mock data: 60 vehicles, 28 appointments, 16 docks, 6 zones, 8 equipment, 6 labor teams, 18 detention records, 5 AI insights
- Live clock in TopBar (IST)
- INR currency formatting (Lakh/Crore short forms)
- Indian vehicle plate formats (MH12AB1234)
- All interactive elements have `data-testid`

## Prioritized backlog
- **P1**: Vehicle detail drawer with full timeline; appointment booking modal flow
- **P1**: Export to CSV/PDF for tables; print-friendly Executive KPI report
- **P2**: Real backend (FastAPI + MongoDB) with auth
- **P2**: Drag-and-drop in Virtual Queue
- **P2**: Search bar functionality (currently visual only)
- **P2**: Real-time WebSocket simulator for live event feed
- **P3**: Mobile responsive views
- **P3**: Dark mode toggle for night-shift operators

## Next tasks
- Awaiting user feedback after v1 review
