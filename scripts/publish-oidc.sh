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

# Usage:
# - ./scripts/publish-oidc.sh --check
#   - Outputs: should_publish=true|false
#   - Exit 0 if check completed; exit 2 on network/parsing errors.
MODE="publish"
if [[ "${1:-}" == "--check" ]]; then
  MODE="check"
  shift
fi
if [[ $# -ne 0 ]]; then
  echo "Usage: $0 [--check]" >&2
  exit 2
fi

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
BUILT="false"

registry_has_version() {
  local name="$1"
  local version="$2"

  # URL-encode for registry API.
  local encoded="${name//@/%40}"
  encoded="${encoded//\//%2F}"

  # Return codes:
  # - 0: version exists
  # - 1: version missing (or package doesn't exist yet)
  # - 2: hard error (network / unexpected response / parse error)
  local resp http json
  if ! resp="$(curl -sSL -w '\n%{http_code}' "https://registry.npmjs.org/${encoded}" 2>/dev/null)"; then
    return 2
  fi
  http="$(printf '%s' "$resp" | tail -n 1)"
  json="$(printf '%s' "$resp" | sed '$d')"

  case "$http" in
    200) ;;
    404) return 1 ;;
    *) return 2 ;;
  esac

  if ! printf '%s' "$json" | node -e '
    const fs = require("node:fs");
    const version = process.argv[1];
    let data;
    try {
      data = JSON.parse(fs.readFileSync(0, "utf8"));
    } catch {
      process.exit(2);
    }
    process.exit(Object.prototype.hasOwnProperty.call(data.versions ?? {}, version) ? 0 : 1);
  ' "$version"; then
    rc="$?"
    if [[ "$rc" -eq 2 ]]; then
      return 2
    fi
    return 1
  fi
  return 0
}

INTERNAL_PACKAGE_NAMES=()

# Read package names/versions up-front (also validates lockstep versioning).
for dir in "${PACKAGE_DIRS[@]}"; do
  PKG_DIR="${ROOT_DIR}/${dir}"
  if [[ ! -d "$PKG_DIR" ]]; then
    echo "Skipping missing package dir: $dir"
    continue
  fi

  NAME="$(node -p 'require(process.argv[1]).name' "${PKG_DIR}/package.json")"
  VERSION="$(node -p 'require(process.argv[1]).version' "${PKG_DIR}/package.json")"

  INTERNAL_PACKAGE_NAMES+=("$NAME")

  if [[ -z "$RELEASE_VERSION" ]]; then
    RELEASE_VERSION="$VERSION"
  elif [[ "$RELEASE_VERSION" != "$VERSION" ]]; then
    echo "Expected lockstep versions, but found mismatch: ${RELEASE_VERSION} vs ${VERSION} (${NAME})" >&2
    exit 1
  fi
done

if [[ "$MODE" == "check" ]]; then
  SHOULD_PUBLISH="false"
  for dir in "${PACKAGE_DIRS[@]}"; do
    PKG_DIR="${ROOT_DIR}/${dir}"
    if [[ ! -d "$PKG_DIR" ]]; then
      continue
    fi

    NAME="$(node -p 'require(process.argv[1]).name' "${PKG_DIR}/package.json")"
    VERSION="$(node -p 'require(process.argv[1]).version' "${PKG_DIR}/package.json")"

    set +e
    registry_has_version "$NAME" "$VERSION"
    rc="$?"
    set -e

    if [[ "$rc" -eq 0 ]]; then
      continue
    fi
    if [[ "$rc" -eq 1 ]]; then
      SHOULD_PUBLISH="true"
      break
    fi
    echo "Registry check failed for ${NAME}@${VERSION}" >&2
    exit 2
  done

  echo "should_publish=${SHOULD_PUBLISH}"
  if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
    echo "should_publish=${SHOULD_PUBLISH}" >>"$GITHUB_OUTPUT"
  fi
  exit 0
fi

