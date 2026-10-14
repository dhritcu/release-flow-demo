#!/usr/bin/env bash
# Prints the newest version this version builds on (an ancestor), so QA can see
# exactly what changed since what they last tested. Empty for the first one.
# A hotfix on a release branch is skipped automatically: it is not an ancestor.
# Usage: previous-version.sh <version-tag>
set -euo pipefail
current=$1
for tag in $(git tag --list 'v*' | grep -v -- '-rc\.' | sort -rV); do
  [ "$tag" = "$current" ] && continue
  if git merge-base --is-ancestor "$tag" "$current"; then
    echo "$tag"
    exit 0
  fi
done
