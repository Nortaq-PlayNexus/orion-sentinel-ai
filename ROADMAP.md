# Roadmap

ORION Sentinel AI is a continuously evolving platform. This roadmap is a
**directional** plan, not a commitment — priorities shift with community
feedback and operational reality. Items are grouped by theme.

## Now

- [x] Cinematic 3D Earth with procedural day/night, clouds, atmosphere, stars
- [x] Simulated multi-agent AI scanning engine with confidence-weighted events
- [x] Ocean intelligence module (bathymetry, marine biomass, pressure zones)
- [x] UAP / atmospheric trajectory analysis
- [x] ORION AI natural-language assistant with voice input
- [x] Enterprise repo foundation: CI/CD, Docker, tests, docs, branding

## Next

- **Verification workflow** — event lifecycle (`new → under_review →
verified/debunked`) with per-status styling and audit trail.
- **Historic time-travel** — scrub a date slider and replay region imagery
  through the procedural texture generator for true change detection.
- **Multi-region simultaneous sweeps** — parallel sector scans with a global
  coverage heatmap.
- **Real data adapters** — pluggable ingestion for live feeds (AIS, weather
  buoy, satellite TLE), behind the existing store shape.
- **Local persistence** — export/import of investigation sessions (JSON).

## Later

- **Backend service** — optional Node API (Redis-backed) for shared live
  sessions and cross-client synchronization.
- **Multi-user collaboration** — team investigations with presence, roles, and
  shared event triage.
- **Map-mode fallback** — 2D flat-projection view for low-end devices without
  WebGL.
- **Sensor integration SDK** — a documented interface for third-party
  observability sensors to push readings into ORION.
- **Community themes** — user-contributed globe skins and command packs.

## Non-goals (for now)

- Presenting detections as proven fact — ORION remains a hypothesis engine
  first and a presentation layer second.
- Native mobile builds — the experience is desktop-first.
- Bundled ML inference — agent _behaviors_ are simulated; real model execution
  belongs in the future backend adapter layer.

---

Have an idea that reshapes this list? Open a discussion — roadmap is a
conversation, not a decree.
