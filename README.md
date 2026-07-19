# NeuroCity

NeuroCity is an ultra-premium, cognitive urban infrastructure orchestration platform. It integrates computer vision analytics, traffic control systems, and energy grid telemetry into a single, high-fidelity dashboard.

## Project Architecture

The workspace is structured into three main directories:

- **`frontend/`**: The client interface built with **React**, **Vite**, and **Tailwind CSS v4**. It features high-fidelity visual assets, glassmorphic layout wrappers, and custom-animated inline SVG blueprints.
- **`backend-node/`**: Express.js server administering security protocols, platform configurations, database connectivity, and seed setups.
- **`backend-django/`**: Python Django backend executing predictive analysis, YOLOv8 computer vision models, and energy tracking algorithms.

---

## Completed Frontend Modules (Stage 1)

### 1. Unified Navigation Deck (`Navbar.jsx`)
- **Visual Design**: Sleek glassmorphic float bar with a neon cyan under-shadow.
- **SVG Branding**: Custom-kerned geometric `NeuroCity` signature featuring pulsing neural node filaments integrated into the letter `N` and a manually positioned diamond dot above the `I`.
- **Interactions**: Minimalist navigation command links with hover micro-dot indicators and a functional administrative dropdown panel.
- **Telemetry**: Real-time pulsing system status ping widget.

### 2. Traffic Analytics Header (`TrafficHero.jsx`)
- **Metrics Column**: Clean action copy, tagging badges, and quick-action buttons ("Launch Analyzer View" & "View Active Logs").
- **Radar Tracker Column**: A Sci-Fi Computer Vision HUD featuring:
  - Custom glowing L-bracket corner borders.
  - 3D isometric 4-way traffic crossroads junction map using high-precision dashed vector lines.
  - Pulsing target core center node and horizontal laser scanning sweeps.
  - Tactical bounding boxes simulating active object inference (Rickshaw targets, Priority Ambulance overrides with warning alerts).
  - Corner-stamped telemetry parameters (focus coordinates, stream nodes, and CUDA latency indexes).

---

## Development Setup

To launch the frontend locally for design reviews:

```bash
# Navigate to the frontend workspace
cd frontend

# Install Tailwind & configuration dependencies
npm install

# Run the local Vite dev server
npm run dev
```

The application will run at `http://localhost:5173/`.
