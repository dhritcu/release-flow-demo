#!/usr/bin/env bash
# Prints the version for a commit going to staging: the version it already has,
# else the next number of the day (vYYYY.MM.DD.N, UTC date, N from 1).
# Usage: next-version.sh <sha> [YYYY.MM.DD]
set -euo pipefail
sha=$(git rev-parse "$1^{commit}")
base="v${2:-$(date -u +%Y.%m.%d)}"

existing=$(git tag --points-at "$sha" --list 'v*' | grep -v -- '-rc\.' | sort -V | tail -1 || true)
[ -n "$existing" ] && { echo "$existing"; exit 0; }

last=$(git tag --list "$base.*" | sed -nE "s/^${base//./\\.}\\.([0-9]+)$/\\1/p" | sort -n | tail -1)
echo "$base.$(( ${last:-0} + 1 ))"
