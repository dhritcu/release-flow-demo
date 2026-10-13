#!/usr/bin/env bash
# Fails when a release candidate lacks something production runs, so shipping it
# would silently undo a release. A production commit counts as included when the
# candidate has it, or has the original of a hotfix cherry-pick (-x).
# Usage: includes-production.sh <candidate-sha> <production-sha>
set -euo pipefail
candidate=$1 production=$2
trailer='s/^\(cherry picked from commit ([0-9a-f]{40})\)$/\1/p'
# Fixes the candidate carries as cherry-picks count as included too.
picked=$(git log --format=%B "$production..$candidate" | sed -nE "$trailer")
missing=()
for commit in $(git rev-list "$candidate..$production"); do
  grep -qx "$commit" <<<"$picked" && continue
  original=$(git show -s --format=%B "$commit" | sed -nE "$trailer" | tail -1)
  if [ -n "$original" ] && git merge-base --is-ancestor "$original" "$candidate" 2>/dev/null; then
    continue
  fi
  missing+=("$(git log -1 --format='%h %s' "$commit")")
done
[ ${#missing[@]} -eq 0 ] && exit 0
echo "The candidate lacks what production runs:" >&2
printf '  %s\n' "${missing[@]}" >&2
exit 1
