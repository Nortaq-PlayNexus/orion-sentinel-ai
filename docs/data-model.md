# Data Model

This document describes the structured data flowing through ORION Sentinel AI: the anomaly object, the store shape, and the event lifecycle.

## The anomaly object

Every detection produced by `engine.spawnAnomaly()` adheres to the following shape:

```js
{
  id: 'ORION-0042',            // unique, monotonic identifier
  type: 'OCEAN_FLOOR',         // one of the TYPE keys below
  category: 'ocean',           // 'land' | 'ocean' | 'atmos'
  color: '#4cc9f0',            // UI accent derived from type
  lat: 11.35,                  // latitude, -90..90
  lon: 142.2,                  // longitude, -180..180
  region: 'the Philippine Sea',// human-readable region label
  confidence: 91,              // 0..100 — probability-weighted, never certainty
  severity: 0.74,              // 0..1 — impact/novelty estimate
  headline: 'Ocean floor abnormality mapped in ...',
  description: 'Multispectral ...',
  explanations: [              // competing hypotheses with weights (sum ≈ 1)
    { label: 'Submarine landslide deposit', p: 0.38 },
    { label: 'Unmapped seamount', p: 0.27 },
    { label: 'Cabled infrastructure route', p: 0.18 },
    { label: 'Sonar processing artifact', p: 0.17 },
  ],
  agents: ['Ocean Research Agent', 'Wildlife Agent', 'Verification Agent'],
  sources: ['Sentinel-2A', 'ICESat-2', 'EMODnet Bathymetry'],
  timeDetected: '2026-07-31T20:14:32.000Z',  // ISO 8601 UTC
  status: 'new',               // 'new' | 'under_review' | 'verified' | 'debunked'
  vector: null,                // Vector3 (atmos only) — orbital offset for UAP tracks
  speed: null,                 // km/h (atmos only)
  altitude: null,              // km (atmos only)
}
```

### Type catalog

| `type`                | `category` | Meaning                                         |
| --------------------- | ---------- | ----------------------------------------------- |
| `GEOMETRIC_FORMATION` | land       | Unusual grid-like or angular landform           |
| `THERMAL_SIGNATURE`   | land       | Sustained heat source without a matching record |
| `RAPID_CHANGE`        | land       | Abrupt land-cover / phenology change            |
| `UNKNOWN_STRUCTURE`   | land       | Construction not present in any database        |
| `OCEAN_FLOOR`         | ocean      | Bathymetric abnormality on the seafloor         |
| `WILDLIFE_MIGRATION`  | ocean      | Anomalous marine biomass aggregation            |
| `ATMOSPHERIC_UAP`     | atmos      | Unidentified aerial phenomenon track            |

### Design rules

- **No certainty claims.** `confidence` is always < 100 and the `explanations` array always carries at least one alternative hypothesis.
- **Attribution.** Every event names the agent cores that produced it and the data sources used, so the reasoning is auditable.
- **Deterministic-ish seeds.** The initial grid is fixed to ten named locations (Mariana Trench, Bermuda Triangle, South China Sea, …) so the first-run experience is consistent.

## Store shape (`src/store.js`)

```js
{
  booted: boolean,
  bootProgress: number,

  layers: {                      // visual layer toggles
    satellites, clouds, weather, heat, magnetic, grid, flight,
  },
  satellite: boolean,            // stream real satellite imagery (Esri World Imagery)
  oceanMode: boolean,
  scanning: boolean,
  scanSector: string,

  anomalies: Anomaly[],          // newest-first, capped at 120
  feed: FeedEntry[],             // newest-first, capped at 200
  selectedId: string | null,
  activeTab: 'ai' | 'event' | 'uap' | 'ocean',
}
```

A `FeedEntry` is the denormalized log view used by the live panel:

```js
{
  id: 'ORION-0042',
  ts: '2026-07-31T20:14:32.000Z',
  label: 'Ocean floor abnormality mapped in ...',
  type: 'OCEAN_FLOOR',
  confidence: 91,
  lat: 11.35,
  lon: 142.2,
}
```

## Event lifecycle

1. **Spawn** — the scanner builds an anomaly with `status: 'new'` and dispatches `addAnomaly()`.
2. **Render** — the globe instantiates a marker; the feed prepends an entry; counters update.
3. **Select** — clicking a marker or feed entry sets `selectedId` and switches `activeTab` to `event`.
4. **Analyze** — module tabs (`uap`, `ocean`) render purpose-built analysis for the selected event.
5. **Retire** — the anomaly naturally falls off the 120-event cap; `status` transitions are reserved for a future verification workflow.

## Bounds and invariants

| Invariant                   | Enforcement                              |
| --------------------------- | ---------------------------------------- |
| `anomalies.length ≤ 120`    | `addAnomaly()` slices the array          |
| `feed.length ≤ 200`         | `addAnomaly()` slices the array          |
| `id` uniqueness             | monotonic `ORION-NNNN` counter           |
| Coord ranges                | `lat ∈ [-90, 90]`, `lon ∈ [-180, 180]`   |
| `explanations` non-empty    | template catalog guarantees ≥ 4 entries  |
| Tab ↔ selection consistency | `selectAnomaly()` co-updates `activeTab` |

> Unit tests in `src/store.test.js` and `src/core/engine.test.js` lock these invariants down.
