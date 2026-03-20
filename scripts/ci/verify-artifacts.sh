#!/usr/bin/env bash

set -euo pipefail

required_paths=(
  "apps/web/.next"
  "apps/socket/dist"
  "packages/types/dist"
)

missing=0
for path in "${required_paths[@]}"; do
  if [[ -e "$path" ]]; then
    echo "[ok] Found artifact: $path"
  else
    echo "[missing] Required artifact not found: $path"
    missing=1
  fi
done

if [[ "$missing" -ne 0 ]]; then
  echo "Build artifact verification failed."
  exit 1
fi

echo "All required build artifacts are present."