#!/usr/bin/env bash
# Prints release notes for <tag> since <previous> (the last production release),
# leaving out PRs production already got as a cherry-pick (-x) hotfix and any
# section that ends up empty. Needs GH_TOKEN, GITHUB_REPOSITORY and all tags.
# Usage: release-notes.sh <tag> [previous]
set -euo pipefail
tag=$1 previous=${2:-}
args=(-f tag_name="$tag")
[ -n "$previous" ] && args+=(-f previous_tag_name="$previous")
notes=$(gh api "repos/$GITHUB_REPOSITORY/releases/generate-notes" "${args[@]}" --jq .body)

releases=()
while read -r t; do releases+=("$t"); done < <(git tag --list 'v*' | grep -v -- '-rc\.')
shipped=$(git log --format=%B "${releases[@]}" |
  sed -nE 's/^\(cherry picked from commit ([0-9a-f]{40})\)$/\1/p' | sort -u)
for sha in $shipped; do
  for pr in $(gh api "repos/$GITHUB_REPOSITORY/commits/$sha/pulls" --jq '.[].number'); do
    notes=$(grep -v "/pull/$pr\$" <<<"$notes" || true)
  done
done
awk '/^### /{ heading=$0; next } /^\* /{ if (heading != "") print heading; heading="" } { print }' <<<"$notes"
