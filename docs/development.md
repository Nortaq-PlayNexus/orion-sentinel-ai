# Development

Setup, tooling, and workflow for contributors to ORION Sentinel AI.

## Prerequisites

- **Node.js** ≥ 20 (LTS recommended; CI runs on Node 20 and 22)
- **npm** ≥ 10
- **git** ≥ 2.30
- A GPU/WebGL-capable browser (Chrome, Edge, Firefox, or Safari) for the 3D scene

## First-time setup

```bash
git clone https://github.com/orion-sentinel-ai/orion-sentinel-ai.git
cd orion-sentinel-ai
npm install
npm run dev
```

> The entire planet, including day/night textures, is generated procedurally at
> runtime — there are no image or audio assets to download, and the app works
> fully offline after install.

## Scripts

| Script                  | Description                                       |
| ----------------------- | ------------------------------------------------- |
| `npm run dev`           | Vite dev server with HMR                          |
| `npm run build`         | Production build to `dist/`                       |
| `npm run preview`       | Serve the production build locally                |
| `npm run lint`          | Static analysis (oxlint)                          |
| `npm run lint:fix`      | Lint and auto-fix                                 |
| `npm run format`        | Prettier auto-format all source                   |
| `npm run format:check`  | Verify formatting without writing                 |
| `npm run test`          | Vitest unit tests                                 |
| `npm run test:watch`    | Tests in watch mode                               |
| `npm run test:coverage` | Tests with coverage report (`coverage/`)          |
| `npm run check`         | **CI gate** — format + lint + test + build        |
| `npm run typecheck`     | JavaScript type-stability sanity check via oxlint |

Run `npm run check` before pushing. CI runs the identical command.

## Project layout

```
src/
  components/     React UI: TopBar, LayerPanel, LiveFeed, panels, modules, overlays
  core/           Pure logic: geo, engine, orionAI, textures + unit tests
  globe/          react-three-fiber scene layers + texture shaders
  index.css       Design system (glassmorphism, layout, animations)
  main.jsx        App entry
  store.js        Single Zustand store
docs/             Architecture, data model, API, deployment, security
public/           Static shell files, logo, favicon
```

## Testing

Tests live next to the code they cover (`*.test.js`) and run under Vitest with a
Node environment (no DOM required — the simulation layer is framework-free).

```bash
npm run test            # run once
npm run test:watch      # iterate
npm run test:coverage   # coverage report, thresholds enforced in vite.config.js
```

### Coverage gates

`vite.config.js` enforces per-file thresholds (currently lines ≥ 80%, functions
≥ 80%, branches ≥ 60%). New logic must keep the suite green; if a branch is
untestable by design, note it in the PR rather than weakening the gate.

## Code conventions

- **Formatting** is enforced by Prettier — use `npm run format` (or your
  editor's format-on-save with the included `.prettierrc.json`).
- **Linting** is enforced by oxlint — 0 warnings, 0 errors required.
- **Style**: 2-space indent, single quotes, no semicolons, trailing commas
  (Prettier defaults; `.editorconfig` mirrors them).
- **Naming**: kebab-case files, `PascalCase` components, `camelCase` modules.
- No code comments unless they explain a non-obvious decision (API-level
  guidance lives in this doc set, not in the code).
- Keep the simulation layer (`src/core/`) free of React and DOM imports — that
  is what makes it unit-testable and backend-swappable.

## Branching and PRs

```
main        always releasable, protected
feat/*      new capabilities
fix/*       bug fixes
docs/*      documentation only
chore/*     tooling, CI, housekeeping
```

See [CONTRIBUTING.md](../CONTRIBUTING.md) for the full contribution workflow and
the PR checklist.

## Troubleshooting

| Symptom                                  | Likely cause / fix                                                                        |
| ---------------------------------------- | ----------------------------------------------------------------------------------------- |
| Blank 3D globe                           | WebGL unavailable or blocked in the browser / GPU blacklist; enable hardware acceleration |
| npm install fails on esbuild postinstall | npm ≥ 11 may prompt to approve lifecycle scripts; approve and re-run `npm install`        |
| Port already in use                      | Vite auto-selects the next free port; read the printed URL                                |
| Coverage drops below threshold           | `npm run test:coverage`, open `coverage/`, add tests for the uncovered branches           |
| Formatting drift                         | Run `npm run format`; enable format-on-save with Prettier                                 |

## Release workflow

1. Bump the version in `package.json`.
2. Update `CHANGELOG.md` under a new version heading.
3. Tag `vX.Y.Z` and push; the release workflow builds, tests, and drafts a
   GitHub release with assets.

See [deployment.md](deployment.md) for build and hosting specifics.
