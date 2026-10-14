#!/usr/bin/env bash
# Prints the candidate QA last saw that this candidate builds on: the newest
# unshipped candidate whose commit is an ancestor of this one. Empty if none.
# Covers a re-pin (-rc.2 after -rc.1) and a candidate interrupted by a hotfix.
# Usage: previous-candidate.sh <candidate-tag>
set -euo pipefail
current=$1
for tag in $(git tag --list 'v*-rc.*' | sort -rV); do
  [ "$tag" = "$current" ] && continue
  git rev-parse -q --verify "refs/tags/${tag%-rc.*}" >/dev/null && continue   # shipped
  if git merge-base --is-ancestor "$tag" "$current"; then
    echo "$tag"
    exit 0
  fi
done
