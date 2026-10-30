# Security Policy

## Supported versions

Security fixes are published for the **latest release** on npm (`@vorlaxen-labs/bar-js`) and the `main` branch of this repository.

| Version | Supported |
| ------- | --------- |
| Latest npm release | Yes |
| Older releases | No |

## Reporting a vulnerability

**Do not open a public GitHub issue, pull request, or discussion for a security problem.** Do not include exploit details, request dumps that contain secrets, or session cookies in a public place.

Report privately:

1. [GitHub private vulnerability reporting](https://github.com/vorlaxen-labs/bar-js/security/advisories/new) for this repository, or
2. Email [hello@vorlaxen.com](mailto:hello@vorlaxen.com) with the subject `bar-js security` if that form is unavailable.

Include:

- What is affected and what an attacker can do
- Steps to reproduce, with a minimal application when possible
- The package version (`npm ls @vorlaxen-labs/bar-js`) or git revision
- A suggested fix, if you have one

We aim to acknowledge reports within **5 business days** and will coordinate disclosure after a fix is available. Reporters who want credit can say so in the report. Credit is given in the GitHub Security Advisory unless you ask to stay anonymous.

## Scope

This policy covers the published package `@vorlaxen-labs/bar-js` and this repository:

- Response envelope construction
- Header and cookie dispatch in the Express and Fastify adapters
- Default security and cache headers applied when `withDefaultHeaders` is enabled
- Request ID handling
- Error text returned by `wrap()`

Out of scope:

- Defects in Express, Fastify, or `@fastify/cookie`. Report those to the upstream project.
- Authentication, authorization, and input validation in an application that uses BaR.
- A deployment that turns on `includeStack` or leaves `environment` unset on a public server.

Normal bugs that are not security issues belong in [GitHub issues](https://github.com/vorlaxen-labs/bar-js/issues/new/choose).

## Security behavior

BaR builds the HTTP response. The application decides what data, messages, headers, and cookies go into it.

- `withDefaultHeaders` defaults to enabled. The adapter then sets the headers in `DEFAULT_SECURITY_HEADERS` (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, a restrictive `Content-Security-Policy`, `Referrer-Policy`, `Cross-Origin-Opener-Policy`, and `Cache-Control: no-store`). Pass `withDefaultHeaders: false` or `defaultHeaders` to change that.
- Cookie flags (`httpOnly`, `secure`, `sameSite`, and the rest) are whatever the caller passes to `.cookie()`. BaR does not add those flags on its own.
- `wrap()` replaces error text with `Internal Server Error` only when `environment` is `"production"`. `includeStack: true` can place a stack trace in the response. Do not enable that on a server that answers untrusted clients.
- Do not put secrets, tokens, or session identifiers in `data`, `message`, headers, or cookie values.
- Releases are published to the npm registry over HTTPS from GitHub Actions on `main`. The git tag and GitHub Release notes are the record of what shipped.

Distribution channels for this project are HTTPS only: this GitHub repository and [npm `@vorlaxen-labs/bar-js`](https://www.npmjs.com/package/@vorlaxen-labs/bar-js).
