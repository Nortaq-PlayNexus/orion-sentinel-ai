# Security

ORION Sentinel AI is a client-side-only application: it ships static assets and
executes entirely in the user's browser. It stores no data, sets no cookies, and
contacts no first-party server endpoints. That keeps the attack surface small —
but it is not zero, and the project takes a defensive posture.

## Threat model

| Asset                        | Exposure                                                           |
| ---------------------------- | ------------------------------------------------------------------ |
| Delivered payloads (`dist/`) | Tampering of the served bundle (supply-chain / hosting compromise) |
| User environment             | Access to microphone via Web Speech API (user-granted)             |
| Dependencies                 | Transitive vulnerabilities in runtime + dev tooling                |
| CI pipeline                  | Secret leaks, compromised third-party actions                      |

There is **no** user data at rest or in transit on a first-party server: no
accounts, no analytics, no telemetry endpoints, no cookies.

## Posture

- **Least privilege in the browser.** The app never calls `fetch` at runtime;
  the only permission requested is optional microphone access for voice
  commands (granted per-use by the user). No storage APIs are used.
- **Signed, pinned dependencies.** `package-lock.json` is committed and CI uses
  `npm ci` so installs are reproducible.
- **Locked third-party actions.** Every GitHub Action is pinned to a full
  commit SHA with a `dependabot`-maintained review loop.
- **Automated dependency review.** Dependabot monitors the npm manifest and
  raises PRs for vulnerable or outdated packages.
- **Minimal build surface.** The production image is an `nginx:alpine` static
  server with no application runtime, no shell tools beyond the base image, and
  no writable volumes.
- **No secrets in the repository.** There are no keys, tokens, or credentials
  anywhere in the tree. Should one ever appear, contact the maintainers
  immediately per the disclosure policy below.

## Deployment headers

When deploying, apply at minimum:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: default-src 'self'
Permissions-Policy: microphone=(self)
```

The CSP is deliberately strict: the app loads no remote scripts, styles, fonts,
or images, so `default-src 'self'` is sufficient for production. The dev server
requires `connect-src 'self' ws:` for HMR.

## Reporting a vulnerability

**Do not open a public issue for security problems.**

- Use GitHub Private Vulnerability Reporting
  (<https://github.com/Nortaq-PlayNexus/orion-sentinel-ai/security/advisories/new>);
  PGP key, where available, is published via the GitHub maintainer profile.
- Optionally encrypt; unencrypted reports are accepted but plaintext should be
  assumed at-rest unencrypted.
- Include a minimal reproducer: affected version, browser/OS, steps, and impact.

### Disclosure policy

| Severity        | First response | Fix target         | Public disclosure                              |
| --------------- | -------------- | ------------------ | ---------------------------------------------- |
| Critical / High | ≤ 48 h         | ≤ 7 days           | Coordinated with reporter, ≤ 30 days after fix |
| Medium / Low    | ≤ 1 week       | Next minor release | Coordinated                                    |

Confirmed findings receive a credit line in the changelog unless anonymity is
requested.

## Dependency hygiene

- `npm audit` runs in CI and fails on high/critical findings.
- Dependabot opens automated PRs weekly; maintainers merge only after the CI
  gate passes.
- Production dependencies are kept minimal (React, Three.js, fiber, drei,
  zustand); all rendering is dependency-light by design.

## Supply-chain notes

- The multi-stage `Dockerfile` uses pinned `node:22-alpine` and `nginx:alpine`
  digests (update deliberately, not automatically).
- The build does **not** execute arbitrary package lifecycle scripts beyond the
  approved set (`esbuild` postinstall), and CI inspects `package.json` diffs in
  every PR review.

---

See [SECURITY.md](../SECURITY.md) for the short-form policy linked from the
repository landing page.
