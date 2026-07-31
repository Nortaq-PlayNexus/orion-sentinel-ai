# Changelog

All notable changes to ORION Sentinel AI are documented here. The format is
based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Satellite-grade Earth imagery** — the globe now streams real imagery from
  the free public Esri World Imagery tile service. A global base mosaic (zoom 3)
  replaces the procedural day map, and an adaptive detail overlay streams the
  visible region at matching zoom (typically z 4–8) with a bounded tile budget
  and LRU caching. Includes a toggleable satellite-imagery layer, UI
  attribution (`Imagery © Esri, Maxar, Earthstar Geographics`), and automatic
  fallback to procedural textures when offline or unreachable.
- Full enterprise repository scaffold: professional README, docs suite,
  community files, CI/CD workflows, Docker support, branding assets, and
  automated tests.
- Test suite (Vitest) covering the simulation layer, store invariants,
  procedural texture synthesis, and imagery projection math — 42 tests across 6
  files.
- Tooling: oxlint, Prettier, EditorConfig, Git attributes.

## [1.0.0] — 2026-07-31

### Added

- **3D Earth observation** — procedural day/night textures, city lights,
  terminator, cloud layer, atmospheric glow, and a 7,000-star field rendered
  with Three.js via `@react-three/fiber`.
- **Simulated AI scanning engine** — continuous anomaly detection across six
  categories (geometric formations, thermal signatures, rapid land-cover
  change, ocean-floor structures, wildlife biomass, atmospheric UAP tracks),
  each with confidence scores, severity, competing explanations, agent
  attribution, and data-source tags.
- **Ocean intelligence module** — underwater globe mode with bathymetric depth
  rendering, pressure-zone profiles, current simulations, and marine-biomass
  density.
- **UAP / atmospheric analysis module** — trajectory reconstruction, ground
  speed/ceiling estimates, sensor-confidence breakdowns, and competing
  explanations (never presented as fact).
- **ORION AI command assistant** — natural-language directive interpreter with
  six simulated agent cores, follow-up suggestion chips, and region-aware
  investigations. Voice input via the Web Speech API where supported.
- **Mission-control UI** — glassmorphism command-center aesthetic, live
  analysis stream, GPU-inference readout, boot sequence, layer toggles, and a
  live ticker.

### Notes

- Earth imagery is procedurally synthesized at runtime; no external assets or
  network requests are required.

[Unreleased]: https://github.com/Nortaq-PlayNexus/orion-sentinel-ai/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Nortaq-PlayNexus/orion-sentinel-ai/releases/tag/v1.0.0
