# Publishing (@vorlaxen-labs/bar-js)

Production releases are **fully automated** on push to `main` via GitHub Actions and [semantic-release](https://semantic-release.gitbook.io/). You do **not** need a `.env` file in the repo for CI.

## One-time setup (required)

### 1. npm package access

- Scope: `@vorlaxen-labs`
- Package: `@vorlaxen-labs/bar-js`
- Ensure your npm org/user can publish this scope (public access is set in `package.json` → `publishConfig.access`).

### 2. GitHub repository secret

In **GitHub → vorlaxen-labs/bar-js → Settings → Secrets and variables → Actions**, add:

| Secret       | Value |
|--------------|--------|
| `NPM_TOKEN`  | **Not used for publish** when Trusted Publishing is set up (see below). Optional read token only if you install private deps in CI. |

Publish auth is **OIDC** via [Trusted Publishing](https://docs.npmjs.com/trusted-publishers), not a password/OTP token in CI.

`GITHUB_TOKEN` is provided automatically by Actions; no manual secret needed for GitHub releases.

### 3. Branch and commits

- Default release branch: **`main`**
- Use [Conventional Commits](https://www.conventionalcommits.org/) so versions bump correctly:
  - `fix:` → patch
  - `feat:` → minor
  - `feat!:` or footer `BREAKING CHANGE:` → major

Example for adapter subpath breaking change:

```text
feat!: move adapters to subpath exports

BREAKING CHANGE: import BarExpressAdapter from @vorlaxen-labs/bar-js/adapters/express
```

## What CI does

1. **Pull requests:** lint, test, build, `npm pack --dry-run` (no publish).
2. **Push to `main`:** same checks, then semantic-release:
   - Computes next version from commits since last git tag
   - Runs `prepublishOnly` (`build` + `test`) during `npm publish`
   - Publishes to npm
   - Creates a GitHub Release
   - Commits `package.json` + `package-lock.json` with `[skip ci]` to avoid duplicate release runs

## Retire a published version (unpublish)

Use this when a version must be removed from the registry before republishing the same semver (for example replacing a bad `@2.0.0`).

**Requirements:** npm account with publish rights on `@vorlaxen-labs/bar-js`.

**Unpublish cannot use a Granular Access Token with “bypass 2FA”.** If you see:

`403 … Granular access tokens that bypass two-factor authentication may not perform this action`

use one of:

1. **Interactive login (recommended):** `npm logout`, then `npm login` (username + password + 2FA OTP), then unpublish.
2. **Granular token with 2FA enforced** (not bypass) and **Packages: Read and write** including delete, on npm → Access Tokens.
3. **npmjs.com** → package → **Settings** → remove version `2.0.0` (same account + 2FA).

CI `NPM_TOKEN` (Automation, often bypass-2FA) is fine for **publish**; use a human session for **unpublish**.

```bash
npm logout
npm login

# Remove only 2.0.0 (1.x stays available)
npm unpublish @vorlaxen-labs/bar-js@2.0.0

# If `latest` still points at the removed version, reset it:
npm dist-tag add @vorlaxen-labs/bar-js@1.2.2 latest
npm dist-tag rm @vorlaxen-labs/bar-js latest   # only if duplicate/wrong tag remains — see npm dist-tag ls

npm view @vorlaxen-labs/bar-js versions
npm view @vorlaxen-labs/bar-js dist-tags
```

npm may block unpublish if the version is older than 72 hours or has heavy downstream use. Then either deprecate the bad release or ship the fix under a **new semver** (for example `2.0.1`):

```bash
npm deprecate @vorlaxen-labs/bar-js@2.0.0 "Withdrawn — use @vorlaxen-labs/bar-js@2.0.1 or later."
```

After a successful unpublish, you can publish a replacement `2.0.0`. If `2.0.0` stays on the registry, bump to `2.0.1` (or `2.1.0`) instead of reusing `2.0.0`.

## Local publish (optional)

Only if you must publish outside CI:

1. Copy [`.env.example`](../.env.example) → `.env` (gitignored).
2. Set `NPM_TOKEN`, then:

```bash
export NPM_TOKEN=...   # or use direnv / dotenv
npm ci
npm run build
npm test
npx semantic-release --dry-run   # preview
# npx semantic-release           # real release (prefer CI instead)
```

Prefer **CI on `main`** so version tags, GitHub releases, and npm stay in sync.

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| Publish job skipped | Commit message contains `[skip ci]` or not on `main` |
| `ENEEDAUTH` / 401 on npm | No Trusted Publisher OIDC and no valid token; or `setup-node` wrote an empty `.npmrc` auth line (publish job avoids `registry-url` for that reason) |
| OIDC `404 package not found` | **Trusted Publisher not linked** for `@vorlaxen-labs/bar-js`, or wrong GitHub org/repo/`publish.yml` filename |
| `E403` unpublish + GAT bypass 2FA | Use `npm login` + 2FA or a non-bypass token; CI Automation token cannot unpublish |
| `E403` publish + “bypass 2fa required” | CI token lacks publish rights under npm 2FA policy; use a **Granular** token with **Bypass 2FA** + package write, or **[Trusted Publishing](https://docs.npmjs.com/trusted-publishers)** (recommended with `provenance: true`) |
| Version already published | No new conventional commits since last tag; or duplicate manual publish |
| Registry `2.0.0` tarball is stale | npm semver cannot be replaced; add a `feat:` commit after `v2.0.0` and let CI publish `2.1.0` (or newer) |
| Release commit not on GitHub | `@semantic-release/git` needs `contents: write` (already in workflow) |
| Package missing subpaths | Run `npm run build` before publish; published `files` is only `dist/` |

## Provenance

`publishConfig.provenance` is enabled for supply-chain transparency. Publishing runs on GitHub Actions with `id-token: write`. If npm rejects provenance, configure [npm trusted publishers](https://docs.npmjs.com/trusted-publishers) for this repo or temporarily remove `"provenance": true` from `package.json`.

## npm Trusted Publishing (OIDC, recommended)

With `publishConfig.provenance: true`, prefer linking the package to GitHub Actions instead of a long-lived bypass token:

1. [npm](https://www.npmjs.com/) → **@vorlaxen-labs/bar-js** → **Settings** → **Trusted Publisher** → **Add**
2. Provider: **GitHub Actions**
3. **Organization or user:** `vorlaxen-labs` (or the GitHub owner that owns the repo)
4. **Repository:** `bar-js`
5. **Workflow filename:** `publish.yml` (filename only — not the workflow display name)
6. **Environment:** leave empty
7. Save, then re-run the failed **publish** job

The publish job does **not** inject `NPM_TOKEN` into `npm publish`; npm must accept the GitHub OIDC token from this workflow.

**Common mistake:** a granular token with **“Require two-factor authentication”** is not a CI publish token — the runner cannot enter OTP. The `403 … bypass 2fa enabled is required` error often appears when npm rejects token-based publish; use Trusted Publishing instead.

### If Git has `v2.1.0` but npm does not

semantic-release may have tagged GitHub and committed `chore(release): … [skip ci]` before `npm publish` failed. After fixing auth, either publish that commit once locally (`npm ci && npm publish`) or delete the `v2.1.0` tag and the release commit, then re-run CI so semantic-release can retry the same version.
