#!/usr/bin/env bash
# Prints the release-candidate tag for a commit going to staging.
#
#   v2026.10.14.1-rc.1   first candidate of the day
#   v2026.10.14.1-rc.2   staging re-pinned before that version shipped
#   v2026.10.14.2-rc.1   next version, once v2026.10.14.1 shipped
#
# A candidate keeps its number until it ships (Cut release drops the -rc.M) or a
# new day starts. A commit that already has a version keeps it.
# Usage: next-candidate.sh <sha> [YYYY.MM.DD]
set -euo pipefail
sha=$1

# A commit that already has a version keeps it: its release, else its candidate.
tags=$(git tag --points-at "$sha" --list 'v*')
existing=$(grep -v -- '-rc\.' <<<"$tags" | sort -V | tail -1 || true)
[ -n "$existing" ] || existing=$(grep -- '-rc\.' <<<"$tags" | sort -V | tail -1 || true)
[ -n "$existing" ] && { echo "$existing"; exit 0; }

base="v${2:-$(date -u +%Y.%m.%d)}"
pattern="^${base//./\\.}\\.([0-9]+)(-rc\\.([0-9]+))?$"

# Highest version number used today, by a release or a candidate.
last=$(git tag --list "$base.*" | sed -nE "s/$pattern/\\1/p" | sort -n | tail -1)
[ -z "$last" ] && { echo "$base.1-rc.1"; exit 0; }

version="$base.$last"
if git rev-parse -q --verify "refs/tags/$version" >/dev/null; then
  echo "$base.$((last + 1))-rc.1"   # that version shipped: start the next one
  exit 0
fi

latest_rc=$(git tag --list "$version-rc.*" | sed -nE "s/^.*-rc\\.([0-9]+)$/\\1/p" | sort -n | tail -1)
if [ "$(git rev-parse "refs/tags/$version-rc.$latest_rc^{commit}")" = "$(git rev-parse "$sha^{commit}")" ]; then
  echo "$version-rc.$latest_rc"     # same commit re-deployed: same candidate
else
  echo "$version-rc.$((latest_rc + 1))"
fi
