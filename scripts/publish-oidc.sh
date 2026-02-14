#!/usr/bin/env bash
set -euo pipefail

# Publish all monorepo libraries to npm using GitHub OIDC Trusted Publishing.
#
# Why pack with Bun?
# - Our workspace uses `workspace:*` and Bun `catalog:` dependencies.
# - `bun pm pack` rewrites those to real semver ranges inside the tarball.
# - We then `npm publish <tarball>` so authentication can be handled via OIDC
#   (no long-lived NPM token stored in GitHub secrets).
#
# Requirements:
# - GitHub Actions job permissions include: `id-token: write`
# - Each npm package is configured for "Trusted publishing" from this repo/workflow
# - Node >= 22.14 and npm >= 11.5.1 available in PATH

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

TMP_DIR="${RUNNER_TEMP:-/tmp}/kmsg-npm-pack"
mkdir -p "$TMP_DIR"

# Publish order matters for first-time publishes of a new version.
PACKAGE_DIRS=(
  "packages/channel"
  "packages/core"
  "packages/provider"
  "packages/template"
  "packages/messaging"
  "packages/analytics"
  "packages/webhook"
  "packages/k-msg"
)

PUBLISHED_ANY="false"
RELEASE_VERSION=""

registry_has_version() {
  local name="$1"
  local version="$2"

  # URL-encode for registry API.
  local encoded="${name//@/%40}"
  encoded="${encoded//\//%2F}"

  # If the package doesn't exist yet, treat it as "version not found".
  local json
  if ! json="$(curl -fsSL "https://registry.npmjs.org/${encoded}" 2>/dev/null)"; then
    return 1
  fi

  printf '%s' "$json" | node -e '
    const fs = require("node:fs");
    const version = process.argv[1];
    const data = JSON.parse(fs.readFileSync(0, "utf8"));
    process.exit(Object.prototype.hasOwnProperty.call(data.versions ?? {}, version) ? 0 : 1);
  ' "$version"
}

for dir in "${PACKAGE_DIRS[@]}"; do
  PKG_DIR="${ROOT_DIR}/${dir}"
  if [[ ! -d "$PKG_DIR" ]]; then
    echo "Skipping missing package dir: $dir"
    continue
  fi

  NAME="$(node -p 'require(process.argv[1]).name' "${PKG_DIR}/package.json")"
  VERSION="$(node -p 'require(process.argv[1]).version' "${PKG_DIR}/package.json")"

  RELEASE_VERSION="${RELEASE_VERSION:-$VERSION}"

  if registry_has_version "$NAME" "$VERSION"; then
    echo "Already published: ${NAME}@${VERSION}"
    continue
  fi

  echo "Publishing: ${NAME}@${VERSION}"
  PUBLISHED_ANY="true"

  TARBALL_PATH="$(
    cd "$PKG_DIR"
    bun pm pack --destination "$TMP_DIR" --ignore-scripts --quiet | tail -n 1
  )"

  if [[ ! -f "$TARBALL_PATH" ]]; then
    echo "Expected tarball not found: $TARBALL_PATH" >&2
    exit 1
  fi

  if [[ "$NAME" == @* ]]; then
    npm publish "$TARBALL_PATH" --access public
  else
    npm publish "$TARBALL_PATH"
  fi

  rm -f "$TARBALL_PATH"
done

if [[ "$PUBLISHED_ANY" != "true" ]]; then
  echo "No packages to publish."
  exit 0
fi

# Tag the release commit (lockstep) + per-package tags, matching prior convention.
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"

if [[ -n "$RELEASE_VERSION" ]]; then
  if ! git rev-parse -q --verify "refs/tags/v${RELEASE_VERSION}" >/dev/null; then
    git tag "v${RELEASE_VERSION}"
  fi
fi

for dir in "${PACKAGE_DIRS[@]}"; do
  PKG_DIR="${ROOT_DIR}/${dir}"
  NAME="$(node -p 'require(process.argv[1]).name' "${PKG_DIR}/package.json")"
  VERSION="$(node -p 'require(process.argv[1]).version' "${PKG_DIR}/package.json")"
  TAG="${NAME}-v${VERSION}"

  if git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null; then
    continue
  fi
  git tag "$TAG"
done

git push origin --tags
