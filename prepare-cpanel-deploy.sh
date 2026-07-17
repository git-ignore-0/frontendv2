#!/usr/bin/env bash

set -euo pipefail

readonly project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly deploy_dir="${project_root}/cpanel-deploy"
readonly archive_path="${project_root}/cpanel-deploy-passenger.zip"

cd "${project_root}"

echo "Building the standalone Next.js application..."
npm run build

if [[ ! -f .next/standalone/server.js ]]; then
  echo "Missing .next/standalone/server.js; check output: standalone in next.config.ts." >&2
  exit 1
fi

echo "Preparing the cPanel Passenger bundle..."
rm -rf "${deploy_dir}" "${archive_path}"
mkdir -p "${deploy_dir}/.next"

cp -a .next/standalone/. "${deploy_dir}/"
cp -a .next/static "${deploy_dir}/.next/static"
cp -a public "${deploy_dir}/public"

(
  cd "${deploy_dir}"
  zip -qr "${archive_path}" .
)

echo "Created ${archive_path}"
