# Architecture

ORION Sentinel AI is a client-rendered single-page application organized into three cooperating layers. It has no server dependency: every data feed, agent behavior, and sensor reading is simulated deterministically at runtime, which keeps the product fully self-contained and offline-capable while preserving the architecture of a real planetary-intelligence system.

```
┌───────────────────────────────────────────────────────────────────┐
│                        UI SHELL  (React 19)                        │
│                                                                   │
│  TopBar · LayerPanel · LiveFeed · OrionPanel · EventDetail        │
│  UapModule · OceanModule · StatusBar · BootScreen                 │
├──────────────────────┬───────────────────────────────┬────────────┤
│       STATE          │     3D GLOBE (WebGL)          │ SIMULATION │
│  (Zustand store)     │  @react-three/fiber scene     │  (pure JS) │
│                      │                               │            │
│  layers · anomalies  │  Earth · Clouds · Atmosphere  │  engine    │
│  feed · selection    │  Satellites · Heat · Magnetic │  orionAI   │
│  tabs · boot state   │  Weather · FlightArcs · Grid  │  geo       │
│                      │  AnomalyMarkers · Stars       │  textures  │
└───────────┬──────────┴──────────────┬────────────────┴─────┬──────┘
            │                         │                      │
            │   subscription / dispatch (Zustand hooks)       │
            └─────────────────────────────────────────────────┘
```

## Layer responsibilities

### 1. State layer — `src/store.js`

A single [Zustand](https://github.com/pmndrs/zustand) store is the source of truth for everything that changes:

- **`layers`** — booleans controlling which globe layers render (satellites, clouds, weather, heat, magnetic field, grid, flight arcs).
- **`anomalies`** — the bounded list of active detections (capped at 120).
- **`feed`** — the streaming event log (capped at 200 entries) that drives the live panel.
- **`selectedId` / `activeTab`** — which anomaly is focused and which right-hand panel is open.
- **`oceanMode` / `scanning` / `scanSector` / `boot*`** — viewport and system state.

The store is deliberately UI-agnostic: the globe reads it with hooks, the panels read it with hooks, and the simulation engine writes to it imperatively via `useStore.getState()`.

### 2. Simulation layer — `src/core/`

Pure, framework-free modules that produce the "data":

| Module        | Responsibility                                                                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `geo.js`      | Geospatial math: lat/lon ↔ vector3 conversion, great-circle distance, region catalog.                                                              |
| `engine.js`   | The AI scanner. Builds structured anomaly objects (type templates, hypothesis sets, agent attribution, sources) and seeds the initial event grid.  |
| `orionAI.js`  | Command interpreter. Parses natural-language directives, orchestrates simulated agents, and returns structured replies with follow-up suggestions. |
| `textures.js` | Procedural texture synthesis — fBm noise, continent masks, day/night/bathymetry/cloud canvases. Generates all planet imagery at runtime.           |

These modules are unit-tested in isolation with Vitest (see `src/**/*.test.js`).

### 3. Globe layer — `src/globe/`

A `@react-three/fiber` scene graph. Each layer is an isolated component:

| Component                                   | Rendering                                                                                                                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Earth`                                     | Custom GLSL shader blending a day map, night-lights map, and terminator logic driven by a fixed sun direction. In ocean mode the day map is swapped for a bathymetric texture. |
| `Clouds`                                    | Translucent cloud sphere lit by the same sun vector.                                                                                                                           |
| `Atmosphere`                                | Fresnel glow shell (additive back-face shader); color shifts in ocean mode.                                                                                                    |
| `SatelliteLayer`                            | ~26 orbiting craft with fading trail lines.                                                                                                                                    |
| `HeatLayer` / `MarineLife`                  | GPU `Points` clouds with pulsing opacity.                                                                                                                                      |
| `MagneticField` / `ScanRings` / `GridLayer` | `LineSegments`/`Line` overlays.                                                                                                                                                |
| `WeatherLayer`                              | Billboarded cyclone sprites.                                                                                                                                                   |
| `FlightArcs`                                | Quadratic Bézier great-circle arcs with traveling dots.                                                                                                                        |
| `AnomalyMarkers`                            | Per-anomaly marker mesh + pulsing ring; the selected marker renders an HTML label.                                                                                             |

Every component subscribes directly to the store, so layer toggles and ocean mode update the scene without prop drilling.

## Rendering pipeline

1. On boot, `BootScreen` advances its own sequence and calls `setBoot(100)` when complete.
2. The app seeds 10 pre-placed anomalies and starts the scanner timer.
3. Each scanner tick constructs a new anomaly via `engine.spawnAnomaly()`, dispatches it into the store, and schedules the next tick on a randomized cadence (~1.5–4 s).
4. The store notifies subscribers: the globe adds a marker, the feed prepends an event, and the top-bar counters update.
5. The render loop (`useFrame`) animates rotations, trails, rings, and scan beams at 60 fps.

## Why a single state store?

The globe, the stream, and the panels must always agree. Centralizing state in one store:

- Eliminates prop-drilling across 14+ components.
- Guarantees the "event you clicked" is the "event on the globe."
- Makes the simulation engine a pure writer, easy to test and easy to swap for a real backend later.
- Keeps the 3D scene free of UI concern: components only read `layers` and `anomalies`.

## Extension points

- **Real data feeds:** replace `engine.spawnAnomaly()` with a WebSocket/polling client writing the same anomaly shape.
- **New globe layers:** add a component in `src/globe/`, register a key in `store.layers`, add a toggle row in `LayerPanel`.
- **New agent behaviors:** extend the `TYPES` catalog in `engine.js` and the command branches in `orionAI.js`.
- **Backend services:** the store's shape already mirrors a `{ feed, anomalies, command }` API, so a thin REST/GraphQL adapter slots in without UI changes.
