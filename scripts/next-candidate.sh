#!/usr/bin/env bash
# Prints the version for a commit going to staging.
#
#   v2026.10.14.1-rc.1   first candidate of the day
#   v2026.10.14.1-rc.2   staging re-pinned to a later commit on the same line
#   v2026.10.14.2-rc.1   anything else: next version, after everything used today
#
# A commit keeps its release tag, or its candidate tag while that version is still
# ahead of every release that day. A hotfix during QA is not on the candidate's line,
# so it gets its own version; the QA candidate is renumbered once the hotfix ships.
# Usage: next-candidate.sh <sha> [YYYY.MM.DD]
set -euo pipefail
sha=$(git rev-parse "$1^{commit}")
base="v${2:-$(date -u +%Y.%m.%d)}"
day="^${base//./\\.}\\.([0-9]+)"

numbers() { sed -nE "s/$day$1$/\\1/p" | sort -n; }
released=$(git tag --list "$base.*" | numbers "" | tail -1)
used=$(git tag --list "$base.*" | numbers "(-rc\\.[0-9]+)?" | tail -1)
released=${released:-0} used=${used:-0}

# The commit already has a version.
tags=$(git tag --points-at "$sha" --list 'v*')
release=$(grep -v -- '-rc\.' <<<"$tags" | sort -V | tail -1 || true)
[ -n "$release" ] && { echo "$release"; exit 0; }
candidate=$(grep -E "$day-rc\\.[0-9]+$" <<<"$tags" | sort -V | tail -1 || true)
if [ -n "$candidate" ] && [ "$(numbers "-rc\\.[0-9]+" <<<"$candidate")" -gt "$released" ]; then
  echo "$candidate"; exit 0
fi

# Staging re-pinned forward on the line of the open candidate.
if [ "$used" -gt "$released" ]; then
  open="$base.$used"
  latest=$(git tag --list "$open-rc.*" | sort -V | tail -1)
  if [ -n "$latest" ] && git merge-base --is-ancestor "$latest" "$sha"; then
    echo "$open-rc.$(( ${latest##*-rc.} + 1 ))"; exit 0
  fi
fi

echo "$base.$((used + 1))-rc.1"
