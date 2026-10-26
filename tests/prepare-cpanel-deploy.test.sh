#!/usr/bin/env bash

set -euo pipefail

readonly test_project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly script_path="${test_project_root}/prepare-cpanel-deploy.sh"

source "${script_path}"

if ! declare -F validate_sharp_platform_packages >/dev/null; then
  echo "prepare-cpanel-deploy.sh must define validate_sharp_platform_packages" >&2
  exit 1
fi

fixture_root="$(mktemp -d)"
trap 'command rm -rf "${fixture_root}"' EXIT

allowed_node_modules="${fixture_root}/allowed/node_modules"
for package_name in \
  sharp-linux-x64 \
  sharp-linuxmusl-x64 \
  sharp-libvips-linux-x64 \
  sharp-libvips-linuxmusl-x64; do
  command mkdir -p "${allowed_node_modules}/@img/${package_name}"
done

validate_sharp_platform_packages "${allowed_node_modules}"

for package_name in \
  sharp-win32-x64 \
  sharp-darwin-x64 \
  sharp-linux-arm64 \
  sharp-wasm32 \
  sharp-libvips-win32-x64 \
  sharp-libvips-darwin-x64 \
  sharp-libvips-linux-arm64; do
  invalid_node_modules="${fixture_root}/${package_name}/node_modules"
  command mkdir -p "${invalid_node_modules}/@img/${package_name}"

  if validate_sharp_platform_packages "${invalid_node_modules}" >/dev/null 2>&1; then
    echo "expected @img/${package_name} to be rejected" >&2
    exit 1
  fi
done

echo "Sharp platform package validation passed"
