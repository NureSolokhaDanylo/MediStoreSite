#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
SPEC_FILE="$(node "$ROOT_DIR/scripts/resolve_openapi_spec.mjs" "${1:-}")"
OUT_DIR="$ROOT_DIR/src/sdk/generated"

if ! command -v openapi-generator-cli >/dev/null 2>&1; then
  echo "openapi-generator-cli is not installed or not in PATH" >&2
  exit 1
fi

echo "Generating TypeScript SDK from $SPEC_FILE into $OUT_DIR..."
rm -rf "$OUT_DIR"

openapi-generator-cli generate \
  -i "$SPEC_FILE" \
  -g typescript-fetch \
  -o "$OUT_DIR"

rm -rf \
  "$OUT_DIR/.openapi-generator" \
  "$OUT_DIR/.openapi-generator-ignore" \
  "$OUT_DIR/.gitignore" \
  "$OUT_DIR/.npmignore" \
  "$OUT_DIR/.travis.yml" \
  "$OUT_DIR/git_push.sh" \
  "$OUT_DIR/docs" \
  "$OUT_DIR/package.json" \
  "$OUT_DIR/README.md" \
  "$OUT_DIR/tsconfig.esm.json" \
  "$OUT_DIR/tsconfig.json"

echo "Generated TypeScript SDK in: $OUT_DIR"
