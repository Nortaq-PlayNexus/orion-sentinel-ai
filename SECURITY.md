# Security Policy

ORION Sentinel AI takes the security of the project and its users seriously.
Please read the full threat model and posture in
[docs/security.md](docs/security.md).

## Reporting a vulnerability

**Do not open a public issue** for security problems. Report privately:

- **GitHub Private Vulnerability Reporting:** create a report at
  <https://github.com/Nortaq-PlayNexus/orion-sentinel-ai/security/advisories/new>
- **PGP:** key published via the maintainer's GitHub profile
- **Required details:** affected version, browser/OS, reproduction steps,
  expected vs observed behavior, and impact.

You should receive a first response within **48 hours** for critical/high
severity reports and within one week otherwise.

## Disclosure timeline

| Severity        | Fix target         | Public disclosure                |
| --------------- | ------------------ | -------------------------------- |
| Critical / High | ≤ 7 days           | Coordinated, ≤ 30 days after fix |
| Medium / Low    | Next minor release | Coordinated                      |

Confirmed reporters receive a credit line in the changelog unless they request
anonymity.

## Scope

- **In scope:** the shipped application and its build/deploy tooling
  (`src/`, `Dockerfile`, `nginx.conf`, workflows, dependencies).
- **Out of scope:** the public demo hosting environment and third-party
  libraries that upstream the fix themselves.

## Safe harbor

We will not pursue legal action against researchers who report in good faith,
respect the project's boundaries, and avoid exfiltration of user data or
disruption of the service. Coordinated disclosure is appreciated.
