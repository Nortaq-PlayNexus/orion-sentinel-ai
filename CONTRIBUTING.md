# Contributing to ORION Sentinel AI

First off — thank you for contributing. ORION Sentinel AI is an open project and
we welcome features, fixes, documentation, and honest feedback. No contribution
is too small.

By participating you agree to uphold the [Code of Conduct](CODE_OF_CONDUCT.md).

## Table of contents

- [Ways to contribute](#ways-to-contribute)
- [Getting started](#getting-started)
- [Development workflow](#development-workflow)
- [Pull request checklist](#pull-request-checklist)
- [Code conventions](#code-conventions)
- [Testing](#testing)
- [Issue & PR etiquette](#issue--pr-etiquette)
- [Review process](#review-process)

## Ways to contribute

1. **Open issues** — bug reports, feature requests, design discussions. Use the
   provided [issue templates](.github/ISSUE_TEMPLATE/).
2. **Fix bugs & build features** — pick a `good first issue`, branch, and open a
   PR.
3. **Write documentation** — the `docs/` tree always needs love.
4. **Test the app** — try it on odd GPUs/browsers and report what breaks.
5. **Give feedback** — product direction, UX, realism of the simulation.

## Getting started

```bash
# fork, then
git clone https://github.com/orion-sentinel-ai/orion-sentinel-ai.git
cd orion-sentinel-ai
npm install
npm run dev            # http://localhost:5173
```

See [docs/development.md](docs/development.md) for the full local setup and
script reference.

## Development workflow

1. **Find or create an issue.** Announce your intent so work isn't duplicated.
2. **Create a branch** off `main`:

   ```bash
   git checkout -b feat/your-feature   # feat/ fix/ docs/ chore/
   ```

3. **Write the code** following [code conventions](#code-conventions).
4. **Add tests** for new or changed behavior (see [Testing](#testing)).
5. **Run the CI gate locally**:

   ```bash
   npm run check    # format + lint + test + build
   ```

   Green locally means green in CI — the gate is identical.

6. **Push and open a pull request** using the
   [PR template](.github/PULL_REQUEST_TEMPLATE.md).

## Pull request checklist

Before requesting review, verify:

- [ ] Branch name matches `feat/`, `fix/`, `docs/`, or `chore/`
- [ ] `npm run check` passes (format, lint 0/0, all tests, clean build)
- [ ] New behavior has unit tests; coverage thresholds still hold
- [ ] No secrets, absolute local paths, or editor junk committed
- [ ] Docs updated if user-facing behavior changed (`docs/`, `README.md`)
- [ ] Changes are scoped; one concern per PR — open multiple PRs if needed
- [ ] PR title describes the change; body explains the _why_

## Code conventions

- **Formatting:** Prettier (`.prettierrc.json`). Run `npm run format`.
- **Linting:** oxlint, zero warnings. Run `npm run lint`.
- **Style:** 2-space indent, single quotes, no semicolons, trailing commas.
- **Naming:** kebab-case files, `PascalCase` components, `camelCase` modules.
- **Separation of concerns:** the simulation layer (`src/core/`) must stay
  React/DOM-free. That is what keeps it unit-testable and swappable for a real
  backend.
- **Comments:** only where they explain a non-obvious decision; prefer
  self-documenting code and docs.
- **Store discipline:** route state changes through `src/store.js`; don't invent
  ad-hoc `useState` for shared data.

## Testing

- Tests live next to the code (`src/**/*.test.js`), run under Vitest (Node env).
- Coverage thresholds are enforced in `vite.config.js` — do not weaken them
  without a stated reason.
- If a branch is genuinely untestable, say so in the PR description.

```bash
npm run test          # run once
npm run test:watch    # iterate
npm run test:coverage # coverage report
```

## Issue & PR etiquette

- **Search first** — before opening an issue, check that it isn't a duplicate.
- **Reproduce** — include browser/OS, steps, expected vs actual, console errors.
- **Be specific in titles:** `Globe fails to render on Safari 17` beats `bug`.
- **Keep threads kind.** All interaction falls under the
  [Code of Conduct](CODE_OF_CONDUCT.md) — no harassment, no gatekeeping, no
  personal attacks.
- **GitHub issues are public.** Do not post credentials, tokens, or personal
  data. Security issues go to <security@orion-sentinel-ai.dev> — see
  [SECURITY.md](SECURITY.md).

## Review process

- Maintainers review within ~5 working days on average.
- Reviews focus on: correctness, test coverage, adherence to conventions, and
  whether the change is _scoped_.
- You may get change requests — treat them as a conversation, not a verdict.
- Two approvals from maintainers are required to merge; PRs must be up to date
  with `main` before merge.

---

_Questions? Start a discussion or open an issue. We're glad you're here._
