---
name: snyk
description: Run Snyk security scan and fix high/critical vulnerabilities in npm/yarn dependencies. Use when asked to scan for vulnerabilities, fix security issues, or update the .snyk policy file.
argument-hint: [--severity=high|critical] [--fix] [package-name]
---

Run a Snyk security scan and fix high-severity vulnerabilities for this project.

## Prerequisites: SNYK_TOKEN

Snyk requires an authenticated token to run. Check and set it up before scanning:

```bash
# Check if token is already set
echo $SNYK_TOKEN

# If not set, retrieve it from the Snyk dashboard:
# https://app.snyk.io/account → API Token → copy token
# Then set it for the current session:
export SNYK_TOKEN=<your-token>

# Or authenticate interactively (opens browser):
snyk auth
```

The token is also required as a **GitHub Actions secret** for CI:
- Go to repository → Settings → Secrets and variables → Actions
- Add secret named `SNYK_TOKEN` with the same token value
- The workflow at `.github/workflows/security-check.yml` reads it as `${{ secrets.SNYK_TOKEN }}`

To persist the token locally across sessions, add to your shell profile (`~/.zshrc` or `~/.bashrc`):
```bash
export SNYK_TOKEN=<your-token>
```

## Workflow

1. **Scan** — run `snyk test --severity-threshold=high --json` and parse the output
2. **Triage** — for each unique vulnerability, determine if it is:
   - A **direct dependency** → update the version in `package.json` dependencies
   - A **transitive dependency** → add/update a Yarn `resolutions` entry in `package.json`
   - **Unfixable** (no `fixedIn`) → add to `.snyk` ignore policy with a reason
3. **Fix** — apply all changes, then run `yarn install` to regenerate the lockfile
4. **Verify** — re-run `snyk test --severity-threshold=high` to confirm zero high findings

## Fix strategies

### Direct dependency
Update the version range in `dependencies` or `devDependencies`:
```json
"next": "^16.2.3"
```
If the package has a paired version (e.g., `eslint-config-next` mirrors `next`), update both.

### Transitive dependency (Yarn v1 resolutions)
Add to the `resolutions` field in `package.json`:
```json
"resolutions": {
  "brace-expansion": "^5.0.5",
  "path-to-regexp": "^8.4.0",
  "picomatch": "^4.0.4"
}
```
Use exact minimum (`^X.Y.Z`) matching the first entry in `fixedIn`.

### Snyk ignore policy (last resort)
Only use `.snyk` for vulnerabilities with no fix available or false positives. Always include an expiry and reason:
```yaml
# .snyk
version: v1.25.0
ignore:
  SNYK-JS-EXAMPLE-123456:
    - '*':
        reason: No fix available; devDependency only
        expires: 2026-12-31T00:00:00.000Z
```

## Project conventions

- This project uses **Yarn v1** — resolutions are in `package.json` under `"resolutions"`
- The CI workflow (`.github/workflows/security-check.yml`) uses `--severity-threshold=high`
- Existing resolutions: `minimatch`, `ajv`, `@isaacs/brace-expansion`, `qs` — do not remove them
- After editing `package.json`, always run `yarn install` to update `yarn.lock`
- Run `yarn build` after fixing to confirm no build regressions

## Reporting

After fixing, report:
- Vulnerabilities found (count by severity)
- Fixes applied (package → old version → new version, strategy used)
- Remaining vulnerabilities (if any) and why they were ignored or deferred
