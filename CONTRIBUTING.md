# Contributing

Thank you for improving BaR (`@vorlaxen-labs/bar-js`).

**Support:** [GitHub issues](https://github.com/vorlaxen-labs/bar-js/issues/new/choose) · [SECURITY.md](SECURITY.md) · [Code of Conduct](CODE_OF_CONDUCT.md)

Vorlaxen Labs maintains this repository. Public contributions are welcome through issues and pull requests.

## What to change

| Area | Where |
| ---- | ----- |
| Builder, envelope, hooks | `src/core/` |
| Express or Fastify adapters | `src/adapters/` |
| Tests | `tests/` |
| User docs | `docs/` and `README.md` |

## Develop

Requirements: Node.js **18 or newer** (CI uses Node.js 22) and npm.

```bash
npm ci
npm run lint
npm test
npm run build
```

`npm test` runs the TypeScript check and Jest (unit and integration).

## Pull requests

1. Open the pull request against `main`.
2. Keep each pull request to one logical change.
3. Run `npm run lint` and `npm test` before you open it.
4. Update `docs/` or `README.md` when user-facing behavior changes.
5. Use [Conventional Commits](https://www.conventionalcommits.org/) so [semantic-release](https://github.com/semantic-release/semantic-release) can version the package:
   - `fix:` for a patch
   - `feat:` for a minor release
   - `feat!:` or a `BREAKING CHANGE:` footer for a major release

Publish credentials stay in GitHub Actions. Do not add tokens, `.env` files, or registry passwords to the pull request.

## Reporting defects

Use a [bug report](https://github.com/vorlaxen-labs/bar-js/issues/new/choose). Include the package version, the adapter (Express, Fastify, or neither), and a short reproduction.

Security problems follow [SECURITY.md](SECURITY.md). Do not file those as public issues.

## Questions before a large change

Open an issue before work that changes the public response envelope, export paths, or adapter types.
