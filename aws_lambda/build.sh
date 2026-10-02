#!/usr/bin/env bash
# Builds dist/<lambda>.zip, ready to upload: Linux dependency wheels + shared/*.py + lambda_function.py.
# Usage: ./build.sh <lambda-folder> <x86_64|arm64> <python-version>   e.g. ./build.sh floof-api x86_64 3.12
# The architecture and Python version must match the function's settings in AWS (see aws-setup.md step 4).
set -euo pipefail

usage() {
  echo "Usage: $0 <lambda-folder> <x86_64|arm64> <python-version, e.g. 3.12>" >&2
  exit 1
}

# Check the arguments before doing any work
[[ $# -eq 3 ]] || usage
name=$1
arch=$2
python_version=$3
[[ $python_version =~ ^3\.[0-9]+$ ]] || usage

# Work from this script's folder, so it can be run from anywhere
cd "$(dirname "$0")"
[[ -f "$name/lambda_function.py" ]] || { echo "No Lambda folder called '$name' here." >&2; exit 1; }

# AWS says "arm64" where Linux wheel names say "aarch64"; psycopg's ARM builds need glibc 2.28 (Lambda Python 3.12+)
case $arch in
  x86_64) platform=x86_64-manylinux2014 ;;
  arm64) platform=aarch64-manylinux_2_28 ;;
  *) usage ;;
esac

# uv installs packages for another OS/Python correctly; macOS's bundled pip can't (install with: brew install uv)
command -v uv >/dev/null || { echo "build.sh needs uv: brew install uv" >&2; exit 1; }

# Stage everything in a throwaway folder, deleted however the script exits
stage=$(mktemp -d)
trap 'rm -rf "$stage"' EXIT

# Download Linux builds for the Lambda's Python, never this Mac's own builds (psycopg's binary differs per OS)
uv pip install --quiet --target "$stage" --python-platform "$platform" \
  --python-version "$python_version" --only-binary :all: -r "$name/requirements.txt"

# Put the handler and the shared helpers side by side at the top of the zip, where Lambda imports from
cp "$name/lambda_function.py" shared/*.py "$stage/"

# Include requirements.txt as a record of what's installed (Lambda itself never reads it)
cp "$name/requirements.txt" "$stage/"

# Drop Python's bytecode caches: they only bloat the zip, and the Lambda builds its own
find "$stage" -name __pycache__ -type d -prune -exec rm -rf {} +

# Zip it fresh (zip adds to an existing archive instead of replacing it)
mkdir -p dist
out="$PWD/dist/$name.zip"
rm -f "$out"
(cd "$stage" && zip -qr "$out" .)
echo "Built $out"