validate_tarball() {
  local tarball_path="$1"
  local expected_name="$2"
  local expected_version="$3"
  local expected_release_version="$4"

  local extract_dir="${TMP_DIR}/extract-${expected_name//@/_}-${expected_version}"
  rm -rf "$extract_dir"
  mkdir -p "$extract_dir"

  tar -xzf "$tarball_path" -C "$extract_dir"
  local pkg_json="${extract_dir}/package/package.json"
  if [[ ! -f "$pkg_json" ]]; then
    echo "Tarball missing package.json: $tarball_path" >&2
    exit 1
  fi

  INTERNAL_NAMES_CSV="$(IFS=,; echo "${INTERNAL_PACKAGE_NAMES[*]}")" \
    EXPECTED_NAME="$expected_name" \
    EXPECTED_VERSION="$expected_version" \
    EXPECTED_RELEASE_VERSION="$expected_release_version" \
    node - "$pkg_json" <<'NODE'
const fs = require("node:fs");

const expectedName = process.env.EXPECTED_NAME;
const expectedVersion = process.env.EXPECTED_VERSION;
const expectedReleaseVersion = process.env.EXPECTED_RELEASE_VERSION;
const internalNames = new Set((process.env.INTERNAL_NAMES_CSV ?? "").split(",").filter(Boolean));

// When executing `node -` the script path is "-" (argv[1]),
// so custom args start at argv[2].
const pkgPath = process.argv[2];
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));

if (pkg.name !== expectedName) {
  console.error(`Tarball name mismatch: expected ${expectedName}, got ${pkg.name}`);
  process.exit(1);
}
if (pkg.version !== expectedVersion) {
  console.error(`Tarball version mismatch: expected ${expectedVersion}, got ${pkg.version}`);
  process.exit(1);
}

const badPrefixes = ["workspace:", "catalog:"];
const fields = ["dependencies", "peerDependencies", "optionalDependencies"];

for (const field of fields) {
  const deps = pkg[field] ?? {};
  for (const [dep, range] of Object.entries(deps)) {
    if (typeof range === "string" && badPrefixes.some((p) => range.includes(p))) {
      console.error(`Forbidden dependency range in tarball (${field}): ${dep}=${range}`);
      process.exit(1);
    }
    if (internalNames.has(dep)) {
      if (range !== expectedReleaseVersion) {
        console.error(`Internal dep mismatch in tarball (${field}): ${dep}=${range} (expected ${expectedReleaseVersion})`);
        process.exit(1);
      }
    }
  }
}
NODE
}

for dir in "${PACKAGE_DIRS[@]}"; do
  PKG_DIR="${ROOT_DIR}/${dir}"
  if [[ ! -d "$PKG_DIR" ]]; then
    echo "Skipping missing package dir: $dir"
    continue
  fi

  NAME="$(node -p 'require(process.argv[1]).name' "${PKG_DIR}/package.json")"
  VERSION="$(node -p 'require(process.argv[1]).version' "${PKG_DIR}/package.json")"

  set +e
  registry_has_version "$NAME" "$VERSION"
  rc="$?"
  set -e

  if [[ "$rc" -eq 0 ]]; then
    echo "Already published: ${NAME}@${VERSION}"
    continue
  fi
  if [[ "$rc" -eq 2 ]]; then
    echo "Registry check failed for ${NAME}@${VERSION}" >&2
    exit 2
  fi

  echo "Publishing: ${NAME}@${VERSION}"
  PUBLISHED_ANY="true"

  if [[ "$BUILT" != "true" ]]; then
    echo "Refreshing bun.lock (workspace version metadata for pack/publish)..."
    rm -f "${ROOT_DIR}/bun.lock"
    (cd "$ROOT_DIR" && bun install --save-text-lockfile)

    echo "Building workspace packages (required before packing)..."
    (cd "$ROOT_DIR" && bun run build:all)
    BUILT="true"
  fi

  TARBALL_PATH="$(
    cd "$PKG_DIR"
    bun pm pack --destination "$TMP_DIR" --ignore-scripts --quiet | tail -n 1
  )"

  if [[ ! -f "$TARBALL_PATH" ]]; then
    echo "Expected tarball not found: $TARBALL_PATH" >&2
    exit 1
  fi

  validate_tarball "$TARBALL_PATH" "$NAME" "$VERSION" "$RELEASE_VERSION"

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

if [[ -n "$RELEASE_VERSION" ]]; then
  if command -v gh >/dev/null 2>&1; then
    # GH_TOKEN is preferred by gh; fall back to GITHUB_TOKEN if provided.
    export GH_TOKEN="${GH_TOKEN:-${GITHUB_TOKEN:-}}"
    if [[ -n "${GH_TOKEN:-}" ]]; then
      if ! gh release view "v${RELEASE_VERSION}" >/dev/null 2>&1; then
        gh release create "v${RELEASE_VERSION}" --generate-notes
      fi
    else
      echo "GH_TOKEN/GITHUB_TOKEN not set; skipping GitHub Release creation." >&2
    fi
  else
    echo "gh CLI not found; skipping GitHub Release creation." >&2
  fi
fi
